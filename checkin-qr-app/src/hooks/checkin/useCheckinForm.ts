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
  const [checkedInName, setCheckedInName] = useState('');
  const [distanceResult, setDistanceResult] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId || typeof window === 'undefined') return;
    // Khôi phục màn hình thành công nếu thiết bị đã điểm danh phiên này trước đó.
    if (localStorage.getItem(`checkedin_${eventId}`)) {
      const savedName = localStorage.getItem(`checkedin_name_${eventId}`) ?? '';
      Promise.resolve().then(() => {
        setCheckedInName(savedName);
        setIsSuccess(true);
      });
    }
  }, [eventId]);

  const handleSubmit = useCallback(async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!eventId) {
      setSubmitError('Không tìm thấy mã phiên điểm danh. Vui lòng tải lại trang.');
      return;
    }

    const requireLocation = event?.module_settings?.require_location !== false;
    if (requireLocation && (!gpsReady || !coords)) {
      setSubmitError('Chưa xác định được vị trí GPS của bạn. Vui lòng bật định vị.');
      return;
    }

    if (requireLocation && !isWithinRadius && event) {
      setSubmitError(
        `Bạn đang ở cách địa điểm ~${currentDistance}m (Vượt quá bán kính cho phép ${event.radius_meters}m). Vui lòng di chuyển đến gần hội trường.`
      );
      return;
    }

    // Gửi dữ liệu sau khi đã xác nhận GPS và vị trí nằm trong bán kính cho phép.
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await checkIn({
        eventId,
        fullName: fieldValues['full_name'] ?? '',
        customData: { ...fieldValues },
        userLat: coords?.lat ?? null,
        userLng: coords?.lng ?? null,
        pinInput,
        deviceId: getDeviceId(),
        qrToken: new URLSearchParams(window.location.search).get('qr') ?? '',
      });

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      // Lưu dấu trên thiết bị để tránh điểm danh lặp lại cùng một phiên.
      const attendeeName = (fieldValues['full_name'] ?? '').trim();
      localStorage.setItem(`checkedin_${eventId}`, 'true');
      localStorage.setItem(`checkedin_name_${eventId}`, attendeeName);
      setCheckedInName(attendeeName);
      setDistanceResult(result.data.distance_meters);
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Có lỗi khi gửi điểm danh. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [coords, currentDistance, event, eventId, fieldValues, gpsReady, isWithinRadius, pinInput]);

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
