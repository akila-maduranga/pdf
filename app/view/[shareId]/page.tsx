import { supabaseServer } from '@/lib/supabaseServer';
import PdfViewer from '@/components/PdfViewer';
import ImageViewer from '@/components/ImageViewer';
import ReactionBar from '@/components/ReactionBar';
import ViewTracker from '@/components/ViewTracker';
import ViewOnlyGuard from '@/components/ViewOnlyGuard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getItem(shareId: string) {
  const supabase = supabaseServer();

  const { data: file } = await supabase
    .from('files')
    .select('id, title, description, share_id')
    .eq('share_id', shareId)
    .single();
  if (file) return { type: 'file' as const, item: file };

  const { data: image } = await supabase
    .from('images')
    .select('id, title, description, share_id')
    .eq('share_id', shareId)
    .single();
  if (image) return { type: 'image' as const, item: image };

  return null;
}

export default async function ViewPage({ params }: { params: { shareId: string } }) {
  const result = await getItem(params.shareId);
  if (!result) notFound();

  const { type, item } = result;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-8">
      <ViewOnlyGuard />
      <ViewTracker itemType={type} itemId={item.id} />

      <Link href="/" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
        ← Vault
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-paper sm:text-3xl">{item.title}</h1>
      {item.description ? <p className="mt-2 text-paper/60">{item.description}</p> : null}

      <div className="mt-8">
        {type === 'file' ? (
          <PdfViewer shareId={item.share_id} />
        ) : (
          <ImageViewer shareId={item.share_id} alt={item.title} />
        )}
      </div>

      <div className="mt-8 border-t border-line/10 pt-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-paper/40">React</p>
        <ReactionBar itemType={type} itemId={item.id} />
      </div>

      <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-wider text-paper/25">
        View only · downloading is disabled
      </p>
    </main>
  );
}
