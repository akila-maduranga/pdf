import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { fetchStored, imageTypeFor } from '@/lib/r2';

export const runtime = 'nodejs';

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

  // Fetched server-side from Cloudflare R2 so the browser never sees the R2 URL.
  const obj = await fetchStored(image.storage_path, 'image').catch(() => null);
  if (!obj || !obj.body) {
    return NextResponse.json({ error: 'Could not load image' }, { status: 404 });
  }

  const headers: Record<string, string> = {
    'Content-Type': imageTypeFor(image.storage_path, obj.contentType),
    'Content-Disposition': 'inline',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  };
  if (obj.contentLength) headers['Content-Length'] = obj.contentLength;

  return new NextResponse(obj.body, { status: 200, headers });
}
