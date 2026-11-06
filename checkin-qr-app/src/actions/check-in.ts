'use server';

import { createClient, verifyAuth } from '@/lib/supabase/server';
import type { ActionResult, AttendanceRecord } from '@/types/database';

interface CheckInInput {
  eventId: string;
  fullName: string;
  customData: Record<string, string>;
  userLat: number | null;
  userLng: number | null;
  userAccuracy?: number | null;
  pinInput: string;
  deviceId: string;
  qrToken: string;
}
/** Kiểm tra điểm danh */
export async function checkIn(
  input: CheckInInput
): Promise<ActionResult<Pick<AttendanceRecord, 'id' | 'checked_in_at' | 'distance_meters'>>> {
  const supabase = await createClient();
  const baseRpcArgs = {
    p_event_id: input.eventId,
    p_full_name: input.fullName.trim(),
    p_custom_data: input.customData,
    p_user_lat: input.userLat,
    p_user_lng: input.userLng,
    p_pin_input: input.pinInput.trim(),
    p_device_id: input.deviceId,
    p_qr_token_hash: input.qrToken
      ? await hashQrToken(input.qrToken)
      : null,
  };

  let { data, error } = await supabase.rpc('check_in_to_event', {
    ...baseRpcArgs,
    p_user_accuracy: input.userAccuracy ?? null,
  });

  // Tương thích ngược nếu DB chưa chạy migration bổ sung tham số p_user_accuracy.
  if (
    error &&
    (error.code === 'PGRST202' || error.message.includes('p_user_accuracy'))
  ) {
    const fallbackResult = await supabase.rpc('check_in_to_event', baseRpcArgs);
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { success: false, error: 'Không thể lưu dữ liệu điểm danh. Vui lòng thử lại.' };
  }

  return { success: true, data: record };
}

async function hashQrToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Lấy danh sách điểm danh của sự kiện (chỉ dành cho Host sở hữu phiên) */
export async function getAttendanceList(eventId: string) {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (!event) return [];

  const { data } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });
  return data ?? [];
}
