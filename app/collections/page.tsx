import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import SiteHeader from '@/components/SiteHeader';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CollectionsPage() {
  noStore();
  const supabase = supabaseServer();

  const { data: collections } = await supabase
    .from('collections')
    .select('id, title, description, share_id, categories(name)')
    .order('created_at', { ascending: false });

  const collectionIds = (collections || []).map((c: any) => c.id);
  const { data: itemCounts } = collectionIds.length
    ? await supabase.from('collection_items').select('collection_id').in('collection_id', collectionIds)
    : { data: [] as any[] };

  const countMap: Record<string, number> = {};
  for (const row of itemCounts || []) {
    countMap[row.collection_id] = (countMap[row.collection_id] || 0) + 1;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass/70">Multi-part stories</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Collections</h1>
        <p className="mt-2 max-w-md text-paper/55">
          Series, chapters, and issues — grouped in order, one story at a time.
        </p>

        {!collections?.length ? (
          <p className="mt-10 text-paper/50">No collections yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {collections.map((c: any) => (
              <div
                key={c.id}
                className="group relative overflow-hidden rounded-lg border border-line/15 bg-white/[0.02] p-5 transition-all hover:-translate-y-0.5 hover:border-brass/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              >
                <Link href={`/collection/${c.share_id}`} className="block pr-8">
                  {c.categories ? (
                    <span className="mb-2 inline-block rounded-full bg-brass/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brass">
                      {c.categories.name}
                    </span>
                  ) : null}
                  <p className="font-display text-lg font-semibold text-paper/95 group-hover:text-brass">
                    {c.title}
                  </p>
                  {c.description ? (
                    <p className="mt-1.5 line-clamp-2 text-sm text-paper/50">{c.description}</p>
                  ) : null}
                  <p className="mt-3 font-mono text-xs uppercase tracking-wider text-paper/35">
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
