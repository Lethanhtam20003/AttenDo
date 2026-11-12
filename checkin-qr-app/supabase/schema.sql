-- =====================================================
-- AttenDo – Database Schema Migration
-- Chạy trong Supabase Dashboard > SQL Editor
-- Sau đó áp dụng tất cả file trong supabase/migrations theo thứ tự thời gian.
-- =====================================================

-- 1. BẢNG SỰ KIỆN / PHIÊN HỌP
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active', -- 'draft' | 'active' | 'closed'

  -- Cấu hình vị trí (Geofencing)
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  radius_meters INT DEFAULT 100,

  -- Cấu hình tính năng mở rộng (JSONB)
  module_settings JSONB DEFAULT '{}',

  -- Cấu hình form tùy biến
  -- Ví dụ: [{"key":"phone","label":"Số điện thoại","type":"tel","required":true}]
  custom_fields JSONB DEFAULT '[]'
);
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. BẢNG MÃ PIN ĐỘNG
CREATE TABLE IF NOT EXISTS event_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  current_pin VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG DỮ LIỆU ĐIỂM DANH
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,

  -- Dữ liệu tùy biến theo custom_fields của event
  -- Ví dụ: {"phone":"0912345678","don_vi":"Phòng Kế hoạch"}
  custom_data JSONB DEFAULT '{}',

  -- Xác thực vị trí & thiết bị
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  device_id VARCHAR(255),
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_pins_event_id ON event_pins(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_device   ON attendance_records(event_id, device_id);
CREATE INDEX IF NOT EXISTS idx_events_active_expiration
  ON events(expires_at)
  WHERE status = 'active' AND expires_at IS NOT NULL;

-- ── Row Level Security (RLS) ─────────────────────────────────
-- Bật RLS (dữ liệu public – anon key có thể đọc/ghi)
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_pins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active events" ON events;
DROP POLICY IF EXISTS "Public can read active or closed events" ON events;
CREATE POLICY "Public can read active or closed events"
  ON events FOR SELECT
  USING (
    status IN ('active', 'closed')
    OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can create events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create owned events" ON events;
CREATE POLICY "Authenticated users can create owned events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Owners can close events" ON events;
CREATE POLICY "Owners can close events"
  ON events FOR UPDATE TO authenticated
  USING (
    status = 'active'
    AND (created_by = auth.uid() OR created_by IS NULL)
  )
  WITH CHECK (status = 'closed' AND created_by = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert pins" ON event_pins;
DROP POLICY IF EXISTS "Owners can insert pins for active events" ON event_pins;
CREATE POLICY "Owners can insert pins for active events"
  ON event_pins FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_pins.event_id
        AND events.status = 'active'
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );

DROP POLICY IF EXISTS "Anyone can delete pins" ON event_pins;
DROP POLICY IF EXISTS "Owners can delete pins for active events" ON event_pins;
CREATE POLICY "Owners can delete pins for active events"
  ON event_pins FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_pins.event_id
        AND events.status = 'active'
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );

DROP POLICY IF EXISTS "Anyone can check in" ON attendance_records;
DROP POLICY IF EXISTS "Anyone can check in to active events" ON attendance_records;
CREATE POLICY "Anyone can check in to active events"
  ON attendance_records FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
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
  event_starts_at TIMESTAMPTZ;
  event_expires_at TIMESTAMPTZ;
BEGIN
  SELECT status, starts_at, expires_at
  INTO event_status, event_starts_at, event_expires_at
  FROM public.events
  WHERE id = NEW.event_id;

  IF event_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Event is not active'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_TABLE_NAME = 'attendance_records' AND event_starts_at > NOW() THEN
    RAISE EXCEPTION 'Event has not started yet'
      USING ERRCODE = 'check_violation';
  END IF;

  IF event_expires_at IS NOT NULL AND event_expires_at <= NOW() THEN
    RAISE EXCEPTION 'Event has expired'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_active_event_pin ON event_pins;
CREATE TRIGGER ensure_active_event_pin
  BEFORE INSERT ON event_pins
  FOR EACH ROW EXECUTE FUNCTION public.ensure_event_is_active();

DROP TRIGGER IF EXISTS ensure_active_event_checkIn ON attendance_records;
CREATE TRIGGER ensure_active_event_checkIn
  BEFORE INSERT ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.ensure_event_is_active();

DROP POLICY IF EXISTS "Public can read pins" ON event_pins;
DROP POLICY IF EXISTS "Public can read pins for active events" ON event_pins;
DROP POLICY IF EXISTS "Owners can read pins for active events" ON event_pins;
CREATE POLICY "Owners can read pins for active events"
  ON event_pins FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_pins.event_id
        AND events.status = 'active'
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );
REVOKE SELECT ON TABLE event_pins FROM anon;

-- Chỉ cho phép Host sở hữu sự kiện đọc danh sách điểm danh
DROP POLICY IF EXISTS "Public can read attendance" ON attendance_records;
DROP POLICY IF EXISTS "Owners can read attendance for their events" ON attendance_records;
CREATE POLICY "Owners can read attendance for their events"
  ON attendance_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = attendance_records.event_id
        AND (events.created_by = auth.uid() OR events.created_by IS NULL)
    )
  );
REVOKE SELECT ON TABLE attendance_records FROM anon;

-- ── Bật Supabase Realtime ─────────────────────────────────────
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

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'attendance_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'event_pins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_pins;
  END IF;
END;
$$;
