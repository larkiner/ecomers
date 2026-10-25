"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Tasa de desaceleración por milisegundo, la misma del desplazamiento normal de iOS. */
const DESACELERACION = 0.998;

/**
 * Fila horizontal que se puede arrastrar con el mouse: sigue al puntero 1:1 y, al soltar, continúa con la velocidad del
 * gesto y frena como el scroll de un iPhone. En pantallas táctiles el navegador ya hace esto solo. Tiene botones
 * Anterior/Siguiente para quien no arrastra y se puede recorrer con el teclado.
 */
export function Carrusel({ etiqueta, className = "", children }: { etiqueta: string; className?: string; children: React.ReactNode }) {
  const pista = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let arrastrando = false;
    let movio = false;
    let inicioX = 0;
    let inicioScroll = 0;
    let cuadro = 0;
    let muestras: { x: number; t: number }[] = [];

    const medir = () => {
      const fin = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
      setBordes((b) => (b.inicio === el.scrollLeft <= 2 && b.fin === fin ? b : { inicio: el.scrollLeft <= 2, fin }));
    };
    const soltarClase = () => el.classList.remove("is-arrastrando");

    const abajo = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(cuadro);
      arrastrando = true;
      movio = false;
      inicioX = e.clientX;
      inicioScroll = el.scrollLeft;
      muestras = [{ x: e.clientX, t: e.timeStamp }];
    };
    const mover = (e: PointerEvent) => {
      if (!arrastrando) return;
      const dx = e.clientX - inicioX;
      // Histéresis: un clic con un temblor de pocos píxeles sigue siendo un clic.
      if (!movio && Math.abs(dx) < 6) return;
      if (!movio) {
        movio = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-arrastrando");
      }
      el.scrollLeft = inicioScroll - dx;
      muestras.push({ x: e.clientX, t: e.timeStamp });
      if (muestras.length > 5) muestras.shift();
    };
    const arriba = () => {
      if (!arrastrando) return;
      arrastrando = false;
      if (!movio) return;
      const a = muestras[0];
      const b = muestras[muestras.length - 1];
      const dt = b.t - a.t;
      // Velocidad en px/ms en el sentido del scroll; el gesto entrega su impulso a la animación sin costura.
      let v = dt > 0 ? -(b.x - a.x) / dt : 0;
      if (reducido || Math.abs(v) < 0.05) {
        soltarClase();
        return;
      }
      let ultimo = performance.now();
      const paso = (ahora: number) => {
        const d = ahora - ultimo;
        ultimo = ahora;
        el.scrollLeft += v * d;
        v *= Math.pow(DESACELERACION, d);
        const enBorde = el.scrollLeft <= 0 || el.scrollLeft >= el.scrollWidth - el.clientWidth;
        if (Math.abs(v) > 0.02 && !enBorde) cuadro = requestAnimationFrame(paso);
        else soltarClase();
      };
      cuadro = requestAnimationFrame(paso);
    };
    // Tras un arrastre, el clic no abre la tarjeta que quedó bajo el puntero.
    const clic = (e: MouseEvent) => {
      if (movio) {
        e.preventDefault();
        e.stopPropagation();
        movio = false;
      }
    };
    const cancelar = () => cancelAnimationFrame(cuadro);
    const sinArrastreNativo = (e: DragEvent) => e.preventDefault();

    const primera = requestAnimationFrame(medir);
    el.addEventListener("pointerdown", abajo);
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerup", arriba);
    el.addEventListener("pointercancel", arriba);
    el.addEventListener("click", clic, true);
    el.addEventListener("wheel", cancelar, { passive: true });
    el.addEventListener("dragstart", sinArrastreNativo);
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      cancelAnimationFrame(primera);
      cancelAnimationFrame(cuadro);
      el.removeEventListener("pointerdown", abajo);
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerup", arriba);
      el.removeEventListener("pointercancel", arriba);
      el.removeEventListener("click", clic, true);
      el.removeEventListener("wheel", cancelar);
      el.removeEventListener("dragstart", sinArrastreNativo);
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  function desplazar(sentido: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: suave ? "smooth" : "auto" });
  }

  return (
    <div className="ap-carrusel-marco">
      <div ref={pista} className={`ap-carrusel ${className}`} role="region" aria-label={etiqueta} tabIndex={0}>
        {children}
      </div>
      {!(bordes.inicio && bordes.fin) && (
        <div className="ap-carrusel__controles">
          <button type="button" className="ap-icono ap-icono--borde" onClick={() => desplazar(-1)} disabled={bordes.inicio} aria-label="Ver anteriores">
            <ChevronLeft size={20} strokeWidth={2} aria-hidden />
          </button>
          <button type="button" className="ap-icono ap-icono--borde" onClick={() => desplazar(1)} disabled={bordes.fin} aria-label="Ver siguientes">
            <ChevronRight size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
