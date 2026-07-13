import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from './lib/adminSession';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login');

  if (isAdminArea || isAdminApi) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const valid = await verifySessionToken(token);
    if (!valid) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
