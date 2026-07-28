// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // THE FIX: Look for the Vercel-owned visual cookie, not the Render-owned secure token
    const isLoggedIn = request.cookies.get('client_auth')?.value === 'true';
    const { pathname } = request.nextUrl;

    const isProtectedArea = pathname.startsWith('/admin') || pathname.startsWith('/library');
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/verify';

    // 1. Unauthenticated users trying to access secure areas
    if (!isLoggedIn && isProtectedArea) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname); 
        return NextResponse.redirect(loginUrl);
    }

    // 2. Authenticated users trying to view login pages
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};