export const ACCURACY_BUFFER_CAP_METERS = 30;
export const CONVERGED_ACCURACY_THRESHOLD_METERS = 35;
export const IOS_APPROXIMATE_LOCATION_THRESHOLD_METERS = 500;
export const FAST_DENY_THRESHOLD_MS = 350;

export interface BrowserEnvironment {
  isZalo: boolean;
  isInAppBrowser: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browserName: string;
}

export interface GeofenceEvaluation {
  rawDistance: number;
  effectiveDistance: number;
  isWithinRadius: boolean;
}

function resolveBrowserName(ua: string, isZalo: boolean): string {
  if (isZalo) return 'Zalo';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'Facebook';
  if (/Messenger/i.test(ua)) return 'Messenger';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/TikTok|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) return 'Safari';
  return 'Trình duyệt';
}

/**
 * Nhận diện môi trường trình duyệt và In-App WebView (Zalo, Facebook, Messenger)
 * để cung cấp đúng luồng xin quyền GPS hoặc thoát ra Chrome/Safari.
 */
export function detectBrowserEnvironment(customUserAgent?: string): BrowserEnvironment {
  const ua =
    customUserAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  if (!ua) {
    return {
      isZalo: false,
      isInAppBrowser: false,
      isIOS: false,
      isAndroid: false,
      browserName: 'Trình duyệt',
    };
  }

  // iPadOS 13+ thường giả lập UA thành Macintosh nhưng có hỗ trợ cảm ứng đa điểm.
  const isIPadOS =
    typeof navigator !== 'undefined' &&
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1;

  const isIOS = /iPhone|iPad|iPod/i.test(ua) || isIPadOS;
  const isAndroid = /Android/i.test(ua);
  const hasZaloBridge =
    typeof window !== 'undefined' &&
    ('ZaloJavaScriptInterface' in window || 'zaloJSV2' in window);
  const isZalo = hasZaloBridge || /Zalo/i.test(ua);
  const browserName = resolveBrowserName(ua, isZalo);

  // Nhận diện các WebView nhúng phổ biến thường tự chặn hoặc làm treo popup quyền GPS.
  const isInAppBrowser =
    isZalo ||
    /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line|MicroMessenger|TikTok|BytedanceWebview|WebView/i.test(
      ua
    ) ||
    (isAndroid && /; wv\)/i.test(ua));

  return {
    isZalo,
    isInAppBrowser,
    isIOS,
    isAndroid,
    browserName,
  };
}

/**
 * Tính khoảng cách mặt cầu Haversine (mét) đồng bộ với công thức trong PostgreSQL RPC.
 */
export function calculateRawDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const clampedA = Math.min(1, Math.max(0, a));
  return 6371000 * 2 * Math.asin(Math.sqrt(clampedA));
}

/**
 * Bù trừ sai số thiết bị tối đa 30m để người tham dự trong hội trường không bị loại oan
 * do nhiễu sóng GPS trong nhà.
 */
export function calculateEffectiveDistanceMeters(
  rawDistance: number,
  accuracy: number | null | undefined
): number {
  const safeAccuracy =
    typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy > 0
      ? accuracy
      : 0;
  const accuracyBuffer = Math.min(safeAccuracy, ACCURACY_BUFFER_CAP_METERS);
  return Math.max(0, Math.round(rawDistance - accuracyBuffer));
}

/**
 * Đánh giá tọa độ người dùng so với tâm và bán kính sự kiện.
 */
export function evaluateGeofence(params: {
  userLat: number;
  userLng: number;
  accuracy: number | null;
  targetLat: number | null;
  targetLng: number | null;
  radiusMeters: number;
}): GeofenceEvaluation {
  const { userLat, userLng, accuracy, targetLat, targetLng, radiusMeters } = params;
  const allowedRadius = radiusMeters > 0 ? radiusMeters : 100;

  if (targetLat === null || targetLng === null) {
    return {
      rawDistance: 0,
      effectiveDistance: 0,
      isWithinRadius: true,
    };
  }

  const rawDistanceFloat = calculateRawDistanceMeters(
    userLat,
    userLng,
    targetLat,
    targetLng
  );
  const rawDistance = Math.round(rawDistanceFloat);
  const effectiveDistance = calculateEffectiveDistanceMeters(
    rawDistanceFloat,
    accuracy
  );

  return {
    rawDistance,
    effectiveDistance,
    isWithinRadius: effectiveDistance <= allowedRadius,
  };
}

/**
 * Tạo Android Intent URI mở thẳng Google Chrome từ Zalo/Facebook WebView,
 * bảo toàn nguyên vẹn query params (?config=...&qr=...) của phiên điểm danh.
 */
export function buildAndroidChromeIntentUrl(currentHref: string): string {
  try {
    const parsedUrl = new URL(currentHref);
    const scheme = parsedUrl.protocol.replace(':', '') || 'https';
    const urlNoProtocol = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    const encodedFallbackUrl = encodeURIComponent(parsedUrl.toString());

    return `intent://${urlNoProtocol}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodedFallbackUrl};end`;
  } catch {
    const cleanHref = currentHref.replace(/^https?:\/\//i, '');
    return `intent://${cleanHref}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentHref)};end`;
  }
}


