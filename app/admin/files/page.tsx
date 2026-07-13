import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';
import UploadFileForm from '@/components/UploadFileForm';
import AdminItemRow from '@/components/AdminItemRow';

export const dynamic = 'force-dynamic';

export default async function AdminFilesPage() {
  const supabase = supabaseServer();
  const { data: files } = await supabase
    .from('files')
    .select('id, title, share_id')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
        ← Dashboard
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Documents</h1>

      <div className="mt-6">
        <UploadFileForm kind="file" />
      </div>

      <div className="mt-8">
        {!files?.length ? (
          <p className="text-sm text-paper/40">No documents uploaded yet.</p>
        ) : (
          <div className="divide-y divide-line/10 rounded border border-line/15">
            {files.map((f) => (
              <AdminItemRow key={f.id} id={f.id} type="file" title={f.title} shareId={f.share_id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
