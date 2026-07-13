import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-brass">Your cozy little corner</p>
        <h1 className="mt-4 font-display text-5xl font-semibold sm:text-6xl">Walkata</h1>
        <p className="mx-auto mt-4 max-w-md text-paper/60">
          A welcoming place for documents, images, and collections — browse, enjoy, and share.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/files"
            className="group relative overflow-hidden rounded-lg border border-line/25 px-6 py-3 font-body text-sm text-paper/85 transition-colors hover:border-brass hover:text-brass"
          >
            <span className="relative z-10">Browse documents</span>
          </Link>
          <Link
            href="/images"
            className="rounded-lg border border-line/25 px-6 py-3 font-body text-sm text-paper/85 transition-colors hover:border-brass hover:text-brass"
          >
            Browse images
          </Link>
          <Link
            href="/collections"
            className="rounded-lg border border-line/25 px-6 py-3 font-body text-sm text-paper/85 transition-colors hover:border-brass hover:text-brass"
          >
            Browse collections
          </Link>
          <Link
            href="/stats"
            className="rounded-lg border border-line/25 px-6 py-3 font-body text-sm text-paper/85 transition-colors hover:border-brass hover:text-brass"
          >
            View stats
          </Link>
        </div>
      </div>
    </main>
  );
}
