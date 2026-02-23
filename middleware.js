import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const target = token ? '/dashboard' : '/auth/login';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (pathname.startsWith('/auth/login') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/login'],
};
