import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import PdfViewer from '@/components/PdfViewer';
import ImageViewer from '@/components/ImageViewer';
import ReactionBar from '@/components/ReactionBar';
import ViewTracker from '@/components/ViewTracker';
import ViewOnlyGuard from '@/components/ViewOnlyGuard';
import ShareButton from '@/components/ShareButton';
import SiteHeader from '@/components/SiteHeader';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getItem(shareId: string) {
  const supabase = supabaseServer();

  const { data: file } = await supabase
    .from('files')
    .select('id, title, description, share_id, categories(name)')
    .eq('share_id', shareId)
    .single();
  if (file) return { type: 'file' as const, item: file };

  const { data: image } = await supabase
    .from('images')
    .select('id, title, description, share_id, categories(name)')
    .eq('share_id', shareId)
    .single();
  if (image) return { type: 'image' as const, item: image };

  return null;
}

async function getCollectionContext(itemType: 'file' | 'image', itemId: string) {
  const supabase = supabaseServer();

  const { data: membership } = await supabase
    .from('collection_items')
    .select('collection_id, part_number')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();

  if (!membership) return null;

  const { data: collection } = await supabase
    .from('collections')
    .select('id, title, share_id')
    .eq('id', membership.collection_id)
    .single();
  if (!collection) return null;

  const { data: siblings } = await supabase
    .from('collection_items')
    .select('id, item_type, item_id, part_number')
    .eq('collection_id', collection.id)
    .order('part_number', { ascending: true });

  const index = (siblings || []).findIndex((s) => s.item_type === itemType && s.item_id === itemId);
  const prev = index > 0 ? siblings![index - 1] : null;
  const next = index >= 0 && index < (siblings?.length || 0) - 1 ? siblings![index + 1] : null;

  async function resolveShareId(entry: typeof prev) {
    if (!entry) return null;
    const table = entry.item_type === 'file' ? 'files' : 'images';
    const { data } = await supabase.from(table).select('share_id, title').eq('id', entry.item_id).single();
    return data ? { shareId: data.share_id, title: data.title } : null;
  }

  const [prevItem, nextItem] = await Promise.all([resolveShareId(prev), resolveShareId(next)]);

  return {
    collectionTitle: collection.title,
    collectionShareId: collection.share_id,
    partNumber: membership.part_number,
    totalParts: siblings?.length || 0,
    prevItem,
    nextItem,
  };
}

export default async function ViewPage({ params }: { params: { shareId: string } }) {
  noStore();
  const result = await getItem(params.shareId);
  if (!result) notFound();

  const { type, item } = result as any;
  const collectionContext = await getCollectionContext(type, item.id);

  const backLabel = type === 'file' ? 'Sexy Stories' : 'Sexy Photos';
  const backHref = type === 'file' ? '/files' : '/images';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 pb-24 sm:px-8 sm:pb-10">
        <ViewOnlyGuard />
        <ViewTracker itemType={type} itemId={item.id} />

        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-body text-sm text-text-dim hover:text-rose-light transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </Link>

        {/* Collection info bar */}
        {collectionContext && (
          <div className="mt-4 bg-surface-2 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-text-dim text-xs font-body uppercase tracking-wider mb-1">
                Chapter {collectionContext.partNumber} of {collectionContext.totalParts}
              </p>
              <Link
                href={`/collection/${collectionContext.collectionShareId}`}
                className="font-display text-sm text-rose-light hover:text-rose transition-colors"
              >
                {collectionContext.collectionTitle}
              </Link>
            </div>
            <Link
              href={`/collection/${collectionContext.collectionShareId}`}
              className="inline-flex items-center gap-2 self-start sm:self-auto bg-rose/10 hover:bg-rose/20 border border-rose/20 text-rose-light rounded-lg px-4 py-2 text-sm font-body font-medium transition-all btn-press"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Full Story
            </Link>
          </div>
        )}

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            {item.categories ? (
              <span className="mb-2 inline-block rounded-full bg-rose/10 text-rose-light text-xs font-medium uppercase tracking-wider">
                {item.categories.name}
              </span>
            ) : null}
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text">
              {item.title}
            </h1>
            {item.description ? (
              <p className="mt-2 text-text-muted font-body">{item.description}</p>
            ) : null}
          </div>
          <ShareButton
            path={`/view/${item.share_id}`}
            title={item.title}
            variant="button"
            className="shrink-0"
          />
        </div>

        <div className="mt-8">
          {type === 'file' ? (
            <PdfViewer shareId={item.share_id} />
          ) : (
            <ImageViewer shareId={item.share_id} alt={item.title} />
          )}
        </div>

        {/* Chapter navigation buttons - sticky on mobile */}
        {collectionContext && (
          <>
            {/* Mobile: fixed bottom bar above native nav */}
            <div className="sm:hidden fixed bottom-12 left-0 right-0 z-30 px-3 pb-1">
              <div className="flex items-center gap-2">
                {collectionContext.prevItem ? (
                  <Link
                    href={`/view/${collectionContext.prevItem.shareId}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose/15 backdrop-blur-md border border-rose/20 rounded-xl py-3 text-sm font-body text-rose-light btn-press"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Prev
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
                <Link
                  href={`/collection/${collectionContext.collectionShareId}`}
                  className="flex items-center justify-center bg-surface-2/90 backdrop-blur-md border border-border rounded-xl px-3 py-3 text-text-dim btn-press"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </Link>
                {collectionContext.nextItem ? (
                  <Link
                    href={`/view/${collectionContext.nextItem.shareId}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose backdrop-blur-md border border-rose rounded-xl py-3 text-sm font-body text-white btn-press"
                  >
                    Next
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>

            {/* Desktop: inline chapter nav */}
            <div className="hidden sm:flex mt-6 items-center justify-between gap-4">
              {collectionContext.prevItem ? (
                <Link
                  href={`/view/${collectionContext.prevItem.shareId}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 text-sm font-body text-text-muted hover:text-rose-light hover:border-rose/20 transition-all btn-press"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="truncate max-w-[200px]">{collectionContext.prevItem.title}</span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              <span className="text-text-dim text-xs font-body px-2">
                Ch {collectionContext.partNumber} / {collectionContext.totalParts}
              </span>
              {collectionContext.nextItem ? (
                <Link
                  href={`/view/${collectionContext.nextItem.shareId}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose/10 border border-rose/20 rounded-xl px-4 py-3 text-sm font-body text-rose-light hover:bg-rose/20 transition-all btn-press"
                >
                  <span className="truncate max-w-[200px]">{collectionContext.nextItem.title}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>

            {/* Spacer for mobile fixed bar */}
            <div className="sm:hidden h-16" />
          </>
        )}

        <div className="mt-8 bg-surface border border-border rounded-xl p-4">
          <p className="mb-3 text-text-muted text-sm font-body">Reactions</p>
          <ReactionBar itemType={type} itemId={item.id} />
        </div>
      </main>
    </>
  );
}