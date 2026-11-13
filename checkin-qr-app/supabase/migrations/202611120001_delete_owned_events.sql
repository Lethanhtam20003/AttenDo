DROP POLICY IF EXISTS "Owners can delete their events" ON public.events;
CREATE POLICY "Owners can delete their events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

REVOKE DELETE ON TABLE public.events FROM PUBLIC, anon;
GRANT DELETE ON TABLE public.events TO authenticated;
