CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_events_active_expiration
  ON public.events(expires_at)
  WHERE status = 'active' AND expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.ensure_event_is_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  event_status TEXT;
  event_expires_at TIMESTAMPTZ;
BEGIN
  SELECT status, expires_at
  INTO event_status, event_expires_at
  FROM public.events
  WHERE id = NEW.event_id
  FOR UPDATE;

  IF event_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Phiên điểm danh đã kết thúc.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF event_expires_at IS NOT NULL AND event_expires_at <= NOW() THEN
    RAISE EXCEPTION 'Phiên điểm danh đã hết thời gian tồn tại.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_expired_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  closed_count INTEGER;
BEGIN
  UPDATE public.events
  SET status = 'closed'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();

  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.close_expired_events() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'close-expired-events'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'close-expired-events',
    '* * * * *',
    'SELECT public.close_expired_events()'
  );
END;
$$;
