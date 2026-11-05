'use client';

import { useCallback, useEffect, type FormEvent } from 'react';
import { checkIn } from '@/actions/checkin';
import type { Event } from '@/types/database';
import { useCheckinStore } from '@/stores/checkin-store';

interface Coordinates {
  lat: number;
  lng: number;
}

interface UseCheckinFormOptions {
  eventId?: string;
  event: Event | null;
  gpsReady: boolean;
  coords: Coordinates | null;
  currentDistance: number | null;
  isWithinRadius: boolean;
}

const EMPTY_FIELD_VALUES: Record<string, string> = {};

// Dùng cùng một mã thiết bị để máy chủ nhận diện các lần gửi từ thiết bị này.
function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'attendo_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// Quản lý dữ liệu biểu mẫu, gửi điểm danh và trạng thái xác nhận thành công.
export function useCheckinForm({
  eventId,
  event,
  gpsReady,
  coords,
  currentDistance,
  isWithinRadius,
}: UseCheckinFormOptions) {
  const activeEventId = useCheckinStore((state) => state.eventId);
  const storedFieldValues = useCheckinStore((state) => state.fieldValues);
  const storedPinInput = useCheckinStore((state) => state.pinInput);
  const storedIsSubmitting = useCheckinStore((state) => state.isSubmitting);
  const storedSubmitError = useCheckinStore((state) => state.submitError);
  const storedIsSuccess = useCheckinStore((state) => state.isSuccess);
  const storedCheckedInName = useCheckinStore((state) => state.checkedInName);
  const storedDistanceResult = useCheckinStore((state) => state.distanceResult);
  const setStoredFieldValues = useCheckinStore((state) => state.setFieldValues);
  const setStoredPinInput = useCheckinStore((state) => state.setPinInput);
  const setStoredSubmitting = useCheckinStore((state) => state.setSubmitting);
  const setStoredSubmitError = useCheckinStore((state) => state.setSubmitError);
  const setStoredSuccess = useCheckinStore((state) => state.setSuccess);
  const isCurrentEvent = activeEventId === eventId;
  const fieldValues = isCurrentEvent ? storedFieldValues : EMPTY_FIELD_VALUES;
  const pinInput = isCurrentEvent ? storedPinInput : '';
  const isSubmitting = isCurrentEvent && storedIsSubmitting;
  const submitError = isCurrentEvent ? storedSubmitError : null;
  const isSuccess = isCurrentEvent && storedIsSuccess;
  const checkedInName = isCurrentEvent ? storedCheckedInName : '';
  const distanceResult = isCurrentEvent ? storedDistanceResult : null;
  const setFieldValues = useCallback((
    update: Record<string, string> | ((current: Record<string, string>) => Record<string, string>)
  ) => {
    if (eventId) setStoredFieldValues(eventId, update);
  }, [eventId, setStoredFieldValues]);
  const setPinInput = useCallback((value: string) => {
    if (eventId) setStoredPinInput(eventId, value);
  }, [eventId, setStoredPinInput]);

  useEffect(() => {
    if (!eventId || typeof window === 'undefined') return;
    // Khôi phục màn hình thành công nếu thiết bị đã điểm danh phiên này trước đó.
    if (localStorage.getItem(`checkedin_${eventId}`)) {
      const savedName = localStorage.getItem(`checkedin_name_${eventId}`) ?? '';
      Promise.resolve().then(() => {
        setStoredSuccess(eventId, savedName, null);
      });
    }
  }, [eventId, setStoredSuccess]);

  const handleSubmit = useCallback(async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!eventId) {
      if (eventId) setStoredSubmitError(eventId, 'Không tìm thấy mã phiên điểm danh. Vui lòng tải lại trang.');
      return;
    }

    const requireLocation = event?.module_settings?.require_location !== false;
    if (requireLocation && (!gpsReady || !coords)) {
      setStoredSubmitError(eventId, 'Chưa xác định được vị trí GPS của bạn. Vui lòng bật định vị.');
      return;
    }

    if (requireLocation && !isWithinRadius && event) {
      setStoredSubmitError(eventId,
        `Bạn đang ở cách địa điểm ~${currentDistance}m (Vượt quá bán kính cho phép ${event.radius_meters}m). Vui lòng di chuyển đến gần hội trường.`
      );
      return;
    }

    // Gửi dữ liệu sau khi đã xác nhận GPS và vị trí nằm trong bán kính cho phép.
    setStoredSubmitting(eventId, true);
    setStoredSubmitError(eventId, null);

    try {
      const attendeeName = (
        fieldValues['full_name'] ??
        event?.custom_fields
          .map((field) => fieldValues[field.key])
          .find((value) => value?.trim()) ??
        ''
      ).trim();
      const result = await checkIn({
        eventId,
        fullName: attendeeName,
        customData: { ...fieldValues },
        userLat: coords?.lat ?? null,
        userLng: coords?.lng ?? null,
        pinInput,
        deviceId: getDeviceId(),
        qrToken: new URLSearchParams(window.location.search).get('qr') ?? '',
      });

      if (!result.success) {
        setStoredSubmitError(eventId, result.error);
        return;
      }

      // Lưu dấu trên thiết bị để tránh điểm danh lặp lại cùng một phiên.
      localStorage.setItem(`checkedin_${eventId}`, 'true');
      localStorage.setItem(`checkedin_name_${eventId}`, attendeeName);
      setStoredSuccess(eventId, attendeeName, result.data.distance_meters);
    } catch (error) {
      setStoredSubmitError(eventId,
        error instanceof Error ? error.message : 'Có lỗi khi gửi điểm danh. Vui lòng thử lại.'
      );
    } finally {
      setStoredSubmitting(eventId, false);
    }
  }, [
    coords,
    currentDistance,
    event,
    eventId,
    fieldValues,
    gpsReady,
    isWithinRadius,
    pinInput,
    setStoredSubmitError,
    setStoredSubmitting,
    setStoredSuccess,
  ]);

  return {
    fieldValues,
    setFieldValues,
    pinInput,
    setPinInput,
    isSubmitting,
    submitError,
    isSuccess,
    checkedInName,
    distanceResult,
    handleSubmit,
  };
}
