import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export default async function FilesPage() {
  const supabase = supabaseServer();
  const { data: files } = await supabase
    .from('files')
    .select('id, title, description, share_id, thumbnail_path')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-8">
      <Link href="/" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
        ← Vault
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">Documents</h1>

      {!files?.length ? (
        <p className="mt-10 text-paper/50">Nothing here yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {files.map((f) => (
            <Link
              key={f.id}
              href={`/view/${f.share_id}`}
              className="group overflow-hidden rounded border border-line/15 bg-white/[0.02] transition-colors hover:border-brass/50"
            >
              <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-vellum">
                {f.thumbnail_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/thumb/file/${f.share_id}`}
                    alt={f.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-4xl text-ink/20">PDF</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-body text-sm font-medium text-paper/90 group-hover:text-brass">
                  {f.title}
                </p>
                {f.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-paper/45">{f.description}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
