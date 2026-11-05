'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Lock } from 'lucide-react';
import { useCheckinForm } from '@/hooks/checkin/useCheckinForm';
import { useCheckinLocation } from '@/hooks/checkin/useCheckinLocation';
import { CheckinMethodGuidance } from '@/components/checkin/CheckinMethodGuidance';
import {
  AttendeeFields,
  CheckinHeader,
  CheckinLoadingState,
  CheckinSubmitState,
  CheckinSuccessState,
} from '@/components/checkin/CheckinShared';
import { useCheckinEvent } from '@/hooks/checkin/useCheckinEvent';
import { detectCheckinEnvironment } from '@/lib/checkin/browser';
import type { CheckinRequirements } from '@/lib/checkin/solution';
import type { CheckinEvent } from '@/types/database';

type LocationPermissionStep =
  | 'checking'
  | 'prompt'
  | 'requesting'
  | 'granted'
  | 'acquired'
  | 'refused'
  | 'denied'
  | 'error';

function subscribeToBrowser() {
  return () => {};
}

function getUserAgent() {
  return navigator.userAgent;
}

export function CheckinExperience({
  event,
  requirements,
}: {
  event: CheckinEvent;
  requirements: CheckinRequirements;
}) {
  const { loading } = useCheckinEvent(event);
  if (loading) return <CheckinLoadingState />;

  if (requirements.requireLocation) {
    return <GpsCheckinExperience event={event} requirements={requirements} />;
  }
  return <NonGpsCheckinExperience event={event} requirements={requirements} />;
}

function GpsCheckinExperience({
  event,
  requirements,
}: {
  event: CheckinEvent;
  requirements: CheckinRequirements;
}) {
  const userAgent = useSyncExternalStore(subscribeToBrowser, getUserAgent, () => '');
  const location = useCheckinLocation(event, true);
  const requestLocation = location.requestLocation;
  const [permissionStep, setPermissionStep] = useState<LocationPermissionStep>('checking');

  useEffect(() => {
    if (!userAgent) return;

    let active = true;
    const checkExistingPermission = async () => {
      if (!navigator.permissions) {
        setPermissionStep('prompt');
        return;
      }

      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (!active) return;

        if (permission.state === 'granted') {
          setPermissionStep('granted');
          requestLocation();
        } else {
          setPermissionStep('prompt');
        }
      } catch (error) {
        console.warn('Unable to check geolocation permission; asking before requesting location.', error);
        if (active) setPermissionStep('prompt');
      }
    };

    void checkExistingPermission();
    return () => {
      active = false;
    };
  }, [requestLocation, userAgent]);

  const permissionError =
    location.gpsError &&
    (permissionStep === 'requesting' || permissionStep === 'granted');
  const effectivePermissionStep: LocationPermissionStep = permissionError
    ? location.isPermissionDenied
      ? 'denied'
      : 'error'
    : permissionStep === 'requesting' && location.gpsReady
      ? 'acquired'
      : permissionStep;

  if (effectivePermissionStep === 'checking') {
    return <CheckinLoadingState message="Đang kiểm tra quyền truy cập vị trí..." />;
  }

  if (effectivePermissionStep !== 'granted' && effectivePermissionStep !== 'acquired') {
    return (
      <LocationPermissionStepView
        event={event}
        step={effectivePermissionStep}
        error={location.gpsError}
        userAgent={userAgent}
        onGrant={() => {
          setPermissionStep('requesting');
          requestLocation();
        }}
        onRefuse={() => setPermissionStep('refused')}
      />
    );
  }

  return (
    <CheckinFormExperience
      event={event}
      requirements={requirements}
      location={location}
      userAgent={userAgent}
    />
  );
}

function LocationPermissionStepView({
  event,
  step,
  error,
  userAgent,
  onGrant,
  onRefuse,
}: {
  event: CheckinEvent;
  step: LocationPermissionStep;
  error: string | null;
  userAgent: string;
  onGrant: () => void;
  onRefuse: () => void;
}) {
  const environment = detectCheckinEnvironment(
    userAgent,
    typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints
  );
  const isRecovery = step === 'denied' || step === 'error';
  const isRefused = step === 'refused';

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 px-4 py-4 sm:py-6">
      <CheckinHeader title={event.title} />

      <section
        role={step === 'prompt' ? 'dialog' : 'alert'}
        aria-modal={step === 'prompt' ? true : undefined}
        aria-labelledby="gps-permission-title"
        className={
          step === 'prompt'
            ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'
            : 'my-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6'
        }
      >
        <div className={step === 'prompt'
          ? 'w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6'
          : undefined}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <span aria-hidden="true" className="text-xl">⌖</span>
          </div>
          <h2 id="gps-permission-title" className="text-lg font-bold text-slate-900">
            {step === 'prompt'
              ? 'Cho phép truy cập vị trí'
              : isRefused
                ? 'Không thể điểm danh nếu không cho phép vị trí'
                : 'Không thể truy cập vị trí'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {step === 'prompt'
              ? 'Phiên này sử dụng GPS để xác minh bạn đang ở trong khu vực điểm danh. Vị trí sẽ được kiểm tra khi bạn gửi biểu mẫu.'
              : isRefused
                ? 'Cần có quyền truy cập vị trí để tiếp tục điểm danh phiên này.'
                : error || 'Trình duyệt chưa cấp quyền vị trí cho trang điểm danh.'}
          </p>

          {isRecovery && (
            <LocationRecoveryGuide
              platform={environment.platform}
              browser={environment.browser}
              inAppBrowser={environment.inAppBrowser}
            />
          )}

          {step === 'requesting' ? (
            <p role="status" className="mt-5 text-center text-sm font-medium text-blue-700">
              Đang chờ quyền vị trí và xác định vị trí của bạn...
            </p>
          ) : (
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={onGrant}
                className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
              >
                {isRecovery || isRefused ? 'Thử lại / Cấp quyền vị trí' : 'Cho phép vị trí'}
              </button>
              {!isRecovery && !isRefused && (
                <button
                  type="button"
                  onClick={onRefuse}
                  className="min-h-11 w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Từ chối điểm danh
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function LocationRecoveryGuide({
  platform,
  browser,
  inAppBrowser,
}: {
  platform: 'android' | 'ios' | 'other';
  browser: 'zalo' | 'messenger' | 'facebook' | 'chrome' | 'safari' | 'other';
  inAppBrowser: boolean;
}) {
  const appName = browser === 'zalo'
    ? 'Zalo'
    : browser === 'messenger'
      ? 'Messenger'
      : browser === 'facebook'
        ? 'Facebook'
        : 'trình duyệt tích hợp';

  let instructions = 'Mở cài đặt quyền vị trí của trình duyệt, cho phép trang này truy cập vị trí rồi quay lại thử lại.';
  if (inAppBrowser) {
    instructions = `Bạn đang mở liên kết trong ${appName}. Trình duyệt tích hợp có thể hạn chế GPS. Hãy mở menu chia sẻ/tùy chọn và chọn mở bằng Safari (iPhone/iPad) hoặc Chrome (Android), sau đó cấp quyền vị trí cho trang.`;
  } else if (platform === 'ios' && browser === 'safari') {
    instructions = 'Trên iPhone/iPad, vào Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị và bật định vị. Sau đó vào Cài đặt → Ứng dụng → Safari → Vị trí, chọn Hỏi hoặc Cho phép; quay lại trang và thử lại.';
  } else if (platform === 'android' && browser === 'chrome') {
    instructions = 'Trên Android, bật Vị trí trong Cài đặt → Vị trí. Sau đó vào Cài đặt → Ứng dụng → Chrome → Quyền → Vị trí và cho phép khi dùng ứng dụng; trong Chrome, kiểm tra Cài đặt trang web → Vị trí.';
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
      <h3 className="font-semibold">Hướng dẫn khôi phục quyền vị trí</h3>
      <p className="mt-1">{instructions}</p>
    </div>
  );
}

function NonGpsCheckinExperience({
  event,
  requirements,
}: {
  event: CheckinEvent;
  requirements: CheckinRequirements;
}) {
  return <CheckinFormExperience event={event} requirements={requirements} location={null} userAgent="" />;
}

function CheckinFormExperience({
  event,
  requirements,
  location,
  userAgent,
}: {
  event: CheckinEvent;
  requirements: CheckinRequirements;
  location: ReturnType<typeof useCheckinLocation> | null;
  userAgent: string;
}) {
  const form = useCheckinForm({
    eventId: event.id,
    event,
    gpsReady: location?.gpsReady ?? false,
    coords: location?.coords ?? null,
    currentDistance: location?.currentDistance ?? null,
    isWithinRadius: location?.isWithinRadius ?? true,
  });

  if (form.isSuccess) {
    return (
      <CheckinSuccessState
        form={form}
        requirements={requirements}
        coordinates={location?.coords ?? null}
      />
    );
  }

  const outsideRadius =
    requirements.requireLocation &&
    location !== null &&
    !location.isWithinRadius &&
    location.currentDistance !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between bg-slate-50 px-4 py-4 sm:py-6">
      <CheckinHeader title={event.title} />

      <form
        onSubmit={form.handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <CheckinMethodGuidance
          event={event}
          requirements={requirements}
          location={location}
          userAgent={userAgent}
        />

        <AttendeeFields
          fields={event.custom_fields}
          values={form.fieldValues}
          onChange={form.setFieldValues}
        />

        {requirements.requirePin && (
          <div className="pt-2">
            <label htmlFor="checkin-pin" className="mb-1 block text-center text-xs font-semibold text-slate-700">
              Mã PIN trên màn hình trình chiếu <span className="text-rose-500">*</span>
            </label>
            <input
              id="checkin-pin"
              type="text"
              inputMode="numeric"
              maxLength={4}
              required
              value={form.pinInput}
              onChange={(inputEvent) => form.setPinInput(inputEvent.target.value.replace(/\D/g, ''))}
              placeholder="----"
              className="min-h-14 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-center font-mono text-3xl font-black tracking-[0.5em] text-slate-900 transition-colors placeholder:text-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
            />
            <p className="mt-1 text-center text-[11px] text-slate-400">
              Nhìn lên màn chiếu của Host để lấy mã gồm 4 số.
            </p>
          </div>
        )}

        <CheckinSubmitState
          form={form}
          disabled={
            (requirements.requireLocation &&
              (!location?.gpsReady || outsideRadius))
          }
          label={
            outsideRadius && location
              ? `Ngoài bán kính (${location.currentDistance}m > ${event.radius_meters}m)`
              : 'Xác nhận có mặt'
          }
        />
      </form>

      <div className="flex items-center justify-center gap-1.5 py-3 text-center text-[11px] text-slate-400">
        <Lock className="h-3 w-3" />
        {requirements.requireLocation
          ? 'Bảo mật chống gửi trùng bằng Geofence & Device ID'
          : 'Bảo mật chống gửi trùng bằng Device ID'}
      </div>
    </main>
  );
}
