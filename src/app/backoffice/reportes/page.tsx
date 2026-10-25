import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { Reportes } from "./Reportes";

export default function PaginaReportes() {
  return (
    <Suspense fallback={<Cargando texto="Cargando reportes…" />}>
      <Reportes />
    </Suspense>
  );
}

// Depende de la sesión del navegador (ver el layout del backoffice).
export const instant = false;
