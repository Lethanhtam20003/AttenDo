'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { checkIn } from '@/actions/checkin';
import type { Event } from '@/types/database';

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
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [pinInput, setPinInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [distanceResult, setDistanceResult] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId || typeof window === 'undefined') return;
    // Khôi phục màn hình thành công nếu thiết bị đã điểm danh phiên này trước đó.
    if (localStorage.getItem(`checkedin_${eventId}`)) {
      Promise.resolve().then(() => setIsSuccess(true));
    }
  }, [eventId]);

  const handleSubmit = useCallback(async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!gpsReady || !coords || !eventId) {
      setSubmitError('Chưa xác định được vị trí GPS của bạn. Vui lòng bật định vị.');
      return;
    }

    if (!isWithinRadius && event) {
      setSubmitError(
        `Bạn đang ở cách địa điểm ~${currentDistance}m (Vượt quá bán kính cho phép ${event.radius_meters}m). Vui lòng di chuyển đến gần hội trường.`
      );
      return;
    }

    // Gửi dữ liệu sau khi đã xác nhận GPS và vị trí nằm trong bán kính cho phép.
    setIsSubmitting(true);
    setSubmitError(null);

    const result = await checkIn({
      eventId,
      fullName: fieldValues['full_name'] ?? '',
      customData: { ...fieldValues },
      userLat: coords.lat,
      userLng: coords.lng,
      pinInput,
      deviceId: getDeviceId(),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    // Lưu dấu trên thiết bị để tránh điểm danh lặp lại cùng một phiên.
    localStorage.setItem(`checkedin_${eventId}`, 'true');
    setDistanceResult(result.data.distance_meters);
    setIsSuccess(true);
  }, [coords, currentDistance, event, eventId, fieldValues, gpsReady, isWithinRadius, pinInput]);

  const handleCheckInAnother = useCallback(() => {
    if (!eventId || !confirm('Bạn có chắc muốn hủy lưu để người khác điểm danh trên thiết bị này?')) {
      return;
    }
    localStorage.removeItem(`checkedin_${eventId}`);
    setIsSuccess(false);
  }, [eventId]);

  return {
    fieldValues,
    setFieldValues,
    pinInput,
    setPinInput,
    isSubmitting,
    submitError,
    isSuccess,
    distanceResult,
    handleSubmit,
    handleCheckInAnother,
  };
}
