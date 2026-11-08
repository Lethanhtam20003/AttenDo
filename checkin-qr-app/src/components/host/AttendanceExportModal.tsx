'use client';

import { useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { AttendanceRecord, Event } from '@/types/database';
import {
  exportAttendanceData,
  getAvailableExportColumns,
  getDefaultSelectedColumnIds,
} from '@/lib/export/attendance-export';
import { useAttendanceExportStore } from '@/stores/attendance-export-store';

interface AttendanceExportModalProps {
  event: Event | null | undefined;
  attendees: AttendanceRecord[];
}

export function AttendanceExportModal({
  event,
  attendees,
}: AttendanceExportModalProps) {
  const isOpen = useAttendanceExportStore((state) => state.isOpen);
  const format = useAttendanceExportStore((state) => state.format);
  const includeReportHeader = useAttendanceExportStore(
    (state) => state.includeReportHeader
  );
  const selectedColumnIds = useAttendanceExportStore(
    (state) => state.selectedColumnIds
  );
  const closeModal = useAttendanceExportStore((state) => state.closeModal);
  const setFormat = useAttendanceExportStore((state) => state.setFormat);
  const setIncludeReportHeader = useAttendanceExportStore(
    (state) => state.setIncludeReportHeader
  );
  const setSelectedColumnIds = useAttendanceExportStore(
    (state) => state.setSelectedColumnIds
  );
  const toggleColumnId = useAttendanceExportStore(
    (state) => state.toggleColumnId
  );

  const availableColumns = useMemo(
    () => getAvailableExportColumns(event),
    [event]
  );

  const basicColumns = useMemo(
    () => availableColumns.filter((col) => col.group === 'basic'),
    [availableColumns]
  );
  const technicalColumns = useMemo(
    () => availableColumns.filter((col) => col.group === 'technical'),
    [availableColumns]
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === 'Escape') {
        closeModal();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeModal, isOpen]);

  if (!isOpen) return null;

  function handleSelectAll() {
    setSelectedColumnIds(availableColumns.map((col) => col.id));
  }

  function handleSelectDefault() {
    setSelectedColumnIds(getDefaultSelectedColumnIds(event));
  }

  function handleConfirmExport() {
    exportAttendanceData({
      event,
      attendees,
      selectedColumnIds,
      format,
      includeReportHeader,
    });
    closeModal();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) {
          closeModal();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-attendance-modal-title"
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-gold" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-navy">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="export-attendance-modal-title"
                className="text-base font-bold text-brand-navy"
              >
                Tùy chỉnh xuất danh sách điểm danh
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {event?.title ?? 'Phiên điểm danh'} •{' '}
                <span className="font-semibold text-brand-green">
                  {attendees.length} người tham dự
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng hộp thoại xuất file"
            onClick={closeModal}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* 1. Chọn định dạng tệp */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              1. Định dạng tệp tải xuống
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                aria-pressed={format === 'xlsx'}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  format === 'xlsx'
                    ? 'border-brand-navy bg-brand-blue/8 ring-1 ring-brand-navy/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    format === 'xlsx'
                      ? 'bg-brand-navy text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    Excel chuẩn (.xlsx)
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    Có kẻ khung bảng, tự căn độ rộng cột &amp; giữ số 0 đầu SĐT
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                aria-pressed={format === 'csv'}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  format === 'csv'
                    ? 'border-brand-navy bg-brand-blue/8 ring-1 ring-brand-navy/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    format === 'csv'
                      ? 'bg-brand-navy text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    Tệp CSV (.csv)
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    Văn bản UTF-8 phân cách bằng dấu phẩy, nhẹ &amp; phổ thông
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Tùy chọn phần mở đầu báo cáo */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 transition hover:bg-slate-100/70">
            <input
              type="checkbox"
              checked={includeReportHeader}
              onChange={(changeEvent) =>
                setIncludeReportHeader(changeEvent.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-blue/20"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800">
                Thêm tiêu đề báo cáo hành chính ở đầu bảng
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Hiển thị tên đơn vị (Trung tâm Cung ứng DVC xã Xuân Sơn), tên sự kiện, thời gian bắt đầu và tổng số người có mặt.
              </p>
            </div>
          </label>

          {/* 3. Chọn các cột muốn xuất */}
          <div>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                2. Chọn các cột muốn xuất ({selectedColumnIds.length}/
                {availableColumns.length})
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectDefault}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-brand-navy"
                >
                  <RotateCcw className="h-3 w-3" />
                  Mặc định
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-brand-navy"
                >
                  <CheckSquare className="h-3 w-3" />
                  Chọn tất cả
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Nhóm cơ bản */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="mb-2 text-[11px] font-semibold text-brand-navy">
                  Thông tin người tham dự
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {basicColumns.map((column) => {
                    const checked = selectedColumnIds.includes(column.id);
                    return (
                      <label
                        key={column.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition ${
                          checked
                            ? 'border-brand-blue/30 bg-brand-blue/5 font-medium text-slate-900'
                            : 'border-slate-200/70 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumnId(column.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-navy focus:ring-brand-blue/20"
                        />
                        <span className="truncate">{column.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Nhóm kỹ thuật & vị trí */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                <p className="mb-2 text-[11px] font-semibold text-slate-600">
                  Dữ liệu xác thực vị trí &amp; kỹ thuật (Tùy chọn)
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {technicalColumns.map((column) => {
                    const checked = selectedColumnIds.includes(column.id);
                    return (
                      <label
                        key={column.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition ${
                          checked
                            ? 'border-brand-blue/30 bg-brand-blue/5 font-medium text-slate-900'
                            : 'border-slate-200/70 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumnId(column.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-navy focus:ring-brand-blue/20"
                        />
                        <span className="truncate">{column.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Sẽ xuất <strong className="text-slate-800">{attendees.length}</strong> dòng ×{' '}
            <strong className="text-slate-800">{selectedColumnIds.length}</strong> cột
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmExport}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-blue"
            >
              <Download className="h-3.5 w-3.5" />
              Tải xuống .{format}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
