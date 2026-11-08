import { create } from 'zustand';
import type { ExportFormat } from '@/lib/export/attendance-export';

interface AttendanceExportState {
  isOpen: boolean;
  format: ExportFormat;
  includeReportHeader: boolean;
  selectedColumnIds: string[];
  openModal: (defaultColumnIds: string[]) => void;
  closeModal: () => void;
  setFormat: (format: ExportFormat) => void;
  setIncludeReportHeader: (include: boolean) => void;
  setSelectedColumnIds: (columnIds: string[]) => void;
  toggleColumnId: (columnId: string) => void;
}

export const useAttendanceExportStore = create<AttendanceExportState>((set) => ({
  isOpen: false,
  format: 'xlsx',
  includeReportHeader: true,
  selectedColumnIds: [],
  openModal: (defaultColumnIds) =>
    set({
      isOpen: true,
      format: 'xlsx',
      includeReportHeader: true,
      selectedColumnIds: defaultColumnIds,
    }),
  closeModal: () => set({ isOpen: false }),
  setFormat: (format) => set({ format }),
  setIncludeReportHeader: (includeReportHeader) => set({ includeReportHeader }),
  setSelectedColumnIds: (selectedColumnIds) => set({ selectedColumnIds }),
  toggleColumnId: (columnId) =>
    set((state) => {
      const exists = state.selectedColumnIds.includes(columnId);
      if (exists) {
        // Giữ tối thiểu 1 cột được chọn
        if (state.selectedColumnIds.length <= 1) return {};
        return {
          selectedColumnIds: state.selectedColumnIds.filter((id) => id !== columnId),
        };
      }
      return {
        selectedColumnIds: [...state.selectedColumnIds, columnId],
      };
    }),
}));
