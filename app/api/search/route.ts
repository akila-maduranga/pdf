import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 50);
  const supabase = supabaseServer();
  const pattern = `%${q}%`;

  const [filesRes, imagesRes, collectionsRes] = await Promise.all([
    supabase
      .from('files')
      .select('id, title, description, share_id, thumbnail_path, category_id, categories(name, slug)')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('images')
      .select('id, title, description, share_id, category_id, categories(name, slug)')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('collections')
      .select('id, title, description, share_id, category_id, categories(name, slug)')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  const files = (filesRes.data || []).map((f: any) => ({
    type: 'file' as const,
    id: f.id,
    title: f.title,
    description: f.description,
    shareId: f.share_id,
    hasThumbnail: !!f.thumbnail_path,
    category: Array.isArray(f.categories) ? f.categories[0]?.name : f.categories?.name || null,
  }));

  const images = (imagesRes.data || []).map((i: any) => ({
    type: 'image' as const,
    id: i.id,
    title: i.title,
    description: i.description,
    shareId: i.share_id,
    hasThumbnail: false,
    category: Array.isArray(i.categories) ? i.categories[0]?.name : i.categories?.name || null,
  }));

  const collections = (collectionsRes.data || []).map((c: any) => ({
    type: 'collection' as const,
    id: c.id,
    title: c.title,
    description: c.description,
    shareId: c.share_id,
    hasThumbnail: false,
    category: Array.isArray(c.categories) ? c.categories[0]?.name : c.categories?.name || null,
  }));

  const all = [...files, ...images, ...collections];
  const total = all.length;

  // Sort: title matches first, then description matches
  const lowerQ = q.toLowerCase();
  all.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(lowerQ);
    const bTitle = b.title.toLowerCase().includes(lowerQ);
    if (aTitle && !bTitle) return -1;
    if (!aTitle && bTitle) return 1;
    return 0;
  });

  return NextResponse.json({
    results: all.slice(0, limit),
    total,
    query: q,
  });
}
