import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import SiteHeader from '@/components/SiteHeader';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  noStore();
  const supabase = supabaseServer();

  const [{ data: categories }, { data: allImages }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('images')
      .select('id, title, description, share_id, category_id, categories(name, slug)')
      .order('created_at', { ascending: false }),
  ]);

  let images = allImages || [];

  if (searchParams.category) {
    images = images.filter((i: any) => i.categories?.slug === searchParams.category);
  }

  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    images = images.filter((i: any) => i.title?.toLowerCase().includes(query));
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 pb-24 sm:px-8 sm:pb-12">
        <h1 className="font-display text-3xl font-semibold text-text">Sexy Photos</h1>
        <p className="mt-1 text-text-muted text-sm">Browse all sexy photos.</p>

        <div className="mt-6 max-w-md">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <CategoryFilter categories={categories || []} basePath="/images" />
        </Suspense>

        {!images.length ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-text-dim">
            <p className="font-body text-sm">No images yet</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img: any) => (
              <div
                key={img.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden card-glow group relative"
              >
                <Link href={`/view/${img.share_id}`} className="block">
                  <div className="aspect-square bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/thumb/image/${img.share_id}`}
                      alt={img.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2.5 pr-9">
                    {img.categories ? (
                      <span className="mb-1 inline-block rounded-full bg-gold/10 text-gold text-[9px] font-medium uppercase tracking-wider">
                        {img.categories.name}
                      </span>
                    ) : null}
                    <p className="truncate text-text text-xs font-medium group-hover:text-rose-light transition-colors">
                      {img.title}
                    </p>
                  </div>
                </Link>
                <ShareButton
                  path={`/view/${img.share_id}`}
                  title={img.title}
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}