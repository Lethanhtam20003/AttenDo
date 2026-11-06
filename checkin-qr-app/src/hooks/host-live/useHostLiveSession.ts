'use client';

import { startTransition, useCallback, useEffect, useRef } from 'react';
import { useRealtimeTable } from '@/hooks/host-live/useRealtimeTable';
import { rotatePin, getCurrentPin } from '@/actions/pins';
import { endEvent, getEvent } from '@/actions/events';
import { issueDynamicQrToken } from '@/actions/qr';
import {
  PIN_LIFETIME_SECONDS,
  QR_TOKEN_LIFETIME_SECONDS,
  getPinRefreshSeconds,
  getQrTokenRefreshSeconds,
} from '@/constants/check-in';
import type { EventPin, Event } from '@/types/database';
import { useHostLiveStore } from '@/stores/host-live-store';

export function useHostLiveSession(eventId?: string) {
  const activeEventId = useHostLiveStore((state) => state.eventId);
  const storedEvent = useHostLiveStore((state) => state.event);
  const storedPin = useHostLiveStore((state) => state.pin);
  const storedTimeLeft = useHostLiveStore((state) => state.timeLeft);
  const storedSessionTimeLeft = useHostLiveStore((state) => state.sessionTimeLeft);
  const storedCheckInUrl = useHostLiveStore((state) => state.checkInUrl);
  const storedQrTimeLeft = useHostLiveStore((state) => state.qrTimeLeft);
  const storedQrError = useHostLiveStore((state) => state.qrError);
  const storedIsEnding = useHostLiveStore((state) => state.isEnding);
  const storedEndError = useHostLiveStore((state) => state.endError);
  const beginEvent = useHostLiveStore((state) => state.beginEvent);
  const setStoredEvent = useHostLiveStore((state) => state.setEvent);
  const setStoredPin = useHostLiveStore((state) => state.setPin);
  const setStoredCheckInUrl = useHostLiveStore((state) => state.setCheckInUrl);
  const setStoredQrTimeLeft = useHostLiveStore((state) => state.setQrTimeLeft);
  const setStoredQrError = useHostLiveStore((state) => state.setQrError);
  const setStoredSessionTimeLeft = useHostLiveStore((state) => state.setSessionTimeLeft);
  const setStoredIsEnding = useHostLiveStore((state) => state.setIsEnding);
  const setStoredEndError = useHostLiveStore((state) => state.setEndError);
  const isCurrentEvent = activeEventId === eventId;
  const event = isCurrentEvent ? storedEvent : null;
  const pin = isCurrentEvent ? storedPin : '----';
  const timeLeft = isCurrentEvent ? storedTimeLeft : PIN_LIFETIME_SECONDS;
  const sessionTimeLeft = isCurrentEvent ? storedSessionTimeLeft : null;
  const checkInUrl = isCurrentEvent ? storedCheckInUrl : '';
  const qrTimeLeft = isCurrentEvent ? storedQrTimeLeft : QR_TOKEN_LIFETIME_SECONDS;
  const qrError = isCurrentEvent ? storedQrError : null;
  const isEnding = isCurrentEvent && storedIsEnding;
  const endError = isCurrentEvent ? storedEndError : null;
  const expirationEndRequested = useRef(false);

  useEffect(() => {
    beginEvent(eventId);
  }, [beginEvent, eventId]);

  const refreshDynamicQr = useCallback(async (refreshSeconds: number) => {
    if (!eventId) return;

    try {
      const result = await issueDynamicQrToken(eventId);
      if (!result.success) {
        setStoredQrError(eventId, result.error);
        setStoredQrTimeLeft(eventId, 5);
        return;
      }

      const url = new URL(`/checkIn/${eventId}`, window.location.origin);
      url.searchParams.set('qr', result.data.token);
      setStoredCheckInUrl(eventId, url.toString());
      setStoredQrTimeLeft(eventId, refreshSeconds);
      setStoredQrError(eventId, null);
    } catch (error) {
      setStoredQrError(eventId, error instanceof Error ? error.message : 'Không thể làm mới mã QR.');
      setStoredQrTimeLeft(eventId, 5);
    }
  }, [eventId, setStoredCheckInUrl, setStoredQrError, setStoredQrTimeLeft]);

  useEffect(() => {
    if (!eventId) return;

    getEvent(eventId).then((data) => {
      if (!data) return;
      setStoredEvent(eventId, data as Event);

      if (data.status === 'active' && data.module_settings?.require_pin !== false) {
        getCurrentPin(eventId).then((res) => {
          if (res.success) {
            const pinRefreshSeconds = getPinRefreshSeconds(
              data.module_settings?.pin_interval_seconds
            );
            const remaining = Math.max(
              1,
              Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000)
            );
            setStoredPin(eventId, res.data.pin, Math.min(remaining, pinRefreshSeconds));
          }
        });
      }

      if (data.status === 'active' && data.module_settings?.dynamic_qr === true) {
        void refreshDynamicQr(
          getQrTokenRefreshSeconds(data.module_settings?.dynamic_qr_interval_seconds)
        );
      } else if (data.module_settings?.dynamic_qr !== true) {
        setStoredCheckInUrl(eventId, `${window.location.origin}/checkIn/${eventId}`);
      }
    });
  }, [eventId, refreshDynamicQr, setStoredCheckInUrl, setStoredEvent, setStoredPin]);

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
        setStoredPin(eventId, res.data.pin, pinRefreshSeconds);
      }
    });
  }, [event?.status, eventId, pinRefreshSeconds, setStoredPin]);

  const handleEndEvent = useCallback(async () => {
    if (!eventId || event?.status !== 'active' || isEnding) return false;

    setStoredIsEnding(eventId, true);
    setStoredEndError(eventId, null);
    try {
      const result = await endEvent(eventId);
      if (!result.success) {
        const latestEvent = await getEvent(eventId);
        if (latestEvent?.status === 'closed') {
          setStoredEvent(eventId, latestEvent as Event);
          setStoredEndError(eventId, null);
          return true;
        }
        setStoredEndError(eventId, result.error);
        return false;
      }

      setStoredEvent(eventId, { ...event, status: 'closed' });
      return true;
    } catch (error) {
      setStoredEndError(eventId, error instanceof Error ? error.message : 'Không thể kết thúc phiên điểm danh.');
      return false;
    } finally {
      setStoredIsEnding(eventId, false);
    }
  }, [event, eventId, isEnding, setStoredEndError, setStoredEvent, setStoredIsEnding]);

  useEffect(() => {
    expirationEndRequested.current = false;
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !event || event.status !== 'active' || !event.expires_at) {
      return;
    }

    const expiresAt = event.expires_at;
    const updateTimeLeft = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setStoredSessionTimeLeft(eventId, remaining);

      if (remaining === 0 && !expirationEndRequested.current) {
        expirationEndRequested.current = true;
        void handleEndEvent();
      }
    };

    updateTimeLeft();
    const timer = window.setInterval(updateTimeLeft, 1000);
    return () => window.clearInterval(timer);
  }, [event, eventId, handleEndEvent, setStoredSessionTimeLeft]);

  useEffect(() => {
    if (!eventId || event?.status !== 'active' || event.module_settings?.require_pin === false) return;
    const timer = setTimeout(() => {
      if (timeLeft <= 1) {
        void handleRotatePin();
        setStoredPin(eventId, pin, pinRefreshSeconds);
        return;
      }

      setStoredPin(eventId, pin, timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [event?.module_settings?.require_pin, event?.status, eventId, handleRotatePin, pin, pinRefreshSeconds, setStoredPin, timeLeft]);

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

    const timer = setTimeout(() => setStoredQrTimeLeft(eventId, qrTimeLeft - 1), 1000);

    return () => clearTimeout(timer);
  }, [event?.module_settings?.dynamic_qr, event?.status, eventId, qrRefreshSeconds, qrTimeLeft, refreshDynamicQr, setStoredQrTimeLeft]);

  useRealtimeTable<Event & Record<string, unknown>>(
    'events',
    `id=eq.${eventId}`,
    'UPDATE',
    (payload) => {
      if (eventId && payload.new && 'status' in payload.new) {
        setStoredEvent(eventId, payload.new as Event & Record<string, unknown>);
      }
    }
  );

  useRealtimeTable<EventPin & Record<string, unknown>>(
    'event_pins',
    `event_id=eq.${eventId}`,
    'INSERT',
    (payload) => {
      if (event?.status === 'active' && payload.new && 'current_pin' in payload.new) {
        if (eventId) setStoredPin(eventId, payload.new.current_pin as string, pinRefreshSeconds);
      }
    }
  );

  return {
    event,
    pin,
    timeLeft,
    checkInUrl,
    qrTimeLeft,
    qrError,
    handleRotatePin,
    handleEndEvent,
    isEnding,
    endError,
    sessionTimeLeft: event?.status === 'active' && event.expires_at ? sessionTimeLeft : null,
  };
}
