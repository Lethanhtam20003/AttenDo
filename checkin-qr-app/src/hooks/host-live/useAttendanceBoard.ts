// Chỉ định đây là Client Component trong Next.js (code chạy ở phía trình duyệt, không phải server)
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getAttendanceList } from '@/actions/check-in';
import { useRealtimeTable } from '@/hooks/host-live/useRealtimeTable';
import type { AttendanceRecord, Event } from '@/types/database';
import { useHostLiveStore } from '@/stores/host-live-store';

const EMPTY_LOGS: AttendanceRecord[] = [];

// Custom hook quản lý danh sách điểm danh của một sự kiện
export function useAttendanceBoard(eventId?: string, event?: Event | null) {
  const activeEventId = useHostLiveStore((state) => state.eventId);
  const storedLogs = useHostLiveStore((state) => state.logs);
  const storedNewAttendeeId = useHostLiveStore((state) => state.newAttendeeId);
  const setAttendance = useHostLiveStore((state) => state.setAttendance);
  const addAttendee = useHostLiveStore((state) => state.addAttendee);
  const setNewAttendeeId = useHostLiveStore((state) => state.setNewAttendeeId);
  const newAttendeeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logs = activeEventId === eventId ? storedLogs : EMPTY_LOGS;
  const newAttendeeId = activeEventId === eventId ? storedNewAttendeeId : null;

  // Hook useEffect: Chạy mỗi khi eventId thay đổi.
  // Nhiệm vụ: Lấy danh sách điểm danh ban đầu từ server khi vừa vào trang.
  useEffect(() => {
    if (!eventId) return;
    let active = true;
    getAttendanceList(eventId)
      .then((records) => {
        if (active) setAttendance(eventId, records);
      })
      .catch(() => {
        if (active) setAttendance(eventId, []);
      });
    return () => {
      active = false;
      if (newAttendeeTimerRef.current !== null) {
        clearTimeout(newAttendeeTimerRef.current);
        newAttendeeTimerRef.current = null;
      }
    };
  }, [eventId, setAttendance]);

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

  // Hàm xử lý xuất danh sách điểm danh ra file Excel (.csv)
  // Dùng useCallback để tránh render lại hàm này không cần thiết (tối ưu hiệu suất)
  const handleExportExcel = useCallback(() => {
    // Nếu chưa có ai điểm danh thì báo lỗi và dừng lại
    if (logs.length === 0) {
      alert('Chưa có dữ liệu người tham gia điểm danh để xuất.');
      return;
    }

    // Lấy ra các trường thông tin tùy chỉnh (custom fields) của sự kiện, loại bỏ trường 'full_name' vì đã có sẵn
    const customFields = event?.custom_fields?.filter((f) => f.key !== 'full_name') ?? [];

    // Tạo mảng chứa các tiêu đề cột cho file Excel
    const headers = [
      'STT',
      'Họ và tên',
      ...customFields.map((f) => f.label), // Thêm các cột custom field
      'Thời gian điểm danh',
      'Khoảng cách GPS (m)',
      'Tọa độ Vĩ độ (Lat)',
      'Tọa độ Kinh độ (Lng)',
      'Mã thiết bị',
    ];

    // Hàm phụ: Xử lý chuỗi để không bị lỗi định dạng khi xuất CSV (ví dụ: chuỗi có chứa dấu phẩy hoặc ngoặc kép)
    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    // Chuẩn bị dữ liệu từng hàng (row) tương ứng với từng người tham gia
    const rows = logs.map((r, idx) => [
      escapeCsv(idx + 1), // Số thứ tự
      escapeCsv(r.full_name),
      ...customFields.map((f) => escapeCsv(r.custom_data?.[f.key] ?? '')), // Dữ liệu của các trường tùy chỉnh
      escapeCsv(new Date(r.checked_in_at).toLocaleString('vi-VN')), // Format thời gian theo chuẩn Việt Nam
      escapeCsv(r.distance_meters !== null ? `${r.distance_meters}m` : 'Hợp lệ'), // Xử lý hiển thị khoảng cách
      escapeCsv(r.user_lat ?? ''),
      escapeCsv(r.user_lng ?? ''),
      escapeCsv(r.device_id ?? ''),
    ]);

    // Gộp tiêu đề và các hàng dữ liệu lại thành một chuỗi duy nhất, cách nhau bởi dấu phẩy và xuống dòng
    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    // Tạo đối tượng Blob từ chuỗi CSV
    // \uFEFF là Byte Order Mark (BOM) giúp Excel nhận diện đúng font chữ tiếng Việt (UTF-8)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Tạo link ảo để tải file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Xử lý làm sạch tên file, loại bỏ các ký tự đặc biệt
    const cleanTitle = (event?.title || 'diem_danh').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    const localDate = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    
    // Đặt tên file tự động theo chuẩn múi giờ Việt Nam tránh lệch ngày trước 07:00 sáng
    a.download = `diem_danh_${cleanTitle}_${localDate}.csv`;
    
    // Kích hoạt việc tải xuống
    a.click();
    
    // Thu hồi link ảo để giải phóng bộ nhớ
    URL.revokeObjectURL(url);
  }, [event, logs]); // Hàm này sẽ cập nhật lại nếu event hoặc danh sách logs thay đổi

  // Trả ra các state và hàm để component gọi hook này có thể sử dụng được
  return { logs, newAttendeeId, handleExportExcel };
}