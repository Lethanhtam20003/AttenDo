'use client';

import { Lock } from 'lucide-react';
import { CheckInLocationGate } from '@/components/check-in/CheckInLocationGate';
import { useCheckInForm } from '@/hooks/check-in/useCheckInForm';
import { useCheckInLocation } from '@/hooks/check-in/useCheckInLocation';
import { CheckInMethodGuidance } from '@/components/check-in/CheckInMethodGuidance';
import {
  AttendeeFields,
  CheckInHeader,
  CheckInLoadingState,
  CheckInSubmitState,
  CheckInSuccessState,
  CheckInUnavailableState,
} from '@/components/check-in/CheckInShared';
import { useCheckInEvent } from '@/hooks/check-in/useCheckInEvent';
import type { CheckInRequirements } from '@/lib/check-in/solution';
import type { CheckInEvent } from '@/types/database';
import { useCheckInStore } from '@/stores/check-in-store';
import { useEffect } from 'react';

export function CheckInExperience({
  event,
  requirements,
}: {
  event: CheckInEvent;
  requirements: CheckInRequirements;
}) {
  const { loading } = useCheckInEvent(event);
  const isBeforeStart = useCheckInStore((state) => state.isBeforeStart);
  const setIsBeforeStart = useCheckInStore((state) => state.setIsBeforeStart);

  useEffect(() => {
    const updateStartStatus = () => {
      setIsBeforeStart(event.id, new Date(event.starts_at).getTime() > Date.now());
    };

    updateStartStatus();
    const timer = window.setInterval(updateStartStatus, 1000);
    return () => window.clearInterval(timer);
  }, [event.id, event.starts_at, setIsBeforeStart]);

  if (loading) return <CheckInLoadingState />;
  if (isBeforeStart) return <CheckInUnavailableState startsAt={event.starts_at} />;

  return <CheckInFormExperience event={event} requirements={requirements} />;
}

function CheckInFormExperience({
  event,
  requirements,
}: {
  event: CheckInEvent;
  requirements: CheckInRequirements;
}) {
  const location = useCheckInLocation({
    eventId: event.id,
    event,
    enabled: requirements.requireLocation,
  });

  const form = useCheckInForm({
    eventId: event.id,
    event,
    requireLocation: requirements.requireLocation,
    requestLocation: location.handleRequestLocation,
  });

  if (form.isSuccess) {
    return (
      <CheckInSuccessState
        form={form}
        requirements={requirements}
      />
    );
  }

  const isLocationBusy =
    requirements.requireLocation && location.locationStatus === 'requesting';
  const submitLabel =
    requirements.requireLocation && !location.isWithinRadius
      ? 'Bật vị trí & Xác nhận có mặt'
      : 'Xác nhận có mặt';

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between bg-slate-50 px-4 py-4 sm:py-6">
      <CheckInHeader title={event.title} startsAt={event.starts_at} />

      <form
        onSubmit={form.handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <CheckInMethodGuidance requirements={requirements} />

        {requirements.requireLocation && (
          <CheckInLocationGate location={location} />
        )}

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
          disabled={isLocationBusy}
          label={submitLabel}
        />
      </form>

      <div className="flex items-center justify-center gap-1.5 py-3 text-center text-[11px] text-slate-400">
        <Lock className="h-3 w-3" />
        Bảo mật chống gửi trùng bằng Device ID
      </div>
    </main>
  );
}
