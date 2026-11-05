'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/actions/events';
import {
  PIN_MAX_REFRESH_SECONDS,
  PIN_MIN_REFRESH_SECONDS,
  QR_TOKEN_MAX_REFRESH_SECONDS,
  QR_TOKEN_MIN_REFRESH_SECONDS,
} from '@/constants/checkIn';
import type { CustomFieldConfig } from '@/types/database';
import type { HostSetupCustomField } from './useCustomFields';
import { useHostSetupStore } from '@/stores/host-setup-store';

interface Coordinates {
  lat: number;
  lng: number;
}

export function useHostSetupForm(
  coordinates: Coordinates,
  radius: number,
  fields: HostSetupCustomField[],
  checkInSettings: {
    requireLocation: boolean;
    requirePin: boolean;
    dynamicQr: boolean;
    dynamicQrIntervalSeconds: number;
    pinIntervalSeconds: number;
    sessionDurationMinutes: number;
  }
) {
  const router = useRouter();
  const eventTitle = useHostSetupStore((state) => state.eventTitle);
  const setEventTitle = useHostSetupStore((state) => state.setEventTitle);
  const errorMsg = useHostSetupStore((state) => state.errorMsg);
  const setErrorMsg = useHostSetupStore((state) => state.setErrorMsg);
  const [isPending, startTransition] = useTransition();

  const handleLaunch = useCallback(() => {
    setErrorMsg(null);
    if (!eventTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện trước khi khởi chạy.');
      return;
    }
    if (fields.length === 0) {
      setErrorMsg('Vui lòng thêm ít nhất một trường thông tin người tham dự.');
      return;
    }
    if (
      !Number.isInteger(checkInSettings.sessionDurationMinutes) ||
      checkInSettings.sessionDurationMinutes < 1 ||
      checkInSettings.sessionDurationMinutes > 10080
    ) {
      setErrorMsg('Thời gian tồn tại phiên phải từ 1 phút đến 168 giờ.');
      return;
    }
    if (
      checkInSettings.dynamicQr &&
      (!Number.isInteger(checkInSettings.dynamicQrIntervalSeconds) ||
        checkInSettings.dynamicQrIntervalSeconds < QR_TOKEN_MIN_REFRESH_SECONDS ||
        checkInSettings.dynamicQrIntervalSeconds > QR_TOKEN_MAX_REFRESH_SECONDS)
    ) {
      setErrorMsg('Thời gian đổi mã QR phải từ 1 đến 86400 giây.');
      return;
    }
    if (
      checkInSettings.requirePin &&
      (!Number.isInteger(checkInSettings.pinIntervalSeconds) ||
        checkInSettings.pinIntervalSeconds < PIN_MIN_REFRESH_SECONDS ||
        checkInSettings.pinIntervalSeconds > PIN_MAX_REFRESH_SECONDS)
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
        duration_minutes: checkInSettings.sessionDurationMinutes,
        location_lat: checkInSettings.requireLocation ? coordinates.lat : null,
        location_lng: checkInSettings.requireLocation ? coordinates.lng : null,
        radius_meters: radius,
        custom_fields: customFields,
        module_settings: {
          require_location: checkInSettings.requireLocation,
          require_pin: checkInSettings.requirePin,
          dynamic_qr: checkInSettings.dynamicQr,
          dynamic_qr_interval_seconds: checkInSettings.dynamicQrIntervalSeconds,
          pin_interval_seconds: checkInSettings.pinIntervalSeconds,
        },
      });

      if (!result.success) {
        setErrorMsg(result.error);
        return;
      }

      router.push(`/host/live/${result.data.eventId}`);
    });
  }, [checkInSettings, coordinates.lat, coordinates.lng, eventTitle, fields, radius, router, setErrorMsg]);

  return { eventTitle, setEventTitle, errorMsg, isPending, handleLaunch };
}
