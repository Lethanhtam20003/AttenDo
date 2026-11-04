export type DevicePlatform = 'android' | 'ios' | 'other';
export type CheckinBrowser = 'zalo' | 'chrome' | 'safari' | 'other';

export interface CheckinEnvironment {
  platform: DevicePlatform;
  browser: CheckinBrowser;
}

export function detectCheckinEnvironment(
  userAgent: string,
  maxTouchPoints = 0
): CheckinEnvironment {
  const isIOS =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  const platform: DevicePlatform = /Android/i.test(userAgent)
    ? 'android'
    : isIOS
      ? 'ios'
      : 'other';

  if (/Zalo/i.test(userAgent)) {
    return { platform, browser: 'zalo' };
  }

  const isChrome =
    /(?:Chrome|CriOS)\//i.test(userAgent) &&
    !/(?:Edg|EdgiOS|OPR|OPiOS|SamsungBrowser)\//i.test(userAgent);
  if (isChrome) return { platform, browser: 'chrome' };

  const isSafari =
    /Safari\//i.test(userAgent) &&
    !/(?:CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)/i.test(userAgent);
  if (isSafari) return { platform, browser: 'safari' };

  return { platform, browser: 'other' };
}
