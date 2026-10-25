import { CuentaPersonal } from "./CuentaPersonal";

export default function PaginaCuentaPersonal() {
  return <CuentaPersonal />;
}

// Depende de la sesión del navegador (ver el layout del backoffice).
export const instant = false;
