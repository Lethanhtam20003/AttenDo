
import Image from 'next/image';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function AuthPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-white px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image
            src="/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png"
            alt="Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn"
            width={72}
            height={72}
            className="mx-auto mb-3 h-16 w-16 rounded-full object-contain"
          />
          <p className="text-sm font-bold text-slate-900">
            Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn
          </p>
          <p className="mt-1 text-xs text-slate-500">Cổng quản lý dịch vụ số</p>
        </div>
        <Suspense fallback={<div className="h-72 rounded-2xl bg-white" aria-hidden="true" />}>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
