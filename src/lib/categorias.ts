import { api } from "./api";
import type { CategoriaPublica } from "./tipos";

export interface NodoPublico extends CategoriaPublica {
  hijos: NodoPublico[];
}

/**
 * Árbol de las categorías activas que entrega la API. Una categoría cuyo padre no aparece en la lista (por ejemplo, porque
 * el padre está inactivo) se trata como raíz: nunca se oculta una categoría que la API sí entregó.
 */
export function arbolPublico(lista: CategoriaPublica[]): NodoPublico[] {
  const nodos = new Map<number, NodoPublico>(lista.map((c) => [c.idCategoria, { ...c, hijos: [] }]));
  const raices: NodoPublico[] = [];
  for (const nodo of nodos.values()) {
    const padre = nodo.idPadre != null ? nodos.get(nodo.idPadre) : undefined;
    if (padre && padre !== nodo) padre.hijos.push(nodo);
    else raices.push(nodo);
  }
  return raices;
}

/** Busca un nodo por ID en cualquier nivel del árbol. */
export function buscarNodo(arbol: NodoPublico[], id: number): NodoPublico | undefined {
  for (const nodo of arbol) {
    if (nodo.idCategoria === id) return nodo;
    const dentro = buscarNodo(nodo.hijos, id);
    if (dentro) return dentro;
  }
  return undefined;
}

/** `true` si el nodo es la categoría con ese ID o la contiene en alguno de sus niveles. */
export function contiene(nodo: NodoPublico, id: number): boolean {
  return nodo.idCategoria === id || nodo.hijos.some((h) => contiene(h, id));
}

/** La raíz del árbol a la que pertenece la categoría con ese ID. */
export function raizDe(arbol: NodoPublico[], id: number): NodoPublico | undefined {
  return arbol.find((r) => contiene(r, id));
}

/** Cuánto vale la lista en memoria; coincide con la caché pública de la API (60 s). */
const VIGENCIA_MS = 60_000;
let enMemoria: { desde: number; promesa: Promise<CategoriaPublica[]> } | null = null;

/**
 * Categorías activas de la tienda (GET /catalogo/categorias), pedidas una sola vez y compartidas por el encabezado, el
 * inicio, el catálogo y la vista de categorías. Si la petición falla, la siguiente vuelve a intentarlo.
 */
export function categoriasPublicas(): Promise<CategoriaPublica[]> {
  if (!enMemoria || Date.now() - enMemoria.desde > VIGENCIA_MS) {
    const promesa = api<CategoriaPublica[]>("/catalogo/categorias", { publica: true });
    promesa.catch(() => {
      if (enMemoria?.promesa === promesa) enMemoria = null;
    });
    enMemoria = { desde: Date.now(), promesa };
  }
  return enMemoria.promesa;
}
