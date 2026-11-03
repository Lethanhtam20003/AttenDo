'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface ConditionalLayoutChromeProps {
  children: ReactNode;
}

export default function ConditionalLayoutChrome({
  children,
}: ConditionalLayoutChromeProps) {
  const pathname = usePathname();

  if (pathname.startsWith('/checkin')) return null;

  return <>{children}</>;
}
