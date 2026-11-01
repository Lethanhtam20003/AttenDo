'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import { useRealtimeTable } from '@/hooks/host-live/useRealtimeTable';
import { rotatePin, getCurrentPin } from '@/actions/pins';
import { getEvent } from '@/actions/events';
import { PIN_LIFETIME_SECONDS } from '@/constants/checkin';
import type { EventPin, Event } from '@/types/database';

export function useHostLiveSession(eventId?: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [pin, setPin] = useState('----');
  const [timeLeft, setTimeLeft] = useState(PIN_LIFETIME_SECONDS);
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
        setTimeLeft(Math.min(remaining, PIN_LIFETIME_SECONDS));
      }
    });
  }, [eventId]);

  const handleRotatePin = useCallback(async () => {
    if (!eventId) return;
   startTransition(async () => {
      const res = await rotatePin(eventId);
      if (res.success && res.data) {
        setPin(res.data.pin);
        setTimeLeft(PIN_LIFETIME_SECONDS);
      }
    });
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRotatePin();
          return PIN_LIFETIME_SECONDS;
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
        setTimeLeft(PIN_LIFETIME_SECONDS);
      }
    }
  );

  return { event, pin, timeLeft, checkinUrl, handleRotatePin };
}
