# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

"Cierre Semanal": web app para el cierre de caja semanal de un negocio de canchas (Lunes–Domingo, columnas Efectivo y Sinpe, totales por fila y semanales, rango de fechas autogenerado, historial de semanas cerradas que nunca se borran). Multi-dispositivo y pensada para agregar usuarios después. La UI y los mensajes están en español.

**Estado actual:** implementada la tabla de cierre de la semana actual (Lun–Dom, Efectivo/Sinpe, totales en vivo) con guardado en DB. Pendiente: historial de semanas cerradas, usuarios y autenticación (hoy cualquiera puede escribir en `/api/cierre`).

## Comandos

```bash
npm run dev          # servidor de desarrollo (http://localhost:3000)
npm run build        # build de producción (también corre el typecheck)
npm run lint         # eslint
npx tsc --noEmit     # typecheck solo
npm run db:push      # sincroniza prisma/schema.prisma con la DB
npm run db:migrate   # prisma migrate dev
npx prisma generate  # regenera el cliente (corre solo en postinstall)
```

No hay framework de tests configurado todavía.

## Flujo de trabajo

- Hacer un commit de git (mensaje descriptivo en español) después de cada cambio verificado (compila/lint/corre sin errores), sin esperar a que se pida. Remoto: `origin` → `github.com/keyronagain/cierre-caja`, rama `main`.
- Este directorio está dentro del repo git de `C:\Users\keyro`; el repo propio del proyecto es `cierre-caja/.git`, así que los comandos git deben correr dentro de esta carpeta.

## Arquitectura

- **Next.js 16 (App Router) con `cacheComponents: true`** (`next.config.ts`). `AGENTS.md` exige leer `node_modules/next/dist/docs/` antes de escribir código: las APIs difieren de versiones anteriores. En particular, NO usar `export const dynamic = ...`; el contenido que depende de la petición (como consultas a la DB) va en un componente async que hace `await connection()` (`next/server`) dentro de un `<Suspense>`.
- **Prisma 7 + Postgres vía `DATABASE_URL`.** Versiones de `prisma`, `@prisma/client` y `@prisma/adapter-pg` fijadas en 7.10.0 (el tag `latest` de la CLI apunta a una rc 8 incompatible con el cliente). Piezas que hay que leer juntas:
  - `prisma/schema.prisma`: el cliente se genera en `src/generated/prisma` (gitignored; se regenera en `postinstall`). Se importa desde `@/generated/prisma/client`. El datasource no lleva `url`.
  - `prisma.config.ts`: define la URL del datasource y carga `.env.local` (lo que usa Next) además de `.env`.
  - `src/lib/prisma.ts`: `getPrisma()` crea el cliente de forma perezosa con el adapter `PrismaPg` y lo guarda en `globalThis`. Lanza error si falta `DATABASE_URL`, por eso los llamadores deben capturarlo (la app arranca sin DB).
- **Backend = Route Handlers** en `src/app/api/**/route.ts`: `api/cierre` (POST, valida y hace upsert de la `Semana` + 7 `DiaCierre`; volver a guardar la misma semana corrige los montos, nunca se borra) y `api/health`.
- **Modelo:** `Semana` (`fechaInicio` único, siempre lunes) 1—N `DiaCierre` (`efectivo`/`sinpe` en colones enteros, `Int`). Fechas como string `YYYY-MM-DD` y columnas `@db.Date`.
- **`src/lib/semana.ts`:** lógica pura (semana Lun–Dom, "hoy" en zona `America/Costa_Rica` porque el servidor corre en UTC, formato de montos, validación del POST). La página (`src/app/page.tsx`) lee la semana actual en un componente async con `connection()` y se la pasa al componente cliente `src/components/tabla-cierre.tsx`, que calcula todos los totales en vivo sin ir a la DB.
- ESLint (`react-hooks/error-boundaries`) prohíbe construir JSX dentro de `try/catch`: capturar el error en una función aparte que devuelva un resultado y renderizar fuera (patrón en `src/app/page.tsx`).

## Entorno

Copiar `.env.example` a `.env.local` y completar `DATABASE_URL`. El esquema se crea con `npm run db:push`. Sin `DATABASE_URL`, la tabla igual se muestra (con aviso) y `/api/health` responde 500 controlado.

Para probar el guardado sin tocar la DB real: `npx prisma dev --detach --name test` levanta un Postgres local desechable; apuntar `DATABASE_URL` a su URL TCP al correr `db:push` y `npm run dev` (las variables ya definidas en el entorno tienen prioridad sobre `.env.local`).
