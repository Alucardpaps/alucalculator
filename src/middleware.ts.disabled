import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminKey } from '@/admin/verify-admin-key';

/**
 * Middleware — protects /admin and /api/admin routes at the edge using verifyAdminKey.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminKeyCookie =
      request.cookies.get('ADMIN_KEY')?.value || request.cookies.get('alu_admin_key')?.value;
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const urlKey = request.nextUrl.searchParams.get('key');
    const providedKey = adminKeyCookie || bearerToken || urlKey;

    if (!verifyAdminKey(providedKey)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin key required.' },
          { status: 401 },
        );
      }
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // If access was granted via URL query key, set the session cookie and redirect clean
    if (urlKey && verifyAdminKey(urlKey)) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete('key');
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set('alu_admin_key', urlKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin', '/api/admin/:path*'],
};
