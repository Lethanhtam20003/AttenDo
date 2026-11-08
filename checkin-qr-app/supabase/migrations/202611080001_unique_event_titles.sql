DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.events
    GROUP BY title
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce unique event titles: duplicate titles already exist. Rename duplicate events before applying this migration.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_title_unique
  ON public.events (title);
