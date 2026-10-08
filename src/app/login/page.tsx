import type { Metadata } from "next";
import { CanchaHeader } from "@/components/cancha-header";
import { FormularioLogin } from "@/components/formulario-login";

export const metadata: Metadata = {
  title: "Iniciar sesión · Cierre Semanal",
};

export default function Login() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-8">
        <CanchaHeader />
        <FormularioLogin />
      </div>
    </main>
  );
}
