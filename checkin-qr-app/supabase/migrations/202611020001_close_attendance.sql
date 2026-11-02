-- Chay migration nay trong Supabase SQL Editor cho database dang hoat dong.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Public can read active events" ON public.events;
DROP POLICY IF EXISTS "Public can read active or closed events" ON public.events;
CREATE POLICY "Public can read active or closed events"
  ON public.events FOR SELECT
  USING (
    status IN ('active', 'closed')
    OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can create events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create owned events" ON public.events;
CREATE POLICY "Authenticated users can create owned events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Owners can close events" ON public.events;
CREATE POLICY "Owners can close events"
  ON public.events FOR UPDATE TO authenticated
  USING (
    status = 'active'
    AND (created_by = auth.uid() OR created_by IS NULL)
  )
  WITH CHECK (status = 'closed' AND created_by = auth.uid());

DROP POLICY IF EXISTS "Public can read pins" ON public.event_pins;
DROP POLICY IF EXISTS "Public can read pins for active events" ON public.event_pins;
CREATE POLICY "Public can read pins for active events"
  ON public.event_pins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_pins.event_id
        AND events.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Anyone can insert pins" ON public.event_pins;
DROP POLICY IF EXISTS "Owners can insert pins for active events" ON public.event_pins;
CREATE POLICY "Owners can insert pins for active events"
  ON public.event_pins FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_pins.event_id
        AND events.status = 'active'
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );

DROP POLICY IF EXISTS "Anyone can delete pins" ON public.event_pins;
DROP POLICY IF EXISTS "Owners can delete pins for active events" ON public.event_pins;
CREATE POLICY "Owners can delete pins for active events"
  ON public.event_pins FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_pins.event_id
        AND events.status = 'active'
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );

DROP POLICY IF EXISTS "Anyone can check in" ON public.attendance_records;
DROP POLICY IF EXISTS "Anyone can check in to active events" ON public.attendance_records;
CREATE POLICY "Anyone can check in to active events"
  ON public.attendance_records FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = attendance_records.event_id
        AND events.status = 'active'
    )
  );

CREATE OR REPLACE FUNCTION public.ensure_event_is_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  event_status TEXT;
BEGIN
  SELECT status INTO event_status
  FROM public.events
  WHERE id = NEW.event_id
  FOR UPDATE;

  IF event_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Event is not active'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_active_event_pin ON public.event_pins;
CREATE TRIGGER ensure_active_event_pin
  BEFORE INSERT ON public.event_pins
  FOR EACH ROW EXECUTE FUNCTION public.ensure_event_is_active();

DROP TRIGGER IF EXISTS ensure_active_event_checkin ON public.attendance_records;
CREATE TRIGGER ensure_active_event_checkin
  BEFORE INSERT ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.ensure_event_is_active();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END;
$$;
