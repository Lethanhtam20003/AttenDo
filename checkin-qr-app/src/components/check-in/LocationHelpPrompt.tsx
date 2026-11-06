'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Check, Copy, ExternalLink, HelpCircle, X } from 'lucide-react';
import type { CheckInBrowser, DevicePlatform } from '@/lib/check-in/browser';
import type { GpsIssue } from '@/stores/check-in-store';
import { useToolsStore } from '@/stores/tools-store';

function subscribeToLocation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

function getPageUrl() {
  return window.location.href;
}

function getIosAppName(browser: CheckInBrowser) {
  if (browser === 'zalo') return 'Zalo';
  if (browser === 'chrome') return 'Chrome';
  if (browser === 'safari') return 'Safari';
  return 'trình duyệt đang dùng';
}

function getAndroidAppName(browser: CheckInBrowser) {
  if (browser === 'zalo') return 'Zalo';
  if (browser === 'chrome') return 'Chrome';
  return 'trình duyệt đang dùng';
}

interface LocationHelpPromptProps {
  platform: DevicePlatform;
  browser: CheckInBrowser;
  inAppBrowser: boolean;
  gpsIssue: GpsIssue | null;
}

function getChromeIntentUrl(currentPageUrl: string) {
  const pageUrl = new URL(currentPageUrl);
  const fallbackUrl = encodeURIComponent(pageUrl.toString());
  return `intent://${pageUrl.host}${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}#Intent;scheme=${pageUrl.protocol.slice(0, -1)};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
}

export default function LocationHelpPrompt({
  platform,
  browser,
  inAppBrowser,
  gpsIssue,
}: LocationHelpPromptProps) {
  const open = useToolsStore((state) => state.locationHelpOpen);
  const copied = useToolsStore((state) => state.locationHelpCopied);
  const copyError = useToolsStore((state) => state.locationHelpCopyError);
  const setOpen = useToolsStore((state) => state.setLocationHelpOpen);
  const setCopied = useToolsStore((state) => state.setLocationHelpCopied);
  const setCopyError = useToolsStore((state) => state.setLocationHelpCopyError);
  const pageUrl = useSyncExternalStore(subscribeToLocation, getPageUrl, () => '');
  const permissionDenied = gpsIssue === 'permission-denied';
  const deviceLocationUnavailable =
    gpsIssue === 'position-unavailable' || gpsIssue === 'timeout';
  const inAppBrowserBlocked = gpsIssue === 'in-app-browser';

  useEffect(() => {
    setOpen(gpsIssue !== null || inAppBrowser);
    setCopied(false);
    setCopyError(false);
  }, [gpsIssue, inAppBrowser, setCopyError, setCopied, setOpen]);

  const copyLink = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="mx-auto mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium text-blue-700 hover:bg-blue-50"
      >
        <HelpCircle className="h-4 w-4" />
        {inAppBrowserBlocked || inAppBrowser
          ? 'Mở check-in bằng trình duyệt'
          : permissionDenied
          ? 'Cách bật lại quyền vị trí'
          : deviceLocationUnavailable
            ? 'Cách bật Dịch vụ định vị'
            : 'Hướng dẫn quyền vị trí'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-help-title"
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="location-help-title" className="text-base font-bold text-slate-900">
                  {inAppBrowserBlocked || inAppBrowser
                    ? 'Mở check-in bằng trình duyệt Safari/Chrome'
                    : permissionDenied
                    ? 'Bật lại quyền vị trí'
                    : deviceLocationUnavailable
                      ? 'Bật Dịch vụ định vị của thiết bị'
                      : 'Hướng dẫn quyền vị trí'}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {inAppBrowserBlocked
                    ? 'Trình duyệt trong ứng dụng có thể chặn yêu cầu GPS. Hãy mở menu ⋯ ở góc trên và chọn Mở bằng Safari hoặc Chrome, sau đó thử lại.'
                    : permissionDenied
                    ? 'Thiết bị đã từ chối quyền vị trí. Hãy bật lại theo hướng dẫn bên dưới, sau đó quay lại trang và nhấn Thử lại.'
                    : deviceLocationUnavailable
                      ? 'Quyền truy cập trình duyệt đã được cấp nhưng thiết bị chưa trả về tọa độ. Hãy bật Dịch vụ định vị của điện thoại theo hướng dẫn, sau đó quay lại và nhấn Thử lại; không cần cấp lại quyền trình duyệt.'
                      : 'Nhấn Cho phép vị trí trên biểu mẫu để yêu cầu GPS. Nếu không lấy được vị trí, hãy làm theo hướng dẫn dưới đây.'}
                </p>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  Nhận diện: {getPlatformName(platform)} · {getBrowserName(browser)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng hướng dẫn"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {platform === 'ios' ? (
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-xs leading-relaxed text-slate-700">
                <li>
                  Mở <strong>Cài đặt iPhone → Quyền riêng tư &amp; Bảo mật → Dịch vụ định vị</strong> và bật Dịch vụ định vị.
                </li>
                <li>
                  Chọn <strong>{getIosAppName(browser)}</strong> trong Cài đặt ứng dụng, bật quyền vị trí khi dùng ứng dụng và bật <strong>Vị trí chính xác</strong> nếu có.
                </li>
                {browser === 'safari' && (
                  <li>
                    Trong Safari, mở cài đặt trang web và đặt <strong>Vị trí</strong> thành <strong>Hỏi</strong> hoặc <strong>Cho phép</strong>.
                  </li>
                )}
                {browser === 'chrome' && (
                  <li>
                    Trong Chrome, mở menu <strong>⋯ → Cài đặt → Cài đặt nội dung → Vị trí</strong> và cho phép trang web này truy cập vị trí.
                  </li>
                )}
                {inAppBrowser && (
                  <li>
                    Trong {getInAppBrowserName(browser)}, nhấn menu <strong>⋯ → Mở bằng trình duyệt → Safari</strong>, rồi cho phép Safari truy cập vị trí.
                  </li>
                )}
                <li>Quay lại trang điểm danh rồi nhấn <strong>Thử lại</strong> ở thông báo GPS.</li>
              </ol>
            ) : platform === 'android' ? (
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-xs leading-relaxed text-slate-700">
                <li>Bật vị trí của điện thoại trong bảng Cài đặt nhanh hoặc <strong>Cài đặt → Vị trí</strong>.</li>
                <li>
                  Mở <strong>Cài đặt → Ứng dụng → {getAndroidAppName(browser)} → Quyền → Vị trí</strong>, chọn cho phép khi dùng ứng dụng và bật vị trí chính xác nếu có.
                </li>
                {browser === 'chrome' && (
                  <li>
                    Trong Chrome, mở <strong>⋮ → Cài đặt → Cài đặt trang web → Vị trí</strong> và cho phép trang web này.
                  </li>
                )}
                {inAppBrowser && (
                  <li>
                    Trong {getInAppBrowserName(browser)}, mở menu và chọn <strong>Mở bằng trình duyệt</strong>, sau đó cho phép Chrome truy cập vị trí.
                  </li>
                )}
                {browser === 'safari' && (
                  <li>Kiểm tra quyền vị trí của trang web trong cài đặt trình duyệt đang dùng.</li>
                )}
                <li>Quay lại trang điểm danh rồi nhấn <strong>Thử lại</strong> ở thông báo GPS.</li>
              </ol>
            ) : (
              <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-slate-700">
                {browser === 'chrome'
                  ? 'Mở Cài đặt hệ thống để bật Dịch vụ định vị và cấp quyền vị trí cho Chrome. Trong Chrome, mở Cài đặt → Cài đặt trang web → Vị trí và cho phép trang này. Sau đó quay lại trang và nhấn Thử lại.'
                  : browser === 'safari'
                    ? 'Mở Cài đặt hệ thống để bật Dịch vụ định vị và cấp quyền vị trí cho Safari. Trong Safari, mở cài đặt trang web và cho phép trang này truy cập vị trí. Sau đó quay lại trang và nhấn Thử lại.'
                    : 'Hãy bật Dịch vụ định vị và cho phép ứng dụng hoặc trình duyệt đang dùng truy cập vị trí trong phần Cài đặt. Sau đó quay lại trang và nhấn Thử lại.'}
              </p>
            )}

            {platform === 'android' && browser !== 'chrome' && pageUrl && (
              <a
                href={getChromeIntentUrl(pageUrl)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                Thử mở bằng Chrome
              </a>
            )}

            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết check-in'}
            </button>

            {copyError && (
              <div className="mt-3">
                <p className="text-xs text-amber-800">
                  Không thể tự sao chép. Nhấn giữ liên kết bên dưới để sao chép thủ công.
                </p>
                <input
                  aria-label="Liên kết check-in để sao chép thủ công"
                  readOnly
                  value={pageUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Nếu dùng QR động và mã hết hạn sau khi chuyển trình duyệt, hãy quét mã mới trên màn hình Host.
            </p>
          </section>
        </div>
      )}
    </>
  );
}

function getPlatformName(platform: DevicePlatform) {
  if (platform === 'ios') return 'iPhone/iPad';
  if (platform === 'android') return 'Android';
  return 'thiết bị khác';
}

function getBrowserName(browser: CheckInBrowser) {
  if (browser === 'zalo') return 'Zalo';
  if (browser === 'chrome') return 'Chrome';
  if (browser === 'safari') return 'Safari';
  return 'trình duyệt khác';
}

function getInAppBrowserName(browser: CheckInBrowser) {
  if (browser === 'zalo') return 'Zalo';
  if (browser === 'messenger') return 'Messenger';
  if (browser === 'facebook') return 'Facebook';
  return 'trình duyệt này';
}
