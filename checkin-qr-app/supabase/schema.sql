-- =====================================================
-- AttenDo – Database Schema Migration
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. BẢNG SỰ KIỆN / PHIÊN HỌP
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
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

-- ── Row Level Security (RLS) ─────────────────────────────────
-- Bật RLS (dữ liệu public – anon key có thể đọc/ghi)
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_pins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Cho phép anon đọc events đang active
CREATE POLICY "Public can read active events"
  ON events FOR SELECT
  USING (status = 'active');

-- Cho phép anon tạo events (Host chưa đăng nhập)
CREATE POLICY "Anyone can create events"
  ON events FOR INSERT
  WITH CHECK (true);

-- Cho phép anon đọc PIN (để màn hình Live hiển thị)
CREATE POLICY "Public can read pins"
  ON event_pins FOR SELECT
  USING (true);

-- Cho phép anon tạo PIN (Server Action)
CREATE POLICY "Anyone can insert pins"
  ON event_pins FOR INSERT
  WITH CHECK (true);

-- Cho phép anon xóa PIN cũ (khi rotate)
CREATE POLICY "Anyone can delete pins"
  ON event_pins FOR DELETE
  USING (true);

-- Cho phép anon đọc danh sách điểm danh
CREATE POLICY "Public can read attendance"
  ON attendance_records FOR SELECT
  USING (true);

-- Cho phép anon ghi điểm danh
CREATE POLICY "Anyone can check in"
  ON attendance_records FOR INSERT
  WITH CHECK (true);

-- ── Bật Supabase Realtime ─────────────────────────────────────
-- Thực hiện trong Supabase Dashboard:
--   Database > Replication > Tables > Bật toggle cho:
--     • event_pins
--     • attendance_records
-- Hoặc chạy lệnh sau (nếu dùng supabase CLI):
-- ALTER PUBLICATION supabase_realtime ADD TABLE event_pins;
-- ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;

