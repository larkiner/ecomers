import { Productos } from "./Productos";

export default function PaginaProductos() {
  return <Productos />;
}

// Depende de la sesión del navegador (ver el layout del backoffice).
export const instant = false;
