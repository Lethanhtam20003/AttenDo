-- =====================================================
-- Cho phép người tham gia xem lại và chỉnh sửa thông tin
-- đã điểm danh trên chính thiết bị của mình (device_id)
-- khi phiên điểm danh vẫn đang mở (active & chưa hết hạn).
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_my_attendance_record(
  p_event_id UUID,
  p_device_id TEXT
)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR(255),
  custom_data JSONB,
  distance_meters DOUBLE PRECISION,
  checked_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_device_id IS NULL OR length(btrim(p_device_id)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ar.id,
    ar.full_name,
    ar.custom_data,
    ar.distance_meters,
    ar.checked_in_at
  FROM public.attendance_records AS ar
  WHERE ar.event_id = p_event_id
    AND ar.device_id = p_device_id
  ORDER BY ar.checked_in_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_attendance_record(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_attendance_record(UUID, TEXT)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_my_attendance_info(
  p_event_id UUID,
  p_device_id TEXT,
  p_full_name TEXT,
  p_custom_data JSONB
)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR(255),
  custom_data JSONB,
  distance_meters DOUBLE PRECISION,
  checked_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_record_id UUID;
  v_field JSONB;
BEGIN
  SELECT events.*
  INTO v_event
  FROM public.events AS events
  WHERE events.id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sự kiện không tồn tại.';
  END IF;

  IF v_event.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Phiên điểm danh đã kết thúc, không thể chỉnh sửa thông tin.';
  END IF;

  IF v_event.expires_at IS NOT NULL AND v_event.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Phiên điểm danh đã hết thời gian tồn tại, không thể chỉnh sửa thông tin.';
  END IF;

  IF p_device_id IS NULL OR length(btrim(p_device_id)) = 0 OR length(p_device_id) > 255 THEN
    RAISE EXCEPTION 'Không xác định được thiết bị đã điểm danh.';
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

  SELECT ar.id
  INTO v_record_id
  FROM public.attendance_records AS ar
  WHERE ar.event_id = p_event_id
    AND ar.device_id = p_device_id
  ORDER BY ar.checked_in_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_record_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy lượt điểm danh của thiết bị này để cập nhật.';
  END IF;

  RETURN QUERY
  UPDATE public.attendance_records AS ar
  SET
    full_name = btrim(p_full_name),
    custom_data = COALESCE(p_custom_data, '{}'::JSONB)
  WHERE ar.id = v_record_id
  RETURNING
    ar.id,
    ar.full_name,
    ar.custom_data,
    ar.distance_meters,
    ar.checked_in_at;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_attendance_info(UUID, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_attendance_info(UUID, TEXT, TEXT, JSONB)
  TO anon, authenticated;
