import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = supabaseServer();

  const [{ count: fileCount }, { count: imageCount }, { data: events }, { data: reactions }] =
    await Promise.all([
      supabase.from('files').select('*', { count: 'exact', head: true }),
      supabase.from('images').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('item_type, item_id, event_type'),
      supabase.from('reactions').select('emoji'),
    ]);

  const totalViews = (events || []).length;
  const totalLinkClicks = (events || []).filter((e) => e.event_type === 'link_click').length;
  const totalReactions = (reactions || []).length;

  const byItem: Record<string, number> = {};
  for (const e of events || []) {
    const key = `${e.item_type}:${e.item_id}`;
    byItem[key] = (byItem[key] || 0) + 1;
  }
  const topKeys = Object.entries(byItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let topItems: { id: string; type: string; title: string; views: number }[] = [];
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

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-brass">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Dashboard</h1>
        </div>
        <LogoutButton />
      </div>

      <nav className="mt-6 flex gap-3">
        <Link href="/admin/files" className="rounded border border-line/20 px-4 py-2 text-sm hover:border-brass hover:text-brass">
          Manage documents
        </Link>
        <Link href="/admin/images" className="rounded border border-line/20 px-4 py-2 text-sm hover:border-brass hover:text-brass">
          Manage images
        </Link>
      </nav>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Documents" value={fileCount ?? 0} />
        <Stat label="Images" value={imageCount ?? 0} />
        <Stat label="Total views" value={totalViews} />
        <Stat label="Link clicks" value={totalLinkClicks} />
        <Stat label="Reactions" value={totalReactions} />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wider text-paper/40">Most viewed</h2>
        {!topItems.length ? (
          <p className="mt-3 text-sm text-paper/40">No views recorded yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-line/10 rounded border border-line/15">
            {topItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/admin/files/${item.id}?type=${item.type}`}
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
