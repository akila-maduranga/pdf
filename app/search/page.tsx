'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import ShareButton from '@/components/ShareButton';

interface FileResult {
  id: string;
  title: string;
  description?: string;
  share_id: string;
  thumbnail_path?: string;
  categories?: { name: string; slug: string };
}

interface ImageResult {
  id: string;
  title: string;
  description?: string;
  share_id: string;
  categories?: { name: string; slug: string };
}

interface CollectionResult {
  id: string;
  title: string;
  description?: string;
  share_id: string;
  categories?: { name: string };
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';

  const [files, setFiles] = useState<FileResult[]>([]);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [collections, setCollections] = useState<CollectionResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setFiles(data.files || []);
        setImages(data.images || []);
        setCollections(data.collections || []);
      })
      .finally(() => setLoading(false));
  }, [q]);

  const total = files.length + images.length + collections.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 pb-24 sm:px-8 sm:pb-12">
        {/* Search input */}
        <div className="max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="search"
              defaultValue={q}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) router.push(`/search?q=${encodeURIComponent(val)}`);
                }
              }}
              placeholder="Search stories, photos, collections..."
              className="w-full rounded-xl bg-surface border border-border pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-dim outline-none focus:border-rose/40 focus:ring-1 focus:ring-rose/20 transition-all"
            />
          </div>
        </div>

        {!q ? null : loading ? (
          <div className="mt-12 text-center text-text-muted font-body text-sm">Searching...</div>
        ) : total === 0 ? (
          <div className="mt-12 text-center text-text-dim font-body text-sm">
            No results for &ldquo;{q}&rdquo;
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {/* Full Stories (Collections) */}
            {collections.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-text mb-4">Full Stories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collections.map((c) => (
                    <div key={c.id} className="bg-surface border border-border rounded-2xl p-5 card-glow group relative">
                      <Link href={`/collection/${c.share_id}`} className="block pr-8">
                        {c.categories ? (
                          <span className="mb-2 inline-block rounded-full bg-gold/10 text-gold text-[10px] font-medium uppercase tracking-wider">
                            {c.categories.name}
                          </span>
                        ) : null}
                        <p className="font-display text-lg text-text group-hover:text-rose-light transition-colors">{c.title}</p>
                        {c.description ? (
                          <p className="mt-1.5 line-clamp-2 text-text-muted text-sm">{c.description}</p>
                        ) : null}
                      </Link>
                      <ShareButton
                        path={`/collection/${c.share_id}`}
                        title={c.title}
                        className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sexy Stories (Files) */}
            {files.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-text mb-4">Sexy Stories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((f) => (
                    <div key={f.id} className="bg-surface border border-border rounded-2xl overflow-hidden card-glow group relative">
                      <Link href={`/view/${f.share_id}`} className="block">
                        <div className="aspect-[4/5] bg-surface-2 flex items-center justify-center">
                          {f.thumbnail_path ? (
                            <img src={`/api/thumb/file/${f.share_id}`} alt={f.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                          ) : (
                            <span className="text-text-dim font-body text-2xl font-medium tracking-wide">PDF</span>
                          )}
                        </div>
                        <div className="p-3 pr-10">
                          {f.categories ? (
                            <span className="mb-1 inline-block rounded-full bg-rose/10 text-rose-light text-[10px] font-medium uppercase tracking-wider">
                              {f.categories.name}
                            </span>
                          ) : null}
                          <p className="truncate text-text text-sm font-medium group-hover:text-rose-light transition-colors">{f.title}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sexy Photos (Images) */}
            {images.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-text mb-4">Sexy Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="bg-surface border border-border rounded-2xl overflow-hidden card-glow group relative">
                      <Link href={`/view/${img.share_id}`} className="block">
                        <div className="aspect-square bg-surface-2">
                          <img src={`/api/thumb/image/${img.share_id}`} alt={img.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-text text-xs font-medium group-hover:text-rose-light transition-colors">{img.title}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <>
        <SiteHeader />
        <main className="mx-auto min-h-screen max-w-5xl px-4 py-12"><div className="text-text-dim font-body text-sm">Loading...</div></main>
      </>
    }>
      <SearchResults />
    </Suspense>
  );
}