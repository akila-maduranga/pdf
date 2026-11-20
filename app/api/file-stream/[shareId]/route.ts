import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { fetchStored } from '@/lib/r2';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { shareId: string } }) {
  const supabase = supabaseServer();

  const { data: file, error } = await supabase
    .from('files')
    .select('storage_path, title')
    .eq('share_id', params.shareId)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetched server-side from Cloudflare R2 so the browser never sees the R2 URL.
  const obj = await fetchStored(file.storage_path, 'file').catch(() => null);
  if (!obj || !obj.body) {
    return NextResponse.json({ error: 'Could not load file' }, { status: 404 });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    // inline (never attachment) so the browser never offers a "Save As" prompt of its own
    'Content-Disposition': 'inline',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  };
  if (obj.contentLength) headers['Content-Length'] = obj.contentLength;

  return new NextResponse(obj.body, { status: 200, headers });
}
