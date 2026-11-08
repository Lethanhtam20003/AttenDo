-- =====================================================
-- Cho phép chia sẻ màn hình trình chiếu (/present/[eventId]?code=...)
-- không cần đăng nhập tài khoản Admin thông qua mã khóa bảo mật riêng.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.event_presenter_tokens (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  presenter_token TEXT NOT NULL CHECK (length(btrim(presenter_token)) >= 16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_presenter_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.event_presenter_tokens FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_presenter_tokens TO authenticated;

DROP POLICY IF EXISTS "Owners can manage presenter tokens" ON public.event_presenter_tokens;
CREATE POLICY "Owners can manage presenter tokens"
  ON public.event_presenter_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = event_presenter_tokens.event_id
        AND events.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = event_presenter_tokens.event_id
        AND events.created_by = auth.uid()
    )
  );

-- 1. Kiểm tra mã trình chiếu có hợp lệ với sự kiện không
CREATE OR REPLACE FUNCTION public.verify_presenter_token(
  p_event_id UUID,
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_event_id IS NULL OR p_token IS NULL OR length(btrim(p_token)) < 16 THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.event_presenter_tokens
    WHERE event_presenter_tokens.event_id = p_event_id
      AND event_presenter_tokens.presenter_token = btrim(p_token)
  );
END;
$$;

-- 2. Lấy danh sách người tham dự cho màn hình trình chiếu
CREATE OR REPLACE FUNCTION public.presenter_get_attendance(
  p_event_id UUID,
  p_token TEXT
)
RETURNS SETOF public.attendance_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.verify_presenter_token(p_event_id, p_token) THEN
    RAISE EXCEPTION 'Mã trình chiếu không hợp lệ hoặc đã bị thu hồi.';
  END IF;

  RETURN QUERY
  SELECT attendance_records.*
  FROM public.attendance_records
  WHERE attendance_records.event_id = p_event_id
  ORDER BY attendance_records.checked_in_at DESC;
END;
$$;

-- 3. Lấy hoặc xoay vòng mã PIN cho màn hình trình chiếu
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

    IF FOUND AND v_existing_pin.expires_at > NOW() THEN
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

-- 4. Cấp mã QR động mới cho màn hình trình chiếu
CREATE OR REPLACE FUNCTION public.presenter_issue_dynamic_qr_token(
  p_event_id UUID,
  p_token TEXT,
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
BEGIN
  IF NOT public.verify_presenter_token(p_event_id, p_token) THEN
    RAISE EXCEPTION 'Mã trình chiếu không hợp lệ hoặc đã bị thu hồi.';
  END IF;

  SELECT events.*
  INTO v_event
  FROM public.events
  WHERE events.id = p_event_id;

  IF NOT FOUND OR v_event.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Phiên điểm danh không còn hoạt động.';
  END IF;

  IF COALESCE((v_event.module_settings ->> 'dynamic_qr')::BOOLEAN, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'Phiên này không sử dụng mã QR động.';
  END IF;

  DELETE FROM public.event_qr_tokens
  WHERE event_qr_tokens.event_id = p_event_id
    AND event_qr_tokens.expires_at < NOW();

  INSERT INTO public.event_qr_tokens (event_id, token_hash, expires_at)
  VALUES (p_event_id, p_token_hash, p_expires_at);

  RETURN TRUE;
END;
$$;

-- 5. Kết thúc phiên điểm danh từ màn hình trình chiếu
CREATE OR REPLACE FUNCTION public.presenter_close_event(
  p_event_id UUID,
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.verify_presenter_token(p_event_id, p_token) THEN
    RAISE EXCEPTION 'Mã trình chiếu không hợp lệ hoặc đã bị thu hồi.';
  END IF;

  UPDATE public.events
  SET status = 'closed'
  WHERE events.id = p_event_id
    AND events.status = 'active';

  DELETE FROM public.event_pins
  WHERE event_pins.event_id = p_event_id;

  DELETE FROM public.event_qr_tokens
  WHERE event_qr_tokens.event_id = p_event_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_presenter_token(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_presenter_token(UUID, TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.presenter_get_attendance(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.presenter_get_attendance(UUID, TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.presenter_get_or_rotate_pin(UUID, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.presenter_get_or_rotate_pin(UUID, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.presenter_issue_dynamic_qr_token(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.presenter_issue_dynamic_qr_token(UUID, TEXT, TEXT, TIMESTAMPTZ) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.presenter_close_event(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.presenter_close_event(UUID, TEXT) TO anon, authenticated;
