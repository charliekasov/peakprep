
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('firebase-session-token')?.value;

  const protectedRoutes = [
    '/',
    '/students',
    '/assignments',
    '/assign-homework',
    '/needs-review',
    '/test-scores',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route) && (route !== '/' || pathname === '/'));

  // If it's a protected route, verify the token
  if (isProtectedRoute) {
    if (!sessionToken) {
      // No token, redirect to login
      return redirectToLogin(request);
    }

    try {
      // Verify the token with Firebase Admin SDK
      await adminAuth().verifySessionCookie(sessionToken, true);
      // Token is valid, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      // Token is invalid or expired, redirect to login
      console.error('Error verifying session cookie:', error);
      return redirectToLogin(request);
    }
  }

  // If the user is trying to access the login page with a valid token
  if (pathname === '/login' && sessionToken) {
    try {
      await adminAuth().verifySessionCookie(sessionToken, true);
      // If token is valid, redirect them to the dashboard
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      // If token is invalid, let them proceed to the login page
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  // Clear the invalid cookie
  response.cookies.delete('firebase-session-token');
  return response;
}


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

// This line is crucial for fixing the runtime error.
export const runtime = 'nodejs';
