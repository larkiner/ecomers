import { Suspense } from "react";
import { MarcoBackoffice } from "@/components/backoffice/MarcoBackoffice";
import { Cargando } from "@/components/ui/avisos";

export const metadata = { title: "Backoffice · ECOMERS" };

// Todo el backoffice depende de la sesión del navegador: no puede tener navegación instantánea validada en el servidor.
export const instant = false;

// El backoffice depende de la sesión del navegador: todo se pinta en el cliente, dentro de <Suspense>.
export default function LayoutBackoffice({ children }: LayoutProps<"/backoffice">) {
  return (
    <Suspense fallback={<Cargando texto="Cargando backoffice…" />}>
      <MarcoBackoffice>{children}</MarcoBackoffice>
    </Suspense>
  );
}
