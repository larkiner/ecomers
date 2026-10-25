"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ImageOff, ShoppingCart, Tag } from "lucide-react";
import { useState } from "react";
import { agregarAlCarrito } from "@/lib/carrito";
import { tieneValor } from "@/lib/formato";
import type { VarianteCatalogo } from "@/lib/tipos";
import { Boton } from "../ui/controles";
import { Insignia } from "../ui/avisos";
import { Ahorro, Precio } from "../ui/datos";

/** Foto del producto con relleno cuando falta o no carga. */
/**
 * Foto de producto o categoría. next/image entrega un tamaño a la medida del espacio (`sizes`), en lugar de bajar siempre
 * la foto completa de 1600 px.
 */
export function FotoProducto({
  url,
  alt,
  tamanoIcono = 40,
  inmediata = false,
  sizes = "(max-width: 640px) 50vw, 260px",
}: {
  url?: string | null;
  alt: string;
  tamanoIcono?: number;
  inmediata?: boolean;
  sizes?: string;
}) {
  const [fallo, setFallo] = useState(false);
  if (!url || fallo) {
    return (
      <span className="ap-sin-foto" role="img" aria-label="Sin foto">
        <ImageOff size={tamanoIcono} strokeWidth={1.5} aria-hidden />
      </span>
    );
  }
  return <Image src={url} alt={alt} fill sizes={sizes} loading={inmediata ? "eager" : "lazy"} fetchPriority={inmediata ? "high" : undefined} onError={() => setFallo(true)} />;
}

/** Una variante del catálogo: la unidad de venta. */
export function TarjetaProducto({ variante }: { variante: VarianteCatalogo }) {
  const [agregado, setAgregado] = useState(false);
  const promo = tieneValor(variante.descuentoUnitario);
  const href = `/producto/${variante.idVariante}`;

  function agregar() {
    agregarAlCarrito(variante, 1);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1600);
  }

  return (
    <article className="ec-card">
      <Link href={href} className="ec-card__media" tabIndex={-1} aria-hidden>
        <FotoProducto url={variante.imagenUrl} alt="" />
        {promo && (
          <span className="ec-card__badge">
            <Insignia tono="promo" icono={Tag}>Oferta</Insignia>
          </span>
        )}
      </Link>
      <div className="ec-card__body">
        <h3 className="ec-card__name">
          <Link href={href} className="ap-enlace-tarjeta">
            {variante.nombre}
          </Link>
        </h3>
        <span className="ec-card__sku">{variante.sku}</span>
        <div className="ec-card__foot">
          <div>
            <Precio final={variante.precioFinal} base={promo ? variante.precioBase : null} />
            <Ahorro descuento={variante.descuentoUnitario} />
          </div>
          <Boton bloque icono={agregado ? Check : ShoppingCart} variante={agregado ? "secondary" : "primary"} onClick={agregar}>
            {agregado ? "Agregado" : "Agregar al carrito"}
          </Boton>
        </div>
      </div>
    </article>
  );
}

export function TarjetaEsqueleto() {
  return (
    <div className="ec-card" aria-hidden>
      <span className="ec-card__media ec-skeleton" style={{ borderRadius: 0 }} />
      <div className="ec-card__body">
        <span className="ec-skeleton" style={{ height: 18, width: "85%" }} />
        <span className="ec-skeleton" style={{ height: 12, width: "40%" }} />
        <span className="ec-skeleton" style={{ height: 24, width: "55%", marginTop: 8 }} />
        <span className="ec-skeleton" style={{ height: 44 }} />
      </div>
    </div>
  );
}
