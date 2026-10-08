// Lógica pura de semanas y montos (sin dependencias de React ni de la DB).
// Las fechas viajan como strings "YYYY-MM-DD" para evitar problemas de zona horaria.

const ZONA_HORARIA = "America/Costa_Rica";

export const NOMBRES_DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

// Colones enteros. 999.999.999 cabe de sobra en un Int de Postgres.
export const MONTO_MAX = 999_999_999;

export type MontosDia = { efectivo: number; sinpe: number };

export type CierreEntrada = { fechaInicio: string; dias: MontosDia[] };

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha de hoy en Costa Rica (el servidor corre en UTC). */
export function hoyISO(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

function aUTC(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Convierte "YYYY-MM-DD" al Date (medianoche UTC) que se guarda en columnas @db.Date. */
export function aFechaDB(iso: string): Date {
  return aUTC(iso);
}

export function deFechaDB(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function esFechaISO(valor: unknown): valor is string {
  if (typeof valor !== "string" || !FECHA_ISO.test(valor)) return false;
  return deFechaDB(aUTC(valor)) === valor; // descarta fechas inexistentes (30/02)
}

export function sumarDias(iso: string, dias: number): string {
  const fecha = aUTC(iso);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return deFechaDB(fecha);
}

export function esLunes(iso: string): boolean {
  return aUTC(iso).getUTCDay() === 1;
}

/** Lunes de la semana que contiene la fecha dada (la semana va de Lunes a Domingo). */
export function inicioDeSemana(iso: string): string {
  const diasDesdeLunes = (aUTC(iso).getUTCDay() + 6) % 7;
  return sumarDias(iso, -diasDesdeLunes);
}

/**
 * Semana (lunes) a mostrar según el parámetro `?semana=YYYY-MM-DD` de la URL.
 * Un valor inválido cae en la semana actual y no se permiten semanas futuras.
 */
export function resolverSemana(parametro: unknown, hoy: string): string {
  const actual = inicioDeSemana(hoy);
  if (!esFechaISO(parametro)) return actual;
  const pedida = inicioDeSemana(parametro);
  return pedida > actual ? actual : pedida; // "YYYY-MM-DD" ordena como texto
}

export function diasDeSemana(inicio: string) {
  return NOMBRES_DIAS.map((nombre, i) => ({
    nombre,
    fecha: sumarDias(inicio, i),
  }));
}

/** "2026-10-05" -> "5/10/26" */
export function formatoCorto(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return `${dia}/${mes}/${String(anio).slice(-2)}`;
}

/** "5/10/26 a 11/10/26" */
export function formatearRango(inicio: string): string {
  return `${formatoCorto(inicio)} a ${formatoCorto(sumarDias(inicio, 6))}`;
}

const SEPARADOR_MILES = "\u00a0"; // espacio sin salto, como se escribe en Costa Rica

/** 1250000 -> "1 250 000" */
export function formatearMonto(monto: number): string {
  return String(monto).replace(/\B(?=(\d{3})+(?!\d))/g, SEPARADOR_MILES);
}

/** Texto del input -> entero. Solo se aceptan dígitos; vacío vale 0. */
export function parsearMonto(texto: string): number {
  const digitos = texto.replace(/\D/g, "").slice(0, String(MONTO_MAX).length);
  return digitos === "" ? 0 : Math.min(Number(digitos), MONTO_MAX);
}

function esMontoValido(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor >= 0 &&
    valor <= MONTO_MAX
  );
}

/** Valida el cuerpo de POST /api/cierre. */
export function validarCierre(
  cuerpo: unknown,
): { ok: true; datos: CierreEntrada } | { ok: false; error: string } {
  if (typeof cuerpo !== "object" || cuerpo === null) {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const { fechaInicio, dias } = cuerpo as Record<string, unknown>;

  if (!esFechaISO(fechaInicio) || !esLunes(fechaInicio)) {
    return { ok: false, error: "La semana debe empezar un lunes (YYYY-MM-DD)" };
  }
  if (!Array.isArray(dias) || dias.length !== 7) {
    return { ok: false, error: "Se esperan los 7 días de la semana" };
  }
  const montos: MontosDia[] = [];
  for (const dia of dias) {
    const { efectivo, sinpe } = (dia ?? {}) as Record<string, unknown>;
    if (!esMontoValido(efectivo) || !esMontoValido(sinpe)) {
      return {
        ok: false,
        error: `Los montos deben ser enteros entre 0 y ${MONTO_MAX}`,
      };
    }
    montos.push({ efectivo, sinpe });
  }
  return { ok: true, datos: { fechaInicio, dias: montos } };
}
