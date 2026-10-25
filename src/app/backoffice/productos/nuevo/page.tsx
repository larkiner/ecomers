import { NuevoProducto } from "./NuevoProducto";

export default function PaginaNuevoProducto() {
  return <NuevoProducto />;
}

// Depende de la sesión del navegador (ver el layout del backoffice).
export const instant = false;
