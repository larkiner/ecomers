"use client";

import { FotoProducto } from "../tienda/TarjetaProducto";
import { Precio } from "../ui/datos";

/** La tarjeta tal como la verá el cliente en la tienda, mientras se llena el formulario. */
export function VistaPreviaTarjeta({ nombre, sku, precio, imagenUrl }: { nombre: string; sku: string; precio: string; imagenUrl: string | null }) {
  return (
    <article className="ec-card" aria-label="Vista previa en la tienda">
      <div className="ec-card__media">
        <FotoProducto key={imagenUrl ?? "sin-foto"} url={imagenUrl} alt={nombre} />
      </div>
      <div className="ec-card__body">
        <h3 className="ec-card__name">{nombre || "Nombre del producto"}</h3>
        <span className="ec-card__sku">{sku || "SKU"}</span>
        <div className="ec-card__foot">
          <Precio final={precio || "0"} />
        </div>
      </div>
    </article>
  );
}
