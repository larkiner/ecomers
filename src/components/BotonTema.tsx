"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Tema = "light" | "dark";

function leerTema(): Tema {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function suscribir(aviso: () => void) {
  const observador = new MutationObserver(aviso);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observador.disconnect();
}

/** Tema actual y la acción para alternarlo; la elección se recuerda en este navegador. */
export function useTema() {
  const tema = useSyncExternalStore<Tema>(suscribir, leerTema, () => "light");
  const siguiente: Tema = tema === "dark" ? "light" : "dark";

  function cambiar() {
    const aplicar = () => {
      document.documentElement.dataset.theme = siguiente;
    };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(aplicar);
    else aplicar();
    try {
      localStorage.setItem("ecomers-tema", siguiente);
    } catch {
      // Sin almacenamiento (modo privado): el cambio vale solo para esta página.
    }
  }

  return { tema, siguiente, cambiar };
}

/** Botón de ícono que alterna entre tema claro y oscuro. */
export function BotonTema() {
  const { tema, siguiente, cambiar } = useTema();

  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label={siguiente === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      title={siguiente === "dark" ? "Tema oscuro" : "Tema claro"}
      style={{
        display: "grid",
        placeItems: "center",
        width: 44,
        height: 44,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-input)",
        background: "var(--surface)",
        color: "var(--foreground)",
        cursor: "pointer",
      }}
    >
      {tema === "dark" ? <Sun size={20} strokeWidth={2} aria-hidden /> : <Moon size={20} strokeWidth={2} aria-hidden />}
    </button>
  );
}
