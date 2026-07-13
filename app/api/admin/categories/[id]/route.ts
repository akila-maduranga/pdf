import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  // Un-assign the category from anything using it, rather than blocking the delete.
  await supabase.from('files').update({ category_id: null }).eq('category_id', params.id);
  await supabase.from('images').update({ category_id: null }).eq('category_id', params.id);
  await supabase.from('collections').update({ category_id: null }).eq('category_id', params.id);

  const { error } = await supabase.from('categories').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
