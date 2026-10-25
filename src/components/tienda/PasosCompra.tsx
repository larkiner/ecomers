import { Check } from "lucide-react";

const PASOS = ["Carrito", "Pago en Wompi", "Confirmación"];

/**
 * Efecto de gradiente de meta: ver cuánto falta motiva a terminar. Muestra los tres pasos de la compra y marca en cuál
 * vas; los anteriores quedan con un chulo.
 */
export function PasosCompra({ actual }: { actual: 1 | 2 | 3 }) {
  return (
    <ol className="ap-pasos" aria-label="Pasos de la compra">
      {PASOS.map((paso, i) => {
        const n = i + 1;
        const estado = n < actual ? "hecho" : n === actual ? "actual" : "pendiente";
        return (
          <li key={paso} className={`ap-pasos__paso is-${estado}`} aria-current={estado === "actual" ? "step" : undefined}>
            <span className="ap-pasos__num" aria-hidden>
              {estado === "hecho" ? <Check size={14} strokeWidth={3} /> : n}
            </span>
            <span>
              {paso}
              {estado === "hecho" && <span className="ec-sr"> (listo)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
