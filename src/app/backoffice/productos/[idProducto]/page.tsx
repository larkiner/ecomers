import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { EditarProducto } from "./EditarProducto";

export default function PaginaEditarProducto() {
  return (
    <Suspense fallback={<Cargando texto="Cargando producto…" />}>
      <EditarProducto />
    </Suspense>
  );
}

// Depende de la sesión del navegador (ver el layout del backoffice).
export const instant = false;
