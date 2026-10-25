"use client";

import { Moon, Sun } from "lucide-react";
import { useTema } from "../BotonTema";

/** Cambio de tema para quien no ha iniciado sesión: vive en el pie de la tienda. */
export function TemaPie() {
  const { tema, siguiente, cambiar } = useTema();
  return (
    <button type="button" className="ap-pie__tema" onClick={cambiar}>
      {tema === "dark" ? <Sun size={16} strokeWidth={2} aria-hidden /> : <Moon size={16} strokeWidth={2} aria-hidden />}
      {siguiente === "dark" ? "Usar tema oscuro" : "Usar tema claro"}
    </button>
  );
}
