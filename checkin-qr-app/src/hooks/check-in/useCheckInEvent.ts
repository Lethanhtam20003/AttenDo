'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    beginEvent(eventId);
    setEvent(eventId, initialEvent);
    setLoading(eventId, false);
  }, [beginEvent, eventId, initialEvent, setEvent, setLoading]);

  return {
    event: activeEventId === eventId ? event : null,
    loading: activeEventId === eventId ? loading : true,
  };
}
