"use client";

import { Check, X } from "lucide-react";
import { formatFechaHora } from "@/lib/formato";
import { tienePermiso, useSesion } from "@/lib/sesion";
import { Insignia } from "@/components/ui/avisos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";
import { CambiarClave } from "@/components/CambiarClave";

export function CuentaPersonal() {
  const sesion = useSesion();
  if (!sesion) return null;
  const permisos = [
    { codigo: "PRODUCTOS" as const, texto: "Productos" },
    { codigo: "CATEGORIAS" as const, texto: "Categorías" },
  ];

  return (
    <>
      <CabeceraPagina titulo="Mi cuenta" descripcion={sesion.email} />
      <div className="ap-bo__dos">
        <section className="ec-panel ap-stack-sm" aria-labelledby="titulo-acceso">
          <h2 id="titulo-acceso" className="ec-subtitle">
            Tu acceso
          </h2>
          <dl className="ap-datos">
            <div>
              <dt>Rol</dt>
              <dd>
                <Insignia tono={sesion.rol === "ADMIN" ? "success" : "neutral"}>{sesion.rol === "ADMIN" ? "Dueño" : "Trabajador"}</Insignia>
              </dd>
            </div>
            {permisos.map((p) => (
              <div key={p.codigo}>
                <dt>Editar {p.texto.toLowerCase()}</dt>
                <dd>
                  {tienePermiso(sesion, p.codigo) ? (
                    <Insignia tono="success" icono={Check}>Sí</Insignia>
                  ) : (
                    <Insignia icono={X}>No</Insignia>
                  )}
                </dd>
              </div>
            ))}
            <div>
              <dt>Tu sesión vence</dt>
              <dd>{formatFechaHora(new Date(sesion.vence).toISOString())}</dd>
            </div>
          </dl>
          <p className="ec-muted">Inventario y reportes están disponibles para todo el equipo. Los permisos los asigna el dueño.</p>
        </section>
        <section className="ec-panel ap-stack-sm" aria-labelledby="titulo-clave">
          <h2 id="titulo-clave" className="ec-subtitle">
            Cambiar contraseña
          </h2>
          <CambiarClave />
        </section>
      </div>
    </>
  );
}
