import { cookies } from "next/headers";
import { COOKIE_SESION, verificarToken, type Sesion } from "./sesion";

/** Sesión del usuario actual (lee la cookie), o null si no hay sesión válida. */
export async function obtenerSesion(): Promise<Sesion | null> {
  const almacen = await cookies();
  return verificarToken(almacen.get(COOKIE_SESION)?.value);
}

/**
 * Protección extra contra peticiones de otros sitios (CSRF) en los POST:
 * si el navegador envía `Origin`, tiene que ser el mismo host de la app.
 */
export function origenValido(request: Request): boolean {
  const origen = request.headers.get("origin");
  if (!origen) return true; // peticiones que no vienen de un navegador
  try {
    return new URL(origen).host === request.headers.get("host");
  } catch {
    return false;
  }
}
