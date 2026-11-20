DROP POLICY IF EXISTS "Owners can read attendance for their events"
  ON public.attendance_records;

CREATE POLICY "Owners can read attendance for their events"
  ON public.attendance_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = attendance_records.event_id
        AND events.created_by = auth.uid()
    )
  );

REVOKE SELECT ON TABLE public.attendance_records FROM anon;
