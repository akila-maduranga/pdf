import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import SiteHeader from '@/components/SiteHeader';
import SearchBar from '@/components/SearchBar';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  noStore();
  const supabase = supabaseServer();

  const { data: allCollections } = await supabase
    .from('collections')
    .select('id, title, description, share_id, categories(name)')
    .order('created_at', { ascending: false });

  const collectionIds = (allCollections || []).map((c: any) => c.id);
  const { data: itemCounts } = collectionIds.length
    ? await supabase.from('collection_items').select('collection_id').in('collection_id', collectionIds)
    : { data: [] as any[] };

  const countMap: Record<string, number> = {};
  for (const row of itemCounts || []) {
    countMap[row.collection_id] = (countMap[row.collection_id] || 0) + 1;
  }

  let collections = allCollections || [];

  if (searchParams.category) {
    collections = collections.filter((c: any) => c.categories?.name?.toLowerCase().replace(/\s+/g, '-') === searchParams.category.toLowerCase());
  }

  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    collections = collections.filter((c: any) => c.title?.toLowerCase().includes(query));
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 pb-24 sm:px-8 sm:pb-12">
        <h1 className="font-display text-3xl font-semibold text-text">Collections</h1>
        <p className="mt-1 text-text-muted text-sm">Browse curated collections and grouped series.</p>

        <div className="mt-6 max-w-md">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        {!collections.length ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-text-dim">
            <p className="font-body text-sm">No collections yet</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {collections.map((c: any) => (
              <div
                key={c.id}
                className="bg-surface border border-border rounded-2xl p-5 card-glow group relative"
              >
                <Link href={`/collection/${c.share_id}`} className="block pr-8">
                  {c.categories ? (
                    <span className="mb-2 inline-block rounded-full bg-gold/10 text-gold text-[10px] font-medium uppercase tracking-wider">
                      {c.categories.name}
                    </span>
                  ) : null}
                  <p className="font-display text-lg text-text group-hover:text-rose-light transition-colors">
                    {c.title}
                  </p>
                  {c.description ? (
                    <p className="mt-1.5 line-clamp-2 text-text-muted text-sm">{c.description}</p>
                  ) : null}
                  <p className="mt-3 text-text-dim text-xs">
                    {countMap[c.id] || 0} {countMap[c.id] === 1 ? 'part' : 'parts'}
                  </p>
                </Link>
                <ShareButton
                  path={`/collection/${c.share_id}`}
                  title={c.title}
                  className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}