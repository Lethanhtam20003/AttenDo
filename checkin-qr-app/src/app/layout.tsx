import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ConditionalLayoutChrome from '@/components/layout/ConditionalLayoutChrome';
import { Analytics } from "@vercel/analytics/next"
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hệ thống điểm danh | Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn',
  description: 'Hệ thống điểm danh do Trung tâm Cung ứng Dịch vụ công xã Xuân Sơn xây dựng.',
  icons: {
    icon: '/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png',
    shortcut: '/logo/trung-tam-cung-ung-dich-vu-cong-xa-xuan-son.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} flex min-h-screen flex-col bg-slate-50 lg:flex-row`}>
        <Analytics />
        <Suspense fallback={null}>
          <ConditionalLayoutChrome>
            <Suspense
              fallback={
                <>
                  <div
                    className="h-14 border-b border-slate-200/80 bg-white/90 lg:hidden"
                    aria-hidden="true"
                  />
                  <div
                    className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-200/80 lg:bg-white"
                    aria-hidden="true"
                  />
                </>
              }
            >
              <Header />
            </Suspense>
          </ConditionalLayoutChrome>
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex flex-1 flex-col">{children}</main>
          <Suspense fallback={null}>
            <ConditionalLayoutChrome hideOnLive>
              <Footer />
            </ConditionalLayoutChrome>
          </Suspense>
        </div>
      </body>
    </html>
  );
}
