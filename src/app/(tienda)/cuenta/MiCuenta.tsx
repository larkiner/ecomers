"use client";

import { useRouter } from "next/navigation";
import { CircleUser, LayoutDashboard, LogOut, Package, ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import { cerrarSesion } from "@/lib/cuenta";
import { formatFechaHora } from "@/lib/formato";
import { esPersonal, useEnNavegador, useSesion } from "@/lib/sesion";
import { Boton, BotonEnlace } from "@/components/ui/controles";
import { Alerta, Cargando, Insignia } from "@/components/ui/avisos";
import { CambiarClave } from "@/components/CambiarClave";

const NOMBRE_ROL = { CLIENTE: "Cliente", EMPLEADO: "Trabajador", ADMIN: "Dueño" } as const;

export function MiCuenta() {
  const sesion = useSesion();
  const listo = useEnNavegador();
  const router = useRouter();

  useEffect(() => {
    if (listo && !sesion) router.replace("/ingresar?vuelta=/cuenta");
  }, [listo, sesion, router]);

  if (!listo || !sesion) return <Cargando />;

  return (
    <div className="ap-contenedor ap-pagina">
      <div className="ap-pagina__cabeza">
        <div>
          <h1>Mi cuenta</h1>
          <p className="ec-muted">{sesion.email}</p>
        </div>
        <Boton variante="secondary" icono={LogOut} onClick={() => void cerrarSesion()}>
          Cerrar sesión
        </Boton>
      </div>

      <div className="ap-cuenta">
        <section className="ec-panel ap-stack-sm" aria-labelledby="titulo-datos">
          <h2 id="titulo-datos" className="ec-subtitle">
            <CircleUser size={20} strokeWidth={2} aria-hidden /> Tus datos
          </h2>
          <dl className="ap-datos">
            <div>
              <dt>Correo</dt>
              <dd>{sesion.email}</dd>
            </div>
            <div>
              <dt>Tipo de cuenta</dt>
              <dd>
                <Insignia tono={sesion.rol === "CLIENTE" ? "info" : "success"}>{NOMBRE_ROL[sesion.rol]}</Insignia>
              </dd>
            </div>
            <div>
              <dt>Tu sesión vence</dt>
              <dd>{formatFechaHora(new Date(sesion.vence).toISOString())}</dd>
            </div>
          </dl>
          {esPersonal(sesion) ? (
            <BotonEnlace href="/backoffice" icono={LayoutDashboard}>
              Ir al backoffice
            </BotonEnlace>
          ) : (
            <div className="ec-row">
              <BotonEnlace href="/carrito" variante="secondary" icono={ShoppingCart}>
                Ver mi carrito
              </BotonEnlace>
            </div>
          )}
        </section>

        <section className="ec-panel ap-stack-sm" aria-labelledby="titulo-clave">
          <h2 id="titulo-clave" className="ec-subtitle">
            Cambiar contraseña
          </h2>
          <CambiarClave />
        </section>

        {sesion.rol === "CLIENTE" && (
          <section className="ec-panel ap-stack-sm ap-cuenta__ancho" aria-labelledby="titulo-pedidos">
            <h2 id="titulo-pedidos" className="ec-subtitle">
              <Package size={20} strokeWidth={2} aria-hidden /> Mis pedidos
            </h2>
            <Alerta tono="info">
              Muy pronto podrás ver aquí tu historial de pedidos y su estado. Mientras tanto, te avisamos por correo cuando un pago se confirma.
            </Alerta>
          </section>
        )}
      </div>
    </div>
  );
}
