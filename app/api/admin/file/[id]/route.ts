import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, PDF_BUCKET, IMAGE_BUCKET } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') === 'image' ? 'image' : 'file';
  const table = type === 'file' ? 'files' : 'images';

  const supabase = supabaseServer();
  const { data: item, error } = await supabase.from(table).select('*').eq('id', params.id).single();
  if (error || !item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: events } = await supabase
    .from('events')
    .select('event_type, created_at')
    .eq('item_type', type)
    .eq('item_id', params.id)
    .order('created_at', { ascending: false });

  const { data: reactions } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('item_type', type)
    .eq('item_id', params.id);

  const views = (events || []).filter((e) => e.event_type === 'view').length;
  const linkClicks = (events || []).filter((e) => e.event_type === 'link_click').length;
  const reactionCounts: Record<string, number> = {};
  for (const r of reactions || []) reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;

  return NextResponse.json({
    item,
    stats: {
      totalViews: views + linkClicks,
      pageViews: views,
      linkClicks,
      reactionCounts,
      recentEvents: (events || []).slice(0, 20),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') === 'image' ? 'image' : 'file';
  const table = type === 'file' ? 'files' : 'images';

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.title === 'string') update.title = body.title.trim();
  if (typeof body.description === 'string') update.description = body.description.trim();
  if ('categoryId' in body) update.category_id = body.categoryId || null;

  const supabase = supabaseServer();
  const { error } = await supabase.from(table).update(update).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') === 'image' ? 'image' : 'file';
  const table = type === 'file' ? 'files' : 'images';
  const bucket = type === 'file' ? PDF_BUCKET : IMAGE_BUCKET;

  const supabase = supabaseServer();
  const { data: item } = await supabase.from(table).select('storage_path, thumbnail_path').eq('id', params.id).single();

  if (item) {
    const paths = [item.storage_path, item.thumbnail_path].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }

  await supabase.from('events').delete().eq('item_type', type).eq('item_id', params.id);
  await supabase.from('reactions').delete().eq('item_type', type).eq('item_id', params.id);
  const { error } = await supabase.from(table).delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
