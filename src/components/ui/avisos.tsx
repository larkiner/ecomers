"use client";

import { Check, CircleAlert, Info, Package, TriangleAlert, X, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export type Tono = "neutral" | "success" | "warning" | "danger" | "info" | "promo";

export function Insignia({ tono = "neutral", icono: Icono, children }: { tono?: Tono; icono?: LucideIcon; children: ReactNode }) {
  return (
    <span className={`ec-badge ec-badge--${tono}`}>
      {Icono && <Icono size={14} strokeWidth={2} aria-hidden />}
      {children}
    </span>
  );
}

const ICONO_ALERTA: Record<string, LucideIcon> = { info: Info, success: Check, warning: TriangleAlert, danger: CircleAlert };

interface AlertaProps {
  tono?: "info" | "success" | "warning" | "danger";
  titulo?: string;
  codigo?: string;
  alCerrar?: () => void;
  children?: ReactNode;
}

/** Aviso en línea. `danger` se anuncia de inmediato; los demás, con cortesía. */
export function Alerta({ tono = "info", titulo, codigo, alCerrar, children }: AlertaProps) {
  const Icono = ICONO_ALERTA[tono];
  return (
    <div className={`ec-alert ec-alert--${tono}`} role={tono === "danger" ? "alert" : "status"}>
      <Icono size={18} strokeWidth={2} aria-hidden />
      <div className="ec-alert__body">
        {titulo && <p className="ec-alert__title">{titulo}</p>}
        {children && <div>{children}</div>}
        {codigo && <code className="ec-alert__code">{codigo}</code>}
      </div>
      {alCerrar && (
        <button type="button" className="ec-alert__close" aria-label="Cerrar aviso" onClick={alCerrar}>
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}

export function EstadoVacio({ icono: Icono = Package, titulo, children, accion }: { icono?: LucideIcon; titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="ec-empty">
      <span className="ec-empty__icon">
        <Icono size={26} strokeWidth={2} aria-hidden />
      </span>
      <h3 className="ec-empty__title">{titulo}</h3>
      {children && <p className="ec-empty__text">{children}</p>}
      {accion}
    </div>
  );
}

export function Esqueleto({ ancho = "100%", alto = 16, redondo, estilo }: { ancho?: number | string; alto?: number | string; redondo?: boolean; estilo?: CSSProperties }) {
  return <span className="ec-skeleton" aria-hidden style={{ width: ancho, height: alto, borderRadius: redondo ? "var(--radius-full)" : undefined, ...estilo }} />;
}

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="ap-cargando" role="status">
      <span className="ec-spinner" aria-hidden />
      <span>{texto}</span>
    </div>
  );
}
