import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, IMAGE_BUCKET } from '@/lib/supabaseServer';
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
    return NextResponse.json({ error: 'Title and image file are required' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const folder = crypto.randomUUID();
  const ext = file.type.split('/')[1] || 'jpg';
  const storagePath = `${folder}/original.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, await file.arrayBuffer(), { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  let thumbnailPath: string | null = null;
  if (thumbnail && thumbnail.size > 0) {
    const tExt = thumbnail.type.split('/')[1] || 'jpg';
    thumbnailPath = `${folder}/thumb.${tExt}`;
    const { error: thumbError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(thumbnailPath, await thumbnail.arrayBuffer(), { contentType: thumbnail.type });
    if (thumbError) thumbnailPath = null;
  }

  // Generate a URL-friendly slug from the title
  const shareId = await generateUniqueSlug(title, async (slug) => {
    const { count } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('share_id', slug);
    return (count ?? 0) > 0;
  });

  const { data, error: insertError } = await supabase
    .from('images')
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