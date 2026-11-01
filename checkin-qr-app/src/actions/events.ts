'use server';

import { createClient } from '@/lib/supabase/server';
import { PIN_LIFETIME_SECONDS } from '@/constants/checkin';
import type { ActionResult, CustomFieldConfig } from '@/types/database';

interface CreateEventInput {
  title: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  custom_fields: CustomFieldConfig[];
}

/**
 * Tạo sự kiện mới và PIN đầu tiên.
 * Trả về { eventId, pin } nếu thành công.
 */
export async function createEvent(
  input: CreateEventInput
): Promise<ActionResult<{ eventId: string; pin: string }>> {
  const supabase = await createClient();

  // 1. Tạo sự kiện
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      title: input.title,
      status: 'active',
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      radius_meters: input.radius_meters,
      custom_fields: input.custom_fields,
      module_settings: { checkin: true },
    })
    .select('id')
    .single();

  if (eventError || !event) {
    return { success: false, error: eventError?.message ?? 'Không thể tạo sự kiện.' };
  }

  // 2. Tạo PIN đầu tiên
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + PIN_LIFETIME_SECONDS * 1000).toISOString();

  const { error: pinError } = await supabase
    .from('event_pins')
    .insert({ event_id: event.id, current_pin: pin, expires_at: expiresAt });

  if (pinError) {
    return { success: false, error: pinError.message };
  }

  return { success: true, data: { eventId: event.id, pin } };
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
