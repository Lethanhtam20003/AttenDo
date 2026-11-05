'use server';

import { createHash, randomBytes } from 'node:crypto';
import { createClient, verifyAuth } from '@/lib/supabase/server';
import {
  QR_TOKEN_REFRESH_GRACE_SECONDS,
  getQrTokenRefreshSeconds,
} from '@/constants/check-in';
import type { ActionResult } from '@/types/database';

export async function issueDynamicQrToken(
  eventId: string
): Promise<ActionResult<{ token: string; expiresAt: string }>> {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('status, module_settings')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (eventError) {
    return { success: false, error: 'Không thể xác minh phiên điểm danh.' };
  }
  if (!event || event.status !== 'active') {
    return { success: false, error: 'Không tìm thấy phiên đang hoạt động hoặc bạn không có quyền.' };
  }
  if (event.module_settings?.dynamic_qr !== true) {
    return { success: false, error: 'Phiên này không sử dụng mã QR động.' };
  }

  const now = new Date();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const refreshSeconds = getQrTokenRefreshSeconds(
    event.module_settings?.dynamic_qr_interval_seconds
  );
  const expiresAt = new Date(
    now.getTime() + (refreshSeconds + QR_TOKEN_REFRESH_GRACE_SECONDS) * 1000
  ).toISOString();

  const { error: cleanupError } = await supabase
    .from('event_qr_tokens')
    .delete()
    .eq('event_id', eventId)
    .lt('expires_at', now.toISOString());

  if (cleanupError) {
    return { success: false, error: 'Không thể làm mới mã QR. Vui lòng thử lại.' };
  }

  const { error: insertError } = await supabase
    .from('event_qr_tokens')
    .insert({ event_id: eventId, token_hash: tokenHash, expires_at: expiresAt });

  if (insertError) {
    return { success: false, error: 'Không thể tạo mã QR động. Vui lòng thử lại.' };
  }

  return { success: true, data: { token, expiresAt } };
}
