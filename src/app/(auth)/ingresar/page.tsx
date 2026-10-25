import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { Ingresar } from "./Ingresar";

export const metadata = { title: "Ingresar · ECOMERS" };

export default function PaginaIngresar() {
  return (
    <Suspense fallback={<Cargando />}>
      <Ingresar />
    </Suspense>
  );
}
