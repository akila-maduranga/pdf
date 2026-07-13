'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
      }}
      className="rounded-lg border border-velvet-border/30 px-3 py-1.5 text-xs text-velvet-text/60 hover:border-wine hover:text-wine"
    >
      Sign out
    </button>
  );
}
