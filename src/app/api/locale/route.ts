import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { locale } = (await request.json()) as { locale: string };
  const validLocale = locale === 'kk' ? 'kk' : 'en';

  const response = NextResponse.json({ success: true, locale: validLocale });
  response.cookies.set('locale', validLocale, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
  });
  return response;
}
