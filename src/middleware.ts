import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const isProtectedRoute = pathname.startsWith("/dashboard");

  // 🔒 If not logged in and trying to access protected routes
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ If logged in and trying to access signin or signup page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/pricing") {
  }

  return NextResponse.next();
}
