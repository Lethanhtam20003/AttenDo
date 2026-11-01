'use server';

import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_CHECKIN_RADIUS_METERS,
  EARTH_RADIUS_METERS,
  PIN_GRACE_PERIOD_SECONDS,
} from '@/constants/checkin';
import type { ActionResult, AttendanceRecord } from '@/types/database';

/** Công thức Haversine tính khoảng cách giữa 2 tọa độ (mét) */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CheckInInput {
  eventId: string;
  fullName: string;
  customData: Record<string, string>;
  userLat: number;
  userLng: number;
  pinInput: string;
  deviceId: string;
}
/** Kiểm tra điểm danh */
export async function checkIn(
  input: CheckInInput
): Promise<ActionResult<Pick<AttendanceRecord, 'id' | 'checked_in_at' | 'distance_meters'>>> {
  const supabase = await createClient();

  // 1. Lấy thông tin sự kiện (vị trí và bán kính)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('location_lat, location_lng, radius_meters, status')
    .eq('id', input.eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: 'Sự kiện không tồn tại.' };
  }
  if (event.status !== 'active') {
    return { success: false, error: 'Sự kiện đã đóng. Không thể điểm danh.' };
  }

  // 2. Kiểm tra Geofence (nếu sự kiện có cấu hình tọa độ)
  let distance: number | null = null;
  if (event.location_lat != null && event.location_lng != null) {
    distance = haversineDistance(
      event.location_lat,
      event.location_lng,
      input.userLat,
      input.userLng
    );
    if (distance > (event.radius_meters || DEFAULT_CHECKIN_RADIUS_METERS)) {
      return {
        success: false,
        error: `Bạn đang ở ngoài vùng điểm danh (cách ${Math.round(distance)}m, bán kính cho phép ${event.radius_meters}m). Hãy di chuyển lại gần vị trí tổ chức.`,
      };
    }
  }

  // 3. Kiểm tra PIN hợp lệ (hỗ trợ độ trễ mạng 15s cho PIN vừa đổi)
  const now = Date.now();
  const { data: pins, error: pinError } = await supabase
    .from('event_pins')
    .select('current_pin, expires_at')
    .eq('event_id', input.eventId)
    .order('created_at', { ascending: false })
    .limit(2);

  if (pinError || !pins || pins.length === 0) {
    return { success: false, error: 'Không thể xác minh mã PIN. Vui lòng thử lại.' };
  }

  const validPin = pins.find((p) => {
    if (p.current_pin !== input.pinInput.trim()) return false;
    const expiryTime = new Date(p.expires_at).getTime();
    // Chấp nhận nếu chưa hết hạn hoặc vừa hết hạn trong vòng 15 giây
    return now <= expiryTime + PIN_GRACE_PERIOD_SECONDS * 1000;
  });

  if (!validPin) {
    return {
      success: false,
      error: 'Mã PIN không đúng hoặc đã hết hạn. Hãy nhìn màn chiếu của Host để lấy mã mới nhất.',
    };
  }

  // 4. Kiểm tra thiết bị đã điểm danh chưa (device_id)
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('event_id', input.eventId)
    .eq('device_id', input.deviceId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Thiết bị này đã được ghi nhận điểm danh rồi.' };
  }

  // 5. Lưu bản ghi điểm danh
  const { data: record, error: insertError } = await supabase
    .from('attendance_records')
    .insert({
      event_id: input.eventId,
      full_name: input.fullName.trim(),
      custom_data: input.customData,
      user_lat: input.userLat,
      user_lng: input.userLng,
      distance_meters: distance !== null ? Math.round(distance) : null,
      device_id: input.deviceId,
    })
    .select('id, checked_in_at, distance_meters')
    .single();

  if (insertError || !record) {
    return { success: false, error: 'Có lỗi khi lưu dữ liệu điểm danh. Vui lòng thử lại.' };
  }

  return { success: true, data: record };
}

/** Lấy danh sách điểm danh của sự kiện */
export async function getAttendanceList(eventId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });
  return data ?? [];
}
