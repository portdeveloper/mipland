import { NextResponse, type NextRequest } from "next/server";

import { NEGOTIATED_ROUTES, prefersMarkdown } from "@/lib/mip-routes";

// Keep in sync with NEGOTIATED_ROUTES keys below plus the admin gate. The
// matcher has to be a static literal, so a test asserts the two stay aligned.
export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/mip-3",
    "/mip-4",
    "/mip-7",
    "/mip-8",
    "/mip-12",
  ],
};

// --- Machine-readable content negotiation ---

function negotiate(
  req: NextRequest,
  route: { markdown: string; link: string },
): NextResponse {
  if (prefersMarkdown(req.headers.get("accept"))) {
    const res = NextResponse.rewrite(new URL(route.markdown, req.url));
    res.headers.set("Vary", "Accept");
    return res;
  }
  const res = NextResponse.next();
  res.headers.set("Link", route.link);
  res.headers.set("Vary", "Accept");
  return res;
}

// --- Admin Basic Auth ---

const REALM = "MIP Admin";

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function requireAdmin(req: NextRequest): NextResponse {
  const expected = process.env.ADMIN_PASSWORD;
  // Fail closed in production: a missing env var must not leave /admin open.
  // Fail open in dev so local /admin/chat works without a password env.
  if (!expected) {
    return process.env.NODE_ENV === "production"
      ? unauthorized()
      : NextResponse.next();
  }

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  const idx = decoded.indexOf(":");
  if (idx < 0) return unauthorized();
  const password = decoded.slice(idx + 1);

  if (!timingSafeEqual(password, expected)) return unauthorized();
  return NextResponse.next();
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) return requireAdmin(req);

  const route = NEGOTIATED_ROUTES[pathname];
  if (route) return negotiate(req, route);

  return NextResponse.next();
}
