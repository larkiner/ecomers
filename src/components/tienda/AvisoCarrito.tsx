"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { EVENTO_AGREGADO, type DetalleAgregado } from "@/lib/carrito";

/** Cuánto se queda visible el aviso: lo justo para leerlo, sin tapar la tienda. */
const VISIBLE_MS = 5000;

/**
 * Aviso que confirma "agregaste esto al carrito" en menos de 100 ms y ofrece ir al carrito. Es una región `status`, así
 * que el lector de pantalla también lo anuncia. Se cierra solo, con la X o con Esc.
 */
export function AvisoCarrito() {
  const [aviso, setAviso] = useState<(DetalleAgregado & { clave: number }) | null>(null);

  useEffect(() => {
    let temporizador = 0;
    const alAgregar = (e: Event) => {
      const detalle = (e as CustomEvent<DetalleAgregado>).detail;
      setAviso({ ...detalle, clave: Date.now() });
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(() => setAviso(null), VISIBLE_MS);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setAviso(null);
    window.addEventListener(EVENTO_AGREGADO, alAgregar);
    document.addEventListener("keydown", escape);
    return () => {
      window.clearTimeout(temporizador);
      window.removeEventListener(EVENTO_AGREGADO, alAgregar);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div className="ap-aviso-zona" role="status" aria-live="polite">
      {aviso && (
        <div key={aviso.clave} className="ap-aviso">
          <span className="ap-aviso__icono">
            <Check size={18} strokeWidth={2.5} aria-hidden />
          </span>
          <p>
            Agregaste <strong>{aviso.cantidad > 1 ? `${aviso.cantidad} × ` : ""}{aviso.nombre}</strong> al carrito.
          </p>
          <Link href="/carrito" className="ec-btn ec-btn--primary ec-btn--sm" onClick={() => setAviso(null)}>
            Ver carrito
          </Link>
          <button type="button" className="ap-icono" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
