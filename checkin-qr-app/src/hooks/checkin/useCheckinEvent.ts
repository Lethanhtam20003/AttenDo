'use client';

import { useEffect, useState } from 'react';
import { getEvent } from '@/actions/events';
import type { Event } from '@/types/database';

// Tải thông tin phiên điểm danh và cung cấp trạng thái đang tải cho giao diện.
export function useCheckinEvent(eventId?: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    // Chỉ truy vấn sự kiện khi đã có mã sự kiện từ URL.
    getEvent(eventId).then((data) => {
      setEvent(data as Event | null);
      setLoading(false);
    });
  }, [eventId]);

  return { event, loading };
}
