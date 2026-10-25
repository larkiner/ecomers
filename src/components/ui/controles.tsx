"use client";

import Link from "next/link";
import { ChevronDown, CircleAlert, Minus, Plus, type LucideIcon } from "lucide-react";
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variante = "primary" | "secondary" | "ghost" | "danger";
type Tamano = "sm" | "md" | "lg";

function clasesBoton(variante: Variante, tamano: Tamano, extra?: string | false, className?: string) {
  return cx("ec-btn", `ec-btn--${variante}`, `ec-btn--${tamano}`, extra, className);
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  icono?: LucideIcon;
  iconoDerecha?: LucideIcon;
  bloque?: boolean;
}

/** Botón del sistema. `primary` una sola vez por vista; mientras llama a la API, `cargando`. */
export function Boton({ variante = "primary", tamano = "md", cargando, icono: Icono, iconoDerecha: IconoDerecha, bloque, className, children, disabled, type = "button", ...resto }: BotonProps) {
  const t = tamano === "sm" ? 16 : 18;
  return (
    <button
      type={type}
      {...resto}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clasesBoton(variante, tamano, bloque && "ec-btn--block", cx(cargando && "is-loading", className))}
    >
      {cargando ? <span className="ec-spinner" aria-hidden /> : Icono ? <Icono size={t} strokeWidth={2} aria-hidden /> : null}
      {children !== undefined && <span>{children}</span>}
      {IconoDerecha && <IconoDerecha size={t} strokeWidth={2} aria-hidden />}
    </button>
  );
}

interface BotonEnlaceProps {
  href: string;
  variante?: Variante;
  tamano?: Tamano;
  icono?: LucideIcon;
  iconoDerecha?: LucideIcon;
  bloque?: boolean;
  className?: string;
  children: ReactNode;
}

export function BotonEnlace({ href, variante = "primary", tamano = "md", icono: Icono, iconoDerecha: IconoDerecha, bloque, className, children }: BotonEnlaceProps) {
  const t = tamano === "sm" ? 16 : 18;
  return (
    <Link href={href} className={clasesBoton(variante, tamano, bloque && "ec-btn--block", className)}>
      {Icono && <Icono size={t} strokeWidth={2} aria-hidden />}
      <span>{children}</span>
      {IconoDerecha && <IconoDerecha size={t} strokeWidth={2} aria-hidden />}
    </Link>
  );
}

interface BotonIconoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icono: LucideIcon;
  etiqueta: string;
  variante?: Variante;
  tamano?: "sm" | "md";
}

/** Botón de solo ícono: `etiqueta` es su nombre accesible y su tooltip. */
export function BotonIcono({ icono: Icono, etiqueta, variante = "ghost", tamano = "md", className, type = "button", ...resto }: BotonIconoProps) {
  return (
    <button type={type} {...resto} aria-label={etiqueta} title={etiqueta} className={clasesBoton(variante, tamano, "ec-btn--icon", className)}>
      <Icono size={tamano === "sm" ? 18 : 20} strokeWidth={2} aria-hidden />
    </button>
  );
}

interface MarcoCampoProps {
  id: string;
  etiqueta?: string;
  ayuda?: ReactNode;
  error?: string;
  requerido?: boolean;
  className?: string;
  children: ReactNode;
}

function MarcoCampo({ id, etiqueta, ayuda, error, requerido, className, children }: MarcoCampoProps) {
  return (
    <div className={cx("ec-field", error && "is-invalid", className)}>
      {etiqueta && (
        <label className="ec-field__label" htmlFor={id}>
          {etiqueta}
          {requerido && <span className="ec-field__req" aria-hidden> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className="ec-field__error">
          <CircleAlert size={14} strokeWidth={2} aria-hidden /> {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-msg`} className="ec-field__hint">{ayuda}</p>
      ) : null}
    </div>
  );
}

interface CampoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string;
  prefijo?: ReactNode;
  sufijo?: ReactNode;
  claseMarco?: string;
}

/** Campo de texto con etiqueta visible, ayuda y error (el `mensaje` de `errores[]` de la API). */
export function Campo({ etiqueta, ayuda, error, prefijo, sufijo, claseMarco, id, required, ...resto }: CampoProps) {
  const auto = useId();
  const idCampo = id ?? auto;
  return (
    <MarcoCampo id={idCampo} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required} className={claseMarco}>
      <div className="ec-input">
        {prefijo && <span className="ec-input__affix">{prefijo}</span>}
        <input
          {...resto}
          id={idCampo}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || ayuda ? `${idCampo}-msg` : undefined}
        />
        {sufijo && <span className="ec-input__affix">{sufijo}</span>}
      </div>
    </MarcoCampo>
  );
}

interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string;
}

export function AreaTexto({ etiqueta, ayuda, error, id, required, ...resto }: AreaTextoProps) {
  const auto = useId();
  const idCampo = id ?? auto;
  return (
    <MarcoCampo id={idCampo} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      <div className="ec-input">
        <textarea {...resto} id={idCampo} required={required} aria-invalid={error ? true : undefined} aria-describedby={error || ayuda ? `${idCampo}-msg` : undefined} />
      </div>
    </MarcoCampo>
  );
}

export interface Opcion {
  valor: string;
  texto: string;
  deshabilitada?: boolean;
}

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  opciones: Opcion[];
  vacio?: string;
  ayuda?: ReactNode;
  error?: string;
}

export function Selector({ etiqueta, opciones, vacio, ayuda, error, id, required, ...resto }: SelectorProps) {
  const auto = useId();
  const idCampo = id ?? auto;
  return (
    <MarcoCampo id={idCampo} etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      <div className="ec-input ec-input--select">
        <select {...resto} id={idCampo} required={required} aria-invalid={error ? true : undefined} aria-describedby={error || ayuda ? `${idCampo}-msg` : undefined}>
          {vacio !== undefined && (
            <option value="" disabled>
              {vacio}
            </option>
          )}
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor} disabled={o.deshabilitada}>
              {o.texto}
            </option>
          ))}
        </select>
        <ChevronDown className="ec-icon" size={18} strokeWidth={2} aria-hidden />
      </div>
    </MarcoCampo>
  );
}

interface CasillaProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: ReactNode;
}

export function Casilla({ etiqueta, className, disabled, ...resto }: CasillaProps) {
  return (
    <label className={cx("ec-check", disabled && "is-disabled", className)}>
      <input type="checkbox" disabled={disabled} {...resto} />
      {etiqueta && <span>{etiqueta}</span>}
    </label>
  );
}

interface InterruptorProps {
  activo: boolean;
  alCambiar: (valor: boolean) => void;
  etiqueta?: string;
  etiquetaAccesible?: string;
  deshabilitado?: boolean;
}

/** Interruptor de efecto inmediato (activar o desactivar). */
export function Interruptor({ activo, alCambiar, etiqueta, etiquetaAccesible, deshabilitado }: InterruptorProps) {
  return (
    <button
      type="button"
      role="switch"
      className="ec-switch"
      aria-checked={activo}
      aria-label={etiqueta ? undefined : etiquetaAccesible}
      disabled={deshabilitado}
      onClick={() => alCambiar(!activo)}
    >
      <span className="ec-switch__track">
        <span className="ec-switch__thumb" />
      </span>
      {etiqueta && <span>{etiqueta}</span>}
    </button>
  );
}

interface CantidadProps {
  valor: number;
  alCambiar: (n: number) => void;
  minimo?: number;
  maximo?: number;
  etiqueta?: string;
  deshabilitado?: boolean;
}

/** Cantidad entera de 1 a 999: la API rechaza decimales (también 1.0). */
export function Cantidad({ valor, alCambiar, minimo = 1, maximo = 999, etiqueta = "Cantidad", deshabilitado }: CantidadProps) {
  const fijar = (n: number) => {
    const v = Math.max(minimo, Math.min(maximo, Math.trunc(n)));
    if (v !== valor) alCambiar(v);
  };
  return (
    <div className="ec-qty" role="group" aria-label={etiqueta}>
      <button type="button" aria-label="Restar uno" disabled={deshabilitado || valor <= minimo} onClick={() => fijar(valor - 1)}>
        <Minus size={18} strokeWidth={2} aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={etiqueta}
        value={String(valor)}
        disabled={deshabilitado}
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, "");
          if (t) fijar(parseInt(t, 10));
        }}
      />
      <button type="button" aria-label="Sumar uno" disabled={deshabilitado || valor >= maximo} onClick={() => fijar(valor + 1)}>
        <Plus size={18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
