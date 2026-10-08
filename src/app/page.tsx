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
  resolverSemana,
  type MontosDia,
} from "@/lib/semana";

type ParametrosBusqueda = PageProps<"/">["searchParams"];

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

// La semana mostrada depende de "hoy" y de ?semana=, o sea de la petición: se excluye
// del prerender (Cache Components) y se lee dentro de un <Suspense>.
async function semanaSolicitada(searchParams: ParametrosBusqueda) {
  await connection();
  const hoy = hoyISO();
  const { semana } = await searchParams;
  return {
    hoy,
    actual: inicioDeSemana(hoy),
    inicio: resolverSemana(semana, hoy),
  };
}

async function RangoSemana({
  searchParams,
}: {
  searchParams: ParametrosBusqueda;
}) {
  const { actual, inicio } = await semanaSolicitada(searchParams);
  return (
    <div className="w-fit whitespace-nowrap rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur-xl sm:px-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-lime-300">
        <CalendarDays className="size-4" aria-hidden="true" />
        {inicio === actual ? "Semana actual" : "Semana"}
      </p>
      <p className="mt-0.5 text-[1.35rem] font-bold tracking-tight tabular-nums text-white sm:text-3xl">
        {formatearRango(inicio)}
      </p>
    </div>
  );
}

async function CierreSemana({
  searchParams,
}: {
  searchParams: ParametrosBusqueda;
}) {
  const { hoy, actual, inicio } = await semanaSolicitada(searchParams);
  const guardado = await leerCierre(inicio);
  const indiceHoy = diasDeSemana(inicio).findIndex((d) => d.fecha === hoy);

  return (
    <TablaCierre
      // Al cambiar de semana se reinicia el estado del formulario.
      key={inicio}
      inicio={inicio}
      actual={actual}
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
          className="h-36 animate-pulse rounded-2xl bg-tinta/5 md:h-24"
        />
      ))}
    </div>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-36 pt-4 sm:px-6 sm:pt-6 md:pb-12">
      <div className="flex flex-col gap-6">
        <CanchaHeader>
          <Suspense fallback={<RangoEsqueleto />}>
            <RangoSemana searchParams={searchParams} />
          </Suspense>
        </CanchaHeader>
        <Suspense fallback={<TablaEsqueleto />}>
          <CierreSemana searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
