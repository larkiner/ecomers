import { Trabajadores } from "./Trabajadores";

export default function PaginaTrabajadores() {
  return <Trabajadores />;
}

// Depende de la sesión del navegador (ver el layout del backoffice).
export const instant = false;
