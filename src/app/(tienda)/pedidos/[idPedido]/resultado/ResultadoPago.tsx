"use client";

import { useParams, useSearchParams } from "next/navigation";
import { BotonEnlace } from "@/components/ui/controles";

/**
 * A esta ruta vuelve Wompi. El pago NO se confirma al volver: Wompi avisa al servidor por webhook y la base lo aplica
 * unos segundos después. Por eso aquí siempre se dice "estamos confirmando", nunca "pago exitoso".
 */
export function ResultadoPago() {
  const { idPedido } = useParams<{ idPedido: string }>();
  const params = useSearchParams();
  const transaccion = params.get("id");

  return (
    <div className="ap-contenedor ap-pagina">
      <section className="ec-pay" role="status" aria-live="polite">
        <span className="ec-pay__icon">
          <span className="ec-spinner" aria-hidden />
        </span>
        <h1 className="ec-pay__title">Estamos confirmando tu pago</h1>
        <p className="ec-pay__text">
          Wompi nos avisa en unos segundos. Puedes cerrar esta página: te escribiremos al correo cuando el pago quede confirmado.
        </p>
        <span className="ec-pay__id">Pedido #{idPedido}</span>
        {transaccion && <span className="ec-pay__id">Transacción Wompi {transaccion}</span>}
        <div className="ec-row">
          <BotonEnlace href="/productos">Seguir comprando</BotonEnlace>
          <BotonEnlace href="/cuenta" variante="secondary">
            Ir a mi cuenta
          </BotonEnlace>
        </div>
      </section>
    </div>
  );
}
