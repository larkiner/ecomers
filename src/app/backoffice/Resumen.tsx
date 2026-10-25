"use client";

import Link from "next/link";
import { CircleDollarSign, Clock, PackagePlus, PackageX, Plus, ReceiptText, TriangleAlert, Warehouse } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { formatCOP, formatFechaHora, sumarDinero } from "@/lib/formato";
import { tienePermiso, useSesion } from "@/lib/sesion";
import type { FilaReporte } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { BotonEnlace } from "@/components/ui/controles";
import { Alerta, Esqueleto, Insignia } from "@/components/ui/avisos";
import { Tabla } from "@/components/ui/datos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";

interface DatosResumen {
  ventas: FilaReporte[] | null;
  pendientes: FilaReporte[] | null;
  stockBajo: FilaReporte[] | null;
  conciliacion: FilaReporte[] | null;
  errores: string[];
}

async function cargarResumen(signal: AbortSignal): Promise<DatosResumen> {
  const leer = (r: string) => api<FilaReporte[]>(`/backoffice/reportes/${r}`, { signal });
  const [ventas, pendientes, stockBajo, conciliacion] = await Promise.allSettled([leer("ventas-diarias"), leer("pedidos-pendientes?limite=10"), leer("stock-bajo?limite=10"), leer("conciliacion-pagos?limite=50")]);
  const valor = (r: PromiseSettledResult<FilaReporte[]>) => (r.status === "fulfilled" ? r.value : null);
  const errores = [ventas, pendientes, stockBajo, conciliacion].filter((r) => r.status === "rejected").map((r) => mensajeDeError((r as PromiseRejectedResult).reason));
  return { ventas: valor(ventas), pendientes: valor(pendientes), stockBajo: valor(stockBajo), conciliacion: valor(conciliacion), errores: [...new Set(errores)] };
}

function Indicador({ icono: Icono, titulo, valor, detalle, tono = "info" }: { icono: typeof Clock; titulo: string; valor: React.ReactNode; detalle?: string; tono?: "info" | "warning" | "danger" | "success" }) {
  return (
    <div className={`ap-indicador ap-indicador--${tono}`}>
      <span className="ap-indicador__icono">
        <Icono size={20} strokeWidth={2} aria-hidden />
      </span>
      <div>
        <p className="ap-indicador__titulo">{titulo}</p>
        <p className="ap-indicador__valor">{valor}</p>
        {detalle && <p className="ap-indicador__detalle">{detalle}</p>}
      </div>
    </div>
  );
}

export function Resumen() {
  const sesion = useSesion();
  const carga = useCarga(cargarResumen, []);
  const d = carga.datos;
  const total30 = d?.ventas ? sumarDinero(...d.ventas.map((f) => String(f.total ?? "0"))) : null;
  const pedidos30 = d?.ventas ? d.ventas.reduce((acc, f) => acc + Number(f.pedidosPagados ?? 0), 0) : null;
  const cargando = carga.cargando && !d;
  const valor = (v: React.ReactNode | null) => (cargando ? <Esqueleto ancho={90} alto={28} /> : v ?? "—");

  return (
    <>
      <CabeceraPagina
        titulo="Resumen"
        descripcion="Cómo va la tienda en los últimos 30 días."
        acciones={
          <>
            {tienePermiso(sesion, "PRODUCTOS") && (
              <BotonEnlace href="/backoffice/productos/nuevo" icono={Plus}>
                Nuevo producto
              </BotonEnlace>
            )}
            <BotonEnlace href="/backoffice/inventario" variante="secondary" icono={Warehouse}>
              Registrar entrada
            </BotonEnlace>
          </>
        }
      />

      {carga.error ? (
        <Alerta tono="danger">{mensajeDeError(carga.error)}</Alerta>
      ) : (
        d?.errores.map((e) => (
          <div key={e} className="ap-espacio">
            <Alerta tono="warning" titulo="Algunos datos no cargaron">
              {e}
            </Alerta>
          </div>
        ))
      )}

      {d?.conciliacion && d.conciliacion.length > 0 && (
        <div className="ap-espacio">
          <Alerta tono="danger" titulo={`${d.conciliacion.length} pagos no cuadran con su pedido`}>
            Revisa el reporte de conciliación de pagos: puede haber dinero por devolver. <Link href="/backoffice/reportes?r=conciliacion-pagos">Ver el reporte</Link>
          </Alerta>
        </div>
      )}

      <div className="ap-indicadores">
        <Indicador icono={CircleDollarSign} tono="success" titulo="Ventas (30 días)" valor={valor(total30 !== null ? formatCOP(total30) : null)} detalle="Pedidos pagados, con IVA" />
        <Indicador icono={ReceiptText} titulo="Pedidos pagados" valor={valor(pedidos30)} />
        <Indicador icono={Clock} tono="warning" titulo="Pedidos sin pagar" valor={valor(d?.pendientes?.length ?? null)} detalle="Se cancelan solos a los 30 minutos" />
        <Indicador icono={PackageX} tono="danger" titulo="Productos por agotarse" valor={valor(d?.stockBajo?.length ?? null)} />
      </div>

      <div className="ap-bo__dos">
        <section className="ap-stack-sm" aria-labelledby="titulo-stock">
          <div className="ap-seccion__cabeza">
            <h2 id="titulo-stock" className="ec-subtitle">
              Stock bajo
            </h2>
            <Link href="/backoffice/reportes?r=stock-bajo" className="ec-link">
              Ver reporte
            </Link>
          </div>
          <Tabla
            titulo="Stock bajo"
            filas={d?.stockBajo ?? []}
            claveFila={(f) => String(f.idVariante)}
            vacio={<p className="ec-muted ap-celda-vacia">{cargando ? "Cargando…" : "Todo con buen stock."}</p>}
            columnas={[
              { clave: "sku", titulo: "SKU", celda: (f) => <code>{String(f.sku)}</code> },
              { clave: "nombre", titulo: "Producto" },
              {
                clave: "disponible",
                titulo: "Disponible",
                alinear: "derecha",
                celda: (f) => <Insignia tono={Number(f.disponible) <= 0 ? "danger" : "warning"}>{String(f.disponible)}</Insignia>,
              },
              {
                clave: "accion",
                titulo: "",
                alinear: "derecha",
                celda: (f) => (
                  <Link href={`/backoffice/inventario?variante=${f.idVariante}`} className="ec-link">
                    <PackagePlus size={14} strokeWidth={2} aria-hidden /> Entrada
                  </Link>
                ),
              },
            ]}
          />
        </section>
        <section className="ap-stack-sm" aria-labelledby="titulo-pendientes">
          <div className="ap-seccion__cabeza">
            <h2 id="titulo-pendientes" className="ec-subtitle">
              Pedidos sin pagar
            </h2>
            <Link href="/backoffice/reportes?r=pedidos-pendientes" className="ec-link">
              Ver reporte
            </Link>
          </div>
          <Tabla
            titulo="Pedidos sin pagar"
            filas={d?.pendientes ?? []}
            claveFila={(f) => String(f.idPedido)}
            vacio={<p className="ec-muted ap-celda-vacia">{cargando ? "Cargando…" : "No hay pedidos esperando pago."}</p>}
            columnas={[
              { clave: "idPedido", titulo: "Pedido", celda: (f) => <code>#{String(f.idPedido)}</code> },
              { clave: "cliente", titulo: "Cliente" },
              { clave: "total", titulo: "Total", alinear: "derecha", celda: (f) => formatCOP(String(f.total ?? "")) },
              {
                clave: "minutosRestantes",
                titulo: "Vence",
                alinear: "derecha",
                celda: (f) => <span title={formatFechaHora(String(f.fechaExpiracion ?? ""))}>{String(f.minutosRestantes)} min</span>,
              },
            ]}
          />
        </section>
      </div>

      {sesion?.rol === "ADMIN" && (
        <p className="ec-muted ap-espacio-arriba">
          <TriangleAlert size={14} strokeWidth={2} aria-hidden /> Como dueño puedes gestionar trabajadores y sus permisos en <Link href="/backoffice/trabajadores">Trabajadores</Link>.
        </p>
      )}
    </>
  );
}
