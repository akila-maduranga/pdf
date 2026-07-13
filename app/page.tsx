import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Read-only archive</p>
      <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">The Vault</h1>
      <p className="mt-4 max-w-md text-paper/60">
        Documents and images, kept on the shelf for reading — never for taking.
      </p>
      <div className="mt-10 flex gap-4">
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
      </div>
    </main>
  );
}
