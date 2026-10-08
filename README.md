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

3. Agregar `SESSION_SECRET` a `.env.local` (cadena al azar de 32+ caracteres, ver `.env.example`).

4. Crear las tablas:

   ```bash
   npm run db:push
   ```

5. Crear tu usuario (PowerShell):

   ```powershell
   $env:NUEVO_USUARIO="tu-usuario"; $env:NUEVA_CLAVE="una-clave-larga"; npm run crear-usuario
   Remove-Item Env:NUEVA_CLAVE
   ```

6. Correr en desarrollo:

   ```bash
   npm run dev
   ```

   Abrí <http://localhost:3000> e iniciá sesión con el usuario que creaste.
   `GET /api/health` responde `{"ok":true}` si la base está conectada.

## Scripts

| Comando              | Descripción                                     |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                          |
| `npm run build`      | Build de producción                             |
| `npm run lint`       | ESLint                                          |
| `npm run db:push`    | Sincroniza el esquema con la base de datos      |
| `npm run db:migrate` | Crea y aplica una migración (`prisma migrate`)  |
| `npm run crear-usuario` | Crea un usuario o cambia su contraseña      |

## Estructura

- `prisma/schema.prisma` — esquema: `semanas`, `dias_cierre` y `usuarios`.
- `src/lib/semana.ts` — lógica pura de semanas, fechas y montos.
- `src/lib/prisma.ts` — cliente de Prisma (singleton, usa `DATABASE_URL`).
- `src/lib/sesion.ts`, `src/lib/clave.ts`, `src/lib/auth.ts`, `src/proxy.ts` — login y protección de rutas.
- `src/app/page.tsx` + `src/components/tabla-cierre.tsx` — tabla de cierre semanal.
- `src/app/api/cierre`, `login`, `logout`, `health` — API.
- `scripts/crear-usuario.mjs` — alta de usuarios.
