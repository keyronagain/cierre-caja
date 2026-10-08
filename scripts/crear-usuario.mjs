// Crea un usuario (o cambia la contraseña de uno existente) en la base de DATABASE_URL.
//
// Uso (PowerShell):
//   $env:NUEVO_USUARIO="maria"; $env:NUEVA_CLAVE="una-clave-larga"; npm run crear-usuario
//   (después conviene cerrar la terminal o borrar la variable: Remove-Item Env:NUEVA_CLAVE)
//
// Usa DATABASE_URL del entorno o, si no está, la de .env.local.
import { config } from "dotenv";
import pg from "pg";
import { hashClave } from "../src/lib/clave.ts";

config({ path: ".env.local", quiet: true });

const nombre = (process.env.NUEVO_USUARIO ?? "").trim().toLowerCase();
const clave = process.env.NUEVA_CLAVE ?? "";

if (!/^[a-z0-9._-]{3,50}$/.test(nombre)) {
  console.error(
    "NUEVO_USUARIO inválido: 3 a 50 caracteres entre letras minúsculas, números, punto, guion y guion bajo.",
  );
  process.exit(1);
}
if (clave.length < 8 || clave.length > 200) {
  console.error("NUEVA_CLAVE inválida: debe tener entre 8 y 200 caracteres.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (en el entorno o en .env.local).");
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await cliente.connect();
  const claveHash = await hashClave(clave);
  const { rows } = await cliente.query(
    `insert into usuarios (nombre, "claveHash")
     values ($1, $2)
     on conflict (nombre) do update
       set "claveHash" = excluded."claveHash", "intentosFallidos" = 0, "bloqueadoHasta" = null
     returning (xmax = 0) as creado`,
    [nombre, claveHash],
  );
  console.log(
    rows[0].creado
      ? `Usuario "${nombre}" creado.`
      : `Se actualizó la contraseña del usuario "${nombre}".`,
  );
} catch (error) {
  console.error("No se pudo crear el usuario:", error.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
