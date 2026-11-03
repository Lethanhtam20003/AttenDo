'use client';

import { useState, useSyncExternalStore } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

export type ZaloPlatform = 'android' | 'ios' | 'other';

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

interface ZaloBrowserPromptProps {
  platform: ZaloPlatform;
  onContinue: () => void;
}

function getChromeIntentUrl(currentPageUrl: string) {
  const pageUrl = new URL(currentPageUrl);
  const fallbackUrl = encodeURIComponent(pageUrl.toString());
  return `intent://${pageUrl.host}${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}#Intent;scheme=${pageUrl.protocol.slice(0, -1)};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
}

export default function ZaloBrowserPrompt({ platform, onContinue }: ZaloBrowserPromptProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const pageUrl = useSyncExternalStore(subscribeToLocation, getPageUrl, () => '');

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
    <aside
      aria-labelledby="zalo-browser-title"
      className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left"
    >
      <h2 id="zalo-browser-title" className="text-sm font-bold text-slate-900">
        Mở check-in bằng trình duyệt ngoài
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Trình duyệt trong Zalo có thể hạn chế quyền GPS. Mở bằng trình duyệt ngoài để check-in ổn định hơn.
      </p>

      {platform === 'android' && (
        pageUrl && (
          <a
            href={getChromeIntentUrl(pageUrl)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            Thử mở bằng Chrome
          </a>
        )
      )}

      {platform === 'ios' && (
        <p className="mt-3 rounded-xl bg-white/80 p-3 text-xs leading-relaxed text-slate-700">
          Trên iPhone: mở menu <strong>⋯</strong> của Zalo, chọn <strong>Mở bằng trình duyệt</strong> hoặc{' '}
          <strong>Mở bằng Safari</strong>.
        </p>
      )}

      {platform === 'other' && (
        <p className="mt-3 rounded-xl bg-white/80 p-3 text-xs leading-relaxed text-slate-700">
          Mở menu của Zalo rồi chọn <strong>Mở bằng trình duyệt</strong>.
        </p>
      )}

      <button
        type="button"
        onClick={() => void copyLink()}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết check-in'}
      </button>

      {copyError && (
        <div className="mt-2">
          <p className="text-xs text-amber-800">
            Không thể tự sao chép. Hãy nhấn giữ liên kết bên dưới để sao chép thủ công.
          </p>
          <input
            aria-label="Liên kết check-in để sao chép thủ công"
            readOnly
            value={pageUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
          />
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="mt-3 w-full py-2 text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
      >
        Tiếp tục trong Zalo
      </button>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Nếu đã chuyển trình duyệt mà mã QR động hết hạn, hãy quét mã mới trên màn hình Host.
      </p>
    </aside>
  );
}
