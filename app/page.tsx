import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-brass">Read-only archive</p>
        <h1 className="mt-4 font-display text-5xl font-semibold sm:text-6xl">Walkata</h1>
        <p className="mx-auto mt-4 max-w-md text-paper/60">
          Documents, images, and the collections that tie them together — kept on the shelf for
          reading, never for taking.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/files"
            className="rounded border border-line/25 px-6 py-3 font-body text-sm text-paper/85 transition-colors hover:border-brass hover:text-brass"
          >
            Browse documents
          </Link>
          <Link
            href="/images"
            className="rounded border border-line/25 px-6 py-3 font-body text-sm text-paper/85 transition-colors hover:border-brass hover:text-brass"
          >
            Browse images
          </Link>
          <Link
            href="/collections"
            className="rounded border border-line/25 px-6 py-3 font-body text-sm text-paper/85 transition-colors hover:border-brass hover:text-brass"
          >
            Browse collections
          </Link>
        </div>
      </div>
    </main>
  );
}
