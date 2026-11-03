import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ConditionalLayoutChrome from '@/components/layout/ConditionalLayoutChrome';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Trang web của tôi',
  description: 'Mô tả chung cho SEO',
};

export default function RootLayout({ children } : LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Suspense fallback={null}>
          <ConditionalLayoutChrome
          >
            <Suspense
              fallback={
                <div
                  className="h-16 border-b border-slate-200/80 bg-white/80"
                  aria-hidden="true"
                />
              }
            >
              <Header />
            </Suspense>
          </ConditionalLayoutChrome>
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={null}>
          <ConditionalLayoutChrome>
            <Footer />
          </ConditionalLayoutChrome>
        </Suspense>
      </body>
    </html>
  );
}
