import { cerrarSesionLocal, obtenerSesion } from "./sesion";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

/** Error de la API normalizado desde problem+json. Decide siempre por `codigo`, nunca por el texto. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly errores: ErrorCampo[] = [],
  ) {
    super(mensaje);
  }
}

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "DELETE";
  cuerpo?: unknown;
  /** Rutas públicas: no envían token ni tratan el 401 como sesión vencida. */
  publica?: boolean;
  signal?: AbortSignal;
}

const MENSAJES: Record<string, string> = {
  SIN_CONEXION: "No pudimos conectar con el servidor. Revisa tu conexión o intenta en un momento.",
  ERROR_INTERNO: "Algo salió mal de nuestro lado. Intenta de nuevo en un momento.",
  RECURSO_OCUPADO: "El sistema está ocupado. Intenta de nuevo en un momento.",
  DEMASIADAS_PETICIONES: "Hiciste muchas solicitudes seguidas. Espera un minuto e intenta de nuevo.",
  CREDENCIALES_INVALIDAS: "El correo o la contraseña no coinciden.",
  CUENTA_INACTIVA: "Tu cuenta está desactivada. Escríbenos si crees que es un error.",
  ACCESO_DENEGADO: "No tienes permiso para hacer esto.",
  PERMISO_INSUFICIENTE: "No tienes permiso para hacer esto.",
  PASARELA_NO_CONFIGURADA: "Los pagos en línea aún no están activos. Intenta más tarde.",
  PASARELA_NO_DISPONIBLE: "Wompi no respondió. Intenta pagar de nuevo en un momento.",
  ALMACEN_IMAGENES_NO_CONFIGURADO: "La subida de fotos aún no está activa; puedes guardar el producto sin foto.",
  ALMACEN_IMAGENES_NO_DISPONIBLE: "No pudimos subir la foto. Intenta de nuevo.",
  DIRECCION_FACTURACION_INVALIDA:
    "Tu cuenta no tiene una dirección de facturación registrada. Escríbenos para agregarla y poder completar el pedido.",
  PEDIDO_VENCIDO: "Se acabó el tiempo para pagar este pedido. Tus productos siguen en el carrito.",
};

/** Texto apto para mostrar al usuario. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ApiError) return MENSAJES[e.codigo] ?? (e.message || MENSAJES.ERROR_INTERNO);
  if (e instanceof Error && e.message) return e.message;
  return MENSAJES.ERROR_INTERNO;
}

/** Errores de validación por campo (400 VALIDACION) para marcar cada campo del formulario. */
export function erroresPorCampo(e: unknown): Record<string, string> {
  const salida: Record<string, string> = {};
  if (e instanceof ApiError) e.errores.forEach((x) => (salida[x.campo] = x.mensaje));
  return salida;
}

export async function api<T = void>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = "GET", cuerpo, publica = false, signal } = opciones;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  const sesion = publica ? null : obtenerSesion();
  if (sesion) headers.Authorization = `Bearer ${sesion.token}`;

  let res: Response;
  try {
    res = await fetch(API_URL + ruta, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "SIN_CONEXION", MENSAJES.SIN_CONEXION);
  }

  if (res.status === 204) return undefined as T;
  const texto = await res.text();
  const datos = texto ? (JSON.parse(texto) as Record<string, unknown>) : null;
  if (res.ok) return datos as T;

  if (res.status === 429) throw new ApiError(429, "DEMASIADAS_PETICIONES", MENSAJES.DEMASIADAS_PETICIONES);
  const codigo = String(datos?.codigo ?? datos?.title ?? "ERROR_INTERNO");
  const mensaje = String(datos?.mensaje ?? datos?.detail ?? MENSAJES.ERROR_INTERNO);
  const errores = Array.isArray(datos?.errores) ? (datos.errores as ErrorCampo[]) : [];

  if (res.status === 401 && !publica && sesion) {
    cerrarSesionLocal("Tu sesión terminó. Ingresa de nuevo.");
    const vuelta = encodeURIComponent(window.location.pathname + window.location.search);
    // Fuera de React no hay router: una navegación completa también limpia el estado en memoria.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/ingresar?vuelta=${vuelta}`);
  }
  throw new ApiError(res.status, codigo, mensaje, errores);
}
