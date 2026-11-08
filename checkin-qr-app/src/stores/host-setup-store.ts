import { create } from 'zustand';
import type { HostSetupCustomField } from '@/hooks/host-setup/useCustomFields';

interface Coordinates {
  lat: number;
  lng: number;
}

interface HostSetupState {
  eventTitle: string;
  startsAt: string;
  titleAvailability: 'idle' | 'checking' | 'available' | 'taken' | 'error';
  titleAvailabilityError: string | null;
  errorMsg: string | null;
  refreshInterval: string;
  sessionDurationValue: string;
  sessionDurationUnit: 'minutes' | 'hours';
  coordinates: Coordinates;
  radius: number;
  fields: HostSetupCustomField[];
  isLocating: boolean;
  locationError: string | null;
  draggedFieldId: string | null;
  dropIndicator: { fieldId: string; placeAfter: boolean } | null;
  setEventTitle: (value: string) => void;
  setStartsAt: (value: string) => void;
  setTitleAvailability: (
    value: HostSetupState['titleAvailability'],
    error?: string | null
  ) => void;
  setErrorMsg: (value: string | null) => void;
  setRefreshInterval: (value: string) => void;
  setSessionDurationValue: (value: string) => void;
  setSessionDurationUnit: (value: 'minutes' | 'hours') => void;
  setCoordinates: (value: Coordinates) => void;
  setRadius: (value: number) => void;
  setFields: (update: (fields: HostSetupCustomField[]) => HostSetupCustomField[]) => void;
  setGeolocation: (update: Partial<Pick<HostSetupState, 'isLocating' | 'locationError'>>) => void;
  setDraggedFieldId: (value: string | null) => void;
  setDropIndicator: (value: HostSetupState['dropIndicator']) => void;
  reset: (refreshInterval: string) => void;
}

const initialFields: HostSetupCustomField[] = [
  { id: '1', key: 'full_name', label: 'Họ và tên', type: 'text', required: true, fixed: true },
  { id: '2', key: 'phone', label: 'Số điện thoại', type: 'tel', required: true, fixed: false },
  { id: '3', key: 'don_vi', label: 'Đơn vị công tác', type: 'text', required: false, fixed: false },
];

const initialCoordinates = { lat: 10.64102, lng: 107.34564 };

export const useHostSetupStore = create<HostSetupState>((set) => ({
  eventTitle: '',
  startsAt: '',
  titleAvailability: 'idle',
  titleAvailabilityError: null,
  errorMsg: null,
  refreshInterval: '120',
  sessionDurationValue: '2',
  sessionDurationUnit: 'hours',
  coordinates: initialCoordinates,
  radius: 100,
  fields: initialFields,
  isLocating: false,
  locationError: null,
  draggedFieldId: null,
  dropIndicator: null,
  setEventTitle: (eventTitle) =>
    set({ eventTitle, titleAvailability: 'idle', titleAvailabilityError: null }),
  setStartsAt: (startsAt) => set({ startsAt }),
  setTitleAvailability: (titleAvailability, titleAvailabilityError = null) =>
    set({ titleAvailability, titleAvailabilityError }),
  setErrorMsg: (errorMsg) => set({ errorMsg }),
  setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
  setSessionDurationValue: (sessionDurationValue) => set({ sessionDurationValue }),
  setSessionDurationUnit: (sessionDurationUnit) => set({ sessionDurationUnit }),
  setCoordinates: (coordinates) => set({ coordinates }),
  setRadius: (radius) => set({ radius }),
  setFields: (update) => set((state) => ({ fields: update(state.fields) })),
  setGeolocation: (update) => set(update),
  setDraggedFieldId: (draggedFieldId) => set({ draggedFieldId }),
  setDropIndicator: (dropIndicator) => set({ dropIndicator }),
  reset: (refreshInterval) => set({
    eventTitle: '',
    startsAt: '',
    titleAvailability: 'idle',
    titleAvailabilityError: null,
    errorMsg: null,
    refreshInterval,
    sessionDurationValue: '2',
    sessionDurationUnit: 'hours',
    coordinates: initialCoordinates,
    radius: 100,
    fields: initialFields,
    isLocating: false,
    locationError: null,
    draggedFieldId: null,
    dropIndicator: null,
  }),
}));
