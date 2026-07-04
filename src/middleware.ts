import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter.
 * Tracks request counts per IP within a sliding window.
 * Resets on server restart — acceptable for this scale.
 */
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodic cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}, 300_000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "127.0.0.1";

  // Rate limit login attempts: 10 per minute per IP
  if (pathname.startsWith("/login")) {
    if (!rateLimit(`login:${ip}`, 10, 60_000)) {
      return new NextResponse("Too many login attempts. Please try again later.", { status: 429 });
    }
  }

  // Rate limit API routes: 60 per minute per IP
  if (pathname.startsWith("/api/")) {
    if (!rateLimit(`api:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|brand/|.*\\.svg$).*)",
  ],
};
