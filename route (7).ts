import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import SiteHeader from '@/components/SiteHeader';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FilesPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
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

  let files = allFiles || [];

  if (searchParams.category) {
    files = files.filter((f: any) => f.categories?.slug === searchParams.category);
  }

  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    files = files.filter((f: any) => f.title?.toLowerCase().includes(query));
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 pb-24 sm:px-8 sm:pb-12">
        <h1 className="font-display text-3xl font-semibold text-text">Documents</h1>
        <p className="mt-1 text-text-muted text-sm">Browse all uploaded documents and PDFs.</p>

        <div className="mt-6 max-w-md">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <CategoryFilter categories={categories || []} basePath="/files" />
        </Suspense>

        {!files.length ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-text-dim">
            <p className="font-body text-sm">No documents yet</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((f: any) => (
              <div
                key={f.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden card-glow group relative"
              >
                <Link href={`/view/${f.share_id}`} className="block">
                  <div className="aspect-[4/5] bg-surface-2 flex items-center justify-center">
                    {f.thumbnail_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/thumb/file/${f.share_id}`}
                        alt={f.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="text-text-dim font-body text-2xl font-medium tracking-wide">PDF</span>
                    )}
                  </div>
                  <div className="p-3 pr-10">
                    {f.categories ? (
                      <span className="mb-1 inline-block rounded-full bg-rose/10 text-rose-light text-[10px] font-medium uppercase tracking-wider">
                        {f.categories.name}
                      </span>
                    ) : null}
                    <p className="truncate text-text text-sm font-medium group-hover:text-rose-light transition-colors">
                      {f.title}
                    </p>
                    {f.description ? (
                      <p className="mt-1 line-clamp-2 text-text-dim text-xs">{f.description}</p>
                    ) : null}
                  </div>
                </Link>
                <ShareButton
                  path={`/view/${f.share_id}`}
                  title={f.title}
                  className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}