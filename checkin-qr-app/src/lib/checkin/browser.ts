export type DevicePlatform = 'android' | 'ios' | 'other';
export type CheckinBrowser = 'zalo' | 'messenger' | 'facebook' | 'chrome' | 'safari' | 'other';

export interface CheckinEnvironment {
  platform: DevicePlatform;
  browser: CheckinBrowser;
  inAppBrowser: boolean;
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
    return { platform, browser: 'zalo', inAppBrowser: true };
  }
  if (/Messenger/i.test(userAgent)) {
    return { platform, browser: 'messenger', inAppBrowser: true };
  }
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) {
    return { platform, browser: 'facebook', inAppBrowser: true };
  }

  const isChrome =
    /(?:Chrome|CriOS)\//i.test(userAgent) &&
    !/(?:Edg|EdgiOS|OPR|OPiOS|SamsungBrowser)\//i.test(userAgent);
  if (isChrome) return { platform, browser: 'chrome', inAppBrowser: false };

  const isSafari =
    /Safari\//i.test(userAgent) &&
    !/(?:CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)/i.test(userAgent);
  if (isSafari) return { platform, browser: 'safari', inAppBrowser: false };

  return { platform, browser: 'other', inAppBrowser: false };
}
