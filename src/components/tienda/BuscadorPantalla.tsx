"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { categoriasPublicas } from "@/lib/categorias";
import { useCarga } from "@/lib/useCarga";
import { useDialogo } from "../useDialogo";

/** Ley de Hick y de Miller: pocas sugerencias, y el resto a un clic en la vista de Categorías. */
const SUGERENCIAS = 6;

/** Buscador a pantalla completa: se abre desde "Buscar" en el encabezado o con la tecla "/". */
export function BuscadorPantalla({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const router = useRouter();
  const { ref, onCancel } = useDialogo(abierto, alCerrar);
  const campo = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  // Las sugerencias son las categorías reales de la tienda; si fallan, el buscador sigue sirviendo.
  const categorias = useCarga(() => categoriasPublicas(), []);
  const lista = categorias.datos ?? [];

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/productos?q=${encodeURIComponent(t)}` : "/productos");
    setQ("");
    alCerrar();
  }

  return (
    <dialog
      ref={ref}
      className="ap-buscador"
      aria-label="Buscar productos"
      onCancel={onCancel}
      onClose={alCerrar}
      onClick={(e) => {
        if (e.target === ref.current) alCerrar();
      }}
    >
      <form className="ap-buscador__caja" role="search" onSubmit={buscar}>
        <div className="ap-buscador__campo">
          <Search size={22} strokeWidth={2} aria-hidden />
          <input
            ref={campo}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="¿Qué estás buscando?"
            aria-label="Buscar productos por nombre o código"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="button" className="ap-buscador__cerrar" onClick={alCerrar} aria-label="Cerrar buscador">
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <p className="ap-buscador__ayuda">
          Escribe el nombre o el código (SKU) del producto y pulsa <kbd>Enter</kbd>. Para cerrar, pulsa <kbd>Esc</kbd>.
        </p>
        {lista.length > 0 && (
          <div className="ap-buscador__sugerencias">
            <span>O explora por categoría</span>
            <div className="ap-chips">
              {lista.slice(0, SUGERENCIAS).map((c) => (
                <Link key={c.idCategoria} href={`/productos?categoria=${c.idCategoria}`} className="ap-chip" onClick={alCerrar}>
                  {c.nombre}
                </Link>
              ))}
              {lista.length > SUGERENCIAS && (
                <Link href="/categorias" className="ap-chip" onClick={alCerrar}>
                  Ver todas las categorías
                </Link>
              )}
            </div>
          </div>
        )}
      </form>
    </dialog>
  );
}
