import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-brass">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Nothing on this shelf</h1>
      <p className="mt-2 text-paper/50">The link may be wrong, or the item was removed.</p>
      <Link href="/" className="mt-6 rounded border border-line/25 px-5 py-2.5 text-sm hover:border-brass hover:text-brass">
        Back to Walkata
      </Link>
    </main>
  );
}
