import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl">🕳️</span>
      <h1 className="mt-4 font-display text-3xl font-semibold">Oops, nothing here</h1>
      <p className="mt-2 max-w-xs text-paper/50">
        This link might be broken, or someone moved the furniture around.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg border border-line/25 px-5 py-2.5 text-sm transition-colors hover:border-brass hover:text-brass"
      >
        Back to safety
      </Link>
    </main>
  );
}