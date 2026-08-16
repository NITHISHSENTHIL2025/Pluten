import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
    const response = NextResponse.next();
    const pathname = request.nextUrl.pathname;

    const isProtectedPage = pathname === '/library' || pathname === '/profile' || pathname.startsWith('/admin');

    if (isProtectedPage) {
        response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    }

    return response;
}

export const config = {
    matcher: [
        '/library/:path*',
        '/profile/:path*',
        '/admin/:path*',
    ],
};
