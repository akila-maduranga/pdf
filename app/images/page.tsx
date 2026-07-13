import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import SiteHeader from '@/components/SiteHeader';
import CategoryFilter from '@/components/CategoryFilter';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: { category?: string };
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

  const images = searchParams.category
    ? (allImages || []).filter((i: any) => i.categories?.slug === searchParams.category)
    : allImages || [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass/70">Read-only archive</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Images</h1>

        <Suspense fallback={null}>
          <CategoryFilter categories={categories || []} basePath="/images" />
        </Suspense>

        {!images.length ? (
          <p className="mt-10 text-paper/50">Nothing here yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img: any) => (
              <div
                key={img.id}
                className="group relative overflow-hidden rounded-lg border border-line/15 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-brass/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              >
                <Link href={`/view/${img.share_id}`} className="block">
                  <div className="aspect-square overflow-hidden bg-vellum">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/thumb/image/${img.share_id}`}
                      alt={img.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2.5 pr-9">
                    {img.categories ? (
                      <span className="mb-1 inline-block rounded-full bg-brass/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brass">
                        {img.categories.name}
                      </span>
                    ) : null}
                    <p className="truncate font-body text-xs font-medium text-paper/85 group-hover:text-brass">
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
