// This file contains the middleware logic (proxy).
// Next.js requires middleware to live in src/middleware.ts — see that file for the export.
// Uses Web Crypto API (not Node crypto) so it runs in the Edge Runtime.

import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/invest', '/profile', '/vote', '/admin'];

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

async function verifySignedCookie(cookieValue: string, secret: string): Promise<string | null> {
  const lastDot = cookieValue.lastIndexOf('.');
  if (lastDot === -1) return null;
  const value = cookieValue.substring(0, lastDot);
  const sig = cookieValue.substring(lastDot + 1);
  const expected = await hmacSha256(value, secret);
  if (expected.length !== sig.length) return null;
  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0 ? value : null;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  const sessionCookie = request.cookies.get('aura_session')?.value;
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin')) {
    const secret = process.env.SESSION_SECRET ?? 'aura-optima-secret-change-in-production';
    const isAdminCookie = request.cookies.get('aura_is_admin')?.value;
    const isAdminValue = isAdminCookie
      ? await verifySignedCookie(isAdminCookie, secret)
      : null;
    if (isAdminValue !== 'true') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}
