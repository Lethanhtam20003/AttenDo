'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/actions/events';
import {
  PIN_MAX_REFRESH_SECONDS,
  PIN_MIN_REFRESH_SECONDS,
  QR_TOKEN_MAX_REFRESH_SECONDS,
  QR_TOKEN_MIN_REFRESH_SECONDS,
} from '@/constants/checkin';
import type { CustomFieldConfig } from '@/types/database';
import type { HostSetupCustomField } from './useCustomFields';

interface Coordinates {
  lat: number;
  lng: number;
}

export function useHostSetupForm(
  coordinates: Coordinates,
  radius: number,
  fields: HostSetupCustomField[],
  checkinSettings: {
    requireLocation: boolean;
    requirePin: boolean;
    dynamicQr: boolean;
    dynamicQrIntervalSeconds: number;
    pinIntervalSeconds: number;
  }
) {
  const router = useRouter();
  const [eventTitle, setEventTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLaunch = useCallback(() => {
    setErrorMsg(null);
    if (!eventTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện trước khi khởi chạy.');
      return;
    }
    if (
      checkinSettings.dynamicQr &&
      (!Number.isInteger(checkinSettings.dynamicQrIntervalSeconds) ||
        checkinSettings.dynamicQrIntervalSeconds < QR_TOKEN_MIN_REFRESH_SECONDS ||
        checkinSettings.dynamicQrIntervalSeconds > QR_TOKEN_MAX_REFRESH_SECONDS)
    ) {
      setErrorMsg('Thời gian đổi mã QR phải từ 1 đến 86400 giây.');
      return;
    }
    if (
      checkinSettings.requirePin &&
      (!Number.isInteger(checkinSettings.pinIntervalSeconds) ||
        checkinSettings.pinIntervalSeconds < PIN_MIN_REFRESH_SECONDS ||
        checkinSettings.pinIntervalSeconds > PIN_MAX_REFRESH_SECONDS)
    ) {
      setErrorMsg('Thời gian đổi mã PIN phải từ 1 đến 86400 giây.');
      return;
    }

    startTransition(async () => {
      const customFields: CustomFieldConfig[] = fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        ...(field.options ? { options: field.options } : {}),
      }));

      const result = await createEvent({
        title: eventTitle.trim(),
        location_lat: checkinSettings.requireLocation ? coordinates.lat : null,
        location_lng: checkinSettings.requireLocation ? coordinates.lng : null,
        radius_meters: radius,
        custom_fields: customFields,
        module_settings: {
          require_location: checkinSettings.requireLocation,
          require_pin: checkinSettings.requirePin,
          dynamic_qr: checkinSettings.dynamicQr,
          dynamic_qr_interval_seconds: checkinSettings.dynamicQrIntervalSeconds,
          pin_interval_seconds: checkinSettings.pinIntervalSeconds,
        },
      });

      if (!result.success) {
        setErrorMsg(result.error);
        return;
      }

      router.push(`/host/live/${result.data.eventId}`);
    });
  }, [checkinSettings, coordinates.lat, coordinates.lng, eventTitle, fields, radius, router]);

  return { eventTitle, setEventTitle, errorMsg, isPending, handleLaunch };
}
