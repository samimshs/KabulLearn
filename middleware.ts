import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Holding page — rewrite all traffic to the coming-soon static file.
// Restore the original auth middleware (git show HEAD~1:middleware.ts) when going live.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/coming-soon.html") return NextResponse.next();
  return NextResponse.rewrite(new URL("/coming-soon.html", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)" ]
};
