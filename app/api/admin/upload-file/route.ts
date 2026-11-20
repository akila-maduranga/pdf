import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateUniqueSlug } from '@/lib/slugify';
import { normalizeR2Url } from '@/lib/r2';

export const runtime = 'nodejs';

// Adds a PDF by Cloudflare R2 URL (no file upload, no Supabase Storage).
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const fileUrlRaw = String(form.get('fileUrl') || '').trim();
  const thumbUrlRaw = String(form.get('thumbnailUrl') || '').trim();
  const categoryId = (String(form.get('categoryId') || '').trim() || null) as string | null;

  if (!title || !fileUrlRaw) {
    return NextResponse.json({ error: 'Title and PDF URL are required' }, { status: 400 });
  }

  const fileUrl = normalizeR2Url(fileUrlRaw);
  if (!fileUrl) {
    return NextResponse.json(
      { error: 'PDF URL must be a valid https Cloudflare R2 URL' },
      { status: 400 }
    );
  }

  let thumbnailUrl: string | null = null;
  if (thumbUrlRaw) {
    thumbnailUrl = normalizeR2Url(thumbUrlRaw);
    if (!thumbnailUrl) {
      return NextResponse.json(
        { error: 'Thumbnail URL must be a valid https Cloudflare R2 URL' },
        { status: 400 }
      );
    }
  }

  const supabase = supabaseServer();

  // Generate a slug-based share_id
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
      storage_path: fileUrl,
      thumbnail_path: thumbnailUrl,
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
