import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// Público a propósito (sirve para monitoreo), por eso no devuelve datos ni detalles
// del error: solo si la base responde.
export async function GET() {
  try {
    await getPrisma().semana.count();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("health: la base no responde", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
