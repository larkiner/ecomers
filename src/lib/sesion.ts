import { useSyncExternalStore } from "react";
import type { Permiso, Rol } from "./tipos";

/** Lo que la interfaz sabe del usuario. Sale del JWT y sirve SOLO para pintar: la seguridad la aplica la API. */
export interface Sesion {
  token: string;
  email: string;
  rol: Rol;
  permisos: Permiso[];
  idCliente?: number;
  idEmpleado?: number;
  /** Vencimiento en milisegundos desde 1970. */
  vence: number;
}

const CLAVE = "ecomers-token";
const AVISO = "ecomers-aviso-sesion";
const oyentes = new Set<() => void>();
let cache: { token: string | null; sesion: Sesion | null } = { token: null, sesion: null };

function leerClaims(token: string): Record<string, unknown> {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(b64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
  return JSON.parse(json) as Record<string, unknown>;
}

function aSesion(token: string): Sesion | null {
  try {
    const c = leerClaims(token);
    const rol = c.rol as Rol;
    if (rol !== "CLIENTE" && rol !== "EMPLEADO" && rol !== "ADMIN") return null;
    return {
      token,
      email: String(c.sub ?? ""),
      rol,
      permisos: Array.isArray(c.permisos) ? (c.permisos as Permiso[]) : [],
      idCliente: typeof c.id_cliente === "number" ? c.id_cliente : undefined,
      idEmpleado: typeof c.id_empleado === "number" ? c.id_empleado : undefined,
      vence: typeof c.exp === "number" ? c.exp * 1000 : 0,
    };
  } catch {
    return null;
  }
}

function avisar() {
  oyentes.forEach((fn) => fn());
}

export function obtenerSesion(): Sesion | null {
  let token: string | null = null;
  try {
    token = sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
  if (token !== cache.token) {
    cache = { token, sesion: token ? aSesion(token) : null };
  }
  if (cache.sesion && cache.sesion.vence <= Date.now()) {
    cerrarSesionLocal("Tu sesión terminó. Ingresa de nuevo.");
    return null;
  }
  return cache.sesion;
}

export function guardarSesion(token: string): Sesion | null {
  try {
    sessionStorage.setItem(CLAVE, token);
    sessionStorage.removeItem(AVISO);
  } catch {
    // Sin sessionStorage la sesión dura solo mientras la página esté abierta.
  }
  cache = { token, sesion: aSesion(token) };
  avisar();
  return cache.sesion;
}

/** Borra la sesión del navegador. Con `aviso`, la pantalla de ingreso lo muestra una vez. */
export function cerrarSesionLocal(aviso?: string) {
  try {
    sessionStorage.removeItem(CLAVE);
    if (aviso) sessionStorage.setItem(AVISO, aviso);
  } catch {
    // Nada que borrar.
  }
  cache = { token: null, sesion: null };
  avisar();
}

export function tomarAvisoSesion(): string | null {
  try {
    const aviso = sessionStorage.getItem(AVISO);
    sessionStorage.removeItem(AVISO);
    return aviso;
  } catch {
    return null;
  }
}

function suscribir(fn: () => void) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** La sesión actual; `null` sin sesión y también durante el render del servidor. */
export function useSesion(): Sesion | null {
  return useSyncExternalStore(suscribir, obtenerSesion, () => null);
}

const sinCambios = () => () => {};
/** `true` cuando ya se puede leer el navegador (después de hidratar). */
export function useEnNavegador(): boolean {
  return useSyncExternalStore(sinCambios, () => true, () => false);
}

export function esPersonal(s: Sesion | null): boolean {
  return s?.rol === "EMPLEADO" || s?.rol === "ADMIN";
}

export function tienePermiso(s: Sesion | null, permiso: Permiso): boolean {
  return !!s && (s.rol === "ADMIN" || s.permisos.includes(permiso));
}

export function destinoInicial(rol: Rol): string {
  return rol === "CLIENTE" ? "/" : "/backoffice";
}
