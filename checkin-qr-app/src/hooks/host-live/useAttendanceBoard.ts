'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAttendanceList } from '@/actions/checkin';
import { useRealtimeTable } from '@/hooks/host-live/useRealtimeTable';
import type { AttendanceRecord, Event } from '@/types/database';

export function useAttendanceBoard(eventId?: string, event?: Event | null) {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [newAttendeeId, setNewAttendeeId] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    getAttendanceList(eventId).then(setLogs);
  }, [eventId]);

  useRealtimeTable<AttendanceRecord & Record<string, unknown>>(
    'attendance_records',
    `event_id=eq.${eventId}`,
    'INSERT',
    (payload) => {
      if (payload.new && 'id' in payload.new) {
        const newRecord = payload.new as AttendanceRecord;
        setLogs((prev) => {
          if (prev.some((r) => r.id === newRecord.id)) return prev;
          return [newRecord, ...prev];
        });

        setNewAttendeeId(newRecord.id);
        setTimeout(() => setNewAttendeeId(null), 3000);
      }
    }
  );

  const handleExportExcel = useCallback(() => {
    if (logs.length === 0) {
      alert('Chưa có dữ liệu người tham gia điểm danh để xuất.');
      return;
    }

    const customFields = event?.custom_fields?.filter((f) => f.key !== 'full_name') ?? [];

    const headers = [
      'STT',
      'Họ và tên',
      ...customFields.map((f) => f.label),
      'Thời gian điểm danh',
      'Khoảng cách GPS (m)',
      'Tọa độ Vĩ độ (Lat)',
      'Tọa độ Kinh độ (Lng)',
      'Mã thiết bị',
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = logs.map((r, idx) => [
      escapeCsv(idx + 1),
      escapeCsv(r.full_name),
      ...customFields.map((f) => escapeCsv(r.custom_data?.[f.key] ?? '')),
      escapeCsv(new Date(r.checked_in_at).toLocaleString('vi-VN')),
      escapeCsv(r.distance_meters !== null ? `${r.distance_meters}m` : 'Hợp lệ'),
      escapeCsv(r.user_lat ?? ''),
      escapeCsv(r.user_lng ?? ''),
      escapeCsv(r.device_id ?? ''),
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = (event?.title || 'diem_danh').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    a.download = `diem_danh_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [event, logs]);

  return { logs, newAttendeeId, handleExportExcel };
}
