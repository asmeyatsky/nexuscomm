import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: 'API URL not configured' },
      { status: 502 }
    );
  }

  const path = request.nextUrl.pathname.replace(/^\/api/, '');
  const search = request.nextUrl.search;
  const destination = `${apiUrl}/api${path}${search}`;

  return NextResponse.rewrite(new URL(destination));
}

export const config = {
  matcher: '/api/:path*',
};
