import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const itemType = body?.itemType === 'image' ? 'image' : body?.itemType === 'file' ? 'file' : null;
  const itemId = body?.itemId as string | undefined;

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { count } = await supabase
    .from('collection_items')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', params.id);

  const { error } = await supabase.from('collection_items').insert({
    collection_id: params.id,
    item_type: itemType,
    item_id: itemId,
    part_number: (count || 0) + 1,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That item is already part of this collection' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Bulk reorder: body = { order: [collectionItemId, collectionItemId, ...] } in the new order.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const order = body?.order as number[] | undefined;
  if (!Array.isArray(order) || !order.length) {
    return NextResponse.json({ error: 'order array is required' }, { status: 400 });
  }

  const supabase = supabaseServer();
  await Promise.all(
    order.map((itemId, index) =>
      supabase
        .from('collection_items')
        .update({ part_number: index + 1 })
        .eq('id', itemId)
        .eq('collection_id', params.id)
    )
  );

  return NextResponse.json({ ok: true });
}
