// ============================================================
// TypeScript types tương ứng với schema DB trong plan.md
// ============================================================

export interface CustomFieldConfig {
  key: string;          // tên cột khi xuất (e.g. "phone")
  label: string;        // nhãn hiển thị trên form (e.g. "Số điện thoại")
  type: 'text' | 'tel' | 'number' | 'select';
  required: boolean;
  options?: string[];   // dùng khi type = 'select'
}

export interface ModuleSettings {
  voting_enabled?: boolean;
  doc_sharing?: boolean;
  [key: string]: unknown;
}

// ── events ──────────────────────────────────────────────────
export interface Event {
  id: string;
  created_by: string | null;
  title: string;
  created_at: string;
  status: 'draft' | 'active' | 'closed';

  location_lat: number | null;
  location_lng: number | null;
  radius_meters: number;

  module_settings: ModuleSettings;
  custom_fields: CustomFieldConfig[];
}

export type EventInsert = Omit<Event, 'id' | 'created_at'>;

// ── event_pins ───────────────────────────────────────────────
export interface EventPin {
  id: string;
  event_id: string;
  current_pin: string;
  expires_at: string;
  created_at: string;
}

// ── attendance_records ───────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  event_id: string;
  full_name: string;
  custom_data: Record<string, string>;  // {"phone":"0912...","don_vi":"..."}
  user_lat: number | null;
  user_lng: number | null;
  distance_meters: number | null;
  device_id: string | null;
  checked_in_at: string;
}

export type AttendanceRecordInsert = Omit<AttendanceRecord, 'id' | 'checked_in_at'>;

// ── Server Action response shapes ────────────────────────────
export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };
