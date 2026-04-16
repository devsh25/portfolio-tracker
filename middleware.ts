import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth", "/robots.txt"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.get("portfolio_auth");
  const expected = process.env.PORTFOLIO_PASSWORD;

  if (!expected) {
    return NextResponse.next(); // No password set, allow all (dev mode)
  }

  if (authCookie?.value === expected) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
