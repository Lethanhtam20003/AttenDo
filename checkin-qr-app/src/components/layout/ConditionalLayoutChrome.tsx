'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface ConditionalLayoutChromeProps {
  children: ReactNode;
  hideOnLive?: boolean;
}

export default function ConditionalLayoutChrome({
  children,
  hideOnLive = false,
}: ConditionalLayoutChromeProps) {
  const pathname = usePathname();

  if (
    pathname.startsWith('/check-in') ||
    (hideOnLive && pathname.startsWith('/host/live'))
  ) {
    return null;
  }

  return <>{children}</>;
}
