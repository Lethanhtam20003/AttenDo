'use client';

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { useRealtimeTable } from '@/hooks/host-live/useRealtimeTable';
import { rotatePin, getCurrentPin } from '@/actions/pins';
import { endEvent, getEvent } from '@/actions/events';
import { issueDynamicQrToken } from '@/actions/qr';
import {
  PIN_LIFETIME_SECONDS,
  QR_TOKEN_LIFETIME_SECONDS,
  getPinRefreshSeconds,
  getQrTokenRefreshSeconds,
} from '@/constants/checkin';
import type { EventPin, Event } from '@/types/database';

export function useHostLiveSession(eventId?: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [pin, setPin] = useState('----');
  const [timeLeft, setTimeLeft] = useState(PIN_LIFETIME_SECONDS);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [checkinUrl, setCheckinUrl] = useState('');
  const [qrTimeLeft, setQrTimeLeft] = useState(QR_TOKEN_LIFETIME_SECONDS);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const expirationEndRequested = useRef(false);

  const refreshDynamicQr = useCallback(async (refreshSeconds: number) => {
    if (!eventId) return;

    try {
      const result = await issueDynamicQrToken(eventId);
      if (!result.success) {
        setQrError(result.error);
        setQrTimeLeft(5);
        return;
      }

      const url = new URL(`/checkin/${eventId}`, window.location.origin);
      url.searchParams.set('qr', result.data.token);
      setCheckinUrl(url.toString());
      setQrTimeLeft(refreshSeconds);
      setQrError(null);
    } catch (error) {
      setQrError(error instanceof Error ? error.message : 'Không thể làm mới mã QR.');
      setQrTimeLeft(5);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    getEvent(eventId).then((data) => {
      if (!data) return;
      setEvent(data as Event);

      if (data.status === 'active' && data.module_settings?.require_pin !== false) {
        getCurrentPin(eventId).then((res) => {
          if (res.success) {
            const pinRefreshSeconds = getPinRefreshSeconds(
              data.module_settings?.pin_interval_seconds
            );
            setPin(res.data.pin);
            const remaining = Math.max(
              1,
              Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000)
            );
            setTimeLeft(Math.min(remaining, pinRefreshSeconds));
          }
        });
      }

      if (data.status === 'active' && data.module_settings?.dynamic_qr === true) {
        void refreshDynamicQr(
          getQrTokenRefreshSeconds(data.module_settings?.dynamic_qr_interval_seconds)
        );
      } else if (data.module_settings?.dynamic_qr !== true) {
        setCheckinUrl(`${window.location.origin}/checkin/${eventId}`);
      }
    });
  }, [eventId, refreshDynamicQr]);

  const qrRefreshSeconds = getQrTokenRefreshSeconds(
    event?.module_settings?.dynamic_qr_interval_seconds
  );
  const pinRefreshSeconds = getPinRefreshSeconds(
    event?.module_settings?.pin_interval_seconds
  );

  const handleRotatePin = useCallback(async () => {
    if (!eventId || event?.status !== 'active') return;
    startTransition(async () => {
      const res = await rotatePin(eventId);
      if (res.success && res.data) {
        setPin(res.data.pin);
        setTimeLeft(pinRefreshSeconds);
      }
    });
  }, [event?.status, eventId, pinRefreshSeconds]);

  const handleEndEvent = useCallback(async () => {
    if (!eventId || event?.status !== 'active' || isEnding) return false;

    setIsEnding(true);
    setEndError(null);
    try {
      const result = await endEvent(eventId);
      if (!result.success) {
        const latestEvent = await getEvent(eventId);
        if (latestEvent?.status === 'closed') {
          setEvent(latestEvent as Event);
          setEndError(null);
          return true;
        }
        setEndError(result.error);
        return false;
      }

      setEvent((current) => current && { ...current, status: 'closed' });
      return true;
    } catch (error) {
      setEndError(error instanceof Error ? error.message : 'Không thể kết thúc phiên điểm danh.');
      return false;
    } finally {
      setIsEnding(false);
    }
  }, [event?.status, eventId, isEnding]);

  useEffect(() => {
    expirationEndRequested.current = false;
  }, [eventId]);

  useEffect(() => {
    if (!event || event.status !== 'active' || !event.expires_at) {
      return;
    }

    const expiresAt = event.expires_at;
    const updateTimeLeft = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSessionTimeLeft(remaining);

      if (remaining === 0 && !expirationEndRequested.current) {
        expirationEndRequested.current = true;
        void handleEndEvent();
      }
    };

    updateTimeLeft();
    const timer = window.setInterval(updateTimeLeft, 1000);
    return () => window.clearInterval(timer);
  }, [event, handleEndEvent]);

  useEffect(() => {
    if (!eventId || event?.status !== 'active' || event.module_settings?.require_pin === false) return;
    const timer = setTimeout(() => {
      if (timeLeft <= 1) {
        void handleRotatePin();
        setTimeLeft(pinRefreshSeconds);
        return;
      }

      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [event?.module_settings?.require_pin, event?.status, eventId, handleRotatePin, pinRefreshSeconds, timeLeft]);

  useEffect(() => {
    if (
      !eventId ||
      event?.status !== 'active' ||
      event.module_settings?.dynamic_qr !== true
    ) return;

    if (qrTimeLeft <= 1) {
      const timer = setTimeout(() => void refreshDynamicQr(qrRefreshSeconds), 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setQrTimeLeft((remaining) => remaining - 1), 1000);

    return () => clearTimeout(timer);
  }, [event?.module_settings?.dynamic_qr, event?.status, eventId, qrRefreshSeconds, qrTimeLeft, refreshDynamicQr]);

  useRealtimeTable<Event & Record<string, unknown>>(
    'events',
    `id=eq.${eventId}`,
    'UPDATE',
    (payload) => {
      if (payload.new && 'status' in payload.new) {
        setEvent(payload.new as Event & Record<string, unknown>);
      }
    }
  );

  useRealtimeTable<EventPin & Record<string, unknown>>(
    'event_pins',
    `event_id=eq.${eventId}`,
    'INSERT',
    (payload) => {
      if (event?.status === 'active' && payload.new && 'current_pin' in payload.new) {
        setPin(payload.new.current_pin as string);
        setTimeLeft(pinRefreshSeconds);
      }
    }
  );

  return {
    event,
    pin,
    timeLeft,
    checkinUrl,
    qrTimeLeft,
    qrError,
    handleRotatePin,
    handleEndEvent,
    isEnding,
    endError,
    sessionTimeLeft: event?.status === 'active' && event.expires_at ? sessionTimeLeft : null,
  };
}
