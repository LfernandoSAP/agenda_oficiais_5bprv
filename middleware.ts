import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && pathname === "/login") {
    const dest = session.user.isAdmin ? "/admin" : "/agenda";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (pathname.startsWith("/admin") && !session?.user?.isAdmin) {
    return NextResponse.redirect(new URL("/agenda", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
