
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
    
    const options = {
        name: 'firebase-session-token',
        value: sessionCookie,
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set(options);

    return response;

  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
