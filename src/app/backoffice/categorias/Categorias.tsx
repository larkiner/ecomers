"use client";

import { FolderPlus, FolderTree, Lock, Pencil } from "lucide-react";
import { useState } from "react";
import { api, ApiError, mensajeDeError } from "@/lib/api";
import { arbolCategorias, cargarCategorias, cargarImpuestos, descendientes, type NodoCategoria } from "@/lib/backoffice";
import { formatPorcentaje } from "@/lib/formato";
import { tienePermiso, useSesion } from "@/lib/sesion";
import type { Categoria } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { Boton, Campo, Interruptor, Selector } from "@/components/ui/controles";
import { Alerta, EstadoVacio, Insignia } from "@/components/ui/avisos";
import { Dialogo, Tabla } from "@/components/ui/datos";
import { SubirFoto } from "@/components/SubirFoto";
import { FotoProducto } from "@/components/tienda/TarjetaProducto";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";

interface Edicion {
  id: number | null;
  nombre: string;
  idPadre: string;
  imagenUrl: string | null;
}

export function Categorias() {
  const sesion = useSesion();
  const puede = tienePermiso(sesion, "CATEGORIAS");
  const carga = useCarga((s) => cargarCategorias(s), []);
  const impuestos = useCarga((s) => cargarImpuestos(s), []);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lista = carga.datos ?? [];
  const arbol = arbolCategorias(lista);

  function opcionesPadre(id: number | null) {
    const prohibidas = id === null ? new Set<number>() : descendientes(lista, id);
    return [{ valor: "", texto: "Ninguna (categoría principal)" }, ...arbol.filter((c) => c.activo && !prohibidas.has(c.idCategoria)).map((c) => ({ valor: String(c.idCategoria), texto: c.ruta }))];
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!edicion) return;
    if (!edicion.nombre.trim()) {
      setErrorDialogo("Escribe el nombre de la categoría.");
      return;
    }
    setGuardando(true);
    setErrorDialogo(null);
    // PUT reemplaza la categoria entera: la imagen actual se reenvia siempre, y sin imagen se quita.
    const cuerpo = { nombre: edicion.nombre.trim(), idPadre: edicion.idPadre ? Number(edicion.idPadre) : null, imagenUrl: edicion.imagenUrl };
    try {
      if (edicion.id === null) await api("/backoffice/categorias", { metodo: "POST", cuerpo });
      else await api(`/backoffice/categorias/${edicion.id}`, { metodo: "PUT", cuerpo });
      setEdicion(null);
      carga.recargar();
    } catch (err) {
      setErrorDialogo(err instanceof ApiError && err.codigo === "CATEGORIA_REPETIDA" ? "Ya existe una categoría con ese nombre en el mismo lugar." : mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(c: Categoria, activo: boolean) {
    setError(null);
    try {
      await api(`/backoffice/categorias/${c.idCategoria}/estado`, { metodo: "PUT", cuerpo: { activo } });
      carga.recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <>
      <CabeceraPagina
        titulo="Categorías"
        descripcion="Organizan el catálogo en un árbol. Una categoría inactiva no se ofrece al crear productos."
        acciones={
          puede ? (
            <Boton icono={FolderPlus} onClick={() => { setErrorDialogo(null); setEdicion({ id: null, nombre: "", idPadre: "", imagenUrl: null }); }}>
              Nueva categoría
            </Boton>
          ) : (
            <Insignia icono={Lock}>Solo lectura</Insignia>
          )
        }
      />
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
        <Tabla<NodoCategoria>
          titulo="Categorías"
          filas={arbol}
          claveFila={(c) => c.idCategoria}
          vacio={carga.cargando ? <p className="ec-muted ap-celda-vacia">Cargando categorías…</p> : <EstadoVacio icono={FolderTree} titulo="Aún no hay categorías">Crea la primera para empezar a organizar el catálogo.</EstadoVacio>}
          columnas={[
            {
              clave: "imagen",
              titulo: "Imagen",
              celda: (c) => (
                <span className="ap-miniatura">
                  <FotoProducto url={c.imagenUrl} alt={`Imagen de ${c.nombre}`} tamanoIcono={20} sizes="48px" />
                </span>
              ),
            },
            {
              clave: "nombre",
              titulo: "Categoría",
              celda: (c) => (
                <span className="ap-arbol" style={{ paddingLeft: c.nivel * 24 }}>
                  {c.nivel > 0 && <span className="ap-arbol__rama" aria-hidden>└</span>}
                  <strong className={c.activo ? "" : "ap-tachado"}>{c.nombre}</strong>
                </span>
              ),
            },
            { clave: "estado", titulo: "Estado", celda: (c) => <Insignia tono={c.activo ? "success" : "neutral"}>{c.activo ? "Activa" : "Inactiva"}</Insignia> },
            {
              clave: "activo",
              titulo: "Activa",
              alinear: "centro",
              celda: (c) => <Interruptor activo={c.activo} alCambiar={(v) => void cambiarEstado(c, v)} etiquetaAccesible={`Categoría ${c.nombre} activa`} deshabilitado={!puede} />,
            },
            {
              clave: "acciones",
              titulo: "",
              alinear: "derecha",
              celda: (c) =>
                puede ? (
                  <Boton tamano="sm" variante="secondary" icono={Pencil} onClick={() => { setErrorDialogo(null); setEdicion({ id: c.idCategoria, nombre: c.nombre, idPadre: c.idPadre ? String(c.idPadre) : "", imagenUrl: c.imagenUrl ?? null }); }}>
                    Editar
                  </Boton>
                ) : null,
            },
          ]}
        />
      )}

      <section className="ap-espacio-arriba ap-stack-sm" aria-labelledby="titulo-impuestos">
        <h2 id="titulo-impuestos" className="ec-subtitle">
          Impuestos
        </h2>
        <p className="ec-muted">Los impuestos se administran en la base de datos; aquí solo se consultan.</p>
        <Tabla
          titulo="Impuestos"
          filas={impuestos.datos ?? []}
          claveFila={(i) => i.idImpuesto}
          vacio={<p className="ec-muted ap-celda-vacia">{impuestos.cargando ? "Cargando…" : "Sin impuestos registrados."}</p>}
          columnas={[
            { clave: "nombre", titulo: "Impuesto" },
            { clave: "tasa", titulo: "Tasa", alinear: "derecha", celda: (i) => formatPorcentaje(i.tasa) },
            { clave: "activo", titulo: "Estado", celda: (i) => <Insignia tono={i.activo ? "success" : "neutral"}>{i.activo ? "Activo" : "Inactivo"}</Insignia> },
          ]}
        />
      </section>

      <Dialogo
        abierto={edicion !== null}
        titulo={edicion?.id === null ? "Nueva categoría" : "Editar categoría"}
        alCerrar={() => setEdicion(null)}
        pie={
          <>
            <Boton variante="ghost" onClick={() => setEdicion(null)}>
              Cancelar
            </Boton>
            <Boton type="submit" form="form-categoria" cargando={guardando} disabled={subiendo}>
              Guardar
            </Boton>
          </>
        }
      >
        {edicion && (
          <form id="form-categoria" className="ap-form" onSubmit={guardar} noValidate>
            {errorDialogo && <Alerta tono="danger">{errorDialogo}</Alerta>}
            <Campo etiqueta="Nombre" required maxLength={100} value={edicion.nombre} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} autoFocus />
            <Selector etiqueta="Dentro de" value={edicion.idPadre} onChange={(e) => setEdicion({ ...edicion, idPadre: e.target.value })} opciones={opcionesPadre(edicion.id)} ayuda="Una categoría no puede quedar dentro de sí misma ni de sus subcategorías." />
            <div className="ap-foto-chica">
              <span className="ec-field__label">Imagen de la categoría (opcional)</span>
              <SubirFoto
                key={edicion.id ?? "nueva"}
                valor={edicion.imagenUrl}
                alCambiar={(url) => setEdicion((actual) => (actual ? { ...actual, imagenUrl: url } : actual))}
                alOcupado={setSubiendo}
                destino="categorias"
                alt={`Imagen de ${edicion.nombre.trim() || "la categoría"}`}
              />
            </div>
          </form>
        )}
      </Dialogo>
    </>
  );
}
