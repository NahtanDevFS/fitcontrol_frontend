import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get("authToken")?.value ||
    request.headers.get("authorization")?.split(" ")[1]; //También verifica el header

  //Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/login",
    "/register",
    "/confirmation",
    "/",
    "/reset-password",
    "/update-password",
  ];

  //Excluir archivos estáticos y de imagen
  const staticFiles = [
    "/_next/static",
    "/_next/image",
    "/favicon.ico",
    "/public", //permitir la ruta public de mis imágenes
    "/background2.png", //Ruta directa a mi imagen de fondo
  ];

  //Si es un archivo estático o imagen, permitir el acceso
  if (staticFiles.some((staticPath) => pathname.startsWith(staticPath))) {
    return NextResponse.next();
  }

  //Si el usuario está en una ruta pública y tiene token, redirigir al dashboard
  if (publicRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  //Si el usuario no tiene token y está intentando acceder a una ruta protegida
  if (!token && !publicRoutes.includes(pathname)) {
    console.log(pathname);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
