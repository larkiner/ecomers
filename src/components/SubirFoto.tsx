"use client";

import { Check, CircleAlert, RefreshCw, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { mensajeDeError } from "@/lib/api";
import { comprimirImagenProducto, subirFoto, TIPOS_IMAGEN, type DestinoFoto } from "@/lib/imagenes";
import { Boton } from "./ui/controles";
import { Insignia } from "./ui/avisos";

type Estado = "inactivo" | "comprimiendo" | "subiendo" | "listo" | "error";

interface SubirFotoProps {
  /** `urlPublica` actual del producto (o null). */
  valor: string | null;
  alCambiar: (url: string | null) => void;
  /** Avisa cuando hay una subida en curso, para bloquear el guardado. */
  alOcupado?: (ocupado: boolean) => void;
  /** Texto alternativo de la imagen mostrada (por defecto, la foto del producto). */
  alt?: string;
  /** Carpeta del bucket a la que se sube: productos (por defecto) o categorías. */
  destino?: DestinoFoto;
}

const kb = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.round(bytes / 1024)} KB`);

/**
 * Foto del producto: valida, comprime en el navegador (browser-image-compression), muestra la vista previa al instante
 * y la sube directo a Supabase con la URL firmada de la API. Al terminar entrega la `urlPublica`.
 */
export function SubirFoto({ valor, alCambiar, alOcupado, alt = "Foto del producto", destino = "productos" }: SubirFotoProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>(valor ? "listo" : "inactivo");
  const [vista, setVista] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pesos, setPesos] = useState<{ antes: number; despues: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => () => {
    if (vista) URL.revokeObjectURL(vista);
  }, [vista]);

  const ocupado = estado === "comprimiendo" || estado === "subiendo";

  async function procesar(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setPesos(null);
    alOcupado?.(true);
    try {
      setEstado("comprimiendo");
      const comprimida = await comprimirImagenProducto(archivo);
      setPesos({ antes: archivo.size, despues: comprimida.size });
      setVista(URL.createObjectURL(comprimida));
      setEstado("subiendo");
      const url = await subirFoto(comprimida, destino);
      alCambiar(url);
      setEstado("listo");
    } catch (e) {
      setError(mensajeDeError(e));
      setEstado("error");
    } finally {
      alOcupado?.(false);
    }
  }

  const abrir = () => !ocupado && input.current?.click();
  const imagen = vista ?? valor;

  return (
    <div className="ec-upload">
      <input
        ref={input}
        id={id}
        type="file"
        accept={TIPOS_IMAGEN.join(",")}
        className="ec-sr"
        tabIndex={-1}
        onChange={(e) => {
          void procesar(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {imagen ? (
        <div className="ec-upload__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagen} alt={alt} />
          {ocupado && (
            <div className="ec-upload__veil" role="status">
              <span className="ec-spinner" aria-hidden />
              <span>{estado === "comprimiendo" ? "Comprimiendo foto…" : "Subiendo foto…"}</span>
            </div>
          )}
          {estado === "listo" && vista && (
            <span className="ec-upload__state">
              <Insignia tono="success" icono={Check}>Subida</Insignia>
            </span>
          )}
        </div>
      ) : (
        <div
          className={`ec-upload__drop${arrastrando ? " is-drag" : ""}`}
          role="button"
          tabIndex={0}
          aria-describedby={error ? `${id}-err` : undefined}
          onClick={abrir}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              abrir();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            void procesar(e.dataTransfer.files?.[0]);
          }}
        >
          <span className="ec-upload__icon">
            <Upload size={22} strokeWidth={2} aria-hidden />
          </span>
          <strong>Arrastra la foto o elige un archivo</strong>
          <span>JPG, PNG o WebP · hasta 15 MB</span>
          <span>La comprimimos a WebP antes de subirla</span>
        </div>
      )}
      {pesos && estado !== "error" && (
        <p className="ec-field__hint">
          Comprimida de {kb(pesos.antes)} a {kb(pesos.despues)}.
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="ec-field__error" role="alert">
          <CircleAlert size={14} strokeWidth={2} aria-hidden /> {error}
        </p>
      )}
      {imagen && (
        <div className="ec-upload__actions">
          <Boton variante="secondary" tamano="sm" icono={RefreshCw} onClick={abrir} disabled={ocupado}>
            Cambiar foto
          </Boton>
          <Boton
            variante="ghost"
            tamano="sm"
            icono={Trash2}
            disabled={ocupado}
            onClick={() => {
              setVista(null);
              setPesos(null);
              setEstado("inactivo");
              alCambiar(null);
            }}
          >
            Quitar
          </Boton>
        </div>
      )}
    </div>
  );
}
