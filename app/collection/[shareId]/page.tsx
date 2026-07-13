import Link from 'next/link';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import SiteHeader from '@/components/SiteHeader';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CollectionPage({ params }: { params: { shareId: string } }) {
  noStore();
  const supabase = supabaseServer();

  const { data: collection } = await supabase
    .from('collections')
    .select('*, categories(name)')
    .eq('share_id', params.shareId)
    .single();
  if (!collection) notFound();

  const { data: items } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collection.id)
    .order('part_number', { ascending: true });

  const fileIds = (items || []).filter((i) => i.item_type === 'file').map((i) => i.item_id);
  const imageIds = (items || []).filter((i) => i.item_type === 'image').map((i) => i.item_id);

  const [{ data: files }, { data: images }] = await Promise.all([
    fileIds.length
      ? supabase.from('files').select('id, title, description, share_id, thumbnail_path').in('id', fileIds)
      : Promise.resolve({ data: [] as any[] }),
    imageIds.length
      ? supabase.from('images').select('id, title, description, share_id').in('id', imageIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const fileMap = new Map((files || []).map((f) => [f.id, f]));
  const imageMap = new Map((images || []).map((i) => [i.id, i]));

  const parts = (items || []).map((item) => {
    const source = item.item_type === 'file' ? fileMap.get(item.item_id) : imageMap.get(item.item_id);
    return { ...item, source };
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 pb-24 sm:px-8 sm:pb-12">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 font-body text-sm text-text-dim hover:text-rose-light transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Full Stories
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            {collection.categories ? (
              <span className="mb-2 inline-block rounded-full bg-rose/10 text-rose-light text-xs font-medium uppercase tracking-wider">
                {collection.categories.name}
              </span>
            ) : null}
            <h1 className="font-display text-3xl font-semibold text-text">
              {collection.title}
            </h1>
            {collection.description ? (
              <p className="mt-2 text-text-muted font-body">{collection.description}</p>
            ) : null}
          </div>
          <ShareButton
            path={`/collection/${collection.share_id}`}
            title={collection.title}
            className="shrink-0"
          />
        </div>

        {!parts.length ? (
          <div className="mt-10 flex flex-col items-center gap-3 text-text-dim">
            <p className="font-body text-sm">No chapters in this story</p>
          </div>
        ) : (
          <ol className="mt-8 space-y-2">
            {parts.map((part, index) => (
              <li key={part.id}>
                {part.source ? (
                  <Link
                    href={`/view/${part.source.share_id}`}
                    className="bg-surface border border-border rounded-xl p-4 card-glow group flex items-center gap-4 transition-all"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose/10 text-rose-light font-body text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-text font-body text-sm group-hover:text-rose-light transition-colors">
                        {part.source.title}
                      </p>
                      <span className="font-body text-text-dim text-xs uppercase tracking-wider">
                        {part.item_type === 'file' ? 'Story' : 'Photo'}
                      </span>
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-text-dim group-hover:text-rose-light transition-colors shrink-0"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 border-dashed border-border rounded-xl p-4 text-text-dim">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-body text-sm text-text-dim">
                      {index + 1}
                    </span>
                    <span className="font-body text-sm italic">Chapter removed</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}