import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Singleton: evita abrir una conexión nueva en cada recarga (HMR) en desarrollo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function crearCliente() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Se crea de forma perezosa para que la app arranque aunque falte DATABASE_URL.
export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= crearCliente();
  return globalForPrisma.prisma;
}
