import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Contraseñas con scrypt (incluido en Node, sin dependencias). Formato guardado: "sal:hash" en hex.
const LARGO_HASH = 64;
const OPCIONES = { N: 16384, r: 8, p: 1 } as const;

function derivar(clave: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolver, rechazar) => {
    scrypt(clave, sal, LARGO_HASH, OPCIONES, (error, clave) =>
      error ? rechazar(error) : resolver(clave),
    );
  });
}

export async function hashClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(clave, sal);
  return `${sal.toString("hex")}:${hash.toString("hex")}`;
}

export async function verificarClave(
  clave: string,
  guardada: string,
): Promise<boolean> {
  const [salHex, hashHex] = guardada.split(":");
  if (!salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  if (esperado.length !== LARGO_HASH) return false;
  const obtenido = await derivar(clave, Buffer.from(salHex, "hex"));
  return timingSafeEqual(obtenido, esperado);
}

// Hash descartable para gastar el mismo tiempo cuando el usuario no existe
// (así la respuesta no revela qué usuarios hay).
let falso: Promise<string> | undefined;
export function hashFalso(): Promise<string> {
  falso ??= hashClave("clave-que-nadie-usa");
  return falso;
}
