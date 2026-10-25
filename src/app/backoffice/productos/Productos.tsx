"use client";

import Link from "next/link";
import { Lock, Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { api, mensajeDeError } from "@/lib/api";
import { arbolCategorias, cargarCategorias, TAMANO_PRODUCTOS } from "@/lib/backoffice";
import { tienePermiso, useSesion } from "@/lib/sesion";
import type { Producto } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { BotonEnlace, Campo, Interruptor } from "@/components/ui/controles";
import { Alerta, EstadoVacio, Insignia } from "@/components/ui/avisos";
import { Paginacion, Precio, Tabla } from "@/components/ui/datos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";
import { FotoProducto } from "@/components/tienda/TarjetaProducto";

export function Productos() {
  const sesion = useSesion();
  const puedeEditar = tienePermiso(sesion, "PRODUCTOS");
  const [pagina, setPagina] = useState(0);
  const [filtro, setFiltro] = useState("");
  const [cambios, setCambios] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const productos = useCarga((signal) => api<Producto[]>(`/backoffice/productos?page=${pagina}&size=${TAMANO_PRODUCTOS}`, { signal }), [pagina]);
  const categorias = useCarga((signal) => cargarCategorias(signal), []);

  const rutaCategoria = useMemo(() => {
    const m = new Map<number, string>();
    arbolCategorias(categorias.datos ?? []).forEach((c) => m.set(c.idCategoria, c.ruta));
    return m;
  }, [categorias.datos]);

  const lista = (productos.datos ?? []).map((p) => (p.idProducto in cambios ? { ...p, activo: cambios[p.idProducto] } : p));
  const f = filtro.trim().toLowerCase();
  const filas = f ? lista.filter((p) => p.nombre.toLowerCase().includes(f) || p.variantes.some((v) => v.sku.toLowerCase().includes(f))) : lista;

  async function cambiarEstado(p: Producto, activo: boolean) {
    setError(null);
    setCambios((c) => ({ ...c, [p.idProducto]: activo }));
    try {
      await api(`/backoffice/productos/${p.idProducto}/estado`, { metodo: "PUT", cuerpo: { activo } });
    } catch (e) {
      setCambios((c) => ({ ...c, [p.idProducto]: p.activo }));
      setError(mensajeDeError(e));
    }
  }

  return (
    <>
      <CabeceraPagina
        titulo="Productos"
        descripcion={puedeEditar ? "Crea, edita y activa o desactiva productos. Nada se borra: se desactiva." : "Solo lectura: pide al dueño el permiso de Productos para editar."}
        acciones={
          puedeEditar ? (
            <BotonEnlace href="/backoffice/productos/nuevo" icono={Plus}>
              Nuevo producto
            </BotonEnlace>
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
      <div className="ap-filtros">
        <Campo etiqueta="Buscar en esta página" prefijo={<Search size={16} strokeWidth={2} aria-hidden />} placeholder="Nombre o SKU" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      </div>
      {productos.error ? (
        <Alerta tono="danger">{mensajeDeError(productos.error)}</Alerta>
      ) : (
        <div className="ap-stack">
          <Tabla
            titulo="Productos"
            filas={filas}
            claveFila={(p) => p.idProducto}
            vacio={
              productos.cargando ? (
                <p className="ec-muted ap-celda-vacia">Cargando productos…</p>
              ) : (
                <EstadoVacio titulo={f ? "Ningún producto coincide" : "Aún no hay productos"} accion={puedeEditar && !f ? <BotonEnlace href="/backoffice/productos/nuevo" icono={Plus}>Crear el primero</BotonEnlace> : undefined}>
                  {f ? "Prueba con otro nombre o SKU." : "Crea un producto con sus variantes y luego registra su stock."}
                </EstadoVacio>
              )
            }
            columnas={[
              {
                clave: "producto",
                titulo: "Producto",
                celda: (p) => (
                  <div className="ap-producto-celda">
                    <span className="ap-miniatura">
                      <FotoProducto url={p.imagenUrl} alt="" tamanoIcono={20} sizes="48px" />
                    </span>
                    <div>
                      <strong>{p.nombre}</strong>
                      <span className="ec-muted">{rutaCategoria.get(p.idCategoria) ?? `Categoría ${p.idCategoria}`}</span>
                    </div>
                  </div>
                ),
              },
              {
                clave: "variantes",
                titulo: "Variantes",
                celda: (p) => (
                  <div className="ap-variantes-celda">
                    {p.variantes.map((v) => (
                      <span key={v.idVariante} className={v.activa ? "" : "ap-tachado"}>
                        <code>{v.sku}</code> <Precio final={v.precioBase} tamano="sm" />
                      </span>
                    ))}
                  </div>
                ),
              },
              { clave: "estado", titulo: "Estado", celda: (p) => <Insignia tono={p.activo ? "success" : "neutral"}>{p.activo ? "Activo" : "Inactivo"}</Insignia> },
              {
                clave: "activo",
                titulo: "En la tienda",
                alinear: "centro",
                celda: (p) => <Interruptor activo={p.activo} alCambiar={(v) => void cambiarEstado(p, v)} etiquetaAccesible={`Mostrar ${p.nombre} en la tienda`} deshabilitado={!puedeEditar} />,
              },
              {
                clave: "acciones",
                titulo: "",
                alinear: "derecha",
                celda: (p) => (
                  <Link href={`/backoffice/productos/${p.idProducto}`} className="ec-btn ec-btn--secondary ec-btn--sm">
                    <Pencil size={16} strokeWidth={2} aria-hidden />
                    <span>{puedeEditar ? "Editar" : "Ver"}</span>
                  </Link>
                ),
              },
            ]}
          />
          <Paginacion pagina={pagina} tamano={TAMANO_PRODUCTOS} haySiguiente={(productos.datos?.length ?? 0) === TAMANO_PRODUCTOS} enPagina={productos.datos?.length ?? 0} alCambiar={setPagina} />
        </div>
      )}
    </>
  );
}
