"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { arbolPublico, buscarNodo, categoriasPublicas, contiene, raizDe } from "@/lib/categorias";
import type { PaginaCatalogo } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { Boton } from "@/components/ui/controles";
import { Alerta, EstadoVacio } from "@/components/ui/avisos";
import { Paginacion } from "@/components/ui/datos";
import { TarjetaEsqueleto, TarjetaProducto } from "@/components/tienda/TarjetaProducto";

const TAMANO = 20;
/** Leyes de Hick y Miller: a la vista, como mucho seis categorías; el resto detrás de "Más". */
const VISIBLES = 6;

/** Enlace de filtro: una "pastilla" que lleva a /productos con la búsqueda y la categoría elegidas. */
function Pastilla({ href, activa, children }: { href: string; activa: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className="ap-chip" aria-current={activa ? "true" : undefined}>
      {children}
    </Link>
  );
}

export function Productos() {
  const params = useSearchParams();
  const router = useRouter();
  const q = (params.get("q") ?? "").trim();
  const idCategoria = Number.parseInt(params.get("categoria") ?? "", 10);
  const categoria = Number.isFinite(idCategoria) && idCategoria > 0 ? idCategoria : null;
  const pagina = Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0);

  const categorias = useCarga(() => categoriasPublicas(), []);
  const arbol = arbolPublico(categorias.datos ?? []);
  const elegida = categoria !== null ? buscarNodo(arbol, categoria) : undefined;
  const raiz = categoria !== null ? raizDe(arbol, categoria) : undefined;

  const carga = useCarga(
    (signal) => {
      const qs = new URLSearchParams({ page: String(pagina), size: String(TAMANO) });
      if (q) qs.set("q", q);
      if (categoria !== null) qs.set("categoria", String(categoria));
      return api<PaginaCatalogo>(`/catalogo/variantes?${qs}`, { publica: true, signal });
    },
    [q, categoria, pagina],
  );

  /** Enlace a esta misma vista cambiando solo la categoría (se conserva la búsqueda). */
  function hrefCategoria(id: number | null) {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (id !== null) qs.set("categoria", String(id));
    const texto = qs.toString();
    return texto ? `/productos?${texto}` : "/productos";
  }

  function irA(nueva: number) {
    const qs = new URLSearchParams(params.toString());
    qs.set("page", String(nueva));
    router.push(`/productos?${qs}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const datos = carga.datos;
  const titulo = q ? `Resultados para “${q}”` : elegida ? elegida.nombre : "Catálogo";
  const filtrado = q !== "" || categoria !== null;

  return (
    <div className="ap-contenedor ap-pagina">
      <div className="ap-pagina__cabeza">
        <div>
          <h1>{titulo}</h1>
          <p className="ec-muted">
            {datos ? `${datos.total} ${datos.total === 1 ? "producto" : "productos"}` : "Buscando productos…"}
            {q && elegida ? ` en ${elegida.nombre}` : ""} · Los precios ya incluyen los descuentos vigentes.
          </p>
        </div>
        {filtrado && (
          <Boton variante="secondary" icono={X} onClick={() => router.push("/productos")}>
            Quitar filtros
          </Boton>
        )}
      </div>

      {arbol.length > 0 && (
        <nav className="ap-filtro-categorias" aria-label="Filtrar por categoría">
          <div className="ap-chips">
            <Pastilla href={hrefCategoria(null)} activa={categoria === null}>
              Todas
            </Pastilla>
            {arbol.slice(0, VISIBLES).map((r) => (
              <Pastilla key={r.idCategoria} href={hrefCategoria(r.idCategoria)} activa={raiz?.idCategoria === r.idCategoria}>
                {r.nombre}
              </Pastilla>
            ))}
            {arbol.length > VISIBLES && (
              <details className="ap-mas" open={!!raiz && arbol.indexOf(raiz) >= VISIBLES}>
                <summary className="ap-chip">Más ({arbol.length - VISIBLES})</summary>
                {arbol.slice(VISIBLES).map((r) => (
                  <Pastilla key={r.idCategoria} href={hrefCategoria(r.idCategoria)} activa={raiz?.idCategoria === r.idCategoria}>
                    {r.nombre}
                  </Pastilla>
                ))}
              </details>
            )}
          </div>
          {raiz && raiz.hijos.length > 0 && (
            <div className="ap-chips ap-chips--sub" aria-label={`Subcategorías de ${raiz.nombre}`}>
              <Pastilla href={hrefCategoria(raiz.idCategoria)} activa={categoria === raiz.idCategoria}>
                Todo en {raiz.nombre}
              </Pastilla>
              {raiz.hijos.map((h) => (
                <Pastilla key={h.idCategoria} href={hrefCategoria(h.idCategoria)} activa={categoria !== null && contiene(h, categoria)}>
                  {h.nombre}
                </Pastilla>
              ))}
            </div>
          )}
        </nav>
      )}

      {carga.error ? (
        <Alerta tono="danger" titulo="No pudimos cargar los productos">
          {mensajeDeError(carga.error)}
        </Alerta>
      ) : carga.cargando && !datos ? (
        <div className="ec-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <TarjetaEsqueleto key={i} />
          ))}
        </div>
      ) : datos && datos.contenido.length === 0 ? (
        <EstadoVacio
          icono={Search}
          titulo={q ? `No encontramos “${q}”` : elegida ? `Aún no hay productos en ${elegida.nombre}` : "Aún no hay productos publicados"}
          accion={
            filtrado ? (
              <Boton variante="secondary" onClick={() => router.push("/productos")}>
                Ver todos los productos
              </Boton>
            ) : undefined
          }
        >
          {q ? "Revisa la ortografía o busca con menos palabras." : filtrado ? "Prueba con otra categoría." : "Vuelve pronto: estamos cargando el catálogo."}
        </EstadoVacio>
      ) : datos ? (
        <div className="ap-stack">
          <h2 className="ec-sr">Resultados</h2>
          <div className="ec-grid" aria-busy={carga.cargando}>
            {datos.contenido.map((v) => (
              <TarjetaProducto key={v.idVariante} variante={v} />
            ))}
          </div>
          <Paginacion pagina={pagina} tamano={TAMANO} total={datos.total} alCambiar={irA} />
        </div>
      ) : null}
    </div>
  );
}
