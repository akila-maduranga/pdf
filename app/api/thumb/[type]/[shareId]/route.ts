import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { fetchStored, imageTypeFor } from '@/lib/r2';

export const runtime = 'nodejs';

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

  const obj = await fetchStored(path, type).catch(() => null);
  if (!obj || !obj.body) {
    return NextResponse.json({ error: 'No thumbnail' }, { status: 404 });
  }

  return new NextResponse(obj.body, {
    status: 200,
    headers: {
      'Content-Type': imageTypeFor(path, obj.contentType),
      'Cache-Control': 'public, max-age=300',
    },
  });
}
