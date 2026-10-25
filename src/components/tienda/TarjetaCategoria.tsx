import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NodoPublico } from "@/lib/categorias";
import { FotoProducto } from "./TarjetaProducto";

/** Una categoría real de la tienda, con su imagen. Lleva a los productos de esa categoría (y de sus subcategorías). */
export function TarjetaCategoria({ nodo, conSubcategorias = false }: { nodo: NodoPublico; conSubcategorias?: boolean }) {
  return (
    <article className="ap-cat">
      <div className="ap-cat__foto">
        <FotoProducto url={nodo.imagenUrl} alt="" tamanoIcono={44} inmediata sizes="(max-width: 640px) 50vw, 300px" />
      </div>
      <div className="ap-cat__cuerpo">
        <h3 className="ap-cat__nombre">
          <Link href={`/productos?categoria=${nodo.idCategoria}`} className="ap-enlace-tarjeta">
            {nodo.nombre}
          </Link>
        </h3>
        <span className="ap-cat__ver">
          Ver productos <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </span>
        {conSubcategorias && nodo.hijos.length > 0 && (
          <ul className="ap-cat__hijos" aria-label={`Subcategorías de ${nodo.nombre}`}>
            {nodo.hijos.map((h) => (
              <li key={h.idCategoria}>
                <Link href={`/productos?categoria=${h.idCategoria}`} className="ap-chip">
                  {h.nombre}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function TarjetaCategoriaEsqueleto() {
  return (
    <div className="ap-cat" aria-hidden>
      <span className="ap-cat__foto ec-skeleton" style={{ borderRadius: 0 }} />
      <div className="ap-cat__cuerpo">
        <span className="ec-skeleton" style={{ height: 20, width: "60%" }} />
        <span className="ec-skeleton" style={{ height: 14, width: "35%" }} />
      </div>
    </div>
  );
}
