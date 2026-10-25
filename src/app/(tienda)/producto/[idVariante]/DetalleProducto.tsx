"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, CreditCard, PackageSearch, ShieldCheck, ShoppingCart, Tag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { api, ApiError, mensajeDeError } from "@/lib/api";
import { agregarAlCarrito } from "@/lib/carrito";
import { formatPorcentaje, multiplicarDinero, tieneValor } from "@/lib/formato";
import type { VarianteCatalogo } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { Boton, BotonEnlace, Cantidad } from "@/components/ui/controles";
import { Alerta, Cargando, EstadoVacio, Insignia } from "@/components/ui/avisos";
import { Ahorro, Precio } from "@/components/ui/datos";
import { FotoProducto } from "@/components/tienda/TarjetaProducto";

export function DetalleProducto() {
  const { idVariante } = useParams<{ idVariante: string }>();
  const router = useRouter();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const carga = useCarga((signal) => api<VarianteCatalogo>(`/catalogo/variantes/${encodeURIComponent(idVariante)}`, { publica: true, signal }), [idVariante]);

  // La pestaña dice qué producto es, para quien tiene varias abiertas o vuelve desde el historial.
  useEffect(() => {
    if (carga.datos) document.title = `${carga.datos.nombre} · ECOMERS`;
  }, [carga.datos]);

  if (carga.cargando) return <Cargando texto="Cargando producto…" />;
  if (carga.error) {
    const noExiste = carga.error instanceof ApiError && carga.error.status === 404;
    return (
      <div className="ap-contenedor ap-pagina">
        {noExiste ? (
          <EstadoVacio icono={PackageSearch} titulo="Este producto ya no está disponible" accion={<BotonEnlace href="/productos">Ir al catálogo</BotonEnlace>}>
            Puede que se haya agotado o que ya no lo vendamos.
          </EstadoVacio>
        ) : (
          <Alerta tono="danger" titulo="No pudimos cargar el producto">
            {mensajeDeError(carga.error)}
          </Alerta>
        )}
      </div>
    );
  }
  const v = carga.datos;
  if (!v) return null;
  const promo = tieneValor(v.descuentoUnitario);

  function agregar(irAlCarrito: boolean) {
    if (!v) return;
    agregarAlCarrito(v, cantidad, { aviso: !irAlCarrito });
    if (irAlCarrito) {
      router.push("/carrito");
    } else {
      setAgregado(true);
      window.setTimeout(() => setAgregado(false), 2000);
    }
  }

  return (
    <div className="ap-contenedor ap-pagina ap-pagina--con-barra">
      <Link href="/productos" className="ap-volver">
        <ArrowLeft size={16} strokeWidth={2} aria-hidden /> Volver al catálogo
      </Link>
      <div className="ap-detalle">
        <div className="ap-detalle__foto">
          <FotoProducto url={v.imagenUrl} alt={v.nombre} tamanoIcono={72} inmediata sizes="(max-width: 860px) 100vw, 600px" />
          {promo && (
            <span className="ec-card__badge">
              <Insignia tono="promo" icono={Tag}>Oferta</Insignia>
            </span>
          )}
        </div>
        <div className="ap-detalle__info">
          <span className="ec-card__sku">SKU {v.sku}</span>
          <h1>{v.nombre}</h1>
          <div className="ap-detalle__precio">
            <Precio final={v.precioFinal} base={promo ? v.precioBase : null} tamano="lg" />
            <Ahorro descuento={v.descuentoUnitario} />
            <p className="ec-muted">
              Más IVA del {formatPorcentaje(v.tasaImpuesto)}, que se calcula al crear el pedido. El precio final se confirma en ese momento.
            </p>
          </div>
          <div className="ap-detalle__compra">
            <Cantidad valor={cantidad} alCambiar={setCantidad} etiqueta={`Cantidad de ${v.nombre}`} />
            <Boton tamano="lg" icono={agregado ? Check : ShoppingCart} variante={agregado ? "secondary" : "primary"} onClick={() => agregar(false)}>
              {agregado ? "Agregado al carrito" : "Agregar al carrito"}
            </Boton>
            <Boton tamano="lg" variante="secondary" icono={CreditCard} onClick={() => agregar(true)}>
              Comprar ahora
            </Boton>
          </div>
          {cantidad > 1 && (
            <p className="ec-muted">
              Subtotal: <Precio final={multiplicarDinero(v.precioFinal, cantidad)} tamano="sm" />
            </p>
          )}
          <ul className="ap-detalle__garantias">
            <li>
              <ShieldCheck size={18} strokeWidth={2} aria-hidden /> Pago seguro con Wompi: tarjeta, PSE o Nequi.
            </li>
            <li>
              <Truck size={18} strokeWidth={2} aria-hidden /> Reservamos tu stock durante 30 minutos mientras pagas.
            </li>
          </ul>
          {!v.controlaStock && <Alerta tono="info">Producto bajo pedido: lo confirmamos contigo después de la compra.</Alerta>}
        </div>
      </div>
      {/* Ley de Fitts: en el celular, la compra queda fija abajo, al alcance del pulgar. */}
      <div className="ap-compra-movil">
        <Precio final={multiplicarDinero(v.precioFinal, cantidad)} tamano="sm" />
        <Boton icono={agregado ? Check : ShoppingCart} variante={agregado ? "secondary" : "primary"} onClick={() => agregar(false)}>
          {agregado ? "Agregado" : "Agregar al carrito"}
        </Boton>
      </div>
    </div>
  );
}
