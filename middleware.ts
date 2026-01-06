import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = [
  "/picks",
  "/ai-picks",
  "/props",
  "/reports",
  "/history",
  "/game-picks",
  "/games",
  "/soccer",
  "/soccer-picks",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never block API routes here (each route enforces its own auth as needed)
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "dev-secret" });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
