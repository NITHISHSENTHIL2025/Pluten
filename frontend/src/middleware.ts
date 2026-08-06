import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isLoggedIn = request.cookies.get('client_auth')?.value === 'true';
    const userRole = request.cookies.get('user_role')?.value || 'CUSTOMER';
    const { pathname } = request.nextUrl;

    const isProtectedLibrary = pathname.startsWith('/library');
    const isAdminArea = pathname.startsWith('/admin');
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/verify';

    // 1. Block unauthenticated users from secure zones
    if (!isLoggedIn && (isProtectedLibrary || isAdminArea)) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname); 
        return NextResponse.redirect(loginUrl);
    }

    // 2. Strict Role-Based Access Control
    if (isLoggedIn && isAdminArea) {
        const allowedAdminRoles = ['SUPER_ADMIN', 'FINANCE_MANAGER', 'PRODUCT_MANAGER'];
        if (!allowedAdminRoles.includes(userRole)) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 3. Prevent logged-in users from seeing the login screen
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.next();

    // 4. Defeat Ghost Cache: Force browser to revalidate protected routes
    if (isProtectedLibrary || isAdminArea) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }

    return response;
}

export const config = {
    matcher: [
  "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
],
};