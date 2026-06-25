import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// middleware work on all files of admin folder 
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export async function middleware(request) {
  // 🔥 FIXED LINE: Pass request directly or with explicit object parameters for edge compatibility
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET // Ensure your secret is passed explicitly here
  });
  
  const { pathname } = request.nextUrl;

  // Sign-in page check bypass logic
  if (token && pathname.startsWith('/admin/sign-in')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (!token && pathname.startsWith('/admin') && !pathname.startsWith('/admin/sign-in')) {
    return NextResponse.redirect(new URL('/admin/sign-in', request.url));
  } 

  // Check user role matrix safety guard
  if (token && pathname !== '/admin/sign-in') {
    if (token.role !== 'superadmin' && token.role !== 'admin' && token.role !== 'staff') {
        return NextResponse.redirect(new URL('/admin/sign-in?error=AccessDenied', request.url));
    }
  }

  return NextResponse.next(); // Yeh Next.js native flow ka next() hai, yeh bilkul perfect chalega!
}