ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

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
  WHERE id = NEW.event_id
  FOR UPDATE;

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
