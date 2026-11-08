import { create } from 'zustand';
import type { ManagedEvent } from '@/actions/events';
import type { AttendanceRecord, Event } from '@/types/database';

interface EventAttendance {
  event: Event;
  attendees: AttendanceRecord[];
}

interface HostManagementState {
  events: ManagedEvent[];
  selected: EventAttendance | null;
  isLoadingEvents: boolean;
  isLoadingAttendance: boolean;
  eventError: string | null;
  attendanceError: string | null;
  eventSearch: string;
  attendeeSearch: string;
  isCreateMenuOpen: boolean;
  setEvents: (events: ManagedEvent[]) => void;
  setSelected: (selected: EventAttendance | null) => void;
  setIsLoadingEvents: (value: boolean) => void;
  setIsLoadingAttendance: (value: boolean) => void;
  setEventError: (error: string | null) => void;
  setAttendanceError: (error: string | null) => void;
  setEventSearch: (value: string) => void;
  setAttendeeSearch: (value: string) => void;
  setIsCreateMenuOpen: (isOpen: boolean) => void;
  toggleCreateMenu: () => void;
  reset: () => void;
}

const initialState = {
  events: [] as ManagedEvent[],
  selected: null,
  isLoadingEvents: true,
  isLoadingAttendance: false,
  eventError: null,
  attendanceError: null,
  eventSearch: '',
  attendeeSearch: '',
  isCreateMenuOpen: false,
};

export const useHostManagementStore = create<HostManagementState>((set) => ({
  ...initialState,
  setEvents: (events) => set({ events }),
  setSelected: (selected) => set({ selected }),
  setIsLoadingEvents: (isLoadingEvents) => set({ isLoadingEvents }),
  setIsLoadingAttendance: (isLoadingAttendance) => set({ isLoadingAttendance }),
  setEventError: (eventError) => set({ eventError }),
  setAttendanceError: (attendanceError) => set({ attendanceError }),
  setEventSearch: (eventSearch) => set({ eventSearch }),
  setAttendeeSearch: (attendeeSearch) => set({ attendeeSearch }),
  setIsCreateMenuOpen: (isCreateMenuOpen) => set({ isCreateMenuOpen }),
  toggleCreateMenu: () => set((state) => ({ isCreateMenuOpen: !state.isCreateMenuOpen })),
  reset: () => set(initialState),
}));
