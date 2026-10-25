import { useSyncExternalStore } from "react";
import { multiplicarDinero, sumarDinero } from "./formato";
import type { VarianteCatalogo } from "./tipos";

/**
 * Carrito local. La API todavía no tiene GET /carrito, así que el navegador guarda los productos y los envía al
 * servidor al momento de pagar (ver `sincronizarCarrito` en la pantalla del carrito).
 */
export interface ItemCarrito {
  idVariante: number;
  cantidad: number;
  nombre: string;
  sku: string;
  precioFinal: string;
  precioBase: string;
  imagenUrl?: string | null;
}

export const CANTIDAD_MAXIMA = 999;

/** Evento de ventana que avisa "se agregó algo al carrito"; lo escucha `AvisoCarrito`. */
export const EVENTO_AGREGADO = "ecomers:agregado";
export interface DetalleAgregado {
  nombre: string;
  cantidad: number;
}
const CLAVE = "ecomers-carrito";
const VACIO: ItemCarrito[] = [];
const oyentes = new Set<() => void>();
let cache: { raw: string | null; items: ItemCarrito[] } = { raw: null, items: VACIO };

function leer(): ItemCarrito[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CLAVE);
  } catch {
    return cache.items;
  }
  if (raw !== cache.raw) {
    let items: ItemCarrito[] = VACIO;
    try {
      items = raw ? (JSON.parse(raw) as ItemCarrito[]) : VACIO;
    } catch {
      items = VACIO;
    }
    cache = { raw, items };
  }
  return cache.items;
}

function escribir(items: ItemCarrito[]) {
  const raw = JSON.stringify(items);
  try {
    localStorage.setItem(CLAVE, raw);
  } catch {
    // Sin almacenamiento: el carrito vive solo en memoria.
  }
  cache = { raw, items };
  oyentes.forEach((fn) => fn());
}

function suscribir(fn: () => void) {
  oyentes.add(fn);
  const alCambiarEnOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE) fn();
  };
  window.addEventListener("storage", alCambiarEnOtraPestana);
  return () => {
    oyentes.delete(fn);
    window.removeEventListener("storage", alCambiarEnOtraPestana);
  };
}

export function useCarrito(): ItemCarrito[] {
  return useSyncExternalStore(suscribir, leer, () => VACIO);
}

const limitar = (n: number) => Math.max(1, Math.min(CANTIDAD_MAXIMA, Math.trunc(n)));

export function agregarAlCarrito(v: VarianteCatalogo, cantidad = 1, { aviso = true }: { aviso?: boolean } = {}) {
  const items = leer();
  const existente = items.find((i) => i.idVariante === v.idVariante);
  if (existente) {
    escribir(items.map((i) => (i === existente ? { ...i, cantidad: limitar(i.cantidad + cantidad) } : i)));
  } else {
    escribir([
      ...items,
      {
        idVariante: v.idVariante,
        cantidad: limitar(cantidad),
        nombre: v.nombre,
        sku: v.sku,
        precioFinal: v.precioFinal,
        precioBase: v.precioBase,
        imagenUrl: v.imagenUrl,
      },
    ]);
  }
  if (aviso) window.dispatchEvent(new CustomEvent<DetalleAgregado>(EVENTO_AGREGADO, { detail: { nombre: v.nombre, cantidad } }));
}

export function cambiarCantidad(idVariante: number, cantidad: number) {
  escribir(leer().map((i) => (i.idVariante === idVariante ? { ...i, cantidad: limitar(cantidad) } : i)));
}

export function quitarDelCarrito(idVariante: number) {
  escribir(leer().filter((i) => i.idVariante !== idVariante));
}

export function vaciarCarrito() {
  escribir([]);
}

export function unidadesEnCarrito(items: ItemCarrito[]): number {
  return items.reduce((acc, i) => acc + i.cantidad, 0);
}

export function subtotalCarrito(items: ItemCarrito[]): string {
  return sumarDinero(...items.map((i) => multiplicarDinero(i.precioFinal, i.cantidad)));
}
