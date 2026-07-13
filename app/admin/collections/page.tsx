import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import CreateCollectionForm from '@/components/CreateCollectionForm';
import AdminCollectionRow from '@/components/AdminCollectionRow';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCollectionsPage() {
  noStore();
  const supabase = supabaseServer();
  const { data: collections } = await supabase
    .from('collections')
    .select('id, title, share_id, collection_items(count)')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
        ← Control room
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Story bundles</h1>
      <p className="mt-2 text-sm text-paper/50">
        Group docs and images into chapters, issues, or photo series — one link to share them all.
      </p>

      <div className="mt-6">
        <CreateCollectionForm />
      </div>

      <div className="mt-8">
        {!collections?.length ? (
          <p className="text-sm text-paper/40">No bundles yet. Start one!</p>
        ) : (
          <div className="divide-y divide-line/10 rounded border border-line/15">
            {collections.map((c: any) => (
              <AdminCollectionRow
                key={c.id}
                id={c.id}
                title={c.title}
                shareId={c.share_id}
                partCount={c.collection_items?.[0]?.count || 0}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
