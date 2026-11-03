'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface ConditionalLayoutChromeProps {
  header: ReactNode;
  footer: ReactNode;
}

export default function ConditionalLayoutChrome({
  header,
  footer,
}: ConditionalLayoutChromeProps) {
  const pathname = usePathname();

  if (pathname.startsWith('/checkin')) return null;

  return (
    <>
      {header}
      {footer}
    </>
  );
}
