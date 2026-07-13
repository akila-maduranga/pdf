import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') === 'image' ? 'image' : 'file';
  const table = type === 'file' ? 'files' : 'images';

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from(table)
    .select('id, title')
    .order('title', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
