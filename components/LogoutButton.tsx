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
      className="rounded border border-line/20 px-3 py-1.5 text-xs text-paper/60 hover:border-rust hover:text-rust"
    >
      Sign out
    </button>
  );
}
