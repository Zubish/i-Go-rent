import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/bookings", "/payments"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth-token")?.value;

  if (authToken) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/signin", request.url);
  signInUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/bookings/:path*", "/payments/:path*"],
};
