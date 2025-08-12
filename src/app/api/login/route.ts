
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  try {
    // Note: In a real production app, you would verify the ID token here
    // with the Firebase Admin SDK to ensure it's valid.
    // For this prototype, we are trusting the client-side authentication.
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const cookieStore = cookies();
    
    cookieStore.set('firebase-session-token', idToken, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting session cookie:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
