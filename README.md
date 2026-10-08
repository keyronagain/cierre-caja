# Cierre Semanal

Web app para el cierre semanal de caja (Lunes a Domingo, Efectivo y Sinpe).

**Stack:** Next.js (App Router) · Tailwind CSS · Prisma 7 · Postgres.

## Puesta en marcha

1. Instalar dependencias (también genera el cliente de Prisma):

   ```bash
   npm install
   ```

2. Configurar la base de datos. Copiá `.env.example` a `.env.local` y poné tu
   cadena de conexión de Postgres (Vercel Postgres, Neon o local):

   ```bash
   cp .env.example .env.local
   ```

3. Crear las tablas:

   ```bash
   npm run db:push
   ```

4. Correr en desarrollo:

   ```bash
   npm run dev
   ```

   Abrí <http://localhost:3000>. La página indica si la base de datos está
   conectada; `GET /api/health` devuelve el mismo estado en JSON.

## Scripts

| Comando              | Descripción                                     |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                          |
| `npm run build`      | Build de producción                             |
| `npm run lint`       | ESLint                                          |
| `npm run db:push`    | Sincroniza el esquema con la base de datos      |
| `npm run db:migrate` | Crea y aplica una migración (`prisma migrate`)  |

## Estructura

- `prisma/schema.prisma` — esquema (por ahora solo la tabla `semanas`).
- `src/lib/prisma.ts` — cliente de Prisma (singleton, usa `DATABASE_URL`).
- `src/app/page.tsx` — página inicial con el estado de la conexión.
- `src/app/api/health/route.ts` — endpoint de verificación.
