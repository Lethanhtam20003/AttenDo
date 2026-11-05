'use client';

import { useEffect } from 'react';
import type { CheckinEvent } from '@/types/database';
import { useCheckinStore } from '@/stores/checkin-store';

// Khởi tạo store từ dữ liệu đã được tải một lần trong Server Component.
export function useCheckinEvent(initialEvent: CheckinEvent) {
  const eventId = initialEvent.id;
  const activeEventId = useCheckinStore((state) => state.eventId);
  const event = useCheckinStore((state) => state.event);
  const loading = useCheckinStore((state) => state.loading);
  const beginEvent = useCheckinStore((state) => state.beginEvent);
  const setEvent = useCheckinStore((state) => state.setEvent);
  const setLoading = useCheckinStore((state) => state.setLoading);

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
