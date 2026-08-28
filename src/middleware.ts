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
    const providedKey = adminKeyCookie || bearerToken;

    if (!verifyAdminKey(providedKey)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin key required.' },
          { status: 401 },
        );
      }
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin', '/api/admin/:path*'],
};
