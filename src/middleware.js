import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export async function middleware(request) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const { pathname } = request.nextUrl;

  // TASK 2: Immediate Session Invalidation for Blocked Team Members with Open Tabs
  if (token && token.isBlocked) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Your account access has been restricted. Please contact your administrator for assistance." 
        },
        { status: 403 }
      );
    }
    
    const redirectUrl = new URL('/admin/sign-in', request.url);
    redirectUrl.searchParams.set('error', 'AccountRestricted');
    return NextResponse.redirect(redirectUrl);
  }

  // Sign-in page check bypass logic for active non-blocked users
  if (token && !token.isBlocked && pathname.startsWith('/admin/sign-in')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Protect all /admin routes for unauthenticated users
  if (!token && pathname.startsWith('/admin') && !pathname.startsWith('/admin/sign-in')) {
    return NextResponse.redirect(new URL('/admin/sign-in', request.url));
  } 

  // Role matrix safety guard
  if (token && !token.isBlocked && pathname !== '/admin/sign-in') {
    const validRoles = ['superadmin', 'admin', 'staff', 'manager', 'inventory'];
    if (!validRoles.includes(token.role)) {
      const redirectUrl = new URL('/admin/sign-in', request.url);
      redirectUrl.searchParams.set('error', 'UnregisteredGoogle');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}