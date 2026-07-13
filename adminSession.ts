import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, PDF_BUCKET } from '@/lib/supabaseServer';

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

  const { data: blob, error: dlError } = await supabase.storage
    .from(PDF_BUCKET)
    .download(file.storage_path);

  if (dlError || !blob) {
    return NextResponse.json({ error: 'Could not load file' }, { status: 404 });
  }

  const arrayBuffer = await blob.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      // inline (never attachment) so the browser never offers a "Save As" prompt of its own
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
