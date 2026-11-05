'use client';

import { useEffect } from 'react';
import { getEvent } from '@/actions/events';
import type { Event } from '@/types/database';
import { useCheckinStore } from '@/stores/checkin-store';

// Tải thông tin phiên điểm danh và cung cấp trạng thái đang tải cho giao diện.
export function useCheckinEvent(eventId?: string) {
  const activeEventId = useCheckinStore((state) => state.eventId);
  const event = useCheckinStore((state) => state.event);
  const loading = useCheckinStore((state) => state.loading);
  const beginEvent = useCheckinStore((state) => state.beginEvent);
  const setEvent = useCheckinStore((state) => state.setEvent);
  const setLoading = useCheckinStore((state) => state.setLoading);

  useEffect(() => {
    beginEvent(eventId);
    if (!eventId) return;

    let active = true;
    getEvent(eventId).then((data) => {
      if (!active) return;
      setEvent(eventId, data as Event | null);
      setLoading(eventId, false);
    });
    return () => {
      active = false;
    };
  }, [beginEvent, eventId, setEvent, setLoading]);

  return {
    event: activeEventId === eventId ? event : null,
    loading: activeEventId === eventId ? loading : true,
  };
}
