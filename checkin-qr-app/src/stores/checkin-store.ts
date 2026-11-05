import { create } from 'zustand';
import type { CheckinEvent } from '@/types/database';

interface Coordinates {
  lat: number;
  lng: number;
}

interface CheckinState {
  eventId: string | null;
  event: CheckinEvent | null;
  loading: boolean;
  gpsReady: boolean;
  coords: Coordinates | null;
  gpsError: string | null;
  isRequestingLocation: boolean;
  isRefiningLocation: boolean;
  isPermissionDenied: boolean;
  fieldValues: Record<string, string>;
  pinInput: string;
  isSubmitting: boolean;
  submitError: string | null;
  isSuccess: boolean;
  checkedInName: string;
  distanceResult: number | null;
  beginEvent: (eventId?: string) => void;
  setEvent: (eventId: string, event: CheckinEvent | null) => void;
  setLoading: (eventId: string, loading: boolean) => void;
  setGpsState: (eventId: string, update: Partial<CheckinState>) => void;
  setFieldValues: (
    eventId: string,
    values: Record<string, string> | ((current: Record<string, string>) => Record<string, string>)
  ) => void;
  setPinInput: (eventId: string, value: string) => void;
  setSubmitting: (eventId: string, value: boolean) => void;
  setSubmitError: (eventId: string, value: string | null) => void;
  setSuccess: (eventId: string, name: string, distance: number | null) => void;
}

const emptyState = {
  event: null,
  loading: true,
  gpsReady: false,
  coords: null,
  gpsError: null,
  isRequestingLocation: false,
  isRefiningLocation: false,
  isPermissionDenied: false,
  fieldValues: {} as Record<string, string>,
  pinInput: '',
  isSubmitting: false,
  submitError: null,
  isSuccess: false,
  checkedInName: '',
  distanceResult: null,
};

export const useCheckinStore = create<CheckinState>((set) => ({
  eventId: null,
  ...emptyState,
  beginEvent: (eventId) => set({ eventId: eventId ?? null, ...emptyState }),
  setEvent: (eventId, event) => set((state) => (
    state.eventId === eventId ? { event } : {}
  )),
  setLoading: (eventId, loading) => set((state) => (
    state.eventId === eventId ? { loading } : {}
  )),
  setGpsState: (eventId, update) => set((state) => (
    state.eventId === eventId ? update : {}
  )),
  setFieldValues: (eventId, values) => set((state) => (
    state.eventId === eventId
      ? { fieldValues: typeof values === 'function' ? values(state.fieldValues) : values }
      : {}
  )),
  setPinInput: (eventId, pinInput) => set((state) => (
    state.eventId === eventId ? { pinInput } : {}
  )),
  setSubmitting: (eventId, isSubmitting) => set((state) => (
    state.eventId === eventId ? { isSubmitting } : {}
  )),
  setSubmitError: (eventId, submitError) => set((state) => (
    state.eventId === eventId ? { submitError } : {}
  )),
  setSuccess: (eventId, checkedInName, distanceResult) => set((state) => (
    state.eventId === eventId ? { checkedInName, distanceResult, isSuccess: true } : {}
  )),
}));
