import imageCompression from "browser-image-compression";
import { api } from "./api";
import type { SubidaImagen } from "./tipos";

/** Tipos que acepta la API para la foto del producto (POST /backoffice/imagenes/subida). */
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;

/** Peso máximo del archivo que elige el usuario, antes de comprimir. */
export const MAX_BYTES_ORIGINAL = 15 * 1024 * 1024;

/** Peso máximo que se sube a Supabase, ya comprimido. */
export const MAX_BYTES_SUBIDA = 2 * 1024 * 1024;

export class ImagenInvalidaError extends Error {}

/**
 * Comprime la foto de un producto en el navegador antes de subirla a Supabase: la deja en WebP, con el lado mayor en
 * 1600 px como máximo y cerca de 500 KB. El resultado se sube con su propio `type` como `tipoContenido`.
 */
export async function comprimirImagenProducto(archivo: File): Promise<File> {
  if (!(TIPOS_IMAGEN as readonly string[]).includes(archivo.type)) {
    throw new ImagenInvalidaError("Solo se aceptan imágenes JPG, PNG o WebP.");
  }
  if (archivo.size > MAX_BYTES_ORIGINAL) {
    throw new ImagenInvalidaError("La imagen pesa más de 15 MB. Usa una más liviana.");
  }

  const comprimida = await imageCompression(archivo, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    fileType: "image/webp",
    initialQuality: 0.85,
    useWebWorker: true,
  });

  if (comprimida.size > MAX_BYTES_SUBIDA) {
    throw new ImagenInvalidaError("No pudimos dejar la imagen por debajo de 2 MB. Prueba con otra foto.");
  }

  const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([comprimida], nombre, { type: "image/webp", lastModified: Date.now() });
}

/** Carpeta del bucket de Supabase: cada tipo de recurso tiene la suya, con su propio permiso en la API. */
export type DestinoFoto = "productos" | "categorias";

const RUTA_SUBIDA: Record<DestinoFoto, string> = {
  productos: "/backoffice/imagenes/subida",
  categorias: "/backoffice/imagenes/categorias/subida",
};

/**
 * Sube una foto ya comprimida: la API firma la subida a la carpeta del destino y el navegador la envía directo a
 * Supabase (la API nunca recibe el archivo). Devuelve la `urlPublica`, que se guarda como `imagenUrl` del producto o de
 * la categoría.
 */
export async function subirFoto(archivo: File, destino: DestinoFoto = "productos"): Promise<string> {
  const firma = await api<SubidaImagen>(RUTA_SUBIDA[destino], {
    metodo: "POST",
    cuerpo: { tipoContenido: archivo.type },
  });
  const datos = new FormData();
  datos.append("cacheControl", "3600");
  datos.append("", archivo);
  let res: Response;
  try {
    res = await fetch(firma.urlSubida, { method: "PUT", body: datos, headers: { "x-upsert": "false" } });
  } catch {
    throw new Error("No pudimos subir la foto. Revisa tu conexión e intenta de nuevo.");
  }
  if (!res.ok) throw new Error("No pudimos subir la foto. Intenta de nuevo.");
  return firma.urlPublica;
}
