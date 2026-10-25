"use client";

import { Shapes } from "lucide-react";
import { mensajeDeError } from "@/lib/api";
import { arbolPublico, categoriasPublicas } from "@/lib/categorias";
import { useCarga } from "@/lib/useCarga";
import { BotonEnlace } from "@/components/ui/controles";
import { Alerta, EstadoVacio } from "@/components/ui/avisos";
import Link from "next/link";
import { TarjetaCategoria, TarjetaCategoriaEsqueleto } from "@/components/tienda/TarjetaCategoria";

export function CategoriasTienda() {
  const carga = useCarga(() => categoriasPublicas(), []);
  const arbol = arbolPublico(carga.datos ?? []);

  return (
    <div className="ap-contenedor ap-pagina">
      <div className="ap-pagina__cabeza">
        <div>
          <h1>Categorías</h1>
          <p className="ec-muted">Elige una categoría para ver sus productos.</p>
        </div>
      </div>

      {carga.error ? (
        <Alerta tono="danger" titulo="No pudimos cargar las categorías">
          {mensajeDeError(carga.error)}
        </Alerta>
      ) : carga.cargando && !carga.datos ? (
        <div className="ap-cat-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <TarjetaCategoriaEsqueleto key={i} />
          ))}
        </div>
      ) : arbol.length === 0 ? (
        <EstadoVacio icono={Shapes} titulo="Aún no hay categorías" accion={<BotonEnlace href="/productos">Ver todos los productos</BotonEnlace>}>
          Cuando la tienda cree categorías, las vas a ver aquí.
        </EstadoVacio>
      ) : (
        <div className="ap-cat-grupos">
          {arbol.map((nodo) =>
            nodo.hijos.length === 0 ? null : (
              <section key={nodo.idCategoria} className="ap-cat-grupo" aria-labelledby={`cat-${nodo.idCategoria}`}>
                <div className="ap-cat-grupo__cabeza">
                  <h2 id={`cat-${nodo.idCategoria}`}>{nodo.nombre}</h2>
                  <Link href={`/productos?categoria=${nodo.idCategoria}`} className="ec-link">
                    Ver todo en {nodo.nombre}
                  </Link>
                </div>
                <div className="ap-cat-grid ap-cat-grid--sub">
                  {nodo.hijos.map((h) => (
                    <TarjetaCategoria key={h.idCategoria} nodo={h} />
                  ))}
                </div>
              </section>
            ),
          )}
          {arbol.some((n) => n.hijos.length === 0) && (
            <section className="ap-cat-grupo" aria-label="Otras categorías">
              <div className="ap-cat-grid">
                {arbol
                  .filter((n) => n.hijos.length === 0)
                  .map((n) => (
                    <TarjetaCategoria key={n.idCategoria} nodo={n} />
                  ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
