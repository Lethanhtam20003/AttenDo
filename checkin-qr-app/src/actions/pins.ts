'use server';

import { createClient } from '@/lib/supabase/server';
import {
  PIN_CLEANUP_RETENTION_SECONDS,
  PIN_LIFETIME_SECONDS,
} from '@/constants/checkin';
import type { ActionResult } from '@/types/database';

/**
 * Sinh PIN mới cho sự kiện và ghi vào DB.
 * Giữ lại PIN cũ trong vòng 2 phút để hỗ trợ độ trễ mạng lúc chuyển chu kỳ.
 */
export async function rotatePin(
  eventId: string
): Promise<ActionResult<{ pin: string; expiresAt: string }>> {
  const supabase = await createClient();

  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + PIN_LIFETIME_SECONDS * 1000).toISOString();
  const cleanupBefore = new Date(Date.now() - PIN_CLEANUP_RETENTION_SECONDS * 1000).toISOString();

  // Dọn dẹp các PIN đã hết hạn quá 2 phút
  await supabase
    .from('event_pins')
    .delete()
    .eq('event_id', eventId)
    .lt('expires_at', cleanupBefore);

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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_pins')
    .select('current_pin, expires_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Nếu chưa có PIN nào, tự động tạo mới
    return rotatePin(eventId);
  }

  // Nếu PIN hiện tại đã hết hạn, tự động rotate
  if (new Date(data.expires_at) < new Date()) {
    return rotatePin(eventId);
  }

  return { success: true, data: { pin: data.current_pin, expiresAt: data.expires_at } };
}
