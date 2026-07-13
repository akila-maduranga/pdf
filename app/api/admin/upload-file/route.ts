import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, PDF_BUCKET } from '@/lib/supabaseServer';
import { generateUniqueSlug } from '@/lib/slugify';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const file = form.get('file') as File | null;
  const thumbnail = form.get('thumbnail') as File | null;
  const categoryId = (String(form.get('categoryId') || '').trim() || null) as string | null;

  if (!title || !file) {
    return NextResponse.json({ error: 'Title and PDF file are required' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const folder = crypto.randomUUID();
  const storagePath = `${folder}/document.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(storagePath, await file.arrayBuffer(), { contentType: 'application/pdf' });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  let thumbnailPath: string | null = null;
  if (thumbnail && thumbnail.size > 0) {
    const ext = thumbnail.type.split('/')[1] || 'jpg';
    thumbnailPath = `${folder}/thumb.${ext}`;
    const { error: thumbError } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(thumbnailPath, await thumbnail.arrayBuffer(), { contentType: thumbnail.type });
    if (thumbError) thumbnailPath = null; // non-fatal, just skip the thumbnail
  }

  // Generate a URL-friendly slug from the title
  const shareId = await generateUniqueSlug(title, async (slug) => {
    const { count } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('share_id', slug);
    return (count ?? 0) > 0;
  });

  const { data, error: insertError } = await supabase
    .from('files')
    .insert({
      title,
      description,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      category_id: categoryId,
      share_id: shareId,
    })
    .select('id, share_id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, shareId: data.share_id });
}