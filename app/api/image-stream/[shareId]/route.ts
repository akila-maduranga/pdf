import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, IMAGE_BUCKET } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

function contentTypeFor(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

export async function GET(req: NextRequest, { params }: { params: { shareId: string } }) {
  const supabase = supabaseServer();

  const { data: image, error } = await supabase
    .from('images')
    .select('storage_path')
    .eq('share_id', params.shareId)
    .single();

  if (error || !image) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: blob, error: dlError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .download(image.storage_path);

  if (dlError || !blob) {
    return NextResponse.json({ error: 'Could not load image' }, { status: 404 });
  }

  const arrayBuffer = await blob.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentTypeFor(image.storage_path),
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
