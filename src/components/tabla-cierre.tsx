"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Smartphone,
} from "lucide-react";
import {
  diasDeSemana,
  formatearMonto,
  formatoCorto,
  parsearMonto,
  sumarDias,
  type MontosDia,
} from "@/lib/semana";

type Campo = "efectivo" | "sinpe";
type Textos = Record<Campo, string>;
type Estado = "idle" | "guardando" | "error";

type Props = {
  /** Lunes de la semana mostrada, "YYYY-MM-DD". */
  inicio: string;
  /** Lunes de la semana actual: no se puede navegar más allá. */
  actual: string;
  /** Posición (0 = lunes) de hoy dentro de la semana mostrada, o -1 si no es esta semana. */
  indiceHoy: number;
  /** Montos ya guardados en la DB, o null si la semana nunca se guardó. */
  inicial: MontosDia[] | null;
  /** Mensaje si no se pudo leer lo guardado. */
  errorCarga?: string;
};

// Mismas columnas en el encabezado y en cada fila (solo escritorio).
const COLUMNAS = "md:grid-cols-[minmax(8rem,1fr)_1.2fr_1.2fr_1.2fr]";

const BOTON_SEMANA =
  "inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-linea bg-superficie px-4 text-base font-semibold text-tinta shadow-tarjeta transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/30 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none";

const aTexto = (monto: number) => (monto > 0 ? String(monto) : "");
const firmaDe = (montos: MontosDia[]) =>
  montos.map((m) => `${m.efectivo}|${m.sinpe}`).join(",");

function CampoMonto({
  id,
  etiqueta,
  dia,
  icono,
  valor,
  alCambiar,
  className,
}: {
  id: string;
  etiqueta: string;
  /** Solo para lectores de pantalla: a qué día pertenece el campo. */
  dia: string;
  icono: ReactNode;
  valor: string;
  alCambiar: (texto: string) => void;
  className: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-suave md:sr-only"
      >
        {icono}
        {etiqueta}
        <span className="sr-only"> {dia}</span>
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-tinta-tenue"
        >
          ₡
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="next"
          placeholder="0"
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          className="h-14 w-full rounded-xl border border-linea bg-campo pl-10 pr-3 text-2xl font-semibold tabular-nums text-tinta outline-none transition-all duration-200 ease-out placeholder:text-tinta-tenue hover:border-green-600/50 focus:border-green-600 focus:bg-campo-foco focus:ring-4 focus:ring-green-500/25 motion-reduce:transition-none md:h-16 md:text-3xl"
        />
      </div>
    </div>
  );
}

function TarjetaTotal({
  titulo,
  monto,
  icono,
}: {
  titulo: string;
  monto: number;
  icono: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-linea bg-superficie p-5 shadow-tarjeta sm:p-6">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-tinta-suave">
        {icono}
        {titulo}
      </p>
      <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums text-tinta md:text-3xl lg:text-4xl">
        <span className="mr-1 text-2xl font-semibold text-tinta-tenue">₡</span>
        {formatearMonto(monto)}
      </p>
    </div>
  );
}

export function TablaCierre({
  inicio,
  actual,
  indiceHoy,
  inicial,
  errorCarga,
}: Props) {
  const router = useRouter();
  const [cambiandoSemana, iniciarCambio] = useTransition();
  const dias = diasDeSemana(inicio);
  const esSemanaActual = inicio === actual;

  const [valores, setValores] = useState<Textos[]>(() =>
    dias.map((_, i) => ({
      efectivo: aTexto(inicial?.[i]?.efectivo ?? 0),
      sinpe: aTexto(inicial?.[i]?.sinpe ?? 0),
    })),
  );
  const [guardadoAntes, setGuardadoAntes] = useState(inicial !== null);
  const [firmaGuardada, setFirmaGuardada] = useState(() =>
    firmaDe(dias.map((_, i) => inicial?.[i] ?? { efectivo: 0, sinpe: 0 })),
  );
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensajeError, setMensajeError] = useState("");

  // Todo se calcula en vivo a partir de lo escrito, sin pasar por la DB.
  const montos: MontosDia[] = valores.map((v) => ({
    efectivo: parsearMonto(v.efectivo),
    sinpe: parsearMonto(v.sinpe),
  }));
  const totalEfectivo = montos.reduce((suma, m) => suma + m.efectivo, 0);
  const totalSinpe = montos.reduce((suma, m) => suma + m.sinpe, 0);
  const totalEntregado = totalEfectivo + totalSinpe;
  const diasConDatos = montos.filter((m) => m.efectivo + m.sinpe > 0).length;

  const firma = firmaDe(montos);
  const sinGuardar = firma !== firmaGuardada;
  const guardando = estado === "guardando";

  useEffect(() => {
    if (!sinGuardar) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sinGuardar]);

  function irASemana(destino: string) {
    if (
      sinGuardar &&
      !window.confirm(
        "Tenés cambios sin guardar en esta semana. ¿Querés salir sin guardarlos?",
      )
    ) {
      return;
    }
    iniciarCambio(() =>
      router.push(destino === actual ? "/" : `/?semana=${destino}`),
    );
  }

  function cambiar(indice: number, campo: Campo, texto: string) {
    const digitos = texto
      .replace(/\D/g, "")
      .replace(/^0+(?=\d)/, "")
      .slice(0, 9);
    setValores((previos) =>
      previos.map((v, i) => (i === indice ? { ...v, [campo]: digitos } : v)),
    );
    if (estado === "error") setEstado("idle");
  }

  async function guardar() {
    const firmaEnviada = firma;
    setEstado("guardando");
    setMensajeError("");
    try {
      const respuesta = await fetch("/api/cierre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaInicio: inicio, dias: montos }),
      });
      const datos = (await respuesta.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!respuesta.ok || !datos?.ok) {
        throw new Error(datos?.error ?? "No se pudo guardar el cierre.");
      }
      setFirmaGuardada(firmaEnviada);
      setGuardadoAntes(true);
      setEstado("idle");
    } catch (error) {
      setMensajeError(
        error instanceof Error ? error.message : "No se pudo guardar el cierre.",
      );
      setEstado("error");
    }
  }

  let textoEstado: ReactNode;
  if (estado === "error") {
    textoEstado = (
      <span className="flex items-center gap-1.5 text-red-700 dark:text-red-300">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        {mensajeError}
      </span>
    );
  } else if (guardando) {
    textoEstado = <span className="text-tinta-suave">Guardando…</span>;
  } else if (sinGuardar) {
    textoEstado = (
      <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
        <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
        <span className="whitespace-nowrap">Sin guardar</span>
      </span>
    );
  } else if (guardadoAntes) {
    textoEstado = (
      <span className="flex items-center gap-1.5 text-green-800 dark:text-green-300">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        Cierre guardado
      </span>
    );
  } else {
    textoEstado = (
      <span className="text-tinta-suave">Completá los montos de la semana</span>
    );
  }

  const botonInactivo = guardando || !sinGuardar;

  return (
    <div
      className="flex flex-col gap-6"
      aria-busy={cambiandoSemana}
    >
      <nav
        aria-label="Navegación entre semanas"
        className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]"
      >
        <button
          type="button"
          onClick={() => irASemana(sumarDias(inicio, -7))}
          disabled={cambiandoSemana}
          aria-label="Semana anterior"
          className={`${BOTON_SEMANA} order-1 sm:justify-self-start`}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          <span>
            <span className="hidden sm:inline">Semana </span>anterior
          </span>
        </button>

        <button
          type="button"
          onClick={() => irASemana(sumarDias(inicio, 7))}
          disabled={cambiandoSemana || esSemanaActual}
          aria-label="Semana siguiente"
          className={`${BOTON_SEMANA} order-2 sm:order-3 sm:justify-self-end`}
        >
          <span>
            <span className="hidden sm:inline">Semana </span>siguiente
          </span>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>

        <div className="order-3 col-span-2 text-center sm:order-2 sm:col-span-1">
          {esSemanaActual ? (
            <span className="hidden items-center gap-1.5 text-sm font-medium text-tinta-suave sm:inline-flex">
              {cambiandoSemana && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              Semana actual
            </span>
          ) : (
            <button
              type="button"
              onClick={() => irASemana(actual)}
              disabled={cambiandoSemana}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-green-800 px-5 text-sm font-semibold text-lime-100 shadow-tarjeta transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none"
            >
              {cambiandoSemana ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CalendarCheck className="size-4" aria-hidden="true" />
              )}
              Volver a la semana actual
            </button>
          )}
        </div>
      </nav>

      {errorCarga && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            No se pudo leer lo guardado de esta semana ({errorCarga}). Podés
            cargar los montos igual, pero revisá la conexión antes de guardar.
          </p>
        </div>
      )}

      <div
        className={`flex flex-col gap-6 transition-opacity duration-200 motion-reduce:transition-none ${
          cambiandoSemana ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <section
          aria-label="Efectivo y Sinpe por día"
          className="rounded-3xl border border-linea bg-superficie-suave p-3 shadow-tarjeta backdrop-blur-xl sm:p-5"
        >
          <div
            aria-hidden="true"
            className={`hidden gap-x-5 px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-widest text-tinta-suave md:grid ${COLUMNAS}`}
          >
            <span>Día</span>
            <span>Efectivo</span>
            <span>Sinpe</span>
            <span className="text-right">Total del día</span>
          </div>

          <ul className="flex flex-col gap-3">
            {dias.map(({ nombre, fecha }, i) => {
              const esHoy = i === indiceHoy;
              const totalDia = montos[i].efectivo + montos[i].sinpe;
              return (
                <li
                  key={fecha}
                  className={`grid grid-cols-2 items-center gap-x-3 gap-y-3 rounded-2xl border p-4 transition-colors duration-200 md:gap-x-5 ${COLUMNAS} ${
                    esHoy
                      ? "border-green-600/50 bg-hoy ring-2 ring-lime-300/70 dark:ring-lime-400/40"
                      : "border-linea bg-superficie"
                  }`}
                >
                  <div className="order-1">
                    <p className="flex items-center gap-2 text-xl font-bold tracking-tight text-tinta">
                      {nombre}
                      {esHoy && (
                        <span className="rounded-full bg-green-800 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-lime-200">
                          Hoy
                        </span>
                      )}
                    </p>
                    <p className="text-sm tabular-nums text-tinta-suave">
                      {formatoCorto(fecha)}
                    </p>
                  </div>

                  <CampoMonto
                    id={`efectivo-${i}`}
                    className="order-3 md:order-2"
                    etiqueta="Efectivo"
                    dia={nombre}
                    icono={<Banknote className="size-4" aria-hidden="true" />}
                    valor={valores[i].efectivo}
                    alCambiar={(t) => cambiar(i, "efectivo", t)}
                  />
                  <CampoMonto
                    id={`sinpe-${i}`}
                    className="order-4 md:order-3"
                    etiqueta="Sinpe"
                    dia={nombre}
                    icono={<Smartphone className="size-4" aria-hidden="true" />}
                    valor={valores[i].sinpe}
                    alCambiar={(t) => cambiar(i, "sinpe", t)}
                  />

                  <div className="order-2 text-right md:order-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave md:hidden">
                      Total del día
                    </p>
                    <p
                      aria-live="off"
                      className={`text-2xl font-bold tracking-tight tabular-nums md:text-3xl ${
                        totalDia > 0 ? "text-tinta" : "text-tinta-tenue"
                      }`}
                    >
                      <span className="mr-0.5 text-lg font-semibold opacity-50">
                        ₡
                      </span>
                      {formatearMonto(totalDia)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-label="Totales de la semana"
          className="grid gap-4 md:grid-cols-[1fr_1fr_1.35fr]"
        >
          <TarjetaTotal
            titulo="Total efectivo"
            monto={totalEfectivo}
            icono={<Banknote className="size-4" aria-hidden="true" />}
          />
          <TarjetaTotal
            titulo="Total sinpe"
            monto={totalSinpe}
            icono={<Smartphone className="size-4" aria-hidden="true" />}
          />
          <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-green-700 via-green-800 to-green-950 p-5 text-white shadow-[0_20px_50px_-12px_rgba(5,46,22,0.6)] sm:p-6">
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-10 -z-10 size-40 rounded-full bg-lime-300/25 blur-3xl"
            />
            <p className="text-sm font-semibold uppercase tracking-wide text-lime-200">
              Total entregado
            </p>
            <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums md:text-4xl lg:text-5xl">
              <span className="mr-1 text-3xl font-semibold text-lime-200/70">
                ₡
              </span>
              {formatearMonto(totalEntregado)}
            </p>
            <p className="mt-3 text-sm text-green-100/80">
              {diasConDatos} de 7 días con montos
            </p>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-superficie-suave px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0 text-sm font-medium" aria-live="polite">
            <p className="md:hidden">
              <span className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">
                Entregado
              </span>{" "}
              <span className="text-xl font-bold tabular-nums text-tinta">
                ₡{formatearMonto(totalEntregado)}
              </span>
            </p>
            <p>{textoEstado}</p>
          </div>
          <button
            type="button"
            onClick={guardar}
            disabled={botonInactivo}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-green-700 px-6 text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(21,128,61,0.7)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/40 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-tinta/15 disabled:text-tinta/50 disabled:shadow-none motion-reduce:transition-none md:min-w-56"
          >
            {guardando ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-5" aria-hidden="true" />
            )}
            {guardando ? "Guardando…" : "Guardar cierre"}
          </button>
        </div>
      </div>
    </div>
  );
}
