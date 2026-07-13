import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { hybridPath } from '@/lib/slugify';
import SiteHeader from '@/components/SiteHeader';
import CategoryFilter from '@/components/CategoryFilter';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FilesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  noStore();
  const supabase = supabaseServer();

  const [{ data: categories }, { data: allFiles }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('files')
      .select('id, title, description, share_id, thumbnail_path, category_id, categories(name, slug)')
      .order('created_at', { ascending: false }),
  ]);

  const files = searchParams.category
    ? (allFiles || []).filter((f: any) => f.categories?.slug === searchParams.category)
    : allFiles || [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass/70">The paper stash</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Documents</h1>
        <p className="mt-2 text-sm text-paper/50">Browse and enjoy our collection of documents.</p>

        <Suspense fallback={null}>
          <CategoryFilter categories={categories || []} basePath="/files" />
        </Suspense>

        {!files.length ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="text-4xl">📂</span>
            <p className="mt-4 text-lg font-medium text-paper/70">No documents yet</p>
            <p className="mt-1 text-sm text-paper/40">Check back soon for new uploads.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {files.map((f: any) => (
              <div
                key={f.id}
                className="group relative overflow-hidden rounded-lg border border-line/15 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-brass/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              >
                <Link href={hybridPath('/view', f.share_id, f.title)} className="block">
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-vellum">
                    {f.thumbnail_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/thumb/file/${f.share_id}`}
                        alt={f.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="font-mono text-4xl text-ink/20">PDF</span>
                    )}
                  </div>
                  <div className="p-3 pr-11">
                    {f.categories ? (
                      <span className="mb-1 inline-block rounded-full bg-brass/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brass">
                        {f.categories.name}
                      </span>
                    ) : null}
                    <p className="truncate font-body text-sm font-medium text-paper/90 group-hover:text-brass">
                      {f.title}
                    </p>
                    {f.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-paper/45">{f.description}</p>
                    ) : null}
                  </div>
                </Link>
                <ShareButton
                  shareId={f.share_id}
                  title={f.title}
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
