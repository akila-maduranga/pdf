import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemType = searchParams.get('itemType');
  const itemId = searchParams.get('itemId');
  const deviceId = searchParams.get('deviceId');

  if (!itemType || !itemId) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji, device_id')
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  let mine: string | null = null;
  for (const row of data || []) {
    counts[row.emoji] = (counts[row.emoji] || 0) + 1;
    if (deviceId && row.device_id === deviceId) mine = row.emoji;
  }

  return NextResponse.json({ counts, mine });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const { itemType, itemId, deviceId, emoji } = body as {
    itemType: 'file' | 'image';
    itemId: string;
    deviceId: string;
    emoji: string | null;
  };

  if (!itemType || !itemId || !deviceId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabase = supabaseServer();

  if (!emoji) {
    // removing a reaction
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .eq('device_id', deviceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from('reactions')
    .upsert(
      { item_type: itemType, item_id: itemId, device_id: deviceId, emoji },
      { onConflict: 'item_type,item_id,device_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
