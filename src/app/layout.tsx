import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cierre Semanal",
  description: "Cierre semanal de caja: efectivo y Sinpe",
};

// Se ejecuta antes del primer render para no mostrar un destello del tema equivocado.
// Usa la elección guardada ("tema" = "claro" | "oscuro") o, si no hay, la del sistema.
const SCRIPT_TEMA = `try{var t=localStorage.getItem("tema");var d=t?t==="oscuro":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: el script de arriba cambia la clase `dark` antes de hidratar.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
