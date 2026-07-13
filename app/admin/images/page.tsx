import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import UploadFileForm from '@/components/UploadFileForm';
import AdminItemRow from '@/components/AdminItemRow';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminImagesPage() {
  noStore();
  const supabase = supabaseServer();
  const { data: images } = await supabase
    .from('images')
    .select('id, title, share_id')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
        ← Dashboard
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Images</h1>

      <div className="mt-6">
        <UploadFileForm kind="image" />
      </div>

      <div className="mt-8">
        {!images?.length ? (
          <p className="text-sm text-paper/40">No images uploaded yet.</p>
        ) : (
          <div className="divide-y divide-line/10 rounded border border-line/15">
            {images.map((img) => (
              <AdminItemRow key={img.id} id={img.id} type="image" title={img.title} shareId={img.share_id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
