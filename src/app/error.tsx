"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

/** Pantalla de error de la app: explica qué pasó y ofrece las dos salidas útiles (reintentar o volver al inicio). */
export default function ErrorDeLaApp({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="ap-contenedor ap-pagina">
      <div className="ec-empty">
        <span className="ec-empty__icon">
          <RotateCcw size={24} strokeWidth={2} aria-hidden />
        </span>
        <h1 className="ec-empty__title">Algo salió mal al mostrar esta página</h1>
        <p className="ec-empty__text">Tu carrito sigue guardado. Intenta de nuevo; si el problema sigue, vuelve al inicio.</p>
        <div className="ec-row ap-centro">
          <button type="button" className="ec-btn ec-btn--primary ec-btn--md" onClick={reset}>
            Intentar de nuevo
          </button>
          <Link href="/" className="ec-btn ec-btn--secondary ec-btn--md">
            Ir al inicio
          </Link>
        </div>
        {error.digest && <code className="ap-codigo-error">Código: {error.digest}</code>}
      </div>
    </div>
  );
}
