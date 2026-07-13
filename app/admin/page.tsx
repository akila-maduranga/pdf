import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { hybridPath } from '@/lib/slugify';
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
  let topItems: { id: string; type: string; title: string; views: number; shareId: string }[] = [];
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
          ? supabase.from('files').select('id, title, share_id').in('id', fileIds)
          : Promise.resolve({ data: [] as any[] }),
        imageIds.length
          ? supabase.from('images').select('id, title, share_id').in('id', imageIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const titleMap: Record<string, { title: string; shareId: string }> = {};
      for (const r of fRows || []) titleMap[`file:${r.id}`] = { title: r.title, shareId: r.share_id };
      for (const r of iRows || []) titleMap[`image:${r.id}`] = { title: r.title, shareId: r.share_id };
      topItems = topKeys.map(([key, views]) => {
        const [type, id] = key.split(':');
        const info = titleMap[key] || { title: '(untitled)', shareId: '' };
        return { id, type, title: info.title, views, shareId: info.shareId };
      });
    }
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-brass">Boss mode</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">The control room</h1>
        </div>
        <LogoutButton />
      </div>

      {loadError && (
        <div className="mt-4 rounded-lg border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          Couldn&apos;t reach the database. Check your Supabase env vars?
        </div>
      )}

      <nav className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/files" className="rounded-lg border border-line/20 px-4 py-2 text-sm transition-colors hover:border-brass hover:text-brass">
          Paper stash
        </Link>
        <Link href="/admin/images" className="rounded-lg border border-line/20 px-4 py-2 text-sm transition-colors hover:border-brass hover:text-brass">
          Visual vault
        </Link>
        <Link href="/admin/collections" className="rounded-lg border border-line/20 px-4 py-2 text-sm transition-colors hover:border-brass hover:text-brass">
          Story bundles
        </Link>
        <Link href="/admin/categories" className="rounded-lg border border-line/20 px-4 py-2 text-sm transition-colors hover:border-brass hover:text-brass">
          Label maker
        </Link>
        <Link href="/admin/stats" className="rounded-lg border border-brass/30 bg-brass/10 px-4 py-2 text-sm text-brass transition-colors hover:bg-brass/20">
          The numbers room
        </Link>
      </nav>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Documents" value={fileCount} />
        <Stat label="Images" value={imageCount} />
        <Stat label="Total views" value={totalViews} />
        <Stat label="Shared links" value={totalLinkClicks} />
        <Stat label="Reactions" value={totalReactions} />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wider text-paper/40">Crowd favorites</h2>
        {!topItems.length ? (
          <p className="mt-3 text-sm text-paper/40">No views yet. Share some links to get started!</p>
        ) : (
          <div className="mt-3 divide-y divide-line/10 rounded border border-line/15">
            {topItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={hybridPath('/view', item.shareId, item.title)}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-white/[0.03]"
              >
                <span className="text-paper/85">{item.title}</span>
                <span className="font-mono text-paper/40">
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
    <div className="rounded border border-line/15 bg-white/[0.02] p-4">
      <p className="font-mono text-2xl font-semibold text-brass">{value}</p>
      <p className="mt-1 text-xs text-paper/50">{label}</p>
    </div>
  );
}
