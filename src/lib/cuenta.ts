import { api } from "./api";
import { cerrarSesionLocal, guardarSesion, type Sesion } from "./sesion";
import type { AuthResponse } from "./tipos";

export async function iniciarSesion(email: string, password: string): Promise<Sesion | null> {
  const r = await api<AuthResponse>("/auth/login", { metodo: "POST", cuerpo: { email, password }, publica: true });
  return guardarSesion(r.token);
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  password: string;
}

export async function registrarCliente(datos: DatosRegistro): Promise<Sesion | null> {
  const r = await api<AuthResponse>("/auth/registro", { metodo: "POST", cuerpo: datos, publica: true });
  return guardarSesion(r.token);
}

/** Revoca el token en el servidor (si responde) y borra la sesión local. */
/** Revoca el token en la API y cierra la sesión en este navegador. `aviso` se muestra luego en /ingresar. */
export async function cerrarSesion(destino = "/", aviso?: string) {
  try {
    await api("/auth/logout", { metodo: "POST" });
  } catch {
    // Si el servidor no responde, igual se cierra la sesión en este navegador.
  }
  cerrarSesionLocal(aviso);
  window.location.assign(destino);
}

/** Cambia la clave. La API cierra todas las sesiones, la actual incluida. */
export async function cambiarClave(passwordActual: string, passwordNueva: string) {
  await api("/auth/password", { metodo: "PUT", cuerpo: { passwordActual, passwordNueva } });
  cerrarSesionLocal("Cambiaste tu contraseña. Ingresa con la nueva.");
}

export const TIPOS_DOCUMENTO = [
  { valor: "CC", texto: "Cédula de ciudadanía" },
  { valor: "CE", texto: "Cédula de extranjería" },
  { valor: "NIT", texto: "NIT" },
  { valor: "PAS", texto: "Pasaporte" },
];
