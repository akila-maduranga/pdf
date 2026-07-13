import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <p className="font-display text-8xl font-bold text-text-dim">404</p>
        <h1 className="mt-4 font-display text-2xl text-text">Page not found</h1>
        <p className="mt-3 text-text-muted font-body">
          This link may be broken or the content no longer exists.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-rose text-white rounded-xl px-6 py-3 font-medium font-body btn-press"
        >
          Back to Walkata
        </Link>
      </div>
    </main>
  );
}