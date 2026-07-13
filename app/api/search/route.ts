import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ files: [], images: [], collections: [] });
  }

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: 'return=representation',
    'Content-Type': 'application/json',
  };

  const term = `%${q}%`;

  const [filesRes, imagesRes, collectionsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/files?select=id,title,description,share_id,thumbnail_path,category_id,categories(name,slug)&title=ilike.${encodeURIComponent(term)}&order=created_at.desc&limit=20`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/images?select=id,title,description,share_id,category_id,categories(name,slug)&title=ilike.${encodeURIComponent(term)}&order=created_at.desc&limit=20`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/collections?select=id,title,description,share_id,category_id,categories(name)&title=ilike.${encodeURIComponent(term)}&order=created_at.desc&limit=20`, { headers }),
  ]);

  const [files, images, collections] = await Promise.all([
    filesRes.json(),
    imagesRes.json(),
    collectionsRes.json(),
  ]);

  return NextResponse.json({
    files: Array.isArray(files) ? files : [],
    images: Array.isArray(images) ? images : [],
    collections: Array.isArray(collections) ? collections : [],
  });
}