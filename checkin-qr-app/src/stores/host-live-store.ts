import { create } from 'zustand';
import type { AttendanceRecord, Event } from '@/types/database';
import { PIN_LIFETIME_SECONDS, QR_TOKEN_LIFETIME_SECONDS } from '@/constants/check-in';

interface HostLiveState {
  eventId: string | null;
  event: Event | null;
  pin: string;
  timeLeft: number;
  sessionTimeLeft: number | null;
  checkInUrl: string;
  qrTimeLeft: number;
  qrError: string | null;
  isEnding: boolean;
  endError: string | null;
  logs: AttendanceRecord[];
  newAttendeeId: string | null;
  showEndConfirmation: boolean;
  showQrModal: boolean;
  isSharingQr: boolean;
  shareMessage: string | null;
  shareError: string | null;
  copyFallbackUrl: boolean;
  beginEvent: (eventId?: string) => void;
  setEvent: (eventId: string, event: Event | null) => void;
  setPin: (eventId: string, pin: string, timeLeft?: number) => void;
  setCheckInUrl: (eventId: string, url: string) => void;
  setQrTimeLeft: (eventId: string, seconds: number) => void;
  setQrError: (eventId: string, error: string | null) => void;
  setSessionTimeLeft: (eventId: string, seconds: number | null) => void;
  setIsEnding: (eventId: string, value: boolean) => void;
  setEndError: (eventId: string, error: string | null) => void;
  setAttendance: (eventId: string, records: AttendanceRecord[]) => void;
  addAttendee: (eventId: string, record: AttendanceRecord) => void;
  setNewAttendeeId: (eventId: string, id: string | null) => void;
  setShowEndConfirmation: (eventId: string, value: boolean) => void;
  setShowQrModal: (eventId: string, value: boolean) => void;
  setIsSharingQr: (eventId: string, value: boolean) => void;
  setShareMessage: (eventId: string, value: string | null) => void;
  setShareError: (eventId: string, value: string | null) => void;
  setCopyFallbackUrl: (eventId: string, value: boolean) => void;
}

const emptyState = {
  event: null,
  pin: '----',
  timeLeft: PIN_LIFETIME_SECONDS,
  sessionTimeLeft: null,
  checkInUrl: '',
  qrTimeLeft: QR_TOKEN_LIFETIME_SECONDS,
  qrError: null,
  isEnding: false,
  endError: null,
  logs: [] as AttendanceRecord[],
  newAttendeeId: null,
  showEndConfirmation: false,
  showQrModal: false,
  isSharingQr: false,
  shareMessage: null,
  shareError: null,
  copyFallbackUrl: false,
};

export const useHostLiveStore = create<HostLiveState>((set) => ({
  eventId: null,
  ...emptyState,
  beginEvent: (eventId) => set({ eventId: eventId ?? null, ...emptyState }),
  setEvent: (eventId, event) => set((state) => (
    state.eventId === eventId ? { event } : {}
  )),
  setPin: (eventId, pin, timeLeft) => set((state) => (
    state.eventId === eventId
      ? { pin, ...(timeLeft === undefined ? {} : { timeLeft }) }
      : {}
  )),
  setCheckInUrl: (eventId, checkInUrl) => set((state) => (
    state.eventId === eventId ? { checkInUrl } : {}
  )),
  setQrTimeLeft: (eventId, qrTimeLeft) => set((state) => (
    state.eventId === eventId ? { qrTimeLeft } : {}
  )),
  setQrError: (eventId, qrError) => set((state) => (
    state.eventId === eventId ? { qrError } : {}
  )),
  setSessionTimeLeft: (eventId, sessionTimeLeft) => set((state) => (
    state.eventId === eventId ? { sessionTimeLeft } : {}
  )),
  setIsEnding: (eventId, isEnding) => set((state) => (
    state.eventId === eventId ? { isEnding } : {}
  )),
  setEndError: (eventId, endError) => set((state) => (
    state.eventId === eventId ? { endError } : {}
  )),
  setAttendance: (eventId, logs) => set((state) => (
    state.eventId === eventId ? { logs } : {}
  )),
  addAttendee: (eventId, record) => set((state) => {
    if (state.eventId !== eventId || state.logs.some((item) => item.id === record.id)) return {};
    return { logs: [record, ...state.logs] };
  }),
  setNewAttendeeId: (eventId, newAttendeeId) => set((state) => (
    state.eventId === eventId ? { newAttendeeId } : {}
  )),
  setShowEndConfirmation: (eventId, showEndConfirmation) => set((state) => (
    state.eventId === eventId ? { showEndConfirmation } : {}
  )),
  setShowQrModal: (eventId, showQrModal) => set((state) => (
    state.eventId === eventId ? { showQrModal } : {}
  )),
  setIsSharingQr: (eventId, isSharingQr) => set((state) => (
    state.eventId === eventId ? { isSharingQr } : {}
  )),
  setShareMessage: (eventId, shareMessage) => set((state) => (
    state.eventId === eventId ? { shareMessage } : {}
  )),
  setShareError: (eventId, shareError) => set((state) => (
    state.eventId === eventId ? { shareError } : {}
  )),
  setCopyFallbackUrl: (eventId, copyFallbackUrl) => set((state) => (
    state.eventId === eventId ? { copyFallbackUrl } : {}
  )),
}));
