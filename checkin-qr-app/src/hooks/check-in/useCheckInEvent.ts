'use client';

import { useEffect } from 'react';
import { getLocationConsentStorageKey } from '@/constants/check-in';
import type { CheckInEvent } from '@/types/database';
import { useCheckInStore } from '@/stores/check-in-store';

// Khởi tạo store từ cấu hình check-in đã được nhúng trong liên kết do host tạo.
export function useCheckInEvent(initialEvent: CheckInEvent) {
  const eventId = initialEvent.id;
  const activeEventId = useCheckInStore((state) => state.eventId);
  const event = useCheckInStore((state) => state.event);
  const loading = useCheckInStore((state) => state.loading);
  const beginEvent = useCheckInStore((state) => state.beginEvent);
  const setEvent = useCheckInStore((state) => state.setEvent);
  const setLoading = useCheckInStore((state) => state.setLoading);
  const setLocationIntroConfirmed = useCheckInStore((state) => state.setLocationIntroConfirmed);

  useEffect(() => {
    beginEvent(eventId);
    setEvent(eventId, initialEvent);

    const restoreLocationConsent = async () => {
      let hasLocationConsent = false;

      try {
        hasLocationConsent = localStorage.getItem(getLocationConsentStorageKey(eventId)) === 'true';
      } catch {
        // Không truy cập được bộ nhớ vẫn không ngăn người dùng tiếp tục điểm danh.
      }

      if (!hasLocationConsent && typeof navigator !== 'undefined' && navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          hasLocationConsent = permission.state === 'granted';
        } catch {
          // Một số trình duyệt không hỗ trợ truy vấn trạng thái quyền.
        }
      }

      if (hasLocationConsent) {
        try {
          localStorage.setItem(getLocationConsentStorageKey(eventId), 'true');
        } catch {
          // Vẫn có thể tiếp tục nếu trình duyệt chặn bộ nhớ cục bộ.
        }
        setLocationIntroConfirmed(eventId, true);
      }

      setLoading(eventId, false);
    };

    void restoreLocationConsent();
  }, [beginEvent, eventId, initialEvent, setEvent, setLoading, setLocationIntroConfirmed]);

  return {
    event: activeEventId === eventId ? event : null,
    loading: activeEventId === eventId ? loading : true,
  };
}
