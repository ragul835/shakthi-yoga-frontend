'use client';

import { usePathname } from 'next/navigation';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <main id="main-content" tabIndex={-1} style={{ minHeight: '100vh' }}>{children}</main>;
  }

  return <main id="main-content" tabIndex={-1} style={{ minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>{children}</main>;
}
