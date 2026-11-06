'use client';

import { useSyncExternalStore } from 'react';
import { Lock, MapPin } from 'lucide-react';
import { getLocationConsentStorageKey } from '@/constants/check-in';
import { useCheckInForm } from '@/hooks/check-in/useCheckInForm';
import { useCheckInLocation } from '@/hooks/check-in/useCheckInLocation';
import { CheckInMethodGuidance } from '@/components/check-in/CheckInMethodGuidance';
import {
  AttendeeFields,
  CheckInHeader,
  CheckInLoadingState,
  CheckInSubmitState,
  CheckInSuccessState,
} from '@/components/check-in/CheckInShared';
import { useCheckInEvent } from '@/hooks/check-in/useCheckInEvent';
import type { CheckInRequirements } from '@/lib/check-in/solution';
import type { CheckInEvent } from '@/types/database';
import { useCheckInStore } from '@/stores/check-in-store';
import { detectCheckInEnvironment } from '@/lib/check-in/browser';

function subscribeToBrowser() {
  return () => {};
}

function getUserAgent() {
  return navigator.userAgent;
}

export function CheckInExperience({
  event,
  requirements,
}: {
  event: CheckInEvent;
  requirements: CheckInRequirements;
}) {
  const { loading } = useCheckInEvent(event);
  if (loading) return <CheckInLoadingState />;

  if (requirements.requireLocation) {
    return <GpsCheckInExperience event={event} requirements={requirements} />;
  }
  return <NonGpsCheckInExperience event={event} requirements={requirements} />;
}

function GpsCheckInExperience({
  event,
  requirements,
}: {
  event: CheckInEvent;
  requirements: CheckInRequirements;
}) {
  const userAgent = useSyncExternalStore(subscribeToBrowser, getUserAgent, () => '');
  const location = useCheckInLocation(event);
  const locationIntroConfirmed = useCheckInStore((state) => state.locationIntroConfirmed);
  const setLocationIntroConfirmed = useCheckInStore((state) => state.setLocationIntroConfirmed);
  const environment = detectCheckInEnvironment(
    userAgent,
    typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints
  );

  if (!locationIntroConfirmed) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-consent-title"
          aria-describedby="location-consent-description"
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <MapPin aria-hidden="true" size={24} />
          </div>
          <h2 id="location-consent-title" className="text-center text-lg font-bold text-slate-900">
            Cho phép truy cập vị trí
          </h2>
          <p id="location-consent-description" className="mt-2 text-center text-sm leading-6 text-slate-600">
            Phiên điểm danh này cần xác minh bạn đang ở trong phạm vi địa điểm tổ chức. Khi tiếp tục, trình duyệt có thể hỏi quyền vị trí nếu bạn chưa cấp; hệ thống sẽ lấy vị trí chính xác.
          </p>
          {environment.inAppBrowser && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-relaxed text-amber-900">
              Trình duyệt trong ứng dụng có thể chặn GPS. Nếu không lấy được vị trí, hãy mở menu ⋯ và chọn mở liên kết bằng {environment.platform === 'ios' ? 'Safari' : 'Chrome'}.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(getLocationConsentStorageKey(event.id), 'true');
              } catch {
                // Trạng thái trong store vẫn cho phép tiếp tục nếu bộ nhớ bị chặn.
              }
              setLocationIntroConfirmed(event.id, true);
              location.requestLocation();
            }}
            className="mt-5 min-h-12 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
          >
            Xác nhận và tiếp tục
          </button>
        </section>
      </main>
    );
  }

  return (
    <CheckInFormExperience
      event={event}
      requirements={requirements}
      location={location}
      userAgent={userAgent}
    />
  );
}

function NonGpsCheckInExperience({
  event,
  requirements,
}: {
  event: CheckInEvent;
  requirements: CheckInRequirements;
}) {
  return <CheckInFormExperience event={event} requirements={requirements} location={null} userAgent="" />;
}

function CheckInFormExperience({
  event,
  requirements,
  location,
  userAgent,
}: {
  event: CheckInEvent;
  requirements: CheckInRequirements;
  location: ReturnType<typeof useCheckInLocation> | null;
  userAgent: string;
}) {
  const form = useCheckInForm({
    eventId: event.id,
    event,
    gpsReady: location?.gpsReady ?? false,
    coords: location?.coords ?? null,
    currentDistance: location?.currentDistance ?? null,
    isWithinRadius: location?.isWithinRadius ?? true,
  });

  if (form.isSuccess) {
    return (
      <CheckInSuccessState
        form={form}
        requirements={requirements}
        coordinates={location?.coords ?? null}
      />
    );
  }

  const outsideRadius =
    requirements.requireLocation &&
    location !== null &&
    location.gpsReady &&
    !location.isWithinRadius &&
    location.currentDistance !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between bg-slate-50 px-4 py-4 sm:py-6">
      <CheckInHeader title={event.title} />

      <form
        onSubmit={form.handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <CheckInMethodGuidance
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
            <label htmlFor="checkIn-pin" className="mb-1 block text-center text-xs font-semibold text-slate-700">
              Mã PIN trên màn hình trình chiếu <span className="text-rose-500">*</span>
            </label>
            <input
              id="checkIn-pin"
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

        <CheckInSubmitState
          form={form}
          disabled={
            (requirements.requireLocation &&
              (!location?.gpsReady || !location.coords || !location.isWithinRadius))
          }
          label={
            outsideRadius && location
              ? `Ngoài bán kính (${location.currentDistance}m > ${event.radius_meters}m)`
              : requirements.requireLocation && !location?.gpsReady
                ? 'Đang chờ xác minh vị trí'
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
