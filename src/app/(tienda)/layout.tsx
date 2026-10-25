import { ViewTransition } from "react";
import { AvisoCarrito } from "@/components/tienda/AvisoCarrito";
import { EfectoLuz } from "@/components/tienda/EfectoLuz";
import { Encabezado } from "@/components/tienda/Encabezado";
import { Pie } from "@/components/tienda/Pie";

export default function LayoutTienda({ children }: LayoutProps<"/">) {
  return (
    <div className="ap-tienda">
      <a href="#contenido" className="ap-saltar">
        Saltar al contenido
      </a>
      <Encabezado />
      {/* Cada cambio de página sale y entra con una transición suave (ver ::view-transition en app.css). */}
      <ViewTransition default="vt-pagina">
        <main id="contenido" className="ap-tienda__main">
          {children}
        </main>
      </ViewTransition>
      <Pie />
      <AvisoCarrito />
      <EfectoLuz />
    </div>
  );
}
