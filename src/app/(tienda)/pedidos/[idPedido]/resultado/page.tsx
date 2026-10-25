import { Suspense } from "react";
import { Cargando } from "@/components/ui/avisos";
import { ResultadoPago } from "./ResultadoPago";

export const metadata = { title: "Resultado del pago · ECOMERS" };

export default function PaginaResultado() {
  return (
    <Suspense fallback={<Cargando />}>
      <ResultadoPago />
    </Suspense>
  );
}
