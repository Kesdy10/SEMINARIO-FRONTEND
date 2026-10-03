import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Rutas públicas
  const publicRoutes = ["/login", "/register"];

  // Permitir acceso a las rutas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Si no existe token, enviar al login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si existe token, permitir el acceso
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};