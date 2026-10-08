"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const CLAVE = "tema";

function guardado(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function SelectorTema() {
  // Mientras el usuario no elija un tema, se sigue el cambio de preferencia del sistema.
  useEffect(() => {
    const sistema = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = (e: MediaQueryListEvent) => {
      if (guardado() === null) {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    sistema.addEventListener("change", alCambiar);
    return () => sistema.removeEventListener("change", alCambiar);
  }, []);

  function alternar() {
    const oscuro = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", oscuro);
    try {
      localStorage.setItem(CLAVE, oscuro ? "oscuro" : "claro");
    } catch {
      // Sin almacenamiento (modo privado): el cambio vale solo para esta visita.
    }
  }

  // Los íconos se alternan solo con CSS (`dark:`), así no hay desajuste de hidratación.
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar entre modo claro y oscuro"
      className="grid size-11 shrink-0 sm:size-12 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50 active:translate-y-0 active:scale-95 motion-reduce:transition-none"
    >
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
    </button>
  );
}
