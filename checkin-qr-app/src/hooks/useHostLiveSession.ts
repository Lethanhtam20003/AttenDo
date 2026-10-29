'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { rotatePin, getCurrentPin } from '@/actions/pins';
import { getEvent } from '@/actions/events';
import type { EventPin, Event } from '@/types/database';

export const PIN_INTERVAL_SEC = 30;

export function useHostLiveSession(eventId?: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [pin, setPin] = useState('----');
  const [timeLeft, setTimeLeft] = useState(PIN_INTERVAL_SEC);
  const [checkinUrl, setCheckinUrl] = useState('');

  useEffect(() => {
    if (!eventId) return;

    Promise.resolve().then(() => setCheckinUrl(`${window.location.origin}/checkin/${eventId}`));

    getEvent(eventId).then((data) => {
      if (data) setEvent(data as Event);
    });

    getCurrentPin(eventId).then((res) => {
      if (res.success) {
        setPin(res.data.pin);
        const remaining = Math.max(
          1,
          Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(Math.min(remaining, PIN_INTERVAL_SEC));
      }
    });
  }, [eventId]);

  const handleRotatePin = useCallback(async () => {
    if (!eventId) return;

    const result = await rotatePin(eventId);
    if (result.success) {
      setPin(result.data.pin);
      setTimeLeft(PIN_INTERVAL_SEC);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRotatePin();
          return PIN_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [eventId, handleRotatePin]);

  useRealtimeTable<EventPin & Record<string, unknown>>(
    'event_pins',
    `event_id=eq.${eventId}`,
    'INSERT',
    (payload) => {
      if (payload.new && 'current_pin' in payload.new) {
        setPin(payload.new.current_pin as string);
        setTimeLeft(PIN_INTERVAL_SEC);
      }
    }
  );

  return { event, pin, timeLeft, checkinUrl, handleRotatePin };
}
