"use client";

import { Cpu, SearchX } from "lucide-react";
import { BotonEnlace } from "@/components/ui/controles";
import { EstadoVacio } from "@/components/ui/avisos";

export default function NoEncontrada() {
  return (
    <main className="ap-contenedor ap-pagina">
      <EstadoVacio
        icono={SearchX}
        titulo="Esta página no existe"
        accion={
          <BotonEnlace href="/" icono={Cpu}>
            Ir a la tienda
          </BotonEnlace>
        }
      >
        Puede que el enlace esté mal escrito o que la página ya no esté disponible.
      </EstadoVacio>
    </main>
  );
}
