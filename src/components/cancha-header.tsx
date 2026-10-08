import type { ReactNode } from "react";
import { BotonSalir } from "./boton-salir";
import { SelectorTema } from "./selector-tema";

function Pelota({ className }: { className?: string }) {
  // Pelota estilizada: pentágono central, costuras y parches en el borde.
  return (
    <svg
      viewBox="-22 -22 44 44"
      className={className}
      role="img"
      aria-label="Pelota de fútbol"
    >
      <circle r="20" fill="#fff" stroke="#052e16" strokeWidth="1.5" />
      <polygon
        points="0,-7 6.66,-2.16 4.11,5.66 -4.11,5.66 -6.66,-2.16"
        fill="#052e16"
      />
      <g stroke="#052e16" strokeWidth="1.5" strokeLinecap="round">
        <line x1="0" y1="-7" x2="0" y2="-14" />
        <line x1="6.66" y1="-2.16" x2="13.3" y2="-4.3" />
        <line x1="4.11" y1="5.66" x2="8.2" y2="11.3" />
        <line x1="-4.11" y1="5.66" x2="-8.2" y2="11.3" />
        <line x1="-6.66" y1="-2.16" x2="-13.3" y2="-4.3" />
      </g>
      <g fill="#052e16">
        <circle cx="0" cy="-17" r="3" />
        <circle cx="16.2" cy="-5.3" r="3" />
        <circle cx="10" cy="13.7" r="3" />
        <circle cx="-10" cy="13.7" r="3" />
        <circle cx="-16.2" cy="-5.3" r="3" />
      </g>
    </svg>
  );
}

// Líneas de una cancha vistas desde arriba, de fondo en el header.
function LineasDeCancha() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 240"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full text-white/20"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <rect x="16" y="16" width="768" height="208" rx="4" />
      <line x1="400" y1="16" x2="400" y2="224" />
      <circle cx="400" cy="120" r="56" />
      <circle cx="400" cy="120" r="4" fill="currentColor" />
      <rect x="16" y="56" width="104" height="128" />
      <rect x="16" y="88" width="40" height="64" />
      <rect x="680" y="56" width="104" height="128" />
      <rect x="744" y="88" width="40" height="64" />
    </svg>
  );
}

export function CanchaHeader({
  children,
  conSalir = false,
}: {
  children?: ReactNode;
  /** Muestra el botón para cerrar sesión (no en la pantalla de login). */
  conSalir?: boolean;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-green-900 shadow-[0_20px_50px_-12px_rgba(5,46,22,0.55)]">
      {/* Franjas de césped recién cortado */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(90deg,#14532d_0,#14532d_56px,#166534_56px,#166534_112px)] dark:bg-[repeating-linear-gradient(90deg,#0c2d18_0,#0c2d18_56px,#0f3a1e_56px,#0f3a1e_112px)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/0 via-black/0 to-black/30"
      />
      <LineasDeCancha />
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-16 -z-10 size-56 rounded-full bg-lime-300/20 blur-3xl"
      />

      <div className="relative grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-5 p-5 sm:gap-x-4 sm:p-8 lg:grid-cols-[1fr_auto_auto] lg:items-end lg:p-10">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-xl sm:size-20">
            <Pelota className="size-8 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] sm:size-14" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-lime-300">
              <span className="hidden sm:inline">Canchas · </span>Efectivo y Sinpe
            </p>
            <h1 className="mt-1 whitespace-nowrap text-xl font-bold tracking-tight text-white sm:text-4xl">
              Cierre Semanal
            </h1>
          </div>
        </div>
        {/* Botones de tema y salir: junto al título en móvil, a la derecha del rango en escritorio. */}
        <div className="flex items-center gap-2 sm:gap-3 lg:order-3">
          <SelectorTema />
          {conSalir && <BotonSalir />}
        </div>
        <div className="col-span-2 lg:order-2 lg:col-span-1">{children}</div>
      </div>
    </header>
  );
}
