/** Contratos JSON de la API de ECOMERS (/api/v1). El dinero llega como texto decimal. */

export type Dinero = string;
export type Rol = "CLIENTE" | "EMPLEADO" | "ADMIN";
export type Permiso = "CATEGORIAS" | "PRODUCTOS";

export interface AuthResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  email: string;
  rol: Rol;
}

export interface VarianteCatalogo {
  idVariante: number;
  sku: string;
  nombre: string;
  controlaStock: boolean;
  precioBase: Dinero;
  descuentoUnitario?: Dinero | null;
  precioFinal: Dinero;
  tasaImpuesto: string;
  idPromocion?: number | null;
  imagenUrl?: string | null;
}

export interface PaginaCatalogo {
  contenido: VarianteCatalogo[];
  pagina: number;
  tamano: number;
  total: number;
}

export interface Categoria {
  idCategoria: number;
  idPadre?: number | null;
  nombre: string;
  activo: boolean;
  imagenUrl?: string | null;
}

/** Categoría activa del catálogo público (GET /catalogo/categorias). */
export interface CategoriaPublica {
  idCategoria: number;
  idPadre?: number | null;
  nombre: string;
  imagenUrl?: string | null;
}

export interface Impuesto {
  idImpuesto: number;
  nombre: string;
  tasa: string;
  activo: boolean;
}

export interface VarianteAdmin {
  idVariante: number;
  sku: string;
  nombre: string;
  precioBase: Dinero;
  controlaStock: boolean;
  activa: boolean;
}

export interface Producto {
  idProducto: number;
  idCategoria: number;
  idImpuesto: number;
  nombre: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  activo: boolean;
  variantes: VarianteAdmin[];
}

export interface Trabajador {
  idEmpleado: number;
  nombre: string;
  email: string;
  activo: boolean;
  fechaCreacion: string;
  permisos: Permiso[];
}

export interface SubidaImagen {
  urlSubida: string;
  token: string;
  ruta: string;
  urlPublica: string;
  tipoContenido: string;
  expiraEnSegundos: number;
}

export interface EnlacePago {
  referencia: string;
  montoEnCentavos: number;
  moneda: string;
  checkoutUrl: string;
}

export type FilaReporte = Record<string, string | number | boolean | null>;
