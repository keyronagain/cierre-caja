import { jwtVerify, SignJWT } from "jose";

// La sesión es un JWT (HS256) en una cookie httpOnly. Este archivo no importa nada de
// next/headers para poder usarse tanto en el proxy como en route handlers y páginas.

export const COOKIE_SESION = "sesion";
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 24 * 30; // 30 días

export type Sesion = { usuarioId: number; nombre: string };

// Si falta SESSION_SECRET no hay forma de firmar ni validar: se falla cerrado.
function clave(): Uint8Array | null {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) return null;
  return new TextEncoder().encode(secreto);
}

export function sesionConfigurada(): boolean {
  return clave() !== null;
}

export async function crearToken(sesion: Sesion): Promise<string> {
  const secreto = clave();
  if (!secreto) throw new Error("SESSION_SECRET no está configurada");
  return new SignJWT({ nombre: sesion.nombre })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(sesion.usuarioId))
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEGUNDOS}s`)
    .sign(secreto);
}

/** Devuelve la sesión si el token es válido (firma y vencimiento); si no, null. */
export async function verificarToken(
  token: string | undefined,
): Promise<Sesion | null> {
  const secreto = clave();
  if (!token || !secreto) return null;
  try {
    const { payload } = await jwtVerify(token, secreto, {
      algorithms: ["HS256"],
    });
    const usuarioId = Number(payload.sub);
    if (!Number.isInteger(usuarioId) || typeof payload.nombre !== "string") {
      return null;
    }
    return { usuarioId, nombre: payload.nombre };
  } catch {
    return null;
  }
}

export const OPCIONES_COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
