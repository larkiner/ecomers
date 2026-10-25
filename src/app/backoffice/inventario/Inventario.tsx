"use client";

import { useSearchParams } from "next/navigation";
import { ArrowDownToLine, PackageCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { api, ApiError, mensajeDeError } from "@/lib/api";
import { cargarTodosLosProductos } from "@/lib/backoffice";
import type { FilaReporte } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { AreaTexto, Boton, Campo, Selector } from "@/components/ui/controles";
import { Alerta, Insignia } from "@/components/ui/avisos";
import { Tabla } from "@/components/ui/datos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";

type Tipo = "entrada" | "ajuste";

export function Inventario() {
  const params = useSearchParams();
  const productos = useCarga((s) => cargarTodosLosProductos(s), []);
  const stock = useCarga((s) => api<FilaReporte[]>("/backoffice/reportes/stock-bajo?limite=50", { signal: s }), []);
  const [idVariante, setIdVariante] = useState(params.get("variante") ?? "");
  const [tipo, setTipo] = useState<Tipo>("entrada");
  const [cantidad, setCantidad] = useState("");
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<{ tono: "success" | "danger"; texto: string; codigo?: string } | null>(params.get("nuevo") ? { tono: "success", texto: "Producto creado. Registra ahora su primera entrada de stock." } : null);
  const [enviando, setEnviando] = useState(false);

  const opciones = useMemo(
    () =>
      (productos.datos ?? []).flatMap((p) =>
        p.variantes.filter((v) => v.controlaStock).map((v) => ({ valor: String(v.idVariante), texto: `${v.sku} · ${p.nombre} - ${v.nombre}${v.activa && p.activo ? "" : " (inactiva)"}` })),
      ),
    [productos.datos],
  );

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(cantidad);
    const locales: Record<string, string> = {};
    if (!idVariante) locales.variante = "Elige la variante.";
    if (!/^-?\d+$/.test(cantidad)) locales.cantidad = "Escribe un número entero.";
    else if (tipo === "entrada" && (n < 1 || n > 100000)) locales.cantidad = "Entre 1 y 100.000 unidades.";
    else if (tipo === "ajuste" && (n === 0 || n < -100000 || n > 100000)) locales.cantidad = "Entre −100.000 y 100.000, distinto de 0.";
    if (tipo === "ajuste" && !observacion.trim()) locales.observacion = "Explica el motivo del ajuste.";
    setErrores(locales);
    if (Object.keys(locales).length) return;
    setEnviando(true);
    setAviso(null);
    try {
      await api(`/backoffice/inventario/${idVariante}/${tipo === "entrada" ? "entradas" : "ajustes"}`, { metodo: "POST", cuerpo: { cantidad: n, observacion: observacion.trim() || null } });
      const variante = opciones.find((o) => o.valor === idVariante)?.texto ?? "la variante";
      setAviso({ tono: "success", texto: `${tipo === "entrada" ? "Entrada" : "Ajuste"} de ${n} unidades registrado para ${variante}.` });
      setCantidad("");
      setObservacion("");
      stock.recargar();
    } catch (err) {
      setAviso({ tono: "danger", texto: mensajeDeError(err), codigo: err instanceof ApiError ? err.codigo : undefined });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <CabeceraPagina titulo="Inventario" descripcion="Registra la mercancía que llega y corrige el stock. Cada movimiento queda en el kardex con tu correo." />
      <div className="ap-bo__dos">
        <section className="ec-panel ap-stack-sm" aria-labelledby="titulo-movimiento">
          <h2 id="titulo-movimiento" className="ec-subtitle">
            Nuevo movimiento
          </h2>
          {aviso && (
            <Alerta tono={aviso.tono} codigo={aviso.codigo} alCerrar={() => setAviso(null)}>
              {aviso.texto}
            </Alerta>
          )}
          <div className="ap-segmentos" role="radiogroup" aria-label="Tipo de movimiento">
            <button type="button" role="radio" aria-checked={tipo === "entrada"} onClick={() => setTipo("entrada")}>
              <ArrowDownToLine size={16} strokeWidth={2} aria-hidden /> Entrada de mercancía
            </button>
            <button type="button" role="radio" aria-checked={tipo === "ajuste"} onClick={() => setTipo("ajuste")}>
              <SlidersHorizontal size={16} strokeWidth={2} aria-hidden /> Ajuste
            </button>
          </div>
          <form className="ap-form" onSubmit={registrar} noValidate>
            <Selector
              etiqueta="Variante"
              required
              vacio={productos.cargando ? "Cargando productos…" : "Elige la variante"}
              value={idVariante}
              onChange={(e) => setIdVariante(e.target.value)}
              opciones={opciones}
              error={errores.variante}
              ayuda="Solo variantes que controlan stock."
            />
            <Campo
              etiqueta={tipo === "entrada" ? "Unidades que llegaron" : "Unidades a sumar o restar"}
              required
              inputMode="numeric"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value.replace(tipo === "ajuste" ? /[^\d-]/g : /\D/g, ""))}
              error={errores.cantidad}
              ayuda={tipo === "ajuste" ? "Negativo para restar (merma, conteo físico). No puede dejar el total por debajo de lo reservado." : undefined}
            />
            <AreaTexto
              etiqueta={tipo === "entrada" ? "Observación (opcional)" : "Motivo del ajuste"}
              required={tipo === "ajuste"}
              maxLength={500}
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              error={errores.observacion}
              placeholder={tipo === "entrada" ? "Factura 123" : "Conteo físico del 24 de octubre"}
            />
            <div>
              <Boton type="submit" icono={PackageCheck} cargando={enviando}>
                Registrar {tipo === "entrada" ? "entrada" : "ajuste"}
              </Boton>
            </div>
          </form>
        </section>
        <section className="ap-stack-sm" aria-labelledby="titulo-bajo">
          <h2 id="titulo-bajo" className="ec-subtitle">
            Productos por agotarse
          </h2>
          {stock.error ? (
            <Alerta tono="danger">{mensajeDeError(stock.error)}</Alerta>
          ) : (
            <Tabla
              titulo="Stock bajo"
              filas={stock.datos ?? []}
              claveFila={(f) => String(f.idVariante)}
              vacio={<p className="ec-muted ap-celda-vacia">{stock.cargando ? "Cargando…" : "Todo con buen stock."}</p>}
              columnas={[
                {
                  clave: "sku",
                  titulo: "SKU",
                  celda: (f) => (
                    <button type="button" className="ec-link" onClick={() => setIdVariante(String(f.idVariante))} title="Elegir esta variante">
                      {String(f.sku)}
                    </button>
                  ),
                },
                { clave: "nombre", titulo: "Producto" },
                { clave: "total", titulo: "Total", alinear: "derecha" },
                { clave: "reservada", titulo: "Reservada", alinear: "derecha" },
                { clave: "disponible", titulo: "Disponible", alinear: "derecha", celda: (f) => <Insignia tono={Number(f.disponible) <= 0 ? "danger" : "warning"}>{String(f.disponible)}</Insignia> },
              ]}
            />
          )}
        </section>
      </div>
    </>
  );
}
