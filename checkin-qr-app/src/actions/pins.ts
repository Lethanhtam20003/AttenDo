'use server';

import { createClient, verifyAuth } from '@/lib/supabase/server';
import {
  PIN_CLEANUP_RETENTION_SECONDS,
  getPinRefreshSeconds,
} from '@/constants/check-in';
import type { ActionResult } from '@/types/database';

/**
 * Sinh PIN mới cho sự kiện và ghi vào DB.
 * Giữ lại PIN cũ trong vòng 2 phút để hỗ trợ độ trễ mạng lúc chuyển chu kỳ.
 */
export async function rotatePin(
  eventId: string,
  forceRotate = false
): Promise<ActionResult<{ pin: string; expiresAt: string }>> {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('status, starts_at, module_settings')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (eventError) return { success: false, error: eventError.message };
  if (!event) {
    return {
      success: false,
      error: 'Không tìm thấy phiên điểm danh hoặc bạn không có quyền thao tác.',
    };
  }
  if (event.status !== 'active') {
    return { success: false, error: 'Phiên điểm danh đã kết thúc.' };
  }

  // Tái sử dụng PIN vừa được màn hình khác tạo nếu đây là lệnh xoay tự động hết chu kỳ
  if (!forceRotate) {
    const { data: existingPin } = await supabase
      .from('event_pins')
      .select('current_pin, expires_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existingPin &&
      new Date(existingPin.expires_at).getTime() > Date.now() + 1000
    ) {
      return {
        success: true,
        data: { pin: existingPin.current_pin, expiresAt: existingPin.expires_at },
      };
    }
  }

  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const refreshSeconds = getPinRefreshSeconds(event.module_settings?.pin_interval_seconds);
  const effectiveStart = Math.max(Date.now(), new Date(event.starts_at).getTime());
  const expiresAt = new Date(effectiveStart + refreshSeconds * 1000).toISOString();
  const cleanupBefore = new Date(Date.now() - PIN_CLEANUP_RETENTION_SECONDS * 1000).toISOString();

  // Dọn dẹp các PIN đã hết hạn quá 2 phút
  const { error: cleanupError } = await supabase
    .from('event_pins')
    .delete()
    .eq('event_id', eventId)
    .lt('expires_at', cleanupBefore);

  if (cleanupError) return { success: false, error: cleanupError.message };

  const { error } = await supabase
    .from('event_pins')
    .insert({ event_id: eventId, current_pin: pin, expires_at: expiresAt });

  if (error) return { success: false, error: error.message };

  return { success: true, data: { pin, expiresAt } };
}

/**
 * Lấy PIN hiện tại của sự kiện (kèm thời gian hết hạn).
 */
export async function getCurrentPin(
  eventId: string
): Promise<ActionResult<{ pin: string; expiresAt: string }>> {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('status, starts_at')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (eventError) return { success: false, error: eventError.message };
  if (!event) {
    return {
      success: false,
      error: 'Không tìm thấy phiên điểm danh hoặc bạn không có quyền thao tác.',
    };
  }
  if (event.status !== 'active') {
    return { success: false, error: 'Phiên điểm danh đã kết thúc.' };
  }

  const { data, error } = await supabase
    .from('event_pins')
    .select('current_pin, expires_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { success: false, error: error.message };

  if (!data) {
    // Nếu chưa có PIN nào, tự động tạo mới
    return rotatePin(eventId);
  }

  // Nếu PIN hiện tại đã hết hạn hoặc còn <= 1 giây, tự động rotate
  if (new Date(data.expires_at).getTime() <= Date.now() + 1000) {
    return rotatePin(eventId, false);
  }

  return { success: true, data: { pin: data.current_pin, expiresAt: data.expires_at } };
}
