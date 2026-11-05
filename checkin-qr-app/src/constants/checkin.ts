// Thời hạn PIN của các phiên cũ và mặc định cho phiên mới, tính bằng giây.
export const PIN_LIFETIME_SECONDS = 5 * 60;
export const PIN_REFRESH_DEFAULT_SECONDS = 30;
export const PIN_GRACE_PERIOD_SECONDS = 15;
export const PIN_MIN_REFRESH_SECONDS = 1;
export const PIN_MAX_REFRESH_SECONDS = 24 * 60 * 60;

export function getPinRefreshSeconds(value: unknown): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= PIN_MIN_REFRESH_SECONDS &&
    value <= PIN_MAX_REFRESH_SECONDS
    ? value
    : PIN_LIFETIME_SECONDS;
}

// Thời gian giữ PIN cũ trước khi dọn khỏi cơ sở dữ liệu, tính bằng giây.
export const PIN_CLEANUP_RETENTION_SECONDS = 2 * 60;
export const QR_TOKEN_LIFETIME_SECONDS = 30;
export const QR_TOKEN_REFRESH_GRACE_SECONDS = 5;
export const QR_TOKEN_MIN_REFRESH_SECONDS = 1;
export const QR_TOKEN_MAX_REFRESH_SECONDS = 24 * 60 * 60;

export function getQrTokenRefreshSeconds(value: unknown): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= QR_TOKEN_MIN_REFRESH_SECONDS &&
    value <= QR_TOKEN_MAX_REFRESH_SECONDS
    ? value
    : QR_TOKEN_LIFETIME_SECONDS;
}

// Các giá trị khoảng cách tính bằng mét.
export const DEFAULT_CHECKIN_RADIUS_METERS = 100;
export const EARTH_RADIUS_METERS = 6_371_000;

export function getLocationConsentStorageKey(eventId: string): string {
  return `attendo_location_consent_${eventId}`;
}
