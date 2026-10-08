import { NextResponse } from "next/server";
import { origenValido } from "@/lib/auth";
import { hashFalso, verificarClave } from "@/lib/clave";
import { getPrisma } from "@/lib/prisma";
import {
  COOKIE_SESION,
  DURACION_SESION_SEGUNDOS,
  OPCIONES_COOKIE,
  crearToken,
  sesionConfigurada,
} from "@/lib/sesion";

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

// Mismo mensaje para usuario inexistente, clave incorrecta y cuenta bloqueada:
// no revela qué usuarios existen.
const ERROR_CREDENCIALES =
  "Usuario o contraseña incorrectos. Si fallaste varias veces, esperá unos minutos.";

function respuestaError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  if (!sesionConfigurada()) {
    return respuestaError(
      "El inicio de sesión no está configurado en el servidor.",
      503,
    );
  }
  if (!origenValido(request)) return respuestaError("Origen no permitido", 403);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return respuestaError("JSON inválido", 400);
  }
  const { usuario, clave } = (cuerpo ?? {}) as Record<string, unknown>;
  if (
    typeof usuario !== "string" ||
    typeof clave !== "string" ||
    usuario.length === 0 ||
    clave.length === 0 ||
    usuario.length > 50 ||
    clave.length > 200
  ) {
    return respuestaError(ERROR_CREDENCIALES, 401);
  }

  try {
    const prisma = getPrisma();
    const nombre = usuario.trim().toLowerCase();
    const encontrado = await prisma.usuario.findUnique({ where: { nombre } });
    const ahora = new Date();
    const bloqueado =
      encontrado?.bloqueadoHasta != null && encontrado.bloqueadoHasta > ahora;

    // Siempre se calcula un hash, exista el usuario o no, para igualar los tiempos.
    const claveCorrecta = await verificarClave(
      clave,
      encontrado && !bloqueado ? encontrado.claveHash : await hashFalso(),
    );

    if (!encontrado || bloqueado || !claveCorrecta) {
      if (encontrado && !bloqueado) {
        const intentos = encontrado.intentosFallidos + 1;
        await prisma.usuario.update({
          where: { id: encontrado.id },
          data:
            intentos >= MAX_INTENTOS
              ? {
                  intentosFallidos: 0,
                  bloqueadoHasta: new Date(
                    ahora.getTime() + BLOQUEO_MINUTOS * 60_000,
                  ),
                }
              : { intentosFallidos: intentos },
        });
      }
      return respuestaError(ERROR_CREDENCIALES, 401);
    }

    if (encontrado.intentosFallidos > 0 || encontrado.bloqueadoHasta) {
      await prisma.usuario.update({
        where: { id: encontrado.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null },
      });
    }

    const token = await crearToken({
      usuarioId: encontrado.id,
      nombre: encontrado.nombre,
    });
    const respuesta = NextResponse.json({ ok: true });
    respuesta.cookies.set(COOKIE_SESION, token, {
      ...OPCIONES_COOKIE,
      maxAge: DURACION_SESION_SEGUNDOS,
    });
    return respuesta;
  } catch (error) {
    console.error("Error en el login", error);
    return respuestaError("No se pudo iniciar sesión. Intentá de nuevo.", 500);
  }
}
