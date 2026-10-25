"use client";

import { Lock, UserPlus } from "lucide-react";
import { useState } from "react";
import { api, ApiError, erroresPorCampo, mensajeDeError } from "@/lib/api";
import { formatFecha } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import type { Permiso, Trabajador } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { Boton, BotonEnlace, Campo, Casilla, Interruptor } from "@/components/ui/controles";
import { Alerta, EstadoVacio, Insignia } from "@/components/ui/avisos";
import { Dialogo, Tabla } from "@/components/ui/datos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";

const PERMISOS: { codigo: Permiso; texto: string; detalle: string }[] = [
  { codigo: "CATEGORIAS", texto: "Categorías", detalle: "Crear, editar y activar categorías" },
  { codigo: "PRODUCTOS", texto: "Productos", detalle: "Crear y editar productos, variantes y precios" },
];

const VACIO = { nombre: "", email: "", password: "" };

export function Trabajadores() {
  const sesion = useSesion();
  const carga = useCarga((s) => api<Trabajador[]>("/backoffice/trabajadores", { signal: s }), [], sesion?.rol === "ADMIN");
  const [cambios, setCambios] = useState<Record<number, Partial<Trabajador>>>({});
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Trabajador | null>(null);
  const [nuevo, setNuevo] = useState<typeof VACIO | null>(null);
  const [erroresNuevo, setErroresNuevo] = useState<Record<string, string>>({});
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  if (sesion?.rol !== "ADMIN") {
    return (
      <EstadoVacio icono={Lock} titulo="Solo el dueño gestiona trabajadores" accion={<BotonEnlace href="/backoffice">Volver al resumen</BotonEnlace>}>
        Si necesitas un permiso, pídeselo al dueño de la tienda.
      </EstadoVacio>
    );
  }

  const filas = (carga.datos ?? []).map((t) => ({ ...t, ...cambios[t.idEmpleado] }));
  const ocupar = (clave: string, si: boolean) =>
    setOcupados((s) => {
      const n = new Set(s);
      if (si) n.add(clave);
      else n.delete(clave);
      return n;
    });

  async function cambiarPermiso(t: Trabajador, codigo: Permiso, dar: boolean) {
    const clave = `${t.idEmpleado}-${codigo}`;
    setError(null);
    ocupar(clave, true);
    const permisos = dar ? [...t.permisos, codigo] : t.permisos.filter((p) => p !== codigo);
    setCambios((c) => ({ ...c, [t.idEmpleado]: { ...c[t.idEmpleado], permisos } }));
    try {
      await api(`/backoffice/trabajadores/${t.idEmpleado}/permisos/${codigo}`, { metodo: dar ? "PUT" : "DELETE" });
    } catch (e) {
      setCambios((c) => ({ ...c, [t.idEmpleado]: { ...c[t.idEmpleado], permisos: t.permisos } }));
      setError(mensajeDeError(e));
    } finally {
      ocupar(clave, false);
    }
  }

  async function cambiarActivo(t: Trabajador, activo: boolean) {
    setConfirmar(null);
    setError(null);
    ocupar(`${t.idEmpleado}-activo`, true);
    setCambios((c) => ({ ...c, [t.idEmpleado]: { ...c[t.idEmpleado], activo } }));
    try {
      await api(`/backoffice/trabajadores/${t.idEmpleado}/estado`, { metodo: "PUT", cuerpo: { activo } });
    } catch (e) {
      setCambios((c) => ({ ...c, [t.idEmpleado]: { ...c[t.idEmpleado], activo: t.activo } }));
      setError(mensajeDeError(e));
    } finally {
      ocupar(`${t.idEmpleado}-activo`, false);
    }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo) return;
    const locales: Record<string, string> = {};
    if (!nuevo.nombre.trim()) locales.nombre = "Escribe el nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo.email.trim())) locales.email = "Escribe un correo válido.";
    if (nuevo.password.length < 8 || nuevo.password.length > 72) locales.password = "Entre 8 y 72 caracteres.";
    setErroresNuevo(locales);
    setErrorNuevo(null);
    if (Object.keys(locales).length) return;
    setCreando(true);
    try {
      await api("/backoffice/trabajadores", { metodo: "POST", cuerpo: { nombre: nuevo.nombre.trim(), email: nuevo.email.trim(), password: nuevo.password } });
      setNuevo(null);
      setCambios({});
      carga.recargar();
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      if (err instanceof ApiError && err.codigo === "EMAIL_YA_REGISTRADO") porCampo.email = "Ese correo ya tiene una cuenta (de cliente o trabajador).";
      if (err instanceof ApiError && err.codigo === "PASSWORD_DEBIL") porCampo.password = err.message;
      setErroresNuevo(porCampo);
      if (!Object.keys(porCampo).length) setErrorNuevo(mensajeDeError(err));
    } finally {
      setCreando(false);
    }
  }

  return (
    <>
      <CabeceraPagina
        titulo="Trabajadores"
        descripcion="Solo tú ves esta sección. Nadie se borra: se desactiva."
        acciones={
          <Boton icono={UserPlus} onClick={() => { setErroresNuevo({}); setErrorNuevo(null); setNuevo({ ...VACIO }); }}>
            Nuevo trabajador
          </Boton>
        }
      />
      <div className="ap-espacio">
        <Alerta tono="warning">Desactivar a un trabajador o cambiar sus permisos cierra sus sesiones al instante. Al volver a entrar recibe los permisos nuevos.</Alerta>
      </div>
      {error && (
        <div className="ap-espacio">
          <Alerta tono="danger" alCerrar={() => setError(null)}>
            {error}
          </Alerta>
        </div>
      )}
      {carga.error ? (
        <Alerta tono="danger">{mensajeDeError(carga.error)}</Alerta>
      ) : (
        <Tabla
          titulo="Trabajadores"
          filas={filas}
          claveFila={(t) => t.idEmpleado}
          vacio={carga.cargando ? <p className="ec-muted ap-celda-vacia">Cargando trabajadores…</p> : <EstadoVacio titulo="Aún no tienes trabajadores">Crea una cuenta para cada persona de tu equipo.</EstadoVacio>}
          columnas={[
            {
              clave: "nombre",
              titulo: "Trabajador",
              celda: (t) => (
                <div className="ap-persona">
                  <strong>{t.nombre}</strong>
                  <span className="ec-muted">{t.email}</span>
                </div>
              ),
            },
            { clave: "fecha", titulo: "Alta", celda: (t) => formatFecha(t.fechaCreacion) },
            ...PERMISOS.map((p) => ({
              clave: p.codigo,
              titulo: p.texto,
              alinear: "centro" as const,
              celda: (t: Trabajador) => (
                <Casilla
                  aria-label={`${p.texto}: ${p.detalle}, ${t.nombre}`}
                  title={p.detalle}
                  checked={t.permisos.includes(p.codigo)}
                  disabled={!t.activo || ocupados.has(`${t.idEmpleado}-${p.codigo}`)}
                  onChange={(e) => void cambiarPermiso(t, p.codigo, e.target.checked)}
                />
              ),
            })),
            { clave: "estado", titulo: "Estado", celda: (t) => <Insignia tono={t.activo ? "success" : "neutral"}>{t.activo ? "Activo" : "Inactivo"}</Insignia> },
            {
              clave: "acceso",
              titulo: "Acceso",
              alinear: "centro",
              celda: (t) => (
                <Interruptor
                  activo={t.activo}
                  etiquetaAccesible={`Acceso de ${t.nombre}`}
                  deshabilitado={ocupados.has(`${t.idEmpleado}-activo`)}
                  alCambiar={(v) => (v ? void cambiarActivo(t, true) : setConfirmar(t))}
                />
              ),
            },
          ]}
        />
      )}

      <Dialogo
        abierto={confirmar !== null}
        titulo="¿Desactivar a este trabajador?"
        alCerrar={() => setConfirmar(null)}
        pie={
          <>
            <Boton variante="ghost" onClick={() => setConfirmar(null)}>
              Cancelar
            </Boton>
            <Boton variante="danger" onClick={() => confirmar && void cambiarActivo(confirmar, false)}>
              Desactivar
            </Boton>
          </>
        }
      >
        <p>
          <strong>{confirmar?.nombre}</strong> ({confirmar?.email}) no podrá volver a ingresar y sus sesiones abiertas se cierran ahora mismo. Puedes reactivarlo cuando quieras.
        </p>
      </Dialogo>

      <Dialogo
        abierto={nuevo !== null}
        titulo="Nuevo trabajador"
        alCerrar={() => setNuevo(null)}
        pie={
          <>
            <Boton variante="ghost" onClick={() => setNuevo(null)}>
              Cancelar
            </Boton>
            <Boton type="submit" form="form-trabajador" icono={UserPlus} cargando={creando}>
              Crear trabajador
            </Boton>
          </>
        }
      >
        {nuevo && (
          <form id="form-trabajador" className="ap-form" onSubmit={crear} noValidate>
            {errorNuevo && <Alerta tono="danger">{errorNuevo}</Alerta>}
            <Campo etiqueta="Nombre" required maxLength={200} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} error={erroresNuevo.nombre} autoFocus />
            <Campo etiqueta="Correo" type="email" required value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} error={erroresNuevo.email} />
            <Campo etiqueta="Contraseña inicial" type="text" autoComplete="off" required value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} error={erroresNuevo.password} ayuda="Compártela en privado. El trabajador la cambia desde Mi cuenta." />
            <p className="ec-muted">Empieza sin permisos de edición: después marca Categorías o Productos en la tabla.</p>
          </form>
        )}
      </Dialogo>
    </>
  );
}
