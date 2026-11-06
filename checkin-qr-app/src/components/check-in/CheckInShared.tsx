'use client';

import Image from 'next/image';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import type { CheckInRequirements } from '@/lib/check-in/solution';
import type { CustomFieldConfig } from '@/types/database';
import type { useCheckInForm } from '@/hooks/check-in/useCheckInForm';

export type CheckInFormState = ReturnType<typeof useCheckInForm>;

export function CheckInHeader({ title }: { title: string }) {
  return (
    <header className="pb-3 pt-1 text-center">
      <Image
        src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
        alt="Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
        width={44}
        height={44}
        className="mx-auto mb-2 h-11 w-11 rounded-full object-contain"
      />
      <p className="text-[11px] font-semibold text-blue-800">Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn</p>
      <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Điểm danh</h1>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-500">{title}</p>
    </header>
  );
}

export function CheckInLoadingState({ message = 'Đang tải thông tin phiên điểm danh...' }: { message?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 p-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </main>
  );
}

export function CheckInUnavailableState({
  closed = false,
  invalidLink = false,
}: {
  closed?: boolean;
  invalidLink?: boolean;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-4">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h2 className="text-base font-bold text-slate-900">
          {invalidLink ? 'Liên kết điểm danh không hợp lệ' : closed ? 'Phiên điểm danh đã kết thúc' : 'Phiên không tồn tại'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {invalidLink
            ? 'Vui lòng quét mã QR mới đang hiển thị trên màn hình Host để mở biểu mẫu điểm danh.'
            : closed
            ? 'Host đã đóng phiên hoặc phiên đã hết thời gian tồn tại. Bạn không thể gửi thêm lượt điểm danh.'
            : 'Mã sự kiện không đúng hoặc phiên điểm danh đã kết thúc.'}
        </p>
      </div>
    </main>
  );
}

export function CheckInSuccessState({
  form,
  requirements,
}: {
  form: CheckInFormState;
  requirements: CheckInRequirements;
}) {
  const methods = [
    requirements.requireLocation ? 'GPS' : null,
    requirements.dynamicQr
      ? 'QR động'
      : requirements.requirePin || !requirements.requireLocation
        ? 'QR'
        : null,
    requirements.requirePin ? 'PIN' : null,
  ].filter((method): method is string => method !== null);
  const methodLabel = methods.join(' và ');

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm">
        <div className="mb-4 border-b border-slate-100 pb-4">
          <Image
            src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
            alt="Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
            width={44}
            height={44}
            className="mx-auto mb-2 h-11 w-11 rounded-full object-contain"
          />
          <p className="text-[11px] font-semibold text-blue-800">
            Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
          </p>
        </div>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {form.checkedInName
            ? `${form.checkedInName}, bạn đã điểm danh thành công!`
            : 'Bạn đã điểm danh thành công!'}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Thông tin và thời gian điểm danh đã được ghi nhận sau khi xác minh {methodLabel}.
        </p>

        {requirements.requireLocation && form.distanceResult !== null && (
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left font-mono text-xs text-slate-600">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Khoảng cách:</span>
              <span className="text-slate-800">{form.distanceResult}m từ hội trường</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export function AttendeeFields({
  fields,
  values,
  onChange,
}: {
  fields: CustomFieldConfig[];
  values: Record<string, string>;
  onChange: CheckInFormState['setFieldValues'];
}) {
  return (
    <div className="space-y-3 pt-1">
      {fields.map((field) => (
        <div key={field.key}>
          <label htmlFor={`attendee-${field.key}`} className="mb-1 block text-sm font-semibold text-slate-700 sm:text-xs">
            {field.label}
            {field.required && <span className="text-rose-500"> *</span>}
          </label>
          {field.type === 'select' ? (
            <select
              id={`attendee-${field.key}`}
              required={field.required}
              value={values[field.key] ?? ''}
              onChange={(event) => onChange((previous) => ({ ...previous, [field.key]: event.target.value }))}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 sm:min-h-11 sm:text-sm"
            >
              <option value="">Chọn {field.label.toLowerCase()}...</option>
              {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input
              id={`attendee-${field.key}`}
              type={field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
              inputMode={field.type === 'tel' ? 'numeric' : undefined}
              pattern={field.type === 'tel' ? '[0-9]*' : undefined}
              required={field.required}
              value={values[field.key] ?? ''}
              onChange={(event) => {
                const value = field.type === 'tel'
                  ? event.target.value.replace(/\D/g, '')
                  : event.target.value;
                onChange((previous) => ({ ...previous, [field.key]: value }));
              }}
              placeholder={`Nhập ${field.label.toLowerCase()}...`}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 sm:min-h-11 sm:text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function CheckInSubmitState({
  form,
  disabled,
  label,
}: {
  form: CheckInFormState;
  disabled: boolean;
  label: string;
}) {
  return (
    <>
      {form.submitError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {form.submitError}
        </div>
      )}
      <button
        type="submit"
        disabled={disabled || form.isSubmitting}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {form.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {form.isSubmitting ? 'Đang gửi điểm danh...' : label}
      </button>
    </>
  );
}
