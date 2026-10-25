"use client";

import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, Wallet } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { categoriasPublicas } from "@/lib/categorias";
import type { PaginaCatalogo } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { formatCOP } from "@/lib/formato";
import { BotonEnlace } from "@/components/ui/controles";
import { Alerta } from "@/components/ui/avisos";
import { Carrusel } from "@/components/tienda/Carrusel";
import { TarjetaCategoria, TarjetaCategoriaEsqueleto } from "@/components/tienda/TarjetaCategoria";
import { FotoProducto, TarjetaEsqueleto, TarjetaProducto } from "@/components/tienda/TarjetaProducto";

const BENEFICIOS = [
  { icono: ShieldCheck, titulo: "Pago seguro", texto: "Pagas en Wompi con tarjeta, PSE o Nequi." },
  { icono: Clock, titulo: "Tu stock apartado", texto: "Lo reservamos 30 minutos mientras pagas." },
  { icono: Wallet, titulo: "Precios claros", texto: "Ves el descuento antes de comprar." },
];

export function Inicio() {
  const categorias = useCarga(() => categoriasPublicas(), []);
  const productos = useCarga((signal) => api<PaginaCatalogo>("/catalogo/variantes?page=0&size=8", { publica: true, signal }), []);

  // Solo se muestra lo que existe en la base: con fotos primero, y sin sección si no hay nada.
  const lista = [...(categorias.datos ?? [])].sort((a, b) => Number(!!b.imagenUrl) - Number(!!a.imagenUrl));
  const recientes = productos.datos?.contenido ?? [];
  const destacado = recientes.find((v) => v.imagenUrl) ?? recientes[0];

  return (
    <>
      <section className={`ap-escena${destacado ? " ap-escena--viva" : ""}`} aria-label="Portada">
        <div className="ap-escena__marco">
          <div className="ap-escena__titular ap-contenedor">
            <h1>Tecnología que quieres, a precio claro.</h1>
            <p>Con el descuento a la vista, precios en pesos y pago seguro con Wompi.</p>
            <div className="ec-row ap-escena__acciones">
              <BotonEnlace href="/productos" tamano="lg" iconoDerecha={ArrowRight}>
                Comprar en el catálogo
              </BotonEnlace>
              <BotonEnlace href="/categorias" variante="secondary" tamano="lg">
                Ver categorías
              </BotonEnlace>
            </div>
          </div>

          {destacado && (
            <Link href={`/producto/${destacado.idVariante}`} className="ap-escena__placa ap-destacado">
              <div className="ap-destacado__texto ap-escena__final">
                <h2>{destacado.nombre}</h2>
                <p className="ap-destacado__precio">{formatCOP(destacado.precioFinal)}</p>
                <span className="ap-destacado__ir">
                  Ver producto <ArrowRight size={18} strokeWidth={2} aria-hidden />
                </span>
              </div>
              <div className="ap-destacado__foto">
                <FotoProducto url={destacado.imagenUrl} alt={destacado.nombre} tamanoIcono={64} inmediata sizes="(max-width: 900px) 100vw, 640px" />
              </div>
            </Link>
          )}
        </div>
      </section>

      <div className="ap-contenedor ap-secciones">
        {categorias.error ? (
          <Alerta tono="warning" titulo="No pudimos cargar las categorías">
            {mensajeDeError(categorias.error)}
          </Alerta>
        ) : categorias.cargando && !categorias.datos ? (
          <section aria-label="Categorías">
            <div className="ap-carrusel">
              {Array.from({ length: 4 }, (_, i) => (
                <TarjetaCategoriaEsqueleto key={i} />
              ))}
            </div>
          </section>
        ) : lista.length > 0 ? (
          <section aria-labelledby="titulo-categorias">
            <div className="ap-seccion__cabeza">
              <h2 id="titulo-categorias">Explora por categoría</h2>
              <Link href="/categorias" className="ec-link">
                Ver todas <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            </div>
            <Carrusel etiqueta="Categorías">
              {lista.map((c) => (
                <TarjetaCategoria key={c.idCategoria} nodo={{ ...c, hijos: [] }} />
              ))}
            </Carrusel>
          </section>
        ) : null}

        {productos.cargando && !productos.datos ? (
          <section aria-label="Productos">
            <div className="ap-carrusel">
              {Array.from({ length: 4 }, (_, i) => (
                <TarjetaEsqueleto key={i} />
              ))}
            </div>
          </section>
        ) : recientes.length > 0 ? (
          <section aria-labelledby="titulo-recientes">
            <div className="ap-seccion__cabeza">
              <h2 id="titulo-recientes">Lo que hay en la tienda</h2>
              <Link href="/productos" className="ec-link">
                Ver el catálogo <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            </div>
            <Carrusel etiqueta="Productos de la tienda" className="ap-carrusel--productos">
              {recientes.map((v) => (
                <TarjetaProducto key={v.idVariante} variante={v} />
              ))}
            </Carrusel>
          </section>
        ) : null}

        <section className="ap-beneficios" aria-label="Por qué comprar en ECOMERS">
          {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="ap-beneficio">
              <span className="ap-beneficio__icono">
                <Icono size={24} strokeWidth={2} aria-hidden />
              </span>
              <div>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
