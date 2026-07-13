import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import UploadFileForm from '@/components/UploadFileForm';
import AdminItemRow from '@/components/AdminItemRow';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminFilesPage() {
  noStore();
  const supabase = supabaseServer();
  const { data: files } = await supabase
    .from('files')
    .select('id, title, share_id, categories(name)')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-text-dim hover:text-gold">
        ← Dashboard
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-text">Documents</h1>

      <div className="mt-6">
        <UploadFileForm kind="file" />
      </div>

      <div className="mt-8">
        {!files?.length ? (
          <p className="text-sm text-text-dim">No documents uploaded yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {files.map((f: any) => (
              <AdminItemRow
                key={f.id}
                id={f.id}
                type="file"
                title={f.title}
                shareId={f.share_id}
                categoryName={f.categories?.name}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}