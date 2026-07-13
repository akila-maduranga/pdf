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
      className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-danger hover:text-danger transition-colors btn-press"
    >
      Sign out
    </button>
  );
}