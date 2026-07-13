import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, PDF_BUCKET, IMAGE_BUCKET } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

function contentTypeFor(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string; shareId: string } }
) {
  const { type, shareId } = params;
  if (type !== 'file' && type !== 'image') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const table = type === 'file' ? 'files' : 'images';
  const bucket = type === 'file' ? PDF_BUCKET : IMAGE_BUCKET;

  const { data: row, error } = await supabase
    .from(table)
    .select('thumbnail_path, storage_path')
    .eq('share_id', shareId)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // For images, fall back to the full image if no dedicated thumbnail was set.
  // For PDFs with no thumbnail, tell the client to show its own placeholder icon.
  const path = row.thumbnail_path || (type === 'image' ? row.storage_path : null);
  if (!path) {
    return NextResponse.json({ error: 'No thumbnail' }, { status: 404 });
  }

  const { data: blob, error: dlError } = await supabase.storage.from(bucket).download(path);
  if (dlError || !blob) {
    return NextResponse.json({ error: 'No thumbnail' }, { status: 404 });
  }

  const arrayBuffer = await blob.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentTypeFor(path),
      'Cache-Control': 'public, max-age=300',
    },
  });
}
