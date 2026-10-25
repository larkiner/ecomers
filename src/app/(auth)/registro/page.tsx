import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { Registro } from "./Registro";

export const metadata = { title: "Crear cuenta · ECOMERS" };

export default function PaginaRegistro() {
  return (
    <Suspense fallback={<Cargando />}>
      <Registro />
    </Suspense>
  );
}
