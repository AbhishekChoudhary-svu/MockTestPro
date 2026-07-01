import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If path starts with /admin, ensure role is admin
    if (path.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Protect authenticated paths
  matcher: [
    "/profile",
    "/profile/:path*",
    "/exam/:path*",
    "/my-tests",
    "/my-tests/:path*",
    "/leaderboard",
    "/admin/:path*",
  ],
};
