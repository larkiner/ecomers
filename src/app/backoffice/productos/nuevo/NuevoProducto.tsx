"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, ApiError, erroresPorCampo, mensajeDeError } from "@/lib/api";
import { cargarCategorias, cargarImpuestos } from "@/lib/backoffice";
import { tienePermiso, useSesion } from "@/lib/sesion";
import { useCarga } from "@/lib/useCarga";
import { AreaTexto, Boton, BotonEnlace, BotonIcono, Campo, Casilla, Selector } from "@/components/ui/controles";
import { Alerta, EstadoVacio } from "@/components/ui/avisos";
import { CabeceraPagina } from "@/components/backoffice/MarcoBackoffice";
import { SubirFoto } from "@/components/SubirFoto";
import { VistaPreviaTarjeta } from "@/components/backoffice/VistaPreviaTarjeta";
import { limpiarPrecio, opcionesCategorias, opcionesImpuestos, PRECIO_VALIDO } from "@/components/backoffice/campos";

interface FilaVariante {
  clave: number;
  sku: string;
  nombre: string;
  precioBase: string;
  controlaStock: boolean;
}

let siguienteClave = 1;
const nuevaVariante = (): FilaVariante => ({ clave: siguienteClave++, sku: "", nombre: "", precioBase: "", controlaStock: true });

export function NuevoProducto() {
  const sesion = useSesion();
  const router = useRouter();
  const categorias = useCarga((s) => cargarCategorias(s), []);
  const impuestos = useCarga((s) => cargarImpuestos(s), []);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [idImpuesto, setIdImpuesto] = useState("");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [variantes, setVariantes] = useState<FilaVariante[]>(() => [nuevaVariante()]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ texto: string; codigo?: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!tienePermiso(sesion, "PRODUCTOS")) {
    return (
      <EstadoVacio icono={Lock} titulo="No tienes permiso para crear productos" accion={<BotonEnlace href="/backoffice/productos">Volver a productos</BotonEnlace>}>
        Pídele al dueño el permiso de Productos.
      </EstadoVacio>
    );
  }

  const cambiar = (clave: number, campo: keyof FilaVariante, valor: string | boolean) => setVariantes((vs) => vs.map((v) => (v.clave === clave ? { ...v, [campo]: valor } : v)));
  const skus = variantes.map((v) => v.sku.trim().toUpperCase());

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "Escribe el nombre del producto.";
    if (!idCategoria) e.idCategoria = "Elige una categoría.";
    if (!idImpuesto) e.idImpuesto = "Elige el impuesto.";
    variantes.forEach((v, i) => {
      if (!v.sku.trim()) e[`variantes[${i}].sku`] = "Escribe el SKU.";
      else if (skus.indexOf(v.sku.trim().toUpperCase()) !== i) e[`variantes[${i}].sku`] = "Ya usaste este SKU.";
      if (!v.nombre.trim()) e[`variantes[${i}].nombre`] = "Escribe el nombre de la variante.";
      if (!PRECIO_VALIDO.test(v.precioBase)) e[`variantes[${i}].precioBase`] = "Precio con hasta 2 decimales.";
    });
    return e;
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const locales = validar();
    setErrores(locales);
    if (Object.keys(locales).length) return;
    setEnviando(true);
    try {
      const r = await api<{ idProducto: number; idsVariantes: number[] }>("/backoffice/productos", {
        metodo: "POST",
        cuerpo: {
          idCategoria: Number(idCategoria),
          idImpuesto: Number(idImpuesto),
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          imagenUrl,
          variantes: variantes.map((v) => ({ sku: v.sku.trim(), nombre: v.nombre.trim(), precioBase: v.precioBase, controlaStock: v.controlaStock })),
        },
      });
      const primera = variantes.findIndex((v) => v.controlaStock);
      router.push(primera >= 0 ? `/backoffice/inventario?variante=${r.idsVariantes[primera]}&nuevo=1` : `/backoffice/productos/${r.idProducto}`);
    } catch (err) {
      setEnviando(false);
      const porCampo = erroresPorCampo(err);
      if (err instanceof ApiError && err.codigo === "CATEGORIA_NO_ENCONTRADA") porCampo.idCategoria = err.message;
      if (err instanceof ApiError && err.codigo === "IMPUESTO_INVALIDO") porCampo.idImpuesto = err.message;
      setErrores(porCampo);
      setError({ texto: mensajeDeError(err), codigo: err instanceof ApiError ? err.codigo : undefined });
    }
  }

  const primera = variantes[0];
  return (
    <form onSubmit={crear} noValidate>
      <CabeceraPagina
        titulo="Nuevo producto"
        migas={
          <>
            <Link href="/backoffice/productos">Productos</Link> / Nuevo
          </>
        }
        acciones={
          <>
            <BotonEnlace href="/backoffice/productos" variante="ghost">
              Cancelar
            </BotonEnlace>
            <Boton type="submit" icono={Check} cargando={enviando} disabled={subiendo}>
              Crear producto
            </Boton>
          </>
        }
      />
      {error && (
        <div className="ap-espacio">
          <Alerta tono="danger" titulo="No pudimos crear el producto" codigo={error.codigo} alCerrar={() => setError(null)}>
            {error.texto}
          </Alerta>
        </div>
      )}
      <div className="ap-editor">
        <div className="ap-stack">
          <section className="ec-panel ap-stack-sm">
            <h2 className="ec-subtitle">Datos del producto</h2>
            <Campo etiqueta="Nombre" required maxLength={200} value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} placeholder="Portátil X 14 pulgadas" />
            <AreaTexto etiqueta="Descripción" maxLength={2000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} ayuda={`${descripcion.length} de 2000 caracteres`} error={errores.descripcion} />
            <div className="ap-form__dos">
              <Selector etiqueta="Categoría" required vacio={categorias.cargando ? "Cargando…" : "Elige una categoría"} value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)} opciones={opcionesCategorias(categorias.datos)} error={errores.idCategoria} ayuda="Solo categorías activas" />
              <Selector etiqueta="Impuesto" required vacio={impuestos.cargando ? "Cargando…" : "Elige el impuesto"} value={idImpuesto} onChange={(e) => setIdImpuesto(e.target.value)} opciones={opcionesImpuestos(impuestos.datos)} error={errores.idImpuesto} />
            </div>
          </section>

          <section className="ec-panel ap-stack-sm">
            <div>
              <h2 className="ec-subtitle">Variantes</h2>
              <p className="ec-muted">Cada variante es lo que se vende, con su propio SKU y precio. “Controla stock” no se puede cambiar después.</p>
            </div>
            {variantes.map((v, i) => (
              <div key={v.clave} className="ap-variante">
                <Campo etiqueta="SKU" required maxLength={50} value={v.sku} onChange={(e) => cambiar(v.clave, "sku", e.target.value)} error={errores[`variantes[${i}].sku`]} />
                <Campo etiqueta="Nombre" required maxLength={150} value={v.nombre} onChange={(e) => cambiar(v.clave, "nombre", e.target.value)} error={errores[`variantes[${i}].nombre`]} placeholder="16 GB / Negro" />
                <Campo etiqueta="Precio base" required prefijo="$" inputMode="decimal" value={v.precioBase} onChange={(e) => cambiar(v.clave, "precioBase", limpiarPrecio(e.target.value))} error={errores[`variantes[${i}].precioBase`]} />
                <Casilla etiqueta="Controla stock" checked={v.controlaStock} onChange={(e) => cambiar(v.clave, "controlaStock", e.target.checked)} />
                <BotonIcono icono={Trash2} etiqueta={`Quitar variante ${i + 1}`} disabled={variantes.length === 1} onClick={() => setVariantes((vs) => vs.filter((x) => x.clave !== v.clave))} />
              </div>
            ))}
            <div>
              <Boton variante="secondary" icono={Plus} disabled={variantes.length >= 50} onClick={() => setVariantes((vs) => [...vs, nuevaVariante()])}>
                Agregar variante
              </Boton>
            </div>
          </section>
          <Alerta tono="info" titulo="El stock empieza en 0">
            Al crear el producto te llevamos a registrar la primera entrada de inventario.
          </Alerta>
        </div>

        <aside className="ap-stack ap-editor__lateral">
          <section className="ec-panel ap-stack-sm">
            <h2 className="ec-subtitle">Foto del producto</h2>
            <SubirFoto valor={imagenUrl} alCambiar={setImagenUrl} alOcupado={setSubiendo} />
          </section>
          <section className="ap-stack-sm">
            <h2 className="ec-subtitle">Así se verá en la tienda</h2>
            <VistaPreviaTarjeta nombre={nombre.trim() + (primera?.nombre.trim() ? ` - ${primera.nombre.trim()}` : "")} sku={primera?.sku.trim().toUpperCase() ?? ""} precio={primera?.precioBase ?? ""} imagenUrl={imagenUrl} />
          </section>
        </aside>
      </div>
    </form>
  );
}
