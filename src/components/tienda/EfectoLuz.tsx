"use client";

import { useEffect } from "react";

/** Luz que sigue al cursor sobre las tarjetas: guarda la posición del puntero en --mx y --my de la tarjeta. */
export function EfectoLuz() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const mover = (e: PointerEvent) => {
      const tarjeta = (e.target as HTMLElement).closest<HTMLElement>(".ec-card, .ap-cat");
      if (!tarjeta) return;
      const r = tarjeta.getBoundingClientRect();
      tarjeta.style.setProperty("--mx", `${e.clientX - r.left}px`);
      tarjeta.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => document.removeEventListener("pointermove", mover);
  }, []);
  return null;
}
