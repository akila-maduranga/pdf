import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  noStore();

  let fileCount = 0;
  let imageCount = 0;
  let totalViews = 0;
  let totalLinkClicks = 0;
  let totalReactions = 0;
  let topItems: { id: string; type: string; title: string; views: number }[] = [];
  let loadError = false;

  try {
    const supabase = supabaseServer();

    const [{ count: fc }, { count: ic }, { data: events }, { data: reactions }] =
      await Promise.all([
        supabase.from('files').select('*', { count: 'exact', head: true }),
        supabase.from('images').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('item_type, item_id, event_type'),
        supabase.from('reactions').select('emoji'),
      ]);

    fileCount = fc ?? 0;
    imageCount = ic ?? 0;
    totalViews = (events || []).length;
    totalLinkClicks = (events || []).filter((e) => e.event_type === 'link_click').length;
    totalReactions = (reactions || []).length;

    const byItem: Record<string, number> = {};
    for (const e of events || []) {
      const key = `${e.item_type}:${e.item_id}`;
      byItem[key] = (byItem[key] || 0) + 1;
    }
    const topKeys = Object.entries(byItem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topKeys.length) {
      const fileIds = topKeys.filter(([k]) => k.startsWith('file:')).map(([k]) => k.split(':')[1]);
      const imageIds = topKeys.filter(([k]) => k.startsWith('image:')).map(([k]) => k.split(':')[1]);
      const [{ data: fRows }, { data: iRows }] = await Promise.all([
        fileIds.length
          ? supabase.from('files').select('id, title').in('id', fileIds)
          : Promise.resolve({ data: [] as any[] }),
        imageIds.length
          ? supabase.from('images').select('id, title').in('id', imageIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const titleMap: Record<string, string> = {};
      for (const r of fRows || []) titleMap[`file:${r.id}`] = r.title;
      for (const r of iRows || []) titleMap[`image:${r.id}`] = r.title;
      topItems = topKeys.map(([key, views]) => {
        const [type, id] = key.split(':');
        return { id, type, title: titleMap[key] || '(untitled)', views };
      });
    }
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-rose-gold">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Dashboard</h1>
        </div>
        <LogoutButton />
      </div>

      {loadError && (
        <div className="mt-4 rounded-lg border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-wine">
          Could not reach the database. Check your Supabase configuration.
        </div>
      )}

      <nav className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/files" className="rounded-lg border border-velvet-border/30 px-4 py-2 text-sm transition-colors hover:border-rose-gold hover:text-rose-gold">
          Stories
        </Link>
        <Link href="/admin/images" className="rounded-lg border border-velvet-border/30 px-4 py-2 text-sm transition-colors hover:border-rose-gold hover:text-rose-gold">
          Images
        </Link>
        <Link href="/admin/collections" className="rounded-lg border border-velvet-border/30 px-4 py-2 text-sm transition-colors hover:border-rose-gold hover:text-rose-gold">
          Collections
        </Link>
        <Link href="/admin/categories" className="rounded-lg border border-velvet-border/30 px-4 py-2 text-sm transition-colors hover:border-rose-gold hover:text-rose-gold">
          Categories
        </Link>
        <Link href="/admin/stats" className="rounded-lg border border-rose-gold/30 bg-rose-gold/10 px-4 py-2 text-sm text-rose-gold transition-colors hover:bg-rose-gold/20">
          Statistics
        </Link>
      </nav>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Stories" value={fileCount} />
        <Stat label="Images" value={imageCount} />
        <Stat label="Total views" value={totalViews} />
        <Stat label="Shared links" value={totalLinkClicks} />
        <Stat label="Reactions" value={totalReactions} />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wider text-velvet-text/40">Most popular</h2>
        {!topItems.length ? (
          <p className="mt-3 text-sm text-velvet-text/40">No views yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-velvet-border/20 rounded-xl border border-velvet-border/30">
            {topItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/admin/files/${item.id}?type=${item.type}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-velvet-surface/30"
              >
                <span className="text-velvet-text/85">{item.title}</span>
                <span className="font-mono text-velvet-text/40">
                  {item.views} views · {item.type}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4">
      <p className="font-mono text-2xl font-semibold text-rose-gold">{value}</p>
      <p className="mt-1 text-xs text-velvet-text/50">{label}</p>
    </div>
  );
}
