"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, ApiError, mensajeDeError } from "@/lib/api";
import { cambiarCantidad, quitarDelCarrito, subtotalCarrito, unidadesEnCarrito, useCarrito, vaciarCarrito, type ItemCarrito } from "@/lib/carrito";
import { multiplicarDinero } from "@/lib/formato";
import { esPersonal, useEnNavegador, useSesion } from "@/lib/sesion";
import type { EnlacePago } from "@/lib/tipos";
import { Boton, BotonEnlace, BotonIcono, Cantidad } from "@/components/ui/controles";
import { Alerta, Cargando, EstadoVacio } from "@/components/ui/avisos";
import { Precio } from "@/components/ui/datos";
import { FotoProducto } from "@/components/tienda/TarjetaProducto";
import { PasosCompra } from "@/components/tienda/PasosCompra";

type Paso = "inactivo" | "sincronizando" | "creando" | "pagando";

const TEXTO_PASO: Record<Paso, string> = {
  inactivo: "Ir a pagar",
  sincronizando: "Revisando tu carrito…",
  creando: "Reservando tu stock…",
  pagando: "Abriendo Wompi…",
};

/** Lleva el carrito local al servidor tal cual: lo vacía y agrega cada producto. */
async function sincronizarCarrito(items: ItemCarrito[]) {
  await api("/carrito", { metodo: "DELETE" });
  for (const i of items) {
    await api("/carrito/items", { metodo: "POST", cuerpo: { idVariante: i.idVariante, cantidad: i.cantidad } });
  }
}

export function Carrito() {
  const items = useCarrito();
  const sesion = useSesion();
  const listo = useEnNavegador();
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("inactivo");
  const [error, setError] = useState<{ texto: string; codigo?: string } | null>(null);
  const [pedidoPendiente, setPedidoPendiente] = useState<number | null>(null);

  if (!listo) return <Cargando texto="Cargando tu carrito…" />;

  async function pagar(idPedido: number) {
    setPaso("pagando");
    const enlace = await api<EnlacePago>(`/pedidos/${idPedido}/pagos`, { metodo: "POST" });
    window.location.assign(enlace.checkoutUrl);
  }

  async function irAPagar() {
    setError(null);
    if (!sesion) {
      router.push("/ingresar?vuelta=/carrito");
      return;
    }
    try {
      if (pedidoPendiente) {
        await pagar(pedidoPendiente);
        return;
      }
      setPaso("sincronizando");
      await sincronizarCarrito(items);
      setPaso("creando");
      const { idPedido } = await api<{ idPedido: number }>("/pedidos", { metodo: "POST" });
      // El pedido ya congeló precios y reservó stock: el carrito del servidor y el local quedan vacíos.
      vaciarCarrito();
      setPedidoPendiente(idPedido);
      await pagar(idPedido);
    } catch (e) {
      setPaso("inactivo");
      setError({ texto: mensajeDeError(e), codigo: e instanceof ApiError ? e.codigo : undefined });
    }
  }

  async function cancelarPedido() {
    if (!pedidoPendiente) return;
    try {
      await api(`/pedidos/${pedidoPendiente}/cancelacion`, { metodo: "POST", cuerpo: { motivo: "Cancelado por el cliente antes de pagar" } });
      setPedidoPendiente(null);
      setError(null);
    } catch (e) {
      setError({ texto: mensajeDeError(e) });
    }
  }

  if (esPersonal(sesion)) {
    return (
      <div className="ap-contenedor ap-pagina">
        <Alerta tono="info" titulo="Estás con una cuenta del equipo">
          Las compras se hacen con una cuenta de cliente. Cierra sesión o usa otra ventana para comprar.
        </Alerta>
      </div>
    );
  }

  if (items.length === 0 && !pedidoPendiente) {
    return (
      <div className="ap-contenedor ap-pagina">
        <EstadoVacio icono={ShoppingCart} titulo="Tu carrito está vacío" accion={<BotonEnlace href="/productos">Ver productos</BotonEnlace>}>
          Agrega productos desde la tienda y aquí verás el resumen antes de pagar.
        </EstadoVacio>
      </div>
    );
  }

  const ocupado = paso !== "inactivo";
  return (
    <div className="ap-contenedor ap-pagina">
      <div className="ap-pagina__cabeza">
        <div>
          <h1>Tu carrito</h1>
          <p className="ec-muted">{unidadesEnCarrito(items)} productos</p>
        </div>
      </div>
      <PasosCompra actual={1} />

      {error && (
        <div className="ap-espacio">
          <Alerta tono="danger" titulo="No pudimos continuar con el pago" codigo={error.codigo} alCerrar={() => setError(null)}>
            {error.texto}
          </Alerta>
        </div>
      )}

      {pedidoPendiente && (
        <div className="ap-espacio">
          <Alerta tono="warning" titulo={`Tu pedido #${pedidoPendiente} está esperando el pago`}>
            Reservamos tu stock durante 30 minutos. Puedes intentar pagar de nuevo o cancelarlo.
            <div className="ec-row ap-espacio-arriba">
              <Boton tamano="sm" onClick={() => void irAPagar()} cargando={ocupado}>
                Reintentar el pago
              </Boton>
              <Boton tamano="sm" variante="secondary" onClick={() => void cancelarPedido()} disabled={ocupado}>
                Cancelar pedido
              </Boton>
            </div>
          </Alerta>
        </div>
      )}

      <div className="ap-carrito">
        <ul className="ap-carrito__lista">
          {items.map((i) => (
            <li key={i.idVariante} className="ap-linea">
              <Link href={`/producto/${i.idVariante}`} className="ap-linea__foto" tabIndex={-1} aria-hidden>
                <FotoProducto url={i.imagenUrl} alt="" tamanoIcono={28} sizes="88px" />
              </Link>
              <div className="ap-linea__info">
                <Link href={`/producto/${i.idVariante}`} className="ap-linea__nombre">
                  {i.nombre}
                </Link>
                <span className="ec-card__sku">{i.sku}</span>
                <Precio final={i.precioFinal} base={i.precioBase} tamano="sm" />
              </div>
              <div className="ap-linea__acciones">
                <Cantidad valor={i.cantidad} alCambiar={(n) => cambiarCantidad(i.idVariante, n)} etiqueta={`Cantidad de ${i.nombre}`} deshabilitado={ocupado} />
                <Precio final={multiplicarDinero(i.precioFinal, i.cantidad)} tamano="sm" />
                <BotonIcono icono={Trash2} etiqueta={`Quitar ${i.nombre}`} variante="ghost" onClick={() => quitarDelCarrito(i.idVariante)} disabled={ocupado} />
              </div>
            </li>
          ))}
        </ul>

        <aside className="ap-resumen ec-panel" aria-label="Resumen de compra">
          <h2>Resumen</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>
                <Precio final={subtotalCarrito(items)} tamano="md" />
              </dd>
            </div>
            <div>
              <dt>IVA</dt>
              <dd className="ec-muted">Se calcula al crear el pedido</dd>
            </div>
          </dl>
          <Boton bloque tamano="lg" iconoDerecha={ocupado ? undefined : sesion ? ArrowRight : Lock} cargando={ocupado} onClick={() => void irAPagar()} disabled={items.length === 0 && !pedidoPendiente}>
            {sesion ? TEXTO_PASO[paso] : "Ingresa para pagar"}
          </Boton>
          <p className="ap-resumen__nota">
            <ShieldCheck size={16} strokeWidth={2} aria-hidden /> Pagas en Wompi. Al crear el pedido reservamos tu stock durante 30 minutos.
          </p>
          <Link href="/productos" className="ec-link">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
