CREATE TABLE IF NOT EXISTS public.event_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL CHECK (length(token_hash) = 64),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_qr_tokens_event_expiry
  ON public.event_qr_tokens(event_id, expires_at DESC);

ALTER TABLE public.event_qr_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON TABLE public.event_qr_tokens TO authenticated;

DROP POLICY IF EXISTS "Public can read pins for active events" ON public.event_pins;
DROP POLICY IF EXISTS "Public can read pins" ON public.event_pins;
DROP POLICY IF EXISTS "Owners can read pins for active events" ON public.event_pins;
CREATE POLICY "Owners can read pins for active events"
  ON public.event_pins FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = event_pins.event_id
        AND events.status = 'active'
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );
REVOKE SELECT ON TABLE public.event_pins FROM anon;

DROP POLICY IF EXISTS "Owners can create QR tokens for active events" ON public.event_qr_tokens;
CREATE POLICY "Owners can create QR tokens for active events"
  ON public.event_qr_tokens FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = event_qr_tokens.event_id
        AND events.status = 'active'
        AND events.created_by = auth.uid()
        AND events.module_settings ->> 'dynamic_qr' = 'true'
    )
  );

DROP POLICY IF EXISTS "Owners can delete expired QR tokens" ON public.event_qr_tokens;
DROP POLICY IF EXISTS "Owners can view expired QR tokens" ON public.event_qr_tokens;
CREATE POLICY "Owners can view expired QR tokens"
  ON public.event_qr_tokens FOR SELECT TO authenticated
  USING (
    expires_at < NOW()
    AND EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = event_qr_tokens.event_id
        AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Owners can delete expired QR tokens"
  ON public.event_qr_tokens FOR DELETE TO authenticated
  USING (
    expires_at < NOW()
    AND EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = event_qr_tokens.event_id
        AND events.created_by = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.check_in_to_event(
  p_event_id UUID,
  p_full_name TEXT,
  p_custom_data JSONB,
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION,
  p_pin_input TEXT,
  p_device_id TEXT,
  p_qr_token_hash TEXT
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
  v_distance DOUBLE PRECISION;
  v_a DOUBLE PRECISION;
  v_field JSONB;
BEGIN
  SELECT events.*
  INTO v_event
  FROM public.events AS events
  WHERE events.id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sự kiện không tồn tại.';
  END IF;
  IF v_event.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Sự kiện đã đóng. Không thể điểm danh.';
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
      RAISE EXCEPTION 'Không thể xác minh vị trí GPS của bạn.';
    END IF;

    v_a := sin(radians(p_user_lat - v_event.location_lat) / 2) ^ 2
      + cos(radians(v_event.location_lat)) * cos(radians(p_user_lat))
      * sin(radians(p_user_lng - v_event.location_lng) / 2) ^ 2;
    v_distance := 6371000 * 2 * asin(sqrt(LEAST(1, GREATEST(0, v_a))));

    IF v_distance > COALESCE(NULLIF(v_event.radius_meters, 0), 100) THEN
      RAISE EXCEPTION 'Bạn đang ở ngoài vùng điểm danh (cách %m, bán kính cho phép %m). Hãy di chuyển lại gần vị trí tổ chức.',
        round(v_distance)::INTEGER,
        COALESCE(NULLIF(v_event.radius_meters, 0), 100);
    END IF;
    v_distance := round(v_distance);
  ELSE
    v_distance := NULL;
  END IF;

  IF v_require_pin AND (
    p_pin_input IS NULL OR NOT EXISTS (
      SELECT 1
      FROM (
        SELECT event_pins.current_pin, event_pins.expires_at
        FROM public.event_pins
        WHERE event_pins.event_id = p_event_id
        ORDER BY event_pins.created_at DESC
        LIMIT 2
      ) AS recent_pins
      WHERE recent_pins.current_pin = btrim(p_pin_input)
        AND recent_pins.expires_at >= NOW() - INTERVAL '15 seconds'
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
    v_distance,
    p_device_id
  )
  RETURNING attendance_records.id, attendance_records.checked_in_at, attendance_records.distance_meters;
END;
$$;

DROP POLICY IF EXISTS "Anyone can check in" ON public.attendance_records;
DROP POLICY IF EXISTS "Anyone can check in to active events" ON public.attendance_records;
REVOKE INSERT ON TABLE public.attendance_records FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_in_to_event(
  UUID, TEXT, JSONB, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_to_event(
  UUID, TEXT, JSONB, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT
) TO anon, authenticated;
