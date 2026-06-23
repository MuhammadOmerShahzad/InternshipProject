import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password']

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public routes through immediately
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // Check for session cookie
    const sessionToken = request.cookies.get('session')?.value

    // No session → redirect to login
    if (!sessionToken) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Has session and trying to access login → redirect to dashboard
    if (sessionToken && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect root to dashboard
    if (sessionToken && pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
