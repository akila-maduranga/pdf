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
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-8">
        <Link href="/collections" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
          ← Collections
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            {collection.categories ? (
              <span className="mb-2 inline-block rounded-full bg-brass/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brass">
                {collection.categories.name}
              </span>
            ) : null}
            <h1 className="font-display text-3xl font-semibold">{collection.title}</h1>
            {collection.description ? <p className="mt-2 text-paper/60">{collection.description}</p> : null}
          </div>
          <ShareButton path={`/collection/${collection.share_id}`} title={collection.title} />
        </div>

        <p className="mt-6 font-mono text-xs uppercase tracking-wider text-paper/40">
          {parts.length} {parts.length === 1 ? 'part' : 'parts'}
        </p>

        {!parts.length ? (
          <p className="mt-6 text-paper/50">Nothing has been added to this collection yet.</p>
        ) : (
          <ol className="mt-4 divide-y divide-line/10 rounded-lg border border-line/15">
            {parts.map((part, index) => (
              <li key={part.id}>
                {part.source ? (
                  <Link
                    href={`/view/${part.source.share_id}`}
                    className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line/20 font-mono text-xs text-paper/50 group-hover:border-brass group-hover:text-brass">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-paper/90 group-hover:text-brass">
                        {part.source.title}
                      </p>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-paper/35">
                        {part.item_type === 'file' ? 'Document' : 'Image'}
                      </span>
                    </span>
                    <span className="text-paper/30 group-hover:text-brass">→</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 px-4 py-4 text-paper/35">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line/10 font-mono text-xs">
                      {index + 1}
                    </span>
                    <span className="text-sm italic">Part removed</span>
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
