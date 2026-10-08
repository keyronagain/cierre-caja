import { NextResponse } from "next/server";
import { origenValido } from "@/lib/auth";
import { COOKIE_SESION, OPCIONES_COOKIE } from "@/lib/sesion";

export async function POST(request: Request) {
  if (!origenValido(request)) {
    return NextResponse.json(
      { ok: false, error: "Origen no permitido" },
      { status: 403 },
    );
  }
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, "", { ...OPCIONES_COOKIE, maxAge: 0 });
  return respuesta;
}
