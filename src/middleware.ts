import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

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

export function middleware(req: NextRequest): NextResponse {
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
