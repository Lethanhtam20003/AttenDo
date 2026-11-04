'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { login } from '@/actions/auth';

const initialState = { error: null };

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('next');
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div id="login" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Đăng Nhập Hệ Thống</h3>
        <p className="text-xs text-slate-500 mt-1">Đăng nhập bằng tài khoản được cấp bởi quản trị viên.</p>
      </div>

      <form action={formAction} className="space-y-4">
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={isPending}
              placeholder="admin@attendo.vn"
              className="min-h-12 w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 text-base text-slate-800 transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 sm:min-h-11 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Mật khẩu
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              placeholder="••••••••"
              className="min-h-12 w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-3.5 text-base text-slate-800 transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 sm:min-h-11 sm:text-sm"
            />
          </div>
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          <span>{isPending ? 'Đang đăng nhập...' : 'Vào bảng điều khiển'}</span>
          {!isPending && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};