"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, type Key, type ReactNode } from "react";
import { formatCOP, tieneValor } from "@/lib/formato";
import { Boton } from "./controles";
import { EstadoVacio } from "./avisos";

/** Precio final y, si hay descuento, el base tachado. Recibe el texto decimal de la API. */
export function Precio({ final, base, tamano = "md" }: { final: string | null | undefined; base?: string | null; tamano?: "sm" | "md" | "lg" }) {
  const mostrarBase = base && formatCOP(base) !== formatCOP(final);
  return (
    <span className={`ec-price ec-price--${tamano}`}>
      <span className="ec-price__final">{formatCOP(final)}</span>
      {mostrarBase && (
        <s className="ec-price__base">
          <span className="ec-sr">Antes </span>
          {formatCOP(base)}
        </s>
      )}
    </span>
  );
}

export function Ahorro({ descuento }: { descuento?: string | null }) {
  if (!tieneValor(descuento)) return null;
  return <span className="ec-price__off">Ahorras {formatCOP(descuento)}</span>;
}

export interface Columna<T> {
  clave: string;
  titulo: ReactNode;
  alinear?: "izquierda" | "derecha" | "centro";
  celda?: (fila: T) => ReactNode;
}

interface TablaProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  claveFila: (fila: T, i: number) => Key;
  titulo: string;
  vacio?: ReactNode;
}

export function Tabla<T>({ columnas, filas, claveFila, titulo, vacio }: TablaProps<T>) {
  const clase = (c: Columna<T>) => (c.alinear === "derecha" ? "is-num" : c.alinear === "centro" ? "is-center" : undefined);
  return (
    <div className="ec-table-wrap">
      <table className="ec-table">
        <caption className="ec-sr">{titulo}</caption>
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} scope="col" className={clase(c)}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length ? (
            filas.map((f, i) => (
              <tr key={claveFila(f, i)}>
                {columnas.map((c) => (
                  <td key={c.clave} className={clase(c)}>
                    {c.celda ? c.celda(f) : String((f as Record<string, unknown>)[c.clave] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columnas.length}>{vacio ?? <EstadoVacio titulo="Nada por aquí" />}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginacionProps {
  pagina: number;
  tamano: number;
  total?: number;
  haySiguiente?: boolean;
  enPagina?: number;
  alCambiar: (pagina: number) => void;
}

/** Anterior y siguiente; `pagina` empieza en 0 como en la API. */
export function Paginacion({ pagina, tamano, total, haySiguiente, enPagina, alCambiar }: PaginacionProps) {
  const desde = pagina * tamano + 1;
  const conTotal = typeof total === "number";
  const hasta = conTotal ? Math.min(total, desde + tamano - 1) : desde + (enPagina ?? tamano) - 1;
  const siguiente = conTotal ? hasta < total : !!haySiguiente;
  const info = conTotal ? (total === 0 ? "Sin resultados" : `Mostrando ${desde}–${hasta} de ${total}`) : `Página ${pagina + 1}`;
  return (
    <nav className="ec-pager" aria-label="Paginación">
      <span className="ec-pager__info">{info}</span>
      <div className="ec-row">
        <Boton variante="secondary" tamano="sm" icono={ChevronLeft} disabled={pagina === 0} onClick={() => alCambiar(pagina - 1)}>
          Anterior
        </Boton>
        <Boton variante="secondary" tamano="sm" iconoDerecha={ChevronRight} disabled={!siguiente} onClick={() => alCambiar(pagina + 1)}>
          Siguiente
        </Boton>
      </div>
    </nav>
  );
}

interface DialogoProps {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}

/** Diálogo modal nativo: atrapa el foco y se cierra con Escape. */
export function Dialogo({ abierto, titulo, alCerrar, children, pie }: DialogoProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog ref={ref} className="ap-dialogo" onClose={alCerrar} aria-labelledby="ap-dialogo-titulo">
      <div className="ap-dialogo__cabeza">
        <h2 id="ap-dialogo-titulo">{titulo}</h2>
        <button type="button" className="ec-alert__close" aria-label="Cerrar" onClick={alCerrar}>
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <div className="ap-dialogo__cuerpo">{children}</div>
      {pie && <div className="ap-dialogo__pie">{pie}</div>}
    </dialog>
  );
}
