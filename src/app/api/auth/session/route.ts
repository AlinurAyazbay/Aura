import { NextRequest, NextResponse } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'aura-optima-secret-change-in-production';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());

async function hmacSha256(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function createSignedCookie(value: string, secret: string): Promise<string> {
  return `${value}.${await hmacSha256(value, secret)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    if (!FIREBASE_API_KEY) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
    }

    // Verify token via Firebase Identity Toolkit REST API
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = (await verifyRes.json()) as {
      users?: Array<{ localId: string; email: string }>;
    };

    const user = data.users?.[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { localId: uid, email } = user;
    const isAdmin = ADMIN_EMAILS.includes(email ?? '');

    const response = NextResponse.json({ success: true, isAdmin });

    const SEVEN_DAYS = 7 * 24 * 60 * 60;
    const isSecure = process.env.NODE_ENV === 'production';

    response.cookies.set('aura_session', uid, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: SEVEN_DAYS,
      path: '/',
    });

    response.cookies.set(
      'aura_is_admin',
      await createSignedCookie(String(isAdmin), SESSION_SECRET),
      {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: SEVEN_DAYS,
        path: '/',
      }
    );

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('aura_session');
  response.cookies.delete('aura_is_admin');
  return response;
}
