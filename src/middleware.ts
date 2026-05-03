// Next.js requires this file to be named middleware.ts.
// The implementation logic lives in src/proxy.ts.
import { proxy } from './proxy';

export const middleware = proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
