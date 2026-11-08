// Chỉ định đây là Client Component trong Next.js (code chạy ở phía trình duyệt, không phải server)
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getAttendanceList } from '@/actions/check-in';
import { getPresenterAttendanceList } from '@/actions/presenter';
import { useRealtimeTable } from '@/hooks/host-live/useRealtimeTable';
import { getDefaultSelectedColumnIds } from '@/lib/export/attendance-export';
import type { AttendanceRecord, Event } from '@/types/database';
import { useAttendanceExportStore } from '@/stores/attendance-export-store';
import { useHostLiveStore } from '@/stores/host-live-store';

const EMPTY_LOGS: AttendanceRecord[] = [];

// Custom hook quản lý danh sách điểm danh của một sự kiện
export function useAttendanceBoard(
  eventId?: string,
  event?: Event | null,
  presenterToken?: string
) {
  const activeEventId = useHostLiveStore((state) => state.eventId);
  const storedLogs = useHostLiveStore((state) => state.logs);
  const storedNewAttendeeId = useHostLiveStore((state) => state.newAttendeeId);
  const setAttendance = useHostLiveStore((state) => state.setAttendance);
  const addAttendee = useHostLiveStore((state) => state.addAttendee);
  const setNewAttendeeId = useHostLiveStore((state) => state.setNewAttendeeId);
  const newAttendeeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTopIdRef = useRef<string | null>(null);
  const logs = activeEventId === eventId ? storedLogs : EMPTY_LOGS;
  const newAttendeeId = activeEventId === eventId ? storedNewAttendeeId : null;

  // Hook useEffect: Chạy mỗi khi eventId thay đổi.
  // Nhiệm vụ: Lấy danh sách điểm danh ban đầu từ server khi vừa vào trang (hoặc định kỳ ở chế độ trình chiếu).
  useEffect(() => {
    if (!eventId) return;
    let active = true;
    latestTopIdRef.current = null;

    const loadRecords = async (isInitial: boolean) => {
      try {
        const records = presenterToken
          ? await getPresenterAttendanceList(eventId, presenterToken)
          : await getAttendanceList(eventId);
        if (!active) return;

        const newestId = records[0]?.id ?? null;
        if (!isInitial && newestId && newestId !== latestTopIdRef.current) {
          setNewAttendeeId(eventId, newestId);
          if (newAttendeeTimerRef.current !== null) {
            clearTimeout(newAttendeeTimerRef.current);
          }
          newAttendeeTimerRef.current = setTimeout(() => {
            setNewAttendeeId(eventId, null);
            newAttendeeTimerRef.current = null;
          }, 3000);
        }
        latestTopIdRef.current = newestId;
        setAttendance(eventId, records);
      } catch {
        if (active && isInitial) setAttendance(eventId, []);
      }
    };

    void loadRecords(true);

    // Ở chế độ trình chiếu không đăng nhập (presenterToken), đồng bộ định kỳ 3 giây/lần
    // vì RLS bảng attendance_records chặn anon subscribe trực tiếp.
    const pollInterval =
      presenterToken && event?.status !== 'closed'
        ? window.setInterval(() => {
            void loadRecords(false);
          }, 3000)
        : null;

    return () => {
      active = false;
      if (pollInterval !== null) {
        window.clearInterval(pollInterval);
      }
      if (newAttendeeTimerRef.current !== null) {
        clearTimeout(newAttendeeTimerRef.current);
        newAttendeeTimerRef.current = null;
      }
    };
  }, [event?.status, eventId, presenterToken, setAttendance, setNewAttendeeId]);

  // Hook lắng nghe dữ liệu theo thời gian thực (real-time) từ database
  useRealtimeTable<AttendanceRecord & Record<string, unknown>>(
    'attendance_records',       // Tên bảng cần lắng nghe
    `event_id=eq.${eventId}`,   // Điều kiện: chỉ lắng nghe dữ liệu của sự kiện hiện tại
    'INSERT',                   // Chỉ bắt sự kiện thêm mới (INSERT)
    (payload) => {
      // Khi có người mới điểm danh thành công
      if (payload.new && 'id' in payload.new) {
        const newRecord = payload.new as AttendanceRecord;
        
        // Cập nhật lại danh sách điểm danh (logs)
        if (!eventId) return;
        addAttendee(eventId, newRecord);

        // Đánh dấu ID người mới điểm danh và tự động xóa đánh dấu sau 3 giây
        setNewAttendeeId(eventId, newRecord.id);
        if (newAttendeeTimerRef.current !== null) {
          clearTimeout(newAttendeeTimerRef.current);
        }
        newAttendeeTimerRef.current = setTimeout(() => {
          setNewAttendeeId(eventId, null);
          newAttendeeTimerRef.current = null;
        }, 3000);
      }
    }
  );

  const openExportModal = useAttendanceExportStore((state) => state.openModal);

  // Mở hộp thoại tùy chỉnh cột và xuất danh sách điểm danh ra file Excel (.xlsx / .csv)
  const handleExportExcel = useCallback(() => {
    if (logs.length === 0) {
      alert('Chưa có dữ liệu người tham gia điểm danh để xuất.');
      return;
    }

    openExportModal(getDefaultSelectedColumnIds(event));
  }, [event, logs.length, openExportModal]);

  // Trả ra các state và hàm để component gọi hook này có thể sử dụng được
  return { logs, newAttendeeId, handleExportExcel };
}