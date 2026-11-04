'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import {
  getManagedEventAttendance,
  getManagedEvents,
  type ManagedEvent,
} from '@/actions/events';
import type { AttendanceRecord, Event } from '@/types/database';

type EventAttendance = {
  event: Event;
  attendees: AttendanceRecord[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function HostManagementPage() {
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [selected, setSelected] = useState<EventAttendance | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [attendeeSearch, setAttendeeSearch] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      const result = await getManagedEvents();
      setEventError(null);
      if (!result.success) {
        setEventError(result.error);
        return;
      }
      setEvents(result.data);
    } catch (error) {
      setEventError(
        error instanceof Error ? error.message : 'Không thể tải danh sách phiên điểm danh.'
      );
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadEvents);
  }, [loadEvents]);

  const handleSelectEvent = async (eventId: string) => {
    setIsLoadingAttendance(true);
    setAttendanceError(null);
    setAttendeeSearch('');
    try {
      const result = await getManagedEventAttendance(eventId);
      if (!result.success) {
        setSelected(null);
        setAttendanceError(result.error);
        return;
      }
      setSelected(result.data);
    } catch (error) {
      setSelected(null);
      setAttendanceError(
        error instanceof Error ? error.message : 'Không thể tải danh sách người tham dự.'
      );
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const query = eventSearch.trim().toLocaleLowerCase('vi');
    if (!query) return events;
    return events.filter((event) => event.title.toLocaleLowerCase('vi').includes(query));
  }, [eventSearch, events]);

  const filteredAttendees = useMemo(() => {
    if (!selected) return [];
    const query = attendeeSearch.trim().toLocaleLowerCase('vi');
    if (!query) return selected.attendees;
    return selected.attendees.filter((attendee) => {
      const searchableValues = [
        attendee.full_name,
        ...Object.values(attendee.custom_data ?? {}),
      ];
      return searchableValues.some((value) => value.toLocaleLowerCase('vi').includes(query));
    });
  }, [attendeeSearch, selected]);

  const activeCount = events.filter((event) => event.status === 'active').length;
  const customFields = selected?.event.custom_fields.filter((field) => field.key !== 'full_name') ?? [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">HỆ THỐNG ĐIỂM DANH / QUẢN LÝ</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Quản lý phiên điểm danh
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi trạng thái phiên và danh sách người tham dự.
            </p>
          </div>
          <Link
            href="/host/gps/setup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo phiên
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tổng phiên</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{events.length}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Đang điểm danh</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.7fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex lg:h-[460px] lg:flex-col">
            <div className="shrink-0 border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Các phiên điểm danh</h2>
                  <p className="mt-1 text-xs text-slate-500">Chọn một phiên để xem người tham dự</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {events.length}
                </span>
              </div>
              <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm focus-within:border-blue-500">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  aria-label="Tìm phiên điểm danh"
                  value={eventSearch}
                  onChange={(event) => setEventSearch(event.target.value)}
                  placeholder="Tìm tên phiên..."
                  className="min-w-0 flex-1 text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="max-h-[60dvh] overflow-y-auto p-3 lg:min-h-0 lg:max-h-none lg:flex-1">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách...
                </div>
              ) : eventError ? (
                <div className="p-3 text-sm text-rose-700">
                  <p>{eventError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoadingEvents(true);
                      void loadEvents();
                    }}
                    className="mt-2 font-semibold underline"
                  >
                    Thử tải lại
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    {events.length ? 'Không tìm thấy phiên phù hợp' : 'Chưa có phiên nào'}
                  </p>
                  {!events.length && (
                    <Link href="/host/gps/setup" className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline">
                      Tạo phiên đầu tiên
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredEvents.map((event) => {
                    const isSelected = selected?.event.id === event.id;
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => void handleSelectEvent(event.id)}
                          aria-pressed={isSelected}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-100'
                              : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold text-slate-900">{event.title}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                event.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {event.status === 'active' ? 'Đang diễn ra' : 'Đã kết thúc'}
                            </span>
                          </div>
                          <span className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatDate(event.created_at)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:min-h-[460px]">
            {isLoadingAttendance ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-sm text-slate-500 sm:min-h-[460px]">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                Đang tải danh sách người tham dự...
              </div>
            ) : attendanceError ? (
              <div className="flex min-h-[320px] items-center justify-center p-8 text-center sm:min-h-[460px]">
                <p role="alert" className="max-w-md text-sm text-rose-700">{attendanceError}</p>
              </div>
            ) : !selected ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center sm:min-h-[460px]">
                <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                  <Users className="h-7 w-7" />
                </div>
                <h2 className="mt-4 font-semibold text-slate-900">Danh sách người tham dự</h2>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                Chọn một phiên ở danh sách để xem thông tin điểm danh.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Chi tiết phiên điểm danh
                      </span>
                      <h2 className="mt-1 truncate text-xl font-bold text-slate-900">{selected.event.title}</h2>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(selected.event.created_at)}
                        {selected.event.location_lat !== null && (
                          <>
                            <MapPin className="ml-2 h-3.5 w-3.5" />
                            Có thiết lập vị trí
                          </>
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/host/live/${selected.event.id}`}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Mở phiên
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {selected.attendees.length} người tham dự
                    </p>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm focus-within:border-blue-500 sm:w-64">
                      <Search className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        aria-label="Tìm người tham dự"
                        value={attendeeSearch}
                        onChange={(event) => setAttendeeSearch(event.target.value)}
                        placeholder="Tìm theo tên hoặc thông tin..."
                        className="min-w-0 flex-1 text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </label>
                  </div>
                </div>

                {filteredAttendees.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {selected.attendees.length ? 'Không tìm thấy người tham dự' : 'Chưa có ai điểm danh'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selected.attendees.length
                        ? 'Thử thay đổi từ khóa tìm kiếm.'
                        : 'Người tham dự sẽ xuất hiện tại đây sau khi check-in.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <ul className="divide-y divide-slate-100 md:hidden">
                      {filteredAttendees.map((attendee) => (
                        <li key={attendee.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-slate-900">{attendee.full_name}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatDate(attendee.checked_in_at)}
                              </p>
                            </div>
                            {attendee.distance_meters !== null && (
                              <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {attendee.distance_meters} m
                              </span>
                            )}
                          </div>
                          {customFields.length > 0 && (
                            <dl className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                              {customFields.map((field) => (
                                <div key={field.key} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between">
                                  <dt className="text-xs text-slate-500">{field.label}</dt>
                                  <dd className="break-words text-slate-700">{attendee.custom_data?.[field.key] || '—'}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Người tham dự</th>
                          {customFields.map((field) => (
                            <th key={field.key} className="px-4 py-3 font-semibold">{field.label}</th>
                          ))}
                          <th className="px-4 py-3 font-semibold">Thời gian</th>
                          <th className="px-4 py-3 font-semibold">Khoảng cách</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAttendees.map((attendee) => (
                          <tr key={attendee.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-4 font-semibold text-slate-900">{attendee.full_name}</td>
                            {customFields.map((field) => (
                              <td key={field.key} className="px-4 py-4 text-slate-600">
                                {attendee.custom_data?.[field.key] || '—'}
                              </td>
                            ))}
                            <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                              {formatDate(attendee.checked_in_at)}
                            </td>
                            <td className="px-4 py-4 text-slate-600">
                              {attendee.distance_meters === null ? '—' : `${attendee.distance_meters} m`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
