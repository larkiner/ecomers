"use client";

import { useEffect } from "react";
import { cerrarSesion } from "@/lib/cuenta";
import { cerrarSesionLocal, useSesion } from "@/lib/sesion";

/** Sin tocar la página este tiempo, la sesión se cierra sola (computador compartido, pestaña olvidada). */
const INACTIVIDAD_MS = 30 * 60_000;
const REVISION_MS = 30_000;
const EVENTOS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

/**
 * Cierra la sesión cuando el token vence (aunque la página siga abierta y nadie haga peticiones) y tras 30 minutos sin
 * actividad. En este segundo caso también la revoca en la API, para que el token no sirva aunque alguien lo copie.
 */
export function VigilanteSesion() {
  const sesion = useSesion();

  useEffect(() => {
    if (!sesion) return;
    let ultimaActividad = Date.now();
    const registrar = () => {
      ultimaActividad = Date.now();
    };
    EVENTOS.forEach((e) => window.addEventListener(e, registrar, { passive: true }));
    const revision = window.setInterval(() => {
      if (Date.now() >= sesion.vence) {
        cerrarSesionLocal("Tu sesión terminó. Ingresa de nuevo.");
      } else if (Date.now() - ultimaActividad >= INACTIVIDAD_MS) {
        void cerrarSesion("/ingresar", "Cerramos tu sesión por inactividad. Ingresa de nuevo.");
      }
    }, REVISION_MS);
    return () => {
      window.clearInterval(revision);
      EVENTOS.forEach((e) => window.removeEventListener(e, registrar));
    };
  }, [sesion]);

  return null;
}
