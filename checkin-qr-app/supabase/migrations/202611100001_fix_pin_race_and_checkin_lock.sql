-- =====================================================
-- Khắc phục xung đột đua lệnh xoay PIN (2.1) và
-- loại bỏ khóa hàng độc quyền FOR UPDATE trên events khi điểm danh (3.1).
-- =====================================================

-- 1. Bỏ FOR UPDATE trong trigger kiểm tra trạng thái sự kiện để không khóa chéo các lượt điểm danh
CREATE OR REPLACE FUNCTION public.ensure_event_is_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  event_status TEXT;
  event_starts_at TIMESTAMPTZ;
  event_expires_at TIMESTAMPTZ;
BEGIN
  SELECT status, starts_at, expires_at
  INTO event_status, event_starts_at, event_expires_at
  FROM public.events
  WHERE id = NEW.event_id;

  IF event_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Phiên điểm danh đã kết thúc.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_TABLE_NAME = 'attendance_records' AND event_starts_at > NOW() THEN
    RAISE EXCEPTION 'Phiên điểm danh chưa đến thời gian bắt đầu.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF event_expires_at IS NOT NULL AND event_expires_at <= NOW() THEN
    RAISE EXCEPTION 'Phiên điểm danh đã hết thời gian tồn tại.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Đồng bộ xoay vòng mã PIN trên màn hình trình chiếu bằng khóa tư vấn (advisory lock)
CREATE OR REPLACE FUNCTION public.presenter_get_or_rotate_pin(
  p_event_id UUID,
  p_token TEXT,
  p_force_rotate BOOLEAN DEFAULT FALSE,
  p_new_pin TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  pin TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_existing_pin public.event_pins%ROWTYPE;
  v_pin TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  IF NOT public.verify_presenter_token(p_event_id, p_token) THEN
    RAISE EXCEPTION 'Mã trình chiếu không hợp lệ hoặc đã bị thu hồi.';
  END IF;

  -- Khóa tư vấn theo sự kiện để hai màn hình cùng hết giờ không tạo trùng 2 mã PIN
  PERFORM pg_advisory_xact_lock(hashtext('pin_rotate'), hashtext(p_event_id::text));

  SELECT events.*
  INTO v_event
  FROM public.events
  WHERE events.id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiên điểm danh.';
  END IF;

  IF v_event.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Phiên điểm danh đã kết thúc.';
  END IF;

  IF NOT COALESCE(p_force_rotate, FALSE) THEN
    SELECT event_pins.*
    INTO v_existing_pin
    FROM public.event_pins
    WHERE event_pins.event_id = p_event_id
    ORDER BY event_pins.created_at DESC
    LIMIT 1;

    -- Tái sử dụng PIN nếu một màn hình khác vừa xoay mã mới (còn hạn > 1 giây)
    IF FOUND AND v_existing_pin.expires_at > NOW() + INTERVAL '1 second' THEN
      RETURN QUERY SELECT v_existing_pin.current_pin::TEXT, v_existing_pin.expires_at;
      RETURN;
    END IF;
  END IF;

  v_pin := COALESCE(NULLIF(btrim(p_new_pin), ''), lpad((floor(1000 + random() * 9000))::INT::TEXT, 4, '0'));
  v_expires := COALESCE(p_expires_at, NOW() + INTERVAL '60 seconds');

  DELETE FROM public.event_pins
  WHERE event_pins.event_id = p_event_id
    AND event_pins.expires_at < NOW() - INTERVAL '120 seconds';

  INSERT INTO public.event_pins (event_id, current_pin, expires_at)
  VALUES (p_event_id, v_pin, v_expires);

  RETURN QUERY SELECT v_pin, v_expires;
END;
$$;

-- 3. Nâng cấp hàm điểm danh: bỏ FOR UPDATE trên events, bỏ LIMIT 2 trên event_pins, khóa tư vấn theo từng thiết bị
CREATE OR REPLACE FUNCTION public.check_in_to_event(
  p_event_id UUID,
  p_full_name TEXT,
  p_custom_data JSONB,
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION,
  p_pin_input TEXT,
  p_device_id TEXT,
  p_qr_token_hash TEXT,
  p_user_accuracy DOUBLE PRECISION DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  checked_in_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_require_location BOOLEAN;
  v_require_pin BOOLEAN;
  v_dynamic_qr BOOLEAN;
  v_raw_distance DOUBLE PRECISION;
  v_accuracy_buffer DOUBLE PRECISION;
  v_effective_distance DOUBLE PRECISION;
  v_allowed_radius INTEGER;
  v_a DOUBLE PRECISION;
  v_field JSONB;
BEGIN
  -- Chỉ đọc cấu hình sự kiện, không dùng FOR UPDATE để tránh tuần tự hóa hàng trăm lượt điểm danh cùng lúc
  SELECT events.*
  INTO v_event
  FROM public.events AS events
  WHERE events.id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sự kiện không tồn tại.';
  END IF;
  IF v_event.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Sự kiện đã đóng. Không thể điểm danh.';
  END IF;
  IF v_event.starts_at > NOW() THEN
    RAISE EXCEPTION 'Phiên điểm danh chưa đến thời gian bắt đầu.';
  END IF;
  IF v_event.expires_at IS NOT NULL AND v_event.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Phiên điểm danh đã hết thời gian tồn tại.';
  END IF;
  IF p_full_name IS NULL OR length(btrim(p_full_name)) = 0 OR length(btrim(p_full_name)) > 255 THEN
    RAISE EXCEPTION 'Vui lòng nhập họ tên hợp lệ.';
  END IF;
  IF jsonb_typeof(COALESCE(p_custom_data, '{}'::JSONB)) <> 'object' THEN
    RAISE EXCEPTION 'Dữ liệu biểu mẫu không hợp lệ.';
  END IF;
  FOR v_field IN
    SELECT field.value
    FROM jsonb_array_elements(COALESCE(v_event.custom_fields, '[]'::JSONB)) AS field(value)
    WHERE field.value ->> 'key' <> 'full_name'
  LOOP
    IF COALESCE((v_field ->> 'required')::BOOLEAN, FALSE)
      AND length(btrim(COALESCE(p_custom_data ->> (v_field ->> 'key'), ''))) = 0 THEN
      RAISE EXCEPTION 'Vui lòng nhập %.', COALESCE(v_field ->> 'label', 'thông tin bắt buộc');
    END IF;
  END LOOP;
  IF p_device_id IS NULL OR length(p_device_id) = 0 OR length(p_device_id) > 255 THEN
    RAISE EXCEPTION 'Không xác định được thiết bị. Vui lòng tải lại trang.';
  END IF;

  v_require_location := COALESCE((v_event.module_settings ->> 'require_location')::BOOLEAN, TRUE);
  v_require_pin := COALESCE((v_event.module_settings ->> 'require_pin')::BOOLEAN, TRUE);
  v_dynamic_qr := COALESCE((v_event.module_settings ->> 'dynamic_qr')::BOOLEAN, FALSE);

  IF v_require_location THEN
    IF v_event.location_lat IS NULL OR v_event.location_lng IS NULL
      OR p_user_lat IS NULL OR p_user_lng IS NULL
      OR p_user_lat NOT BETWEEN -90 AND 90
      OR p_user_lng NOT BETWEEN -180 AND 180 THEN
      RAISE EXCEPTION 'Không thể xác minh vị trí GPS của bạn. Vui lòng bật vị trí và thử lại.';
    END IF;

    v_a := sin(radians(p_user_lat - v_event.location_lat) / 2) ^ 2
      + cos(radians(v_event.location_lat)) * cos(radians(p_user_lat))
      * sin(radians(p_user_lng - v_event.location_lng) / 2) ^ 2;
    v_raw_distance := 6371000 * 2 * asin(sqrt(LEAST(1, GREATEST(0, v_a))));

    -- Bù trừ sai số thiết bị tối đa 30m đồng bộ với thuật toán ở Client.
    v_accuracy_buffer := LEAST(GREATEST(COALESCE(p_user_accuracy, 0), 0), 30);
    v_effective_distance := GREATEST(0, ROUND(v_raw_distance - v_accuracy_buffer));
    v_allowed_radius := COALESCE(NULLIF(v_event.radius_meters, 0), 100);

    IF v_effective_distance > v_allowed_radius THEN
      RAISE EXCEPTION 'Bạn đang ở ngoài vùng điểm danh (khoảng cách hiệu dụng %m, bán kính cho phép %m). Hãy di chuyển lại gần vị trí tổ chức.',
        v_effective_distance::INTEGER,
        v_allowed_radius;
    END IF;
  ELSE
    v_effective_distance := NULL;
  END IF;

  -- Kiểm tra mọi mã PIN của sự kiện còn trong thời hạn + 15 giây ân hạn, không giới hạn cứng LIMIT 2
  IF v_require_pin AND (
    p_pin_input IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.event_pins
      WHERE event_pins.event_id = p_event_id
        AND event_pins.current_pin = btrim(p_pin_input)
        AND event_pins.expires_at >= NOW() - INTERVAL '15 seconds'
    )
  ) THEN
    RAISE EXCEPTION 'Mã PIN không đúng hoặc đã hết hạn. Hãy nhìn màn chiếu của Host để lấy mã mới nhất.';
  END IF;

  IF v_dynamic_qr AND (
    p_qr_token_hash IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.event_qr_tokens AS qr
      WHERE qr.event_id = p_event_id
        AND qr.token_hash = p_qr_token_hash
        AND qr.expires_at > NOW()
    )
  ) THEN
    RAISE EXCEPTION 'Mã QR đã hết hạn. Vui lòng quét lại mã mới trên màn hình Host.';
  END IF;

  -- Khóa tư vấn theo cặp (event_id, device_id) để chống gửi đúp từ cùng 1 máy mà không chặn các máy khác
  PERFORM pg_advisory_xact_lock(hashtext(p_event_id::text), hashtext(p_device_id));

  IF EXISTS (
    SELECT 1
    FROM public.attendance_records AS attendance
    WHERE attendance.event_id = p_event_id
      AND attendance.device_id = p_device_id
  ) THEN
    RAISE EXCEPTION 'Thiết bị này đã được ghi nhận điểm danh rồi.';
  END IF;

  RETURN QUERY
  INSERT INTO public.attendance_records (
    event_id,
    full_name,
    custom_data,
    user_lat,
    user_lng,
    distance_meters,
    device_id
  )
  VALUES (
    p_event_id,
    btrim(p_full_name),
    COALESCE(p_custom_data, '{}'::JSONB),
    p_user_lat,
    p_user_lng,
    v_effective_distance,
    p_device_id
  )
  RETURNING attendance_records.id, attendance_records.checked_in_at, attendance_records.distance_meters;
END;
$$;

REVOKE ALL ON FUNCTION public.presenter_get_or_rotate_pin(UUID, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.presenter_get_or_rotate_pin(UUID, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.check_in_to_event(
  UUID, TEXT, JSONB, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT, DOUBLE PRECISION
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_in_to_event(
  UUID, TEXT, JSONB, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT, DOUBLE PRECISION
) TO anon, authenticated;
