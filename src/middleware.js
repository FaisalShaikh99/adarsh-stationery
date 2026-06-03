import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// middleware work on all files of admin folder 
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export async function middleware(request) {
  const token = await getToken({ req: request });
  const {pathname} = request.nextUrl;


  if (
    token &&
    (pathname.startsWith('/admin/sign-in'))
  ) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (!token && pathname.startsWith('/admin/:path*')) {
    return NextResponse.redirect(new URL('/admin/sign-in', request.url));
  }

  // check user role

 if (token && pathname !== '/admin/sign-in') {
    if (token.role !== 'superadmin' && token.role !== 'admin' && token.role !== 'staff') {
        return NextResponse.redirect(new URL('/admin/sign-in?error=AccessDenied', request.url));
    }
 }
  return NextResponse.next();
}