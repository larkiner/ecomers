"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, PackagePlus, PackageSearch, Plus, Save } from "lucide-react";
import { useState } from "react";
import { api, ApiError, erroresPorCampo, mensajeDeError } from "@/lib/api";
import { cargarCategorias, cargarImpuestos, cargarTodosLosProductos } from "@/lib/backoffice";
import { tienePermiso, useSesion } from "@/lib/sesion";
import type { Producto, VarianteAdmin } from "@/lib/tipos";
import { useCarga } from "@/lib/useCarga";
import { AreaTexto, Boton, BotonEnlace, Campo, Casilla, Interruptor, Selector } from "@/components/ui/controles";
import { Alerta, Cargando, EstadoVacio, Insignia } from "@/components/ui/avisos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";
import { SubirFoto } from "@/components/SubirFoto";
import { VistaPreviaTarjeta } from "@/components/backoffice/VistaPreviaTarjeta";
import { limpiarPrecio, opcionesCategorias, opcionesImpuestos, PRECIO_VALIDO } from "@/components/backoffice/campos";

export function EditarProducto() {
  const { idProducto } = useParams<{ idProducto: string }>();
  const id = Number(idProducto);
  const carga = useCarga(async (s) => (await cargarTodosLosProductos(s)).find((p) => p.idProducto === id) ?? null, [id]);

  if (carga.cargando) return <Cargando texto="Cargando producto…" />;
  if (carga.error) return <Alerta tono="danger">{mensajeDeError(carga.error)}</Alerta>;
  if (!carga.datos)
    return (
      <EstadoVacio icono={PackageSearch} titulo="No encontramos este producto" accion={<BotonEnlace href="/backoffice/productos">Volver a productos</BotonEnlace>}>
        Puede que el enlace esté mal escrito.
      </EstadoVacio>
    );
  return <Editor key={carga.datos.idProducto} inicial={carga.datos} recargar={carga.recargar} />;
}

function Editor({ inicial, recargar }: { inicial: Producto; recargar: () => void }) {
  const sesion = useSesion();
  const puede = tienePermiso(sesion, "PRODUCTOS");
  const categorias = useCarga((s) => cargarCategorias(s), []);
  const impuestos = useCarga((s) => cargarImpuestos(s), []);
  const [nombre, setNombre] = useState(inicial.nombre);
  const [descripcion, setDescripcion] = useState(inicial.descripcion ?? "");
  const [idCategoria, setIdCategoria] = useState(String(inicial.idCategoria));
  const [idImpuesto, setIdImpuesto] = useState(String(inicial.idImpuesto));
  const [imagenUrl, setImagenUrl] = useState<string | null>(inicial.imagenUrl ?? null);
  const [activo, setActivo] = useState(inicial.activo);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<{ tono: "success" | "danger"; texto: string } | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrores({ nombre: "Escribe el nombre del producto." });
      return;
    }
    setErrores({});
    setAviso(null);
    setGuardando(true);
    try {
      // PUT reemplaza el producto entero: la imagen actual se reenvía para no borrarla.
      await api(`/backoffice/productos/${inicial.idProducto}`, {
        metodo: "PUT",
        cuerpo: { idCategoria: Number(idCategoria), idImpuesto: Number(idImpuesto), nombre: nombre.trim(), descripcion: descripcion.trim() || null, imagenUrl },
      });
      setAviso({ tono: "success", texto: "Cambios guardados." });
    } catch (err) {
      setErrores(erroresPorCampo(err));
      setAviso({ tono: "danger", texto: mensajeDeError(err) });
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(valor: boolean) {
    setActivo(valor);
    try {
      await api(`/backoffice/productos/${inicial.idProducto}/estado`, { metodo: "PUT", cuerpo: { activo: valor } });
    } catch (err) {
      setActivo(!valor);
      setAviso({ tono: "danger", texto: mensajeDeError(err) });
    }
  }

  const primera = inicial.variantes[0];
  return (
    <>
      <form onSubmit={guardar} noValidate>
        <CabeceraPagina
          titulo={inicial.nombre}
          migas={
            <>
              <Link href="/backoffice/productos">Productos</Link> / {puede ? "Editar" : "Detalle"}
            </>
          }
          acciones={
            <>
              <Interruptor activo={activo} alCambiar={(v) => void cambiarEstado(v)} etiqueta={activo ? "Visible en la tienda" : "Oculto en la tienda"} deshabilitado={!puede} />
              {puede && (
                <Boton type="submit" icono={Save} cargando={guardando} disabled={subiendo}>
                  Guardar cambios
                </Boton>
              )}
            </>
          }
        />
        {aviso && (
          <div className="ap-espacio">
            <Alerta tono={aviso.tono} alCerrar={() => setAviso(null)}>
              {aviso.texto}
            </Alerta>
          </div>
        )}
        <div className="ap-editor">
          <section className="ec-panel ap-stack-sm">
            <h2 className="ec-subtitle">Datos del producto</h2>
            <fieldset className="ap-fieldset" disabled={!puede}>
              <Campo etiqueta="Nombre" required maxLength={200} value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} />
              <AreaTexto etiqueta="Descripción" maxLength={2000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} ayuda={`${descripcion.length} de 2000 caracteres`} />
              <div className="ap-form__dos">
                <Selector etiqueta="Categoría" required value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)} opciones={opcionesCategorias(categorias.datos, inicial.idCategoria)} error={errores.idCategoria} />
                <Selector etiqueta="Impuesto" required value={idImpuesto} onChange={(e) => setIdImpuesto(e.target.value)} opciones={opcionesImpuestos(impuestos.datos, inicial.idImpuesto)} error={errores.idImpuesto} />
              </div>
            </fieldset>
          </section>
          <aside className="ap-stack ap-editor__lateral">
            <section className="ec-panel ap-stack-sm">
              <h2 className="ec-subtitle">Foto del producto</h2>
              {puede ? <SubirFoto valor={imagenUrl} alCambiar={setImagenUrl} alOcupado={setSubiendo} /> : <VistaPreviaTarjeta nombre={nombre} sku={primera?.sku ?? ""} precio={primera?.precioBase ?? ""} imagenUrl={imagenUrl} />}
              {puede && <p className="ec-muted">La foto nueva se guarda al pulsar “Guardar cambios”.</p>}
            </section>
          </aside>
        </div>
      </form>
      <Variantes producto={inicial} puede={puede} recargar={recargar} />
    </>
  );
}

function FilaVariante({ v, puede }: { v: VarianteAdmin; puede: boolean }) {
  const [nombre, setNombre] = useState(v.nombre);
  const [precio, setPrecio] = useState(v.precioBase);
  const [activa, setActiva] = useState(v.activa);
  const [estado, setEstado] = useState<"inactivo" | "guardando" | "guardado">("inactivo");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState({ nombre: v.nombre, precio: v.precioBase });
  const cambiado = nombre !== guardado.nombre || precio !== guardado.precio;

  async function guardar() {
    if (!nombre.trim() || !PRECIO_VALIDO.test(precio)) {
      setError("Revisa el nombre y el precio (hasta 2 decimales).");
      return;
    }
    setError(null);
    setEstado("guardando");
    try {
      await api(`/backoffice/variantes/${v.idVariante}`, { metodo: "PUT", cuerpo: { nombre: nombre.trim(), precioBase: precio } });
      setGuardado({ nombre: nombre.trim(), precio });
      setNombre(nombre.trim());
      setEstado("guardado");
    } catch (err) {
      setEstado("inactivo");
      setError(mensajeDeError(err));
    }
  }

  async function cambiarActiva(valor: boolean) {
    setActiva(valor);
    try {
      await api(`/backoffice/variantes/${v.idVariante}/estado`, { metodo: "PUT", cuerpo: { activo: valor } });
    } catch (err) {
      setActiva(!valor);
      setError(mensajeDeError(err));
    }
  }

  return (
    <div className="ap-variante ap-variante--edicion">
      <div className="ap-variante__sku">
        <span className="ec-field__label">SKU</span>
        <code>{v.sku}</code>
        <Insignia tono={v.controlaStock ? "info" : "neutral"}>{v.controlaStock ? "Con stock" : "Sin stock"}</Insignia>
      </div>
      <Campo etiqueta="Nombre" value={nombre} onChange={(e) => { setNombre(e.target.value); setEstado("inactivo"); }} disabled={!puede} maxLength={150} />
      <Campo etiqueta="Precio base" prefijo="$" inputMode="decimal" value={precio} onChange={(e) => { setPrecio(limpiarPrecio(e.target.value)); setEstado("inactivo"); }} disabled={!puede} ayuda="Queda en el historial de precios" />
      <Interruptor activo={activa} alCambiar={(x) => void cambiarActiva(x)} etiqueta={activa ? "Activa" : "Inactiva"} deshabilitado={!puede} />
      <div className="ap-variante__acciones">
        {puede && (
          <Boton tamano="sm" variante={estado === "guardado" ? "ghost" : "secondary"} icono={estado === "guardado" ? Check : Save} cargando={estado === "guardando"} disabled={!cambiado && estado !== "guardado"} onClick={() => void guardar()}>
            {estado === "guardado" ? "Guardada" : "Guardar"}
          </Boton>
        )}
        {v.controlaStock && (
          <Link href={`/backoffice/inventario?variante=${v.idVariante}`} className="ec-btn ec-btn--ghost ec-btn--sm">
            <PackagePlus size={16} strokeWidth={2} aria-hidden />
            <span>Stock</span>
          </Link>
        )}
      </div>
      {error && (
        <div className="ap-variante__error">
          <Alerta tono="danger" alCerrar={() => setError(null)}>
            {error}
          </Alerta>
        </div>
      )}
    </div>
  );
}

function Variantes({ producto, puede, recargar }: { producto: Producto; puede: boolean; recargar: () => void }) {
  const [nueva, setNueva] = useState({ sku: "", nombre: "", precioBase: "", controlaStock: true });
  const [abierta, setAbierta] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function agregar() {
    const e: Record<string, string> = {};
    if (!nueva.sku.trim()) e.sku = "Escribe el SKU.";
    if (!nueva.nombre.trim()) e.nombre = "Escribe el nombre.";
    if (!PRECIO_VALIDO.test(nueva.precioBase)) e.precioBase = "Precio con hasta 2 decimales.";
    setErrores(e);
    setError(null);
    if (Object.keys(e).length) return;
    setEnviando(true);
    try {
      await api(`/backoffice/productos/${producto.idProducto}/variantes`, { metodo: "POST", cuerpo: { ...nueva, sku: nueva.sku.trim(), nombre: nueva.nombre.trim() } });
      setNueva({ sku: "", nombre: "", precioBase: "", controlaStock: true });
      setAbierta(false);
      recargar();
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      if (err instanceof ApiError && err.codigo === "SKU_REPETIDO") porCampo.sku = err.message;
      setErrores(porCampo);
      if (!Object.keys(porCampo).length) setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="ec-panel ap-stack-sm ap-espacio-arriba">
      <div className="ap-seccion__cabeza">
        <div>
          <h2 className="ec-subtitle">Variantes</h2>
          <p className="ec-muted">El SKU y “controla stock” no cambian. Los cambios de precio quedan en el historial con tu correo.</p>
        </div>
        {puede && !abierta && (
          <Boton variante="secondary" icono={Plus} onClick={() => setAbierta(true)}>
            Agregar variante
          </Boton>
        )}
      </div>
      {producto.variantes.map((v) => (
        <FilaVariante key={v.idVariante} v={v} puede={puede} />
      ))}
      {abierta && (
        <div className="ap-variante ap-variante--nueva">
          <Campo etiqueta="SKU" required maxLength={50} value={nueva.sku} onChange={(e) => setNueva({ ...nueva, sku: e.target.value })} error={errores.sku} />
          <Campo etiqueta="Nombre" required maxLength={150} value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} error={errores.nombre} />
          <Campo etiqueta="Precio base" required prefijo="$" inputMode="decimal" value={nueva.precioBase} onChange={(e) => setNueva({ ...nueva, precioBase: limpiarPrecio(e.target.value) })} error={errores.precioBase} />
          <Casilla etiqueta="Controla stock" checked={nueva.controlaStock} onChange={(e) => setNueva({ ...nueva, controlaStock: e.target.checked })} />
          <div className="ap-variante__acciones">
            <Boton tamano="sm" icono={Check} cargando={enviando} onClick={() => void agregar()}>
              Agregar
            </Boton>
            <Boton tamano="sm" variante="ghost" onClick={() => setAbierta(false)}>
              Cancelar
            </Boton>
          </div>
          {error && (
            <div className="ap-variante__error">
              <Alerta tono="danger">{error}</Alerta>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
