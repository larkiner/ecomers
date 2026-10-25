import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { Inventario } from "./Inventario";

export default function PaginaInventario() {
  return (
    <Suspense fallback={<Cargando texto="Cargando inventario…" />}>
      <Inventario />
    </Suspense>
  );
}

// Depende de la sesión del navegador (ver el layout del backoffice).
export const instant = false;
