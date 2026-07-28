// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // 1. Grab the secure HttpOnly token from the incoming request
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 2. Define your security zones
    const isProtectedArea = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/verify';

    // 3. The Bouncer Logic: No Token + Protected Area = Kick to Login
    if (!token && isProtectedArea) {
        const loginUrl = new URL('/login', request.url);
        // Smart routing: Remember where they were trying to go so we can send them there after they log in
        loginUrl.searchParams.set('redirect', pathname); 
        return NextResponse.redirect(loginUrl);
    }

    // 4. The Bouncer Logic: Has Token + Auth Page = Kick to Home
    // (If they are already logged in, they shouldn't be looking at the login page)
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 5. If they pass the checks, let them proceed normally
    return NextResponse.next();
}

// 6. The Matcher: Tells Next.js exactly which routes to run this security check on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};