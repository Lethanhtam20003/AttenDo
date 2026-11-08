import { create } from 'zustand';
import type { ManagedEvent } from '@/actions/events';
import type { AttendanceRecord, Event } from '@/types/database';

interface EventAttendance {
  event: Event;
  attendees: AttendanceRecord[];
}

export type EventStatusFilter = 'all' | 'upcoming' | 'ongoing' | 'ended';
export type EventSortOrder = 'start-desc' | 'start-asc' | 'title-asc' | 'created-desc';
export type AttendeeSortOrder =
  | 'checked-in-desc'
  | 'checked-in-asc'
  | 'name-asc'
  | 'name-desc'
  | 'distance-asc'
  | 'distance-desc';

interface HostManagementState {
  events: ManagedEvent[];
  selected: EventAttendance | null;
  isLoadingEvents: boolean;
  isLoadingAttendance: boolean;
  eventError: string | null;
  attendanceError: string | null;
  eventSearch: string;
  eventStatusFilter: EventStatusFilter;
  eventSortOrder: EventSortOrder;
  attendeeSearch: string;
  attendeeSortOrder: AttendeeSortOrder;
  isCreateMenuOpen: boolean;
  setEvents: (events: ManagedEvent[]) => void;
  setSelected: (selected: EventAttendance | null) => void;
  setIsLoadingEvents: (value: boolean) => void;
  setIsLoadingAttendance: (value: boolean) => void;
  setEventError: (error: string | null) => void;
  setAttendanceError: (error: string | null) => void;
  setEventSearch: (value: string) => void;
  setEventStatusFilter: (value: EventStatusFilter) => void;
  setEventSortOrder: (value: EventSortOrder) => void;
  setAttendeeSearch: (value: string) => void;
  setAttendeeSortOrder: (value: AttendeeSortOrder) => void;
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
  eventStatusFilter: 'all' as EventStatusFilter,
  eventSortOrder: 'start-desc' as EventSortOrder,
  attendeeSearch: '',
  attendeeSortOrder: 'checked-in-desc' as AttendeeSortOrder,
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
  setEventStatusFilter: (eventStatusFilter) => set({ eventStatusFilter }),
  setEventSortOrder: (eventSortOrder) => set({ eventSortOrder }),
  setAttendeeSearch: (attendeeSearch) => set({ attendeeSearch }),
  setAttendeeSortOrder: (attendeeSortOrder) => set({ attendeeSortOrder }),
  setIsCreateMenuOpen: (isCreateMenuOpen) => set({ isCreateMenuOpen }),
  toggleCreateMenu: () => set((state) => ({ isCreateMenuOpen: !state.isCreateMenuOpen })),
  reset: () => set(initialState),
}));
