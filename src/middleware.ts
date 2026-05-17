import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/today", "/goals"];

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/login";

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!token && isProtected) {
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  if (token && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/today/:path*",
    "/goals/:path*",
    "/signin",
    "/signup",
    "/login",
  ],
};
