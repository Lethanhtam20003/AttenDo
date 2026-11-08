import { create } from 'zustand';
import type { CheckInEvent } from '@/types/database';

export type CheckInLocationStatus = 'idle' | 'requesting' | 'success' | 'error';

export type CheckInLocationErrorCode =
  | 'device_gps_off'
  | 'permission_denied'
  | 'fast_denied_inapp'
  | 'position_unavailable'
  | 'timeout'
  | 'unsupported'
  | 'insecure_context'
  | null;

export interface CheckInLocationSamplePayload {
  userLat: number;
  userLng: number;
  userAccuracy: number;
  rawDistance: number;
  effectiveDistance: number;
  isWithinRadius: boolean;
  isConverged: boolean;
}

interface CheckInState {
  eventId: string | null;
  event: CheckInEvent | null;
  isBeforeStart: boolean;
  loading: boolean;
  fieldValues: Record<string, string>;
  pinInput: string;
  isSubmitting: boolean;
  submitError: string | null;
  isSuccess: boolean;
  checkedInName: string;
  submittedData: Record<string, string>;
  isEditing: boolean;
  updateMessage: string | null;
  distanceResult: number | null;
  locationStatus: CheckInLocationStatus;
  locationErrorCode: CheckInLocationErrorCode;
  locationErrorMessage: string | null;
  userLat: number | null;
  userLng: number | null;
  userAccuracy: number | null;
  rawDistance: number | null;
  effectiveDistance: number | null;
  isWithinRadius: boolean;
  isLinkCopied: boolean;
  isLocationModalDismissed: boolean;
  beginEvent: (eventId?: string) => void;
  setEvent: (eventId: string, event: CheckInEvent | null) => void;
  setIsBeforeStart: (eventId: string, value: boolean) => void;
  setLoading: (eventId: string, loading: boolean) => void;
  setFieldValues: (
    eventId: string,
    values: Record<string, string> | ((current: Record<string, string>) => Record<string, string>)
  ) => void;
  setPinInput: (eventId: string, value: string) => void;
  setSubmitting: (eventId: string, value: boolean) => void;
  setSubmitError: (eventId: string, value: string | null) => void;
  setSuccess: (
    eventId: string,
    name: string,
    distance: number | null,
    submittedData?: Record<string, string>
  ) => void;
  setIsEditing: (eventId: string, value: boolean) => void;
  setUpdateMessage: (eventId: string, value: string | null) => void;
  setLocationRequesting: (eventId: string) => void;
  setLocationSample: (eventId: string, payload: CheckInLocationSamplePayload) => void;
  setLocationError: (
    eventId: string,
    errorCode: CheckInLocationErrorCode,
    errorMessage: string
  ) => void;
  setIsLinkCopied: (eventId: string, value: boolean) => void;
  setIsLocationModalDismissed: (eventId: string, value: boolean) => void;
}

const emptyState = {
  event: null,
  isBeforeStart: true,
  loading: true,
  fieldValues: {} as Record<string, string>,
  pinInput: '',
  isSubmitting: false,
  submitError: null,
  isSuccess: false,
  checkedInName: '',
  submittedData: {} as Record<string, string>,
  isEditing: false,
  updateMessage: null as string | null,
  distanceResult: null,
  locationStatus: 'idle' as CheckInLocationStatus,
  locationErrorCode: null as CheckInLocationErrorCode,
  locationErrorMessage: null as string | null,
  userLat: null as number | null,
  userLng: null as number | null,
  userAccuracy: null as number | null,
  rawDistance: null as number | null,
  effectiveDistance: null as number | null,
  isWithinRadius: false,
  isLinkCopied: false,
  isLocationModalDismissed: false,
};

export const useCheckInStore = create<CheckInState>((set) => ({
  eventId: null,
  ...emptyState,
  beginEvent: (eventId) => set({ eventId: eventId ?? null, ...emptyState }),
  setEvent: (eventId, event) => set((state) => (
    state.eventId === eventId ? { event } : {}
  )),
  setIsBeforeStart: (eventId, isBeforeStart) => set((state) => (
    state.eventId === eventId ? { isBeforeStart } : {}
  )),
  setLoading: (eventId, loading) => set((state) => (
    state.eventId === eventId ? { loading } : {}
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
  setSuccess: (eventId, checkedInName, distanceResult, submittedData) => set((state) => (
    state.eventId === eventId
      ? {
          checkedInName,
          distanceResult: distanceResult ?? state.distanceResult,
          submittedData: submittedData ?? state.submittedData,
          isSuccess: true,
          isEditing: false,
        }
      : {}
  )),
  setIsEditing: (eventId, isEditing) => set((state) => (
    state.eventId === eventId ? { isEditing, submitError: null } : {}
  )),
  setUpdateMessage: (eventId, updateMessage) => set((state) => (
    state.eventId === eventId ? { updateMessage } : {}
  )),
  setLocationRequesting: (eventId) => set((state) => (
    state.eventId === eventId
      ? {
          locationStatus: 'requesting',
          locationErrorCode: null,
          locationErrorMessage: null,
        }
      : {}
  )),
  setLocationSample: (eventId, payload) => set((state) => (
    state.eventId === eventId
      ? {
          locationStatus: payload.isConverged ? 'success' : 'requesting',
          locationErrorCode: null,
          locationErrorMessage: null,
          userLat: payload.userLat,
          userLng: payload.userLng,
          userAccuracy: payload.userAccuracy,
          rawDistance: payload.rawDistance,
          effectiveDistance: payload.effectiveDistance,
          isWithinRadius: payload.isWithinRadius,
        }
      : {}
  )),
  setLocationError: (eventId, locationErrorCode, locationErrorMessage) => set((state) => (
    state.eventId === eventId
      ? {
          locationStatus: 'error',
          locationErrorCode,
          locationErrorMessage,
        }
      : {}
  )),
  setIsLinkCopied: (eventId, isLinkCopied) => set((state) => (
    state.eventId === eventId ? { isLinkCopied } : {}
  )),
  setIsLocationModalDismissed: (eventId, isLocationModalDismissed) => set((state) => (
    state.eventId === eventId ? { isLocationModalDismissed } : {}
  )),
}));
