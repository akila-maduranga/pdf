import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { notFound } from 'next/navigation';
import ItemCategoryEditor from '@/components/ItemCategoryEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminItemDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { type?: string };
}) {
  noStore();
  const type = searchParams.type === 'image' ? 'image' : 'file';
  const table = type === 'file' ? 'files' : 'images';

  const supabase = supabaseServer();
  const { data: item } = await supabase.from(table).select('*').eq('id', params.id).single();
  if (!item) notFound();

  const { data: events } = await supabase
    .from('events')
    .select('event_type, created_at')
    .eq('item_type', type)
    .eq('item_id', params.id)
    .order('created_at', { ascending: false });

  const { data: reactions } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('item_type', type)
    .eq('item_id', params.id);

  const pageViews = (events || []).filter((e) => e.event_type === 'view').length;
  const linkClicks = (events || []).filter((e) => e.event_type === 'link_click').length;
  const reactionCounts: Record<string, number> = {};
  for (const r of reactions || []) reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-8">
      <Link
        href={type === 'file' ? '/admin/files' : '/admin/images'}
        className="text-text-dim hover:text-gold"
      >
        ← {type === 'file' ? 'Documents' : 'Images'}
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold text-text">{item.title}</h1>
      {item.description ? <p className="mt-2 text-text-muted">{item.description}</p> : null}

      <p className="mt-3 font-mono text-xs text-text-dim">
        Share link: <span className="text-gold break-all">/view/{item.share_id}</span>
      </p>

      <div className="mt-6">
        <ItemCategoryEditor itemId={item.id} type={type} initialCategoryId={item.category_id} />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <Stat label="Total views" value={pageViews + linkClicks} />
        <Stat label="Gallery views" value={pageViews} />
        <Stat label="Link clicks" value={linkClicks} />
      </div>

      <div className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-dim">Reactions</h2>
        {!Object.keys(reactionCounts).length ? (
          <p className="mt-3 text-sm text-text-dim">No reactions yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <div key={emoji} className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm">
                {emoji} <span className="font-mono text-text-muted">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-dim">Recent activity</h2>
        {!events?.length ? (
          <p className="mt-3 text-sm text-text-dim">Nothing recorded yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {events.slice(0, 25).map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-xs">
                <span className="text-text-muted">{e.event_type === 'view' ? 'Gallery view' : 'Link click'}</span>
                <span className="font-mono text-text-dim">
                  {new Date(e.created_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <p className="text-gold font-display text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-text-dim text-xs">{label}</p>
    </div>
  );
}