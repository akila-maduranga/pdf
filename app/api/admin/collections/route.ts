import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = supabaseServer();
  const { data: collections, error } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: collections || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const categoryId = body?.categoryId || null;

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('collections')
    .insert({ title, description, category_id: categoryId })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data });
}
