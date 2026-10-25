import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { DetalleProducto } from "./DetalleProducto";

export default function PaginaProducto() {
  return (
    <Suspense fallback={<Cargando texto="Cargando producto…" />}>
      <DetalleProducto />
    </Suspense>
  );
}
