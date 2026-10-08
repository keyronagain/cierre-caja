import { NextResponse } from "next/server";
import { obtenerSesion, origenValido } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  aFechaDB,
  diasDeSemana,
  hoyISO,
  inicioDeSemana,
  sumarDias,
  validarCierre,
} from "@/lib/semana";

// Guarda (o actualiza) el cierre de una semana. Las semanas nunca se borran:
// volver a guardar la misma semana solo corrige sus montos.
export async function POST(request: Request) {
  // El proxy ya exige sesión; se vuelve a comprobar aquí para no depender solo de él.
  if (!(await obtenerSesion())) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 },
    );
  }
  if (!origenValido(request)) {
    return NextResponse.json(
      { ok: false, error: "Origen no permitido" },
      { status: 403 },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const validacion = validarCierre(cuerpo);
  if (!validacion.ok) {
    return NextResponse.json(
      { ok: false, error: validacion.error },
      { status: 400 },
    );
  }
  const { fechaInicio, dias } = validacion.datos;

  if (fechaInicio > inicioDeSemana(hoyISO())) {
    return NextResponse.json(
      { ok: false, error: "No se puede cerrar una semana que aún no empieza" },
      { status: 400 },
    );
  }

  try {
    const prisma = getPrisma();
    const semana = await prisma.semana.upsert({
      where: { fechaInicio: aFechaDB(fechaInicio) },
      create: {
        fechaInicio: aFechaDB(fechaInicio),
        fechaFin: aFechaDB(sumarDias(fechaInicio, 6)),
      },
      update: { actualizadaEn: new Date() },
    });

    await prisma.$transaction(
      diasDeSemana(fechaInicio).map(({ fecha }, i) =>
        prisma.diaCierre.upsert({
          where: {
            semanaId_fecha: { semanaId: semana.id, fecha: aFechaDB(fecha) },
          },
          create: {
            semanaId: semana.id,
            fecha: aFechaDB(fecha),
            efectivo: dias[i].efectivo,
            sinpe: dias[i].sinpe,
          },
          update: { efectivo: dias[i].efectivo, sinpe: dias[i].sinpe },
        }),
      ),
    );

    return NextResponse.json({ ok: true, semanaId: semana.id });
  } catch (error) {
    console.error("Error al guardar el cierre", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el cierre. Intentá de nuevo." },
      { status: 500 },
    );
  }
}
