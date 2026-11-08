import type { AttendanceRecord, Event } from '@/types/database';

export type ExportFormat = 'xlsx' | 'csv';
export type ExportColumnGroup = 'basic' | 'technical';

export interface ExportColumnDefinition {
  id: string;
  label: string;
  group: ExportColumnGroup;
  defaultSelected: boolean;
  align?: 'left' | 'center';
  getValue: (record: AttendanceRecord, index: number) => string;
}

export interface ExportAttendanceOptions {
  event: Event | null | undefined;
  attendees: AttendanceRecord[];
  selectedColumnIds: string[];
  format: ExportFormat;
  includeReportHeader: boolean;
}

function formatDateTimeVi(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function getAvailableExportColumns(
  event: Event | null | undefined
): ExportColumnDefinition[] {
  const customFields =
    event?.custom_fields?.filter((field) => field.key !== 'full_name') ?? [];
  const hasGpsRequirement =
    event?.module_settings?.require_location === true ||
    (event?.location_lat !== null && event?.location_lat !== undefined);

  const columns: ExportColumnDefinition[] = [
    {
      id: 'stt',
      label: 'STT',
      group: 'basic',
      defaultSelected: true,
      align: 'center',
      getValue: (_record, index) => String(index + 1),
    },
    {
      id: 'full_name',
      label: 'Họ và tên',
      group: 'basic',
      defaultSelected: true,
      align: 'left',
      getValue: (record) => record.full_name ?? '',
    },
    ...customFields.map((field): ExportColumnDefinition => ({
      id: `custom:${field.key}`,
      label: field.label,
      group: 'basic',
      defaultSelected: true,
      align: field.type === 'tel' || field.type === 'number' ? 'center' : 'left',
      getValue: (record) => String(record.custom_data?.[field.key] ?? ''),
    })),
    {
      id: 'checked_in_at',
      label: 'Thời gian điểm danh',
      group: 'basic',
      defaultSelected: true,
      align: 'center',
      getValue: (record) => formatDateTimeVi(record.checked_in_at),
    },
    {
      id: 'distance_meters',
      label: 'Khoảng cách GPS (m)',
      group: 'technical',
      defaultSelected: hasGpsRequirement,
      align: 'center',
      getValue: (record) =>
        record.distance_meters !== null && record.distance_meters !== undefined
          ? `${record.distance_meters} m`
          : hasGpsRequirement
            ? 'Hợp lệ'
            : '—',
    },
    {
      id: 'user_lat',
      label: 'Vĩ độ (Lat)',
      group: 'technical',
      defaultSelected: false,
      align: 'center',
      getValue: (record) =>
        record.user_lat !== null && record.user_lat !== undefined
          ? String(record.user_lat)
          : '',
    },
    {
      id: 'user_lng',
      label: 'Kinh độ (Lng)',
      group: 'technical',
      defaultSelected: false,
      align: 'center',
      getValue: (record) =>
        record.user_lng !== null && record.user_lng !== undefined
          ? String(record.user_lng)
          : '',
    },
    {
      id: 'device_id',
      label: 'Mã thiết bị',
      group: 'technical',
      defaultSelected: false,
      align: 'left',
      getValue: (record) => record.device_id ?? '',
    },
  ];

  return columns;
}

export function getDefaultSelectedColumnIds(
  event: Event | null | undefined
): string[] {
  return getAvailableExportColumns(event)
    .filter((column) => column.defaultSelected)
    .map((column) => column.id);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function getExcelColumnName(colIndexOneBased: number): string {
  let num = colIndexOneBased;
  let letters = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters;
}

// Bảng tra CRC32 tiêu chuẩn để đóng gói tệp ZIP (.xlsx)
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipArchive(
  files: Array<{ path: string; content: string }>
): Uint8Array {
  const encoder = new TextEncoder();
  const encodedFiles = files.map((file) => {
    const pathBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.content);
    const crc = computeCrc32(dataBytes);
    return { pathBytes, dataBytes, crc };
  });

  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const entry of encodedFiles) {
    const { pathBytes, dataBytes, crc } = entry;
    const localHeader = new Uint8Array(30 + pathBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true); // Local file header signature
    localView.setUint16(4, 20, true); // Version needed to extract (2.0)
    localView.setUint16(6, 0x0800, true); // UTF-8 filename flag
    localView.setUint16(8, 0, true); // Compression method: 0 (Stored)
    localView.setUint16(10, 0, true); // File last modification time
    localView.setUint16(12, 0x5621, true); // File last modification date
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, pathBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(pathBytes, 30);

    localHeaders.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + pathBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true); // Central directory signature
    centralView.setUint16(4, 20, true); // Version made by
    centralView.setUint16(6, 20, true); // Version needed
    centralView.setUint16(8, 0x0800, true); // UTF-8 flag
    centralView.setUint16(10, 0, true); // Compression: Stored
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0x5621, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, pathBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(pathBytes, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirectorySize = centralHeaders.reduce(
    (sum, chunk) => sum + chunk.length,
    0
  );
  const endOfCentralDir = new Uint8Array(22);
  const endView = new DataView(endOfCentralDir.buffer);
  endView.setUint32(0, 0x06054b50, true); // End of central directory signature
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, encodedFiles.length, true);
  endView.setUint16(10, encodedFiles.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  const totalSize = offset + centralDirectorySize + endOfCentralDir.length;
  const output = new Uint8Array(totalSize);
  let cursor = 0;

  for (const chunk of localHeaders) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  for (const chunk of centralHeaders) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  output.set(endOfCentralDir, cursor);

  return output;
}

function buildXlsxBytes(
  event: Event | null | undefined,
  attendees: AttendanceRecord[],
  columns: ExportColumnDefinition[],
  includeReportHeader: boolean
): Uint8Array {
  const columnCount = Math.max(1, columns.length);
  const lastColumnLetter = getExcelColumnName(columnCount);
  const exportedAt = formatDateTimeVi(new Date().toISOString());
  const eventTitle = event?.title || 'Phiên điểm danh';
  const startsAtText = event?.starts_at ? formatDateTimeVi(event.starts_at) : '—';

  // Tính toán độ rộng từng cột tự động dựa trên tiêu đề và dữ liệu
  const colWidths = columns.map((column) => {
    let maxChars = column.label.length + 4;
    attendees.forEach((record, index) => {
      const value = column.getValue(record, index);
      if (value.length + 3 > maxChars) {
        maxChars = value.length + 3;
      }
    });
    if (column.id === 'stt') return Math.max(8, Math.min(12, maxChars));
    return Math.max(14, Math.min(48, maxChars));
  });

  const colsXml = `<cols>${colWidths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
    )
    .join('')}</cols>`;

  const rowsXml: string[] = [];
  const mergeRefs: string[] = [];
  let currentRow = 1;

  if (includeReportHeader) {
    // Dòng 1: Tên đơn vị
    const row1Cells = columns.map((_, idx) => {
      const ref = `${getExcelColumnName(idx + 1)}${currentRow}`;
      if (idx === 0) {
        return `<c r="${ref}" s="1" t="inlineStr"><is><t>${escapeXml(
          'TRUNG TÂM CUNG ỨNG DỊCH VỤ CÔNG XÃ XUÂN SƠN'
        )}</t></is></c>`;
      }
      return `<c r="${ref}" s="1"/>`;
    });
    rowsXml.push(`<row r="${currentRow}" ht="22" customHeight="1">${row1Cells.join('')}</row>`);
    if (columnCount > 1) {
      mergeRefs.push(`A${currentRow}:${lastColumnLetter}${currentRow}`);
    }
    currentRow++;

    // Dòng 2: Tên báo cáo & sự kiện
    const row2Cells = columns.map((_, idx) => {
      const ref = `${getExcelColumnName(idx + 1)}${currentRow}`;
      if (idx === 0) {
        return `<c r="${ref}" s="2" t="inlineStr"><is><t>${escapeXml(
          `DANH SÁCH ĐIỂM DANH — ${eventTitle.toUpperCase()}`
        )}</t></is></c>`;
      }
      return `<c r="${ref}" s="2"/>`;
    });
    rowsXml.push(`<row r="${currentRow}" ht="26" customHeight="1">${row2Cells.join('')}</row>`);
    if (columnCount > 1) {
      mergeRefs.push(`A${currentRow}:${lastColumnLetter}${currentRow}`);
    }
    currentRow++;

    // Dòng 3: Thông tin chi tiết phiên
    const metaSummary = `Thời gian bắt đầu: ${startsAtText}   |   Tổng số có mặt: ${attendees.length} người   |   Thời điểm xuất: ${exportedAt}`;
    const row3Cells = columns.map((_, idx) => {
      const ref = `${getExcelColumnName(idx + 1)}${currentRow}`;
      if (idx === 0) {
        return `<c r="${ref}" s="3" t="inlineStr"><is><t>${escapeXml(
          metaSummary
        )}</t></is></c>`;
      }
      return `<c r="${ref}" s="3"/>`;
    });
    rowsXml.push(`<row r="${currentRow}" ht="20" customHeight="1">${row3Cells.join('')}</row>`);
    if (columnCount > 1) {
      mergeRefs.push(`A${currentRow}:${lastColumnLetter}${currentRow}`);
    }
    currentRow++;

    // Dòng 4: Dòng trống ngăn cách
    rowsXml.push(`<row r="${currentRow}" ht="10" customHeight="1"/>`);
    currentRow++;
  }

  // Dòng Tiêu đề cột bảng
  const headerCells = columns.map((column, idx) => {
    const ref = `${getExcelColumnName(idx + 1)}${currentRow}`;
    return `<c r="${ref}" s="4" t="inlineStr"><is><t>${escapeXml(
      column.label
    )}</t></is></c>`;
  });
  rowsXml.push(`<row r="${currentRow}" ht="26" customHeight="1">${headerCells.join('')}</row>`);
  currentRow++;

  // Các dòng dữ liệu người tham dự
  attendees.forEach((record, recordIndex) => {
    const dataCells = columns.map((column, colIdx) => {
      const ref = `${getExcelColumnName(colIdx + 1)}${currentRow}`;
      const value = column.getValue(record, recordIndex);
      const styleIndex = column.align === 'center' ? 6 : 5;
      return `<c r="${ref}" s="${styleIndex}" t="inlineStr"><is><t>${escapeXml(
        value
      )}</t></is></c>`;
    });
    rowsXml.push(`<row r="${currentRow}" ht="21" customHeight="1">${dataCells.join('')}</row>`);
    currentRow++;
  });

  const mergeCellsXml =
    mergeRefs.length > 0
      ? `<mergeCells count="${mergeRefs.length}">${mergeRefs
          .map((ref) => `<mergeCell ref="${ref}"/>`)
          .join('')}</mergeCells>`
      : '';

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0" showGridLines="1"/>
  </sheetViews>
  ${colsXml}
  <sheetData>
    ${rowsXml.join('\n    ')}
  </sheetData>
  ${mergeCellsXml}
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="6">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF0B3B82"/><name val="Arial"/></font>
    <font><b/><sz val="14"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><sz val="10"/><color rgb="FF475569"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Arial"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B3B82"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <xf numFmtId="49" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <xf numFmtId="49" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <xf numFmtId="49" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="49" fontId="5" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="49" fontId="5" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Danh sach diem danh" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  return createZipArchive([
    { path: '[Content_Types].xml', content: contentTypesXml },
    { path: '_rels/.rels', content: rootRelsXml },
    { path: 'xl/workbook.xml', content: workbookXml },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { path: 'xl/styles.xml', content: stylesXml },
    { path: 'xl/worksheets/sheet1.xml', content: sheetXml },
  ]);
}

function escapeCsvCell(value: string): string {
  const normalized = String(value ?? '');
  // Giữ nguyên số 0 đứng đầu cho số điện thoại khi mở trực tiếp bằng Excel
  if (/^0\d{7,14}$/.test(normalized.trim())) {
    return `="${normalized.trim()}"`;
  }
  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildCsvBlob(
  event: Event | null | undefined,
  attendees: AttendanceRecord[],
  columns: ExportColumnDefinition[],
  includeReportHeader: boolean
): Blob {
  const lines: string[] = [];
  const exportedAt = formatDateTimeVi(new Date().toISOString());
  const eventTitle = event?.title || 'Phiên điểm danh';
  const startsAtText = event?.starts_at ? formatDateTimeVi(event.starts_at) : '—';

  if (includeReportHeader) {
    lines.push(escapeCsvCell('TRUNG TÂM CUNG ỨNG DỊCH VỤ CÔNG XÃ XUÂN SƠN'));
    lines.push(escapeCsvCell(`DANH SÁCH ĐIỂM DANH: ${eventTitle}`));
    lines.push(
      escapeCsvCell(
        `Thời gian bắt đầu: ${startsAtText} | Tổng số có mặt: ${attendees.length} người | Thời điểm xuất: ${exportedAt}`
      )
    );
    lines.push('');
  }

  lines.push(columns.map((column) => escapeCsvCell(column.label)).join(','));
  attendees.forEach((record, index) => {
    lines.push(
      columns
        .map((column) => escapeCsvCell(column.getValue(record, index)))
        .join(',')
    );
  });

  return new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
}

export function exportAttendanceData({
  event,
  attendees,
  selectedColumnIds,
  format,
  includeReportHeader,
}: ExportAttendanceOptions): void {
  const allColumns = getAvailableExportColumns(event);
  const activeColumns = allColumns.filter((column) =>
    selectedColumnIds.includes(column.id)
  );
  const columnsToExport =
    activeColumns.length > 0 ? activeColumns : allColumns.filter((c) => c.defaultSelected);

  const cleanTitle = (event?.title || 'diem_danh')
    .trim()
    .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const localDate = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  let blob: Blob;
  let extension: ExportFormat;

  if (format === 'xlsx') {
    const xlsxBytes = buildXlsxBytes(
      event,
      attendees,
      columnsToExport,
      includeReportHeader
    );
    blob = new Blob([xlsxBytes.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    extension = 'xlsx';
  } else {
    blob = buildCsvBlob(
      event,
      attendees,
      columnsToExport,
      includeReportHeader
    );
    extension = 'csv';
  }

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `diem_danh_${cleanTitle || 'phien'}_${localDate}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}
