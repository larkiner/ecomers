import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { Productos } from "./Productos";

export const metadata = { title: "Catálogo · ECOMERS" };

export default function PaginaProductos() {
  return (
    <Suspense fallback={<Cargando texto="Cargando productos…" />}>
      <Productos />
    </Suspense>
  );
}
