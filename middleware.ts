import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get("authToken")?.value ||
    request.headers.get("authorization")?.split(" ")[1];

  const publicRoutes = [
    "/login",
    "/register",
    "/confirmation",
    "/",
    "/reset-password",
    "/update-password",
  ];

  const staticFiles = [
    "/_next/static",
    "/_next/image",
    "/favicon.ico",
    "/public",
    "/background2.png", //Ruta directa a mi imagen de fondo
  ];

  if (staticFiles.some((staticPath) => pathname.startsWith(staticPath))) {
    return NextResponse.next();
  }

  if (publicRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!token && !publicRoutes.includes(pathname)) {
    console.log(pathname);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
