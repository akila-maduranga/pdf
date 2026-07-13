import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import SiteHeader from '@/components/SiteHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriesPage() {
  noStore();
  const supabase = supabaseServer();

  const [{ data: categories }, { data: files }, { data: images }, { data: collections }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase.from('files').select('id, share_id, title, thumbnail_path, category_id').order('created_at', { ascending: false }),
    supabase.from('images').select('id, share_id, title, category_id').order('created_at', { ascending: false }),
    supabase.from('collections').select('id, share_id, title, description, category_id').order('created_at', { ascending: false }),
  ]);

  const allFiles = files || [];
  const allImages = images || [];
  const allCollections = collections || [];

  const totalItems = allFiles.length + allImages.length;

  const categoryData = (categories || []).map((cat) => {
    const catFiles = allFiles.filter((f) => f.category_id === cat.id);
    const catImages = allImages.filter((i) => i.category_id === cat.id);
    const catCollections = allCollections.filter((c) => c.category_id === cat.id);
    const items = [...catFiles.map((f) => ({ ...f, type: 'file' as const })), ...catImages.map((i) => ({ ...i, type: 'image' as const }))];
    return { ...cat, files: catFiles, images: catImages, collections: catCollections, items };
  });

  const uncategorizedFiles = allFiles.filter((f) => !f.category_id);
  const uncategorizedImages = allImages.filter((i) => !i.category_id);
  const uncategorizedCollections = allCollections.filter((c) => !c.category_id);
  const hasUncategorized = uncategorizedFiles.length > 0 || uncategorizedImages.length > 0 || uncategorizedCollections.length > 0;

  const recentItems = [
    ...allFiles.slice(0, 4).map((f) => ({ ...f, type: 'file' as const })),
    ...allImages.slice(0, 4).map((i) => ({ ...i, type: 'image' as const })),
  ].slice(0, 8);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="erotica-gradient mb-8 rounded-2xl p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-rose-gold/70">Welcome to</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-velvet-text sm:text-5xl">Velvet Pages</h1>
          <p className="mt-3 max-w-lg text-velvet-text/60">
            Your private collection of illustrated stories and fantasies. Browse by category or dive into the latest additions.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/files"
              className="rounded-lg bg-rose-gold/20 border border-rose-gold/30 px-5 py-2.5 font-body text-sm text-rose-gold transition-colors hover:bg-rose-gold/30"
            >
              Browse Stories
            </Link>
            <Link
              href="/images"
              className="rounded-lg border border-velvet-border/50 px-5 py-2.5 font-body text-sm text-velvet-text/70 transition-colors hover:border-rose-gold/40 hover:text-velvet-text"
            >
              View Gallery
            </Link>
            <Link
              href="/collections"
              className="rounded-lg border border-velvet-border/50 px-5 py-2.5 font-body text-sm text-velvet-text/70 transition-colors hover:border-rose-gold/40 hover:text-velvet-text"
            >
              Collections
            </Link>
          </div>
        </div>

        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl">📚</span>
            <p className="mt-4 font-display text-xl text-velvet-text/70">Nothing here yet</p>
            <p className="mt-2 text-sm text-velvet-text/40">The library is being curated. Check back soon.</p>
          </div>
        ) : (
          <>
            {recentItems.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-velvet-text">Latest Additions</h2>
                  <div className="flex gap-2">
                    <Link href="/files" className="font-mono text-xs uppercase tracking-wider text-rose-gold/60 hover:text-rose-gold">Stories</Link>
                    <span className="text-velvet-text/20">·</span>
                    <Link href="/images" className="font-mono text-xs uppercase tracking-wider text-rose-gold/60 hover:text-rose-gold">Gallery</Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {recentItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/view/${item.share_id}`}
                      className="group overflow-hidden rounded-xl border border-velvet-border/40 bg-velvet-surface/50 transition-all hover:-translate-y-0.5 hover:border-rose-gold/40 hover:shadow-lg"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-velvet-card">
                        {item.type === 'file' && (item as any).thumbnail_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/thumb/file/${item.share_id}`}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : item.type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/thumb/image/${item.share_id}`}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="font-mono text-3xl text-velvet-text/15">PDF</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-medium text-velvet-text/85 group-hover:text-rose-gold">{item.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {categoryData.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 font-display text-xl font-semibold text-velvet-text">Browse by Category</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {categoryData.map((cat) => {
                    const totalCount = cat.items.length + cat.collections.length;
                    const previewItems = cat.items.slice(0, 3);
                    return (
                      <Link
                        key={cat.id}
                        href={`/files?category=${cat.slug}`}
                        className="group rounded-xl border border-velvet-border/40 bg-velvet-surface/40 p-5 transition-all hover:-translate-y-0.5 hover:border-rose-gold/40 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-velvet-text group-hover:text-rose-gold">{cat.name}</h3>
                            <p className="mt-1 text-xs text-velvet-text/45">
                              {cat.files.length} {cat.files.length === 1 ? 'story' : 'stories'} · {cat.images.length} {cat.images.length === 1 ? 'image' : 'images'} · {cat.collections.length} {cat.collections.length === 1 ? 'collection' : 'collections'}
                            </p>
                          </div>
                          <span className="text-velvet-text/20 group-hover:text-rose-gold transition-colors">→</span>
                        </div>
                        {previewItems.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {previewItems.map((item) => (
                              <div key={item.id} className="h-12 w-12 overflow-hidden rounded-lg bg-velvet-card">
                                {item.type === 'file' && (item as any).thumbnail_path ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={`/api/thumb/file/${item.share_id}`} alt="" className="h-full w-full object-cover" />
                                ) : item.type === 'image' ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={`/api/thumb/image/${item.share_id}`} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <span className="text-[8px] text-velvet-text/20">PDF</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {cat.items.length > 3 && (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-velvet-card text-xs text-velvet-text/30">
                                +{cat.items.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {hasUncategorized && (
              <section className="mb-10">
                <Link href="/files" className="group flex items-center gap-2 mb-4">
                  <h2 className="font-display text-xl font-semibold text-velvet-text/70 group-hover:text-rose-gold transition-colors">Uncategorized</h2>
                  <span className="text-velvet-text/20 group-hover:text-rose-gold transition-colors">→</span>
                </Link>
                <p className="text-xs text-velvet-text/40 mb-3">
                  {uncategorizedFiles.length + uncategorizedImages.length} items not yet sorted into categories
                </p>
              </section>
            )}

            {allCollections.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-velvet-text">Collections</h2>
                  <Link href="/collections" className="font-mono text-xs uppercase tracking-wider text-rose-gold/60 hover:text-rose-gold">View all →</Link>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {allCollections.slice(0, 4).map((c) => (
                    <Link
                      key={c.id}
                      href={`/collection/${c.share_id}`}
                      className="group rounded-xl border border-velvet-border/40 bg-velvet-surface/40 p-4 transition-all hover:-translate-y-0.5 hover:border-rose-gold/40 hover:shadow-lg"
                    >
                      <p className="font-display text-base font-semibold text-velvet-text group-hover:text-rose-gold">{c.title}</p>
                      {c.description && <p className="mt-1 line-clamp-2 text-xs text-velvet-text/45">{c.description}</p>}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
