import { Suspense } from "react";
import { connection } from "next/server";
import { getPrisma } from "@/lib/prisma";

type Resultado =
  | { ok: true; semanas: number }
  | { ok: false; error: string };

async function consultarSemanas(): Promise<Resultado> {
  try {
    const semanas = await getPrisma().semana.count();
    return { ok: true, semanas };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

async function EstadoBaseDeDatos() {
  // La consulta depende de la petición: se excluye del prerender.
  await connection();
  const resultado = await consultarSemanas();

  if (resultado.ok) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
        <p className="font-medium">Base de datos conectada</p>
        <p className="text-sm">
          {resultado.semanas === 0
            ? "La tabla de semanas está vacía."
            : `${resultado.semanas} semana(s) guardada(s).`}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <p className="font-medium">Base de datos no conectada</p>
      <p className="mt-1 text-sm">
        Configurá <code className="font-mono">DATABASE_URL</code> en{" "}
        <code className="font-mono">.env.local</code> y ejecutá{" "}
        <code className="font-mono">npm run db:push</code> para crear las
        tablas.
      </p>
      <p className="mt-2 break-words font-mono text-xs opacity-70">
        {resultado.error}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        Cierre Semanal
      </h1>
      <Suspense
        fallback={
          <p className="text-sm opacity-70">Verificando base de datos…</p>
        }
      >
        <EstadoBaseDeDatos />
      </Suspense>
    </main>
  );
}
