'use client';

import { useCallback, useEffect, type FormEvent } from 'react';
import {
  checkIn,
  getMyAttendanceRecord,
  updateAttendanceInfo,
} from '@/actions/check-in';
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
  const storedSubmittedData = useCheckInStore((state) => state.submittedData);
  const storedIsEditing = useCheckInStore((state) => state.isEditing);
  const storedUpdateMessage = useCheckInStore((state) => state.updateMessage);
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
  const setStoredIsEditing = useCheckInStore((state) => state.setIsEditing);
  const setStoredUpdateMessage = useCheckInStore((state) => state.setUpdateMessage);
  const isCurrentEvent = activeEventId === eventId;
  const fieldValues = isCurrentEvent ? storedFieldValues : EMPTY_FIELD_VALUES;
  const pinInput = isCurrentEvent ? storedPinInput : '';
  const isSubmitting = isCurrentEvent && storedIsSubmitting;
  const submitError = isCurrentEvent ? storedSubmitError : null;
  const isSuccess = isCurrentEvent && storedIsSuccess;
  const checkedInName = isCurrentEvent ? storedCheckedInName : '';
  const submittedData = isCurrentEvent ? storedSubmittedData : EMPTY_FIELD_VALUES;
  const isEditing = isCurrentEvent && storedIsEditing;
  const updateMessage = isCurrentEvent ? storedUpdateMessage : null;
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
    let active = true;

    // Khôi phục màn hình thành công nếu thiết bị đã điểm danh phiên này trước đó.
    if (localStorage.getItem(`checkedin_${eventId}`)) {
      const savedName = localStorage.getItem(`checkedin_name_${eventId}`) ?? '';
      let savedData: Record<string, string> = {};
      try {
        const rawData = localStorage.getItem(`checkedin_data_${eventId}`);
        if (rawData) {
          savedData = JSON.parse(rawData) as Record<string, string>;
        }
      } catch {
        savedData = {};
      }
      if (savedName && !savedData.full_name) {
        savedData = { full_name: savedName, ...savedData };
      }

      Promise.resolve().then(() => {
        if (!active) return;
        setStoredFieldValues(eventId, savedData);
        setStoredSuccess(eventId, savedName, null, savedData);
      });
    }

    // Đồng bộ bản ghi thực tế từ máy chủ theo device_id (nếu đã có)
    const deviceId = getDeviceId();
    if (deviceId) {
      getMyAttendanceRecord(eventId, deviceId)
        .then((res) => {
          if (!active || !res.success || !res.data) return;
          const serverData: Record<string, string> = {
            ...(res.data.custom_data ?? {}),
            full_name: res.data.full_name,
          };
          localStorage.setItem(`checkedin_${eventId}`, 'true');
          localStorage.setItem(`checkedin_name_${eventId}`, res.data.full_name);
          localStorage.setItem(`checkedin_data_${eventId}`, JSON.stringify(serverData));
          setStoredFieldValues(eventId, serverData);
          setStoredSuccess(
            eventId,
            res.data.full_name,
            res.data.distance_meters,
            serverData
          );
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, [eventId, setStoredFieldValues, setStoredSuccess]);

  const handleStartEditing = useCallback(() => {
    if (!eventId) return;
    const initialEditValues: Record<string, string> = {
      ...submittedData,
      ...(checkedInName && !submittedData.full_name ? { full_name: checkedInName } : {}),
    };
    setStoredFieldValues(eventId, initialEditValues);
    setStoredUpdateMessage(eventId, null);
    setStoredIsEditing(eventId, true);
  }, [
    checkedInName,
    eventId,
    setStoredFieldValues,
    setStoredIsEditing,
    setStoredUpdateMessage,
    submittedData,
  ]);

  const handleCancelEditing = useCallback(() => {
    if (!eventId) return;
    setStoredFieldValues(eventId, submittedData);
    setStoredIsEditing(eventId, false);
  }, [eventId, setStoredFieldValues, setStoredIsEditing, submittedData]);

  const handleSubmit = useCallback(async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!eventId) {
      return;
    }

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

      const normalizedCustomData: Record<string, string> = {
        ...fieldValues,
        full_name: attendeeName,
      };

      // Trường hợp người tham gia đang chỉnh sửa lại thông tin đã điểm danh
      if (isEditing) {
        const updateResult = await updateAttendanceInfo({
          eventId,
          deviceId: getDeviceId(),
          fullName: attendeeName,
          customData: normalizedCustomData,
        });

        if (!updateResult.success) {
          setStoredSubmitError(eventId, updateResult.error);
          return;
        }

        localStorage.setItem(`checkedin_${eventId}`, 'true');
        localStorage.setItem(`checkedin_name_${eventId}`, attendeeName);
        localStorage.setItem(
          `checkedin_data_${eventId}`,
          JSON.stringify(normalizedCustomData)
        );
        setStoredUpdateMessage(
          eventId,
          'Đã cập nhật thông tin điểm danh thành công!'
        );
        setStoredSuccess(
          eventId,
          attendeeName,
          updateResult.data.distance_meters,
          normalizedCustomData
        );
        return;
      }

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

      const result = await checkIn({
        eventId,
        fullName: attendeeName,
        customData: normalizedCustomData,
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
      localStorage.setItem(
        `checkedin_data_${eventId}`,
        JSON.stringify(normalizedCustomData)
      );
      setStoredUpdateMessage(eventId, null);
      setStoredSuccess(
        eventId,
        attendeeName,
        result.data.distance_meters,
        normalizedCustomData
      );
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
    isEditing,
    isWithinRadius,
    pinInput,
    requireLocation,
    requestLocation,
    setStoredSubmitError,
    setStoredSubmitting,
    setStoredSuccess,
    setStoredUpdateMessage,
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
    submittedData,
    isEditing,
    updateMessage,
    distanceResult,
    handleSubmit,
    handleStartEditing,
    handleCancelEditing,
  };
}
