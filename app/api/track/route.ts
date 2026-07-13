import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const { itemType, itemId, deviceId, isDirectLink } = body as {
    itemType: 'file' | 'image';
    itemId: string;
    deviceId?: string;
    isDirectLink?: boolean;
  };

  if (!itemType || !itemId || !['file', 'image'].includes(itemType)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { error } = await supabase.from('events').insert({
    item_type: itemType,
    item_id: itemId,
    event_type: isDirectLink ? 'link_click' : 'view',
    device_id: deviceId || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
