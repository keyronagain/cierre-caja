import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/sesion";

// Rutas que se pueden usar sin sesión. Todo lo demás exige login.
const PUBLICAS = new Set(["/login", "/api/login", "/api/logout", "/api/health"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sesion = await verificarToken(request.cookies.get(COOKIE_SESION)?.value);

  if (sesion && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (sesion || PUBLICAS.has(pathname)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 },
    );
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

// No corre sobre los archivos estáticos de Next ni sobre imágenes/íconos.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
