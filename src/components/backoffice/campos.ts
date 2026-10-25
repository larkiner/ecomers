import type { Categoria, Impuesto } from "@/lib/tipos";
import { arbolCategorias } from "@/lib/backoffice";
import { formatPorcentaje } from "@/lib/formato";
import type { Opcion } from "../ui/controles";

/** Precio con hasta 12 enteros y 2 decimales, como exige la API. */
export const PRECIO_VALIDO = /^\d{1,12}(\.\d{1,2})?$/;

/** Normaliza lo que se escribe en un campo de precio: acepta coma o punto decimal y quita lo demás. */
export function limpiarPrecio(texto: string): string {
  const s = texto.replace(",", ".").replace(/[^\d.]/g, "");
  const [entero, ...resto] = s.split(".");
  return resto.length ? `${entero}.${resto.join("").slice(0, 2)}` : entero;
}

/** Solo categorías activas (con su ruta en el árbol) para elegir en un producto. */
export function opcionesCategorias(lista: Categoria[] | null, incluir?: number): Opcion[] {
  return arbolCategorias(lista ?? [])
    .filter((c) => c.activo || c.idCategoria === incluir)
    .map((c) => ({ valor: String(c.idCategoria), texto: c.activo ? c.ruta : `${c.ruta} (inactiva)` }));
}

export function opcionesImpuestos(lista: Impuesto[] | null, incluir?: number): Opcion[] {
  return (lista ?? [])
    .filter((i) => i.activo || i.idImpuesto === incluir)
    .map((i) => ({ valor: String(i.idImpuesto), texto: `${i.nombre} (${formatPorcentaje(i.tasa)})${i.activo ? "" : " · inactivo"}` }));
}
