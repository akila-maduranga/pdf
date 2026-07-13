import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', params.id)
    .single();
  if (error || !collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: items } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', params.id)
    .order('part_number', { ascending: true });

  const fileIds = (items || []).filter((i) => i.item_type === 'file').map((i) => i.item_id);
  const imageIds = (items || []).filter((i) => i.item_type === 'image').map((i) => i.item_id);

  const [{ data: files }, { data: images }] = await Promise.all([
    fileIds.length
      ? supabase.from('files').select('id, title, share_id').in('id', fileIds)
      : Promise.resolve({ data: [] as any[] }),
    imageIds.length
      ? supabase.from('images').select('id, title, share_id').in('id', imageIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const fileMap = new Map((files || []).map((f) => [f.id, f]));
  const imageMap = new Map((images || []).map((i) => [i.id, i]));

  const resolvedItems = (items || []).map((item) => {
    const source = item.item_type === 'file' ? fileMap.get(item.item_id) : imageMap.get(item.item_id);
    return {
      id: item.id,
      itemType: item.item_type,
      itemId: item.item_id,
      partNumber: item.part_number,
      title: source?.title || '(removed)',
      shareId: source?.share_id || null,
    };
  });

  return NextResponse.json({ collection, items: resolvedItems });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.title === 'string') update.title = body.title.trim();
  if (typeof body.description === 'string') update.description = body.description.trim();
  if ('categoryId' in body) update.category_id = body.categoryId || null;

  const supabase = supabaseServer();
  const { error } = await supabase.from('collections').update(update).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { error } = await supabase.from('collections').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
