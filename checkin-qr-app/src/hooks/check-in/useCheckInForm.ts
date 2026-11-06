'use client';

import { useCallback, useEffect, type FormEvent } from 'react';
import { checkIn } from '@/actions/check-in';
import type { CheckInEvent } from '@/types/database';
import {
  useCheckInStore,
  type CheckInLocationSamplePayload,
} from '@/stores/check-in-store';

interface UseCheckInFormOptions {
  eventId?: string;
  event: CheckInEvent | null;
  requireLocation?: boolean;
  requestLocation?: () => Promise<CheckInLocationSamplePayload | null>;
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
export function useCheckInForm({
  eventId,
  event,
  requireLocation = false,
  requestLocation,
}: UseCheckInFormOptions) {
  const activeEventId = useCheckInStore((state) => state.eventId);
  const storedFieldValues = useCheckInStore((state) => state.fieldValues);
  const storedPinInput = useCheckInStore((state) => state.pinInput);
  const storedIsSubmitting = useCheckInStore((state) => state.isSubmitting);
  const storedSubmitError = useCheckInStore((state) => state.submitError);
  const storedIsSuccess = useCheckInStore((state) => state.isSuccess);
  const storedCheckedInName = useCheckInStore((state) => state.checkedInName);
  const storedDistanceResult = useCheckInStore((state) => state.distanceResult);
  const storedUserLat = useCheckInStore((state) => state.userLat);
  const storedUserLng = useCheckInStore((state) => state.userLng);
  const storedUserAccuracy = useCheckInStore((state) => state.userAccuracy);
  const storedIsWithinRadius = useCheckInStore((state) => state.isWithinRadius);
  const setStoredFieldValues = useCheckInStore((state) => state.setFieldValues);
  const setStoredPinInput = useCheckInStore((state) => state.setPinInput);
  const setStoredSubmitting = useCheckInStore((state) => state.setSubmitting);
  const setStoredSubmitError = useCheckInStore((state) => state.setSubmitError);
  const setStoredSuccess = useCheckInStore((state) => state.setSuccess);
  const isCurrentEvent = activeEventId === eventId;
  const fieldValues = isCurrentEvent ? storedFieldValues : EMPTY_FIELD_VALUES;
  const pinInput = isCurrentEvent ? storedPinInput : '';
  const isSubmitting = isCurrentEvent && storedIsSubmitting;
  const submitError = isCurrentEvent ? storedSubmitError : null;
  const isSuccess = isCurrentEvent && storedIsSuccess;
  const checkedInName = isCurrentEvent ? storedCheckedInName : '';
  const distanceResult = isCurrentEvent ? storedDistanceResult : null;
  const userLat = isCurrentEvent ? storedUserLat : null;
  const userLng = isCurrentEvent ? storedUserLng : null;
  const userAccuracy = isCurrentEvent ? storedUserAccuracy : null;
  const isWithinRadius = isCurrentEvent && storedIsWithinRadius;
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
      return;
    }

    setStoredSubmitting(eventId, true);
    setStoredSubmitError(eventId, null);

    try {
      let resolvedLat = userLat;
      let resolvedLng = userLng;
      let resolvedAccuracy = userAccuracy;

      if (requireLocation) {
        const hasValidReadyLocation =
          resolvedLat !== null && resolvedLng !== null && isWithinRadius;

        // Tự động kích hoạt lấy GPS ngay trong cú bấm Submit nếu người dùng chưa bật vị trí trước đó.
        if (!hasValidReadyLocation) {
          const freshSample = requestLocation ? await requestLocation() : null;
          if (!freshSample) {
            const latestLocationError =
              useCheckInStore.getState().locationErrorMessage ??
              'Vui lòng mở Vị trí (GPS) trên điện thoại để hoàn tất điểm danh.';
            setStoredSubmitError(eventId, latestLocationError);
            return;
          }

          if (!freshSample.isWithinRadius) {
            const allowedRadius =
              event?.radius_meters && event.radius_meters > 0 ? event.radius_meters : 100;
            setStoredSubmitError(
              eventId,
              `Vị trí của bạn đang cách điểm tổ chức ${freshSample.effectiveDistance}m (bán kính cho phép ${allowedRadius}m).`
            );
            return;
          }

          resolvedLat = freshSample.userLat;
          resolvedLng = freshSample.userLng;
          resolvedAccuracy = freshSample.userAccuracy;
        }
      }

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
        userLat: requireLocation ? resolvedLat : null,
        userLng: requireLocation ? resolvedLng : null,
        userAccuracy: requireLocation ? resolvedAccuracy : null,
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
    event,
    eventId,
    fieldValues,
    isWithinRadius,
    pinInput,
    requireLocation,
    requestLocation,
    setStoredSubmitError,
    setStoredSubmitting,
    setStoredSuccess,
    userAccuracy,
    userLat,
    userLng,
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
