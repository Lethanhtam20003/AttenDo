'use server';

import { createClient, verifyAuth } from '@/lib/supabase/server';
import {
  PIN_MAX_REFRESH_SECONDS,
  PIN_MIN_REFRESH_SECONDS,
  QR_TOKEN_MAX_REFRESH_SECONDS,
  QR_TOKEN_MIN_REFRESH_SECONDS,
} from '@/constants/check-in';
import type {
  ActionResult,
  AttendanceRecord,
  CustomFieldConfig,
  Event,
} from '@/types/database';
import { parseVietnamDateTimeLocal } from '@/lib/vietnam-time';

export type ManagedEvent = Pick<
  Event,
  'id' | 'title' | 'status' | 'created_at' | 'starts_at' | 'expires_at' | 'location_lat' | 'location_lng'
>;

const DUPLICATE_EVENT_TITLE_ERROR =
  'Tên phiên điểm danh này đã được sử dụng. Vui lòng chọn tên khác.';

interface CreateEventInput {
  title: string;
  starts_at: string;
  duration_minutes: number;
  location_lat: number | null;
  location_lng: number | null;
  radius_meters: number;
  custom_fields: CustomFieldConfig[];
  module_settings: {
    require_location: boolean;
    require_pin: boolean;
    dynamic_qr: boolean;
    dynamic_qr_interval_seconds: number;
    pin_interval_seconds: number;
  };
}

export async function checkEventTitle(
  title: string
): Promise<ActionResult<boolean>> {
  await verifyAuth();
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    return { success: false, error: 'Vui lòng nhập tên sự kiện.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id')
    .eq('title', normalizedTitle)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { success: false, error: 'Không thể kiểm tra tên phiên. Vui lòng thử lại.' };
  }

  return { success: true, data: !data };
}

/**
 * Tạo sự kiện mới và PIN đầu tiên.
 * Trả về { eventId, pin } nếu thành công.
 */
export async function createEvent(
  input: CreateEventInput
): Promise<ActionResult<{ eventId: string; pin: string | null }>> {
  const user = await verifyAuth();
  const title = input.title.trim();
  if (!title) {
    return { success: false, error: 'Vui lòng nhập tên sự kiện trước khi khởi chạy.' };
  }
  const startsAt = parseVietnamDateTimeLocal(input.starts_at);
  if (!startsAt || startsAt.getTime() <= Date.now()) {
    return { success: false, error: 'Vui lòng chọn ngày và giờ bắt đầu trong tương lai theo giờ Việt Nam.' };
  }

  if (
    !Number.isInteger(input.duration_minutes) ||
    input.duration_minutes < 1 ||
    input.duration_minutes > 10080
  ) {
    return { success: false, error: 'Thời gian tồn tại phiên phải từ 1 phút đến 168 giờ.' };
  }

  if (input.custom_fields.length === 0) {
    return {
      success: false,
      error: 'Vui lòng thêm ít nhất một trường thông tin người tham dự.',
    };
  }

  const qrInterval = input.module_settings.dynamic_qr_interval_seconds;
  if (
    input.module_settings.dynamic_qr &&
    (!Number.isInteger(qrInterval) ||
      qrInterval < QR_TOKEN_MIN_REFRESH_SECONDS ||
      qrInterval > QR_TOKEN_MAX_REFRESH_SECONDS)
  ) {
    return { success: false, error: 'Thời gian đổi mã QR phải từ 1 đến 86400 giây.' };
  }
  const pinInterval = input.module_settings.pin_interval_seconds;
  if (
    input.module_settings.require_pin &&
    (!Number.isInteger(pinInterval) ||
      pinInterval < PIN_MIN_REFRESH_SECONDS ||
      pinInterval > PIN_MAX_REFRESH_SECONDS)
  ) {
    return { success: false, error: 'Thời gian đổi mã PIN phải từ 1 đến 86400 giây.' };
  }

  const supabase = await createClient();
  const { data: existingEvent, error: titleCheckError } = await supabase
    .from('events')
    .select('id')
    .eq('title', title)
    .limit(1)
    .maybeSingle();

  if (titleCheckError) {
    return { success: false, error: 'Không thể kiểm tra tên phiên. Vui lòng thử lại.' };
  }
  if (existingEvent) {
    return { success: false, error: DUPLICATE_EVENT_TITLE_ERROR };
  }

  const expiresAt = new Date(
    startsAt.getTime() + input.duration_minutes * 60 * 1000
  ).toISOString();

  // 1. Tạo sự kiện
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      created_by: user.id,
      title,
      status: 'active',
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      radius_meters: input.radius_meters,
      custom_fields: input.custom_fields,
      module_settings: { checkIn: true, ...input.module_settings },
    })
    .select('id')
    .single();

  if (eventError || !event) {
    if (eventError?.code === '23505') {
      return { success: false, error: DUPLICATE_EVENT_TITLE_ERROR };
    }
    return { success: false, error: eventError?.message ?? 'Không thể tạo sự kiện.' };
  }

  // 2. Tạo PIN đầu tiên
  let pin: string | null = null;
  if (input.module_settings.require_pin) {
    pin = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(
      startsAt.getTime() + input.module_settings.pin_interval_seconds * 1000
    ).toISOString();

    const { error: pinError } = await supabase
      .from('event_pins')
      .insert({ event_id: event.id, current_pin: pin, expires_at: expiresAt });

    if (pinError) {
      return { success: false, error: pinError.message };
    }
  }

  return { success: true, data: { eventId: event.id, pin } };
}

export async function endEvent(eventId: string): Promise<ActionResult<{ eventId: string }>> {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .update({ status: 'closed', created_by: user.id })
    .eq('id', eventId)
    .eq('status', 'active')
    .or(`created_by.eq.${user.id},created_by.is.null`)
    .select('id')
    .maybeSingle();

  if (error) {
    return { success: false, error: 'Không thể kết thúc phiên điểm danh. Vui lòng thử lại.' };
  }

  if (!data) {
    return {
      success: false,
      error: 'Không tìm thấy phiên đang mở hoặc bạn không có quyền kết thúc phiên này.',
    };
  }

  return { success: true, data: { eventId: data.id } };
}

/**
 * Lấy thông tin sự kiện (dùng trong màn hình check-in để render form động).
 */
export async function getEvent(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) return null;
  return data;
}

export async function getManagedEvents(): Promise<ActionResult<ManagedEvent[]>> {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('id, title, status, created_at, starts_at, expires_at, location_lat, location_lng')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: 'Không thể tải danh sách phiên điểm danh.' };
  }

  return { success: true, data: data ?? [] };
}

export async function getManagedEventAttendance(
  eventId: string
): Promise<ActionResult<{ event: Event; attendees: AttendanceRecord[] }>> {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (eventError) {
    return { success: false, error: 'Không thể tải thông tin phiên điểm danh.' };
  }

  if (!event) {
    return { success: false, error: 'Không tìm thấy phiên điểm danh hoặc bạn không có quyền xem.' };
  }

  const { data: attendees, error: attendanceError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });

  if (attendanceError) {
    return { success: false, error: 'Không thể tải danh sách người tham dự.' };
  }

  return { success: true, data: { event, attendees: attendees ?? [] } };
}
