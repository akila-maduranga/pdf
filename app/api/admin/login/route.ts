import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, MAX_AGE_SECONDS, createSessionToken } from '@/lib/adminSession';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    // small delay to blunt brute-forcing
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return res;
}
