-- Thu hồi quyền đọc công khai bảng attendance_records đối với anon
DROP POLICY IF EXISTS "Public can read attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Owners can read attendance for their events" ON public.attendance_records;

CREATE POLICY "Owners can read attendance for their events"
  ON public.attendance_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = attendance_records.event_id
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );

REVOKE SELECT ON TABLE public.attendance_records FROM anon;

-- Bổ sung bảng attendance_records và event_pins vào Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'event_pins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_pins;
  END IF;
END;
$$;
