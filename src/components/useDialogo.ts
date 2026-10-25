"use client";

import { useEffect, useRef } from "react";

/** Duración de la salida; coincide con `ap-desmaterializa` en app.css. */
const SALIDA_MS = 220;

/**
 * Abre y cierra un <dialog> nativo con la misma animación de ida y vuelta: entra como un material que aparece y sale por
 * el mismo camino, en lugar de desaparecer de golpe. Con "reducir movimiento" se cierra al instante. La tecla Esc pasa por
 * aquí (`onCancel`) para cerrar con la misma salida; el navegador devuelve el foco al botón que abrió el diálogo.
 */
export function useDialogo(abierto: boolean, alCerrar: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const pendiente = useRef<number | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto) {
      if (pendiente.current !== null) window.clearTimeout(pendiente.current);
      pendiente.current = null;
      d.classList.remove("is-cerrando");
      if (!d.open) d.showModal();
      return;
    }
    if (!d.open) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      d.close();
      return;
    }
    d.classList.add("is-cerrando");
    pendiente.current = window.setTimeout(() => {
      pendiente.current = null;
      d.classList.remove("is-cerrando");
      d.close();
    }, SALIDA_MS);
  }, [abierto]);

  useEffect(() => () => {
    if (pendiente.current !== null) window.clearTimeout(pendiente.current);
  }, []);

  function onCancel(e: React.SyntheticEvent) {
    e.preventDefault();
    alCerrar();
  }

  return { ref, onCancel };
}
