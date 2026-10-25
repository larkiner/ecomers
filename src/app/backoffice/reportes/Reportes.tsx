"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { api, mensajeDeError } from "@/lib/api";
import { fechaISO, formatCOP, formatFecha, formatFechaHora } from "@/lib/formato";
import type { FilaReporte } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { Boton, Campo } from "@/components/ui/controles";
import { Alerta, EstadoVacio, Insignia } from "@/components/ui/avisos";
import { Tabla, type Columna } from "@/components/ui/datos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";

interface DefReporte {
  id: string;
  titulo: string;
  descripcion: string;
  fechas?: boolean;
  vacio: string;
}

const REPORTES: DefReporte[] = [
  { id: "ventas-diarias", titulo: "Ventas por día", descripcion: "Pedidos pagados por día (por defecto, los últimos 30 días).", fechas: true, vacio: "No hubo ventas en este rango." },
  { id: "ventas-producto", titulo: "Ventas por producto", descripcion: "Unidades y dinero por producto y día.", fechas: true, vacio: "No hubo ventas en este rango." },
  { id: "pedidos-pendientes", titulo: "Pedidos sin pagar", descripcion: "Pedidos creados que esperan el pago y cuánto les queda.", vacio: "No hay pedidos esperando pago." },
  { id: "stock-bajo", titulo: "Stock bajo", descripcion: "Variantes por agotarse.", vacio: "Todo con buen stock." },
  { id: "top-clientes", titulo: "Mejores clientes", descripcion: "Clientes que más han comprado.", vacio: "Aún no hay compras." },
  { id: "carritos-abandonados", titulo: "Carritos abandonados", descripcion: "Carritos sin actividad reciente.", vacio: "No hay carritos abandonados." },
  { id: "conciliacion-pagos", titulo: "Conciliación de pagos", descripcion: "Pedidos y pagos que no cuadran (por ejemplo, un pago aprobado de un pedido vencido: hay que devolver dinero).", vacio: "Todo cuadra: no hay pagos por revisar." },
  { id: "conciliacion-stock", titulo: "Conciliación de stock", descripcion: "Diferencias entre el saldo y el kardex.", vacio: "Todo cuadra: el saldo coincide con el kardex." },
  { id: "cola-pendiente", titulo: "Cola pendiente", descripcion: "Correos y envíos al ERP que no se han resuelto.", vacio: "La cola está al día." },
];

const ETIQUETAS: Record<string, string> = {
  idVariante: "Variante", sku: "SKU", nombre: "Nombre", total: "Total", reservada: "Reservada", disponible: "Disponible",
  totalSaldo: "Saldo", totalKardex: "Kardex", diferenciaTotal: "Diferencia", reservadaSaldo: "Reservada (saldo)", reservadaKardex: "Reservada (kardex)", diferenciaReservada: "Diferencia reservada",
  idPedido: "Pedido", idPublico: "ID público", idCliente: "Cliente", cliente: "Cliente", email: "Correo", fechaCreacion: "Creado", fechaExpiracion: "Vence", minutosRestantes: "Minutos",
  fecha: "Fecha", pedidosPagados: "Pedidos pagados", subtotal: "Subtotal", impuesto: "IVA", unidades: "Unidades", totalComprado: "Total comprado", ultimaCompra: "Última compra",
  idPublicoPedido: "ID público", estadoPedido: "Estado del pedido", totalPedido: "Total pedido", idPago: "Pago", montoPago: "Monto pagado", fechaAprobacion: "Aprobado", inconsistencia: "Inconsistencia",
  idCarrito: "Carrito", ultimaActividad: "Última actividad", items: "Productos", idEvento: "Evento", tipo: "Tipo", clave: "Clave", estado: "Estado", intentos: "Intentos",
  proximoIntento: "Próximo intento", fechaBloqueo: "Bloqueado", ultimoError: "Último error", atascado: "Atascado",
};
const DINERO = new Set(["total", "subtotal", "impuesto", "totalComprado", "totalPedido", "montoPago"]);
const FECHA_HORA = new Set(["fechaCreacion", "fechaExpiracion", "ultimaCompra", "fechaAprobacion", "ultimaActividad", "proximoIntento", "fechaBloqueo"]);
const NUMERICOS = new Set(["reservada", "disponible", "totalSaldo", "totalKardex", "diferenciaTotal", "reservadaSaldo", "reservadaKardex", "diferenciaReservada", "minutosRestantes", "pedidosPagados", "unidades", "intentos", "items"]);
const OCULTAS = new Set(["idPublico", "idPublicoPedido"]);

function celda(clave: string, valor: FilaReporte[string], reporte: string) {
  if (valor === null || valor === undefined || valor === "") return <span className="ec-muted">—</span>;
  if (typeof valor === "boolean") return <Insignia tono={valor ? "danger" : "neutral"}>{valor ? "Sí" : "No"}</Insignia>;
  if (DINERO.has(clave) && !(reporte === "stock-bajo" && clave === "total")) return formatCOP(String(valor));
  if (FECHA_HORA.has(clave)) return formatFechaHora(String(valor));
  if (clave === "fecha") return formatFecha(String(valor));
  if (clave === "sku") return <code>{String(valor)}</code>;
  if (clave === "inconsistencia" || clave === "ultimoError") return <span className="ap-texto-largo">{String(valor)}</span>;
  return String(valor);
}

export function Reportes() {
  const params = useSearchParams();
  const router = useRouter();
  const ruta = usePathname();
  const id = REPORTES.some((r) => r.id === params.get("r")) ? (params.get("r") as string) : REPORTES[0].id;
  const def = REPORTES.find((r) => r.id === id) ?? REPORTES[0];
  const hoy = new Date();
  const [desde, setDesde] = useState(fechaISO(new Date(hoy.getTime() - 29 * 86400000)));
  const [hasta, setHasta] = useState(fechaISO(hoy));
  const [limite, setLimite] = useState("100");
  const [filtros, setFiltros] = useState({ desde, hasta, limite: "100" });

  const carga = useCarga(
    (signal) => {
      const qs = new URLSearchParams({ limite: filtros.limite });
      if (def.fechas) {
        qs.set("desde", filtros.desde);
        qs.set("hasta", filtros.hasta);
      }
      return api<FilaReporte[]>(`/backoffice/reportes/${id}?${qs}`, { signal });
    },
    [id, filtros],
  );

  const filas = carga.datos ?? [];
  const claves = filas.length ? Object.keys(filas[0]).filter((k) => !OCULTAS.has(k)) : [];
  const columnas: Columna<FilaReporte>[] = claves.map((k) => ({
    clave: k,
    titulo: ETIQUETAS[k] ?? k,
    alinear: DINERO.has(k) || NUMERICOS.has(k) || (id === "stock-bajo" && k === "total") ? "derecha" : undefined,
    celda: (f) => celda(k, f[k], id),
  }));

  return (
    <>
      <CabeceraPagina titulo="Reportes" descripcion="Tablas de seguimiento de ventas, stock, pagos y la cola de integración." />
      <div className="ap-reportes">
        <nav className="ap-reportes__lista" aria-label="Reportes">
          {REPORTES.map((r) => (
            <button key={r.id} type="button" className="ec-side__item" aria-current={r.id === id ? "page" : undefined} onClick={() => router.push(`${ruta}?r=${r.id}`)}>
              <span>{r.titulo}</span>
            </button>
          ))}
        </nav>
        <section className="ap-stack-sm" aria-labelledby="titulo-reporte">
          <div>
            <h2 id="titulo-reporte" className="ec-subtitle">
              {def.titulo}
            </h2>
            <p className="ec-muted">{def.descripcion}</p>
          </div>
          <form
            className="ap-filtros ap-filtros--fila"
            onSubmit={(e) => {
              e.preventDefault();
              setFiltros({ desde, hasta, limite: String(Math.max(1, Math.min(500, Number(limite) || 100))) });
            }}
          >
            {def.fechas && (
              <>
                <Campo etiqueta="Desde" type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
                <Campo etiqueta="Hasta" type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
              </>
            )}
            <Campo etiqueta="Máximo de filas" inputMode="numeric" value={limite} onChange={(e) => setLimite(e.target.value.replace(/\D/g, ""))} ayuda="De 1 a 500" />
            <div className="ap-filtros__boton">
              <Boton type="submit" variante="secondary" icono={RefreshCw} cargando={carga.cargando}>
                Actualizar
              </Boton>
            </div>
          </form>
          {carga.error ? (
            <Alerta tono="danger">{mensajeDeError(carga.error)}</Alerta>
          ) : carga.cargando && !carga.datos ? (
            <p className="ec-muted">Cargando reporte…</p>
          ) : filas.length === 0 ? (
            <EstadoVacio titulo={def.vacio} />
          ) : (
            <Tabla titulo={def.titulo} filas={filas} claveFila={(_, i) => i} columnas={columnas} />
          )}
        </section>
      </div>
    </>
  );
}
