"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

const CAMPO =
  "h-14 w-full rounded-xl border border-linea bg-campo px-4 text-lg font-medium text-tinta outline-none transition-all duration-200 ease-out placeholder:text-tinta-tenue hover:border-green-600/50 focus:border-green-600 focus:bg-campo-foco focus:ring-4 focus:ring-green-500/25 motion-reduce:transition-none";

export function FormularioLogin() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError("");
    try {
      const respuesta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const datos = (await respuesta.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!respuesta.ok || !datos?.ok) {
        throw new Error(datos?.error ?? "No se pudo iniciar sesión.");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      );
      setClave("");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl border border-linea bg-superficie p-6 shadow-tarjeta sm:p-8"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-tinta">
          Iniciar sesión
        </h2>
        <p className="mt-1 text-sm text-tinta-suave">
          Ingresá con tu usuario para ver y guardar los cierres.
        </p>
      </div>

      <div>
        <label
          htmlFor="usuario"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-tinta-suave"
        >
          Usuario
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className={CAMPO}
        />
      </div>

      <div>
        <label
          htmlFor="clave"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-tinta-suave"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="clave"
            name="clave"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            required
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className={`${CAMPO} pr-14`}
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verClave}
            className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-tinta-suave transition-colors hover:text-tinta focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/30"
          >
            {verClave ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || usuario === "" || clave === ""}
        className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-green-700 px-6 text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(21,128,61,0.7)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/40 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-tinta/15 disabled:text-tinta/50 disabled:shadow-none motion-reduce:transition-none"
      >
        {enviando ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="size-5" aria-hidden="true" />
        )}
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
