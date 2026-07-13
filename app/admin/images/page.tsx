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
    .select('id, title, share_id, categories(name)')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-velvet-text/40 hover:text-rose-gold">
        ← Dashboard
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Gallery</h1>

      <div className="mt-6">
        <UploadFileForm kind="image" />
      </div>

      <div className="mt-8">
        {!images?.length ? (
          <p className="text-sm text-velvet-text/40">No images yet. Add your first one!</p>
        ) : (
          <div className="divide-y divide-velvet-border/20 rounded-xl border border-velvet-border/30">
            {images.map((img: any) => (
              <AdminItemRow
                key={img.id}
                id={img.id}
                type="image"
                title={img.title}
                shareId={img.share_id}
                categoryName={img.categories?.name}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
