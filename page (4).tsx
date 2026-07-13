import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="ambient-bg relative flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        <div className="relative mx-auto max-w-2xl">
          <h1 className="font-display text-6xl font-bold sm:text-8xl">
            <span className="bg-gradient-to-r from-rose to-gold bg-clip-text text-transparent">
              Walkata
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-text-muted text-lg font-body leading-relaxed">
            Documents, images &amp; collections
          </p>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/files" className="group">
              <div className="bg-surface border border-border rounded-2xl p-6 card-glow transition-all">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose/10">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-rose"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h2 className="font-display text-xl text-text group-hover:text-rose-light transition-colors">
                  Documents
                </h2>
                <p className="mt-2 text-text-muted text-sm">
                  PDFs and documents, curated and organized.
                </p>
              </div>
            </Link>

            <Link href="/images" className="group">
              <div className="bg-surface border border-border rounded-2xl p-6 card-glow transition-all">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-gold"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h2 className="font-display text-xl text-text group-hover:text-gold-light transition-colors">
                  Images
                </h2>
                <p className="mt-2 text-text-muted text-sm">
                  A curated collection of visual content.
                </p>
              </div>
            </Link>

            <Link href="/collections" className="group">
              <div className="bg-surface border border-border rounded-2xl p-6 card-glow transition-all">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose/10">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-rose-light"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl text-text group-hover:text-rose-light transition-colors">
                  Collections
                </h2>
                <p className="mt-2 text-text-muted text-sm">
                  Grouped series, chapters, and curated sets.
                </p>
              </div>
            </Link>
          </div>
        </div>

        <p className="absolute bottom-8 text-text-dim text-xs font-body">
          Walkata
        </p>
      </main>
    </>
  );
}