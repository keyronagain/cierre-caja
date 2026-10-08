import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarDays } from "lucide-react";
import { CanchaHeader } from "@/components/cancha-header";
import { TablaCierre } from "@/components/tabla-cierre";
import { getPrisma } from "@/lib/prisma";
import {
  aFechaDB,
  deFechaDB,
  diasDeSemana,
  formatearRango,
  hoyISO,
  inicioDeSemana,
  type MontosDia,
} from "@/lib/semana";

type Guardado =
  | { ok: true; dias: MontosDia[] | null }
  | { ok: false; error: string };

async function leerCierre(inicio: string): Promise<Guardado> {
  try {
    const semana = await getPrisma().semana.findUnique({
      where: { fechaInicio: aFechaDB(inicio) },
      include: { dias: true },
    });
    if (!semana) return { ok: true, dias: null };

    const porFecha = new Map(semana.dias.map((d) => [deFechaDB(d.fecha), d]));
    return {
      ok: true,
      dias: diasDeSemana(inicio).map(({ fecha }) => ({
        efectivo: porFecha.get(fecha)?.efectivo ?? 0,
        sinpe: porFecha.get(fecha)?.sinpe ?? 0,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// "Hoy" depende de la petición, así que se excluye del prerender (Cache Components).
async function RangoSemana() {
  await connection();
  const inicio = inicioDeSemana(hoyISO());
  return (
    <div className="w-fit whitespace-nowrap rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20 backdrop-blur-xl">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-lime-300">
        <CalendarDays className="size-4" aria-hidden="true" />
        Semana
      </p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-white sm:text-3xl">
        {formatearRango(inicio)}
      </p>
    </div>
  );
}

async function CierreActual() {
  await connection();
  const hoy = hoyISO();
  const inicio = inicioDeSemana(hoy);
  const guardado = await leerCierre(inicio);
  const indiceHoy = diasDeSemana(inicio).findIndex((d) => d.fecha === hoy);

  return (
    <TablaCierre
      // Si cambia la semana, se reinicia el estado del formulario.
      key={inicio}
      inicio={inicio}
      indiceHoy={indiceHoy}
      inicial={guardado.ok ? guardado.dias : null}
      errorCarga={guardado.ok ? undefined : guardado.error}
    />
  );
}

function RangoEsqueleto() {
  return (
    <div className="h-[4.5rem] w-60 animate-pulse rounded-2xl bg-white/10" />
  );
}

function TablaEsqueleto() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl bg-green-900/5 md:h-24"
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-36 pt-4 sm:px-6 sm:pt-6 md:pb-12">
      <div className="flex flex-col gap-6">
        <CanchaHeader>
          <Suspense fallback={<RangoEsqueleto />}>
            <RangoSemana />
          </Suspense>
        </CanchaHeader>
        <Suspense fallback={<TablaEsqueleto />}>
          <CierreActual />
        </Suspense>
      </div>
    </main>
  );
}
