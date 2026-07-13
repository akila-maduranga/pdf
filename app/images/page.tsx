import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ImagesPage() {
  noStore();
  const supabase = supabaseServer();
  const { data: images } = await supabase
    .from('images')
    .select('id, title, description, share_id')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-8">
      <Link href="/" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
        ← Vault
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">Images</h1>

      {!images?.length ? (
        <p className="mt-10 text-paper/50">Nothing here yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <Link
              key={img.id}
              href={`/view/${img.share_id}`}
              className="group overflow-hidden rounded border border-line/15 bg-white/[0.02] transition-colors hover:border-brass/50"
            >
              <div className="aspect-square overflow-hidden bg-vellum">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/thumb/image/${img.share_id}`}
                  alt={img.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-2.5">
                <p className="truncate font-body text-xs font-medium text-paper/85 group-hover:text-brass">
                  {img.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
