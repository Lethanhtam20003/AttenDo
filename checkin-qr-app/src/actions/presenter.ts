'use server';

import { createHash, createHmac, randomBytes } from 'node:crypto';
import { createClient, verifyAuth } from '@/lib/supabase/server';
import {
  QR_TOKEN_REFRESH_GRACE_SECONDS,
  getPinRefreshSeconds,
  getQrTokenRefreshSeconds,
} from '@/constants/check-in';
import type { ActionResult, AttendanceRecord } from '@/types/database';

function deriveFallbackToken(eventId: string, createdAt: string, createdBy: string | null): string {
  const secretSeed = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'attendo-presenter-secret';
  return createHmac('sha256', secretSeed)
    .update(`presenter:${eventId}:${createdAt}:${createdBy ?? 'anon'}`)
    .digest('base64url')
    .slice(0, 28);
}

/**
 * Lấy hoặc khởi tạo mã khóa trình chiếu (presenter_token) cho Admin sở hữu sự kiện.
 */
export async function getOrCreatePresenterToken(
  eventId: string
): Promise<ActionResult<{ token: string }>> {
  const user = await verifyAuth();
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, created_at, created_by')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (eventError || !event) {
    return {
      success: false,
      error: 'Không tìm thấy phiên điểm danh hoặc bạn không có quyền tạo link trình chiếu.',
    };
  }

  // Kiểm tra trong bảng event_presenter_tokens trước
  const { data: existingRow, error: selectError } = await supabase
    .from('event_presenter_tokens')
    .select('presenter_token')
    .eq('event_id', eventId)
    .maybeSingle();

  if (!selectError && existingRow?.presenter_token) {
    return { success: true, data: { token: existingRow.presenter_token } };
  }

  const newToken = randomBytes(18).toString('base64url');
  const { error: insertError } = await supabase
    .from('event_presenter_tokens')
    .upsert({ event_id: eventId, presenter_token: newToken }, { onConflict: 'event_id' });

  if (!insertError) {
    return { success: true, data: { token: newToken } };
  }

  // Fallback tương thích nếu DB chưa chạy migration 202611080003_presenter_share_access.sql
  return {
    success: true,
    data: { token: deriveFallbackToken(event.id, event.created_at, event.created_by) },
  };
}

/**
 * Xác minh mã khóa trình chiếu có hợp lệ với sự kiện không.
 */
export async function verifyPresenterAccess(
  eventId: string,
  presenterToken: string
): Promise<boolean> {
  const normalizedToken = presenterToken.trim();
  if (!eventId || normalizedToken.length < 16) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('verify_presenter_token', {
    p_event_id: eventId,
    p_token: normalizedToken,
  });

  if (!error && typeof data === 'boolean') {
    return data;
  }

  // Fallback kiểm tra bằng HMAC nếu DB chưa chạy migration mới
  const { data: event } = await supabase
    .from('events')
    .select('id, created_at, created_by')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) return false;
  const expected = deriveFallbackToken(event.id, event.created_at, event.created_by);
  return normalizedToken === expected;
}

/**
 * Lấy danh sách người tham dự trên màn hình trình chiếu bằng presenter_token.
 */
export async function getPresenterAttendanceList(
  eventId: string,
  presenterToken: string
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('presenter_get_attendance', {
    p_event_id: eventId,
    p_token: presenterToken.trim(),
  });

  if (!error && Array.isArray(data)) {
    return data as AttendanceRecord[];
  }

  // Fallback nếu người mở link đồng thời đang có phiên đăng nhập chủ sự kiện
  const isValid = await verifyPresenterAccess(eventId, presenterToken);
  if (!isValid) return [];

  const { data: fallbackRows } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });

  return (fallbackRows as AttendanceRecord[] | null) ?? [];
}

/**
 * Lấy hoặc xoay vòng mã PIN trên màn hình trình chiếu.
 */
export async function getOrRotatePresenterPin(
  eventId: string,
  presenterToken: string,
  forceRotate = false
): Promise<ActionResult<{ pin: string; expiresAt: string }>> {
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('status, starts_at, module_settings')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !event) {
    return { success: false, error: 'Không tìm thấy phiên điểm danh.' };
  }
  if (event.status !== 'active') {
    return { success: false, error: 'Phiên điểm danh đã kết thúc.' };
  }

  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const refreshSeconds = getPinRefreshSeconds(event.module_settings?.pin_interval_seconds);
  const effectiveStart = Math.max(Date.now(), new Date(event.starts_at).getTime());
  const expiresAt = new Date(effectiveStart + refreshSeconds * 1000).toISOString();

  const { data, error } = await supabase.rpc('presenter_get_or_rotate_pin', {
    p_event_id: eventId,
    p_token: presenterToken.trim(),
    p_force_rotate: forceRotate,
    p_new_pin: pin,
    p_expires_at: expiresAt,
  });

  if (!error && data) {
    const row = Array.isArray(data) ? data[0] : data;
    if (row && typeof row.pin === 'string' && typeof row.expires_at === 'string') {
      return { success: true, data: { pin: row.pin, expiresAt: row.expires_at } };
    }
  }

  return {
    success: false,
    error:
      error?.message ??
      'Không thể lấy hoặc làm mới mã PIN trên màn hình trình chiếu (cần áp dụng migration SQL presenter_share_access).',
  };
}

/**
 * Cấp mã QR động trên màn hình trình chiếu bằng presenter_token.
 */
export async function issuePresenterDynamicQrToken(
  eventId: string,
  presenterToken: string
): Promise<ActionResult<{ token: string; expiresAt: string }>> {
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('status, starts_at, module_settings')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !event || event.status !== 'active') {
    return { success: false, error: 'Không tìm thấy phiên đang hoạt động.' };
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
  const effectiveStart = Math.max(now.getTime(), new Date(event.starts_at).getTime());
  const expiresAt = new Date(
    effectiveStart + (refreshSeconds + QR_TOKEN_REFRESH_GRACE_SECONDS) * 1000
  ).toISOString();

  const { error } = await supabase.rpc('presenter_issue_dynamic_qr_token', {
    p_event_id: eventId,
    p_token: presenterToken.trim(),
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });

  if (error) {
    return {
      success: false,
      error: 'Không thể làm mới mã QR động trên trang trình chiếu.',
    };
  }

  return { success: true, data: { token, expiresAt } };
}

/**
 * Kết thúc sự kiện từ màn hình trình chiếu bằng presenter_token.
 */
export async function endPresenterEvent(
  eventId: string,
  presenterToken: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('presenter_close_event', {
    p_event_id: eventId,
    p_token: presenterToken.trim(),
  });

  if (error) {
    return {
      success: false,
      error: 'Không thể kết thúc phiên điểm danh từ trang trình chiếu.',
    };
  }

  return { success: true, data: null };
}
