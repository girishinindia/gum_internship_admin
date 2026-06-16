import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Everything except /login requires a staff session cookie. */
export function middleware(req: NextRequest): NextResponse {
  const hasSession = req.cookies.has('gum_rt');
  const { pathname } = req.nextUrl;
  if (pathname === '/login') {
    return hasSession ? NextResponse.redirect(new URL('/dashboard', req.url)) : NextResponse.next();
  }
  if (!hasSession) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!api|_next|favicon.ico).*)'] };
