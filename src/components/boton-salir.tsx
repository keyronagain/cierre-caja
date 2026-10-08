"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    if (
      !window.confirm(
        "¿Cerrar sesión? Si tenés montos sin guardar, se van a perder.",
      )
    ) {
      return;
    }
    setSaliendo(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      // Aunque falle la red, se va a /login: sin cookie válida el proxy no deja volver.
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className="grid size-11 shrink-0 sm:size-12 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50 active:translate-y-0 active:scale-95 disabled:opacity-60 motion-reduce:transition-none"
    >
      {saliendo ? (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
