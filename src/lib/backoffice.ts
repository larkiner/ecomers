import { api } from "./api";
import type { Categoria, Impuesto, Producto } from "./tipos";

export const TAMANO_PRODUCTOS = 50;

/** Lee páginas de productos hasta que no haya más (o hasta `maxPaginas`). La API no entrega el total. */
export async function cargarTodosLosProductos(signal?: AbortSignal, maxPaginas = 20): Promise<Producto[]> {
  const todos: Producto[] = [];
  for (let page = 0; page < maxPaginas; page++) {
    const lote = await api<Producto[]>(`/backoffice/productos?page=${page}&size=${TAMANO_PRODUCTOS}`, { signal });
    todos.push(...lote);
    if (lote.length < TAMANO_PRODUCTOS) break;
  }
  return todos;
}

export const cargarCategorias = (signal?: AbortSignal) => api<Categoria[]>("/backoffice/categorias", { signal });
export const cargarImpuestos = (signal?: AbortSignal) => api<Impuesto[]>("/backoffice/impuestos", { signal });

export interface NodoCategoria extends Categoria {
  nivel: number;
  ruta: string;
}

/** Ordena la lista plana como árbol (padres antes que hijos) con su nivel y su ruta "Tecnología › Portátiles". */
export function arbolCategorias(lista: Categoria[]): NodoCategoria[] {
  const hijos = new Map<number | null, Categoria[]>();
  lista.forEach((c) => {
    const padre = c.idPadre ?? null;
    hijos.set(padre, [...(hijos.get(padre) ?? []), c]);
  });
  const salida: NodoCategoria[] = [];
  const visitados = new Set<number>();
  const recorrer = (padre: number | null, nivel: number, ruta: string) => {
    (hijos.get(padre) ?? [])
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .forEach((c) => {
        if (visitados.has(c.idCategoria)) return;
        visitados.add(c.idCategoria);
        const r = ruta ? `${ruta} › ${c.nombre}` : c.nombre;
        salida.push({ ...c, nivel, ruta: r });
        recorrer(c.idCategoria, nivel + 1, r);
      });
  };
  recorrer(null, 0, "");
  // Huérfanas (padre inexistente): al final, como raíz.
  lista.filter((c) => !visitados.has(c.idCategoria)).forEach((c) => salida.push({ ...c, nivel: 0, ruta: c.nombre }));
  return salida;
}

/** IDs de una categoría y todas sus descendientes: no puede quedar dentro de ninguna de ellas. */
export function descendientes(lista: Categoria[], id: number): Set<number> {
  const salida = new Set<number>([id]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    lista.forEach((c) => {
      if (c.idPadre != null && salida.has(c.idPadre) && !salida.has(c.idCategoria)) {
        salida.add(c.idCategoria);
        cambio = true;
      }
    });
  }
  return salida;
}
