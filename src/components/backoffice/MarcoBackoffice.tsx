"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartColumn, Cpu, FolderTree, Gauge, Lock, LogOut, Menu, Package, Store, UserCog, Users, Warehouse, X, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cerrarSesion } from "@/lib/cuenta";
import { esPersonal, tienePermiso, useEnNavegador, useSesion, type Sesion } from "@/lib/sesion";
import { BotonTema } from "../BotonTema";
import { BotonEnlace } from "../ui/controles";
import { Cargando, EstadoVacio, Insignia } from "../ui/avisos";

interface ItemMenu {
  href: string;
  texto: string;
  icono: LucideIcon;
  soloLectura?: boolean;
}

/** El menú sale del rol y los permisos del token. Solo pinta: la API vuelve a validar cada acción. */
export function menuBackoffice(s: Sesion): ItemMenu[] {
  const items: ItemMenu[] = [
    { href: "/backoffice", texto: "Resumen", icono: Gauge },
    { href: "/backoffice/productos", texto: "Productos", icono: Package, soloLectura: !tienePermiso(s, "PRODUCTOS") },
    { href: "/backoffice/categorias", texto: "Categorías", icono: FolderTree, soloLectura: !tienePermiso(s, "CATEGORIAS") },
    { href: "/backoffice/inventario", texto: "Inventario", icono: Warehouse },
    { href: "/backoffice/reportes", texto: "Reportes", icono: ChartColumn },
  ];
  if (s.rol === "ADMIN") items.push({ href: "/backoffice/trabajadores", texto: "Trabajadores", icono: Users });
  return items;
}

function activo(ruta: string, href: string) {
  return href === "/backoffice" ? ruta === href : ruta === href || ruta.startsWith(href + "/");
}

export function MarcoBackoffice({ children }: { children: ReactNode }) {
  const sesion = useSesion();
  const listo = useEnNavegador();
  const router = useRouter();
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (listo && !sesion) router.replace(`/ingresar?vuelta=${encodeURIComponent(ruta)}`);
  }, [listo, sesion, router, ruta]);

  if (!listo || !sesion) return <Cargando texto="Verificando tu sesión…" />;

  if (!esPersonal(sesion)) {
    return (
      <div className="ap-contenedor ap-pagina">
        <EstadoVacio icono={Lock} titulo="Esta zona es solo para el equipo de ECOMERS" accion={<BotonEnlace href="/">Volver a la tienda</BotonEnlace>}>
          Tu cuenta es de cliente. Si trabajas con nosotros, ingresa con tu cuenta de trabajador.
        </EstadoVacio>
      </div>
    );
  }

  const items = menuBackoffice(sesion);
  const lateral = (
    <nav className="ec-side ap-side" aria-label="Backoffice">
      <div className="ec-side__brand">
        <Link href="/backoffice" className="ap-marca">
          <Cpu size={22} strokeWidth={2} aria-hidden />
          <span>ECOMERS</span>
        </Link>
        <small>Backoffice</small>
      </div>
      <div className="ec-side__group">
        <span className="ec-side__label">Gestión</span>
        {items.map(({ href, texto, icono: Icono, soloLectura }) => (
          <Link key={href} href={href} className="ec-side__item" aria-current={activo(ruta, href) ? "page" : undefined} onClick={() => setMenuAbierto(false)}>
            <Icono size={18} strokeWidth={2} aria-hidden />
            <span>{texto}</span>
            {soloLectura && <Lock size={14} strokeWidth={2} className="ec-side__lock" aria-label="Solo lectura" />}
          </Link>
        ))}
      </div>
      <div className="ec-side__group">
        <span className="ec-side__label">Tu cuenta</span>
        <Link href="/backoffice/cuenta" className="ec-side__item" aria-current={activo(ruta, "/backoffice/cuenta") ? "page" : undefined} onClick={() => setMenuAbierto(false)}>
          <UserCog size={18} strokeWidth={2} aria-hidden />
          <span>Mi cuenta</span>
        </Link>
        <Link href="/" className="ec-side__item">
          <Store size={18} strokeWidth={2} aria-hidden />
          <span>Ver la tienda</span>
        </Link>
      </div>
      <div className="ec-side__user">
        <span className="ec-side__email" title={sesion.email}>
          {sesion.email}
        </span>
        <div className="ec-row">
          <Insignia tono={sesion.rol === "ADMIN" ? "success" : "neutral"}>{sesion.rol === "ADMIN" ? "Dueño" : "Trabajador"}</Insignia>
        </div>
        <button type="button" className="ec-btn ec-btn--ghost ec-btn--sm" onClick={() => void cerrarSesion("/ingresar")}>
          <LogOut size={16} strokeWidth={2} aria-hidden />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="ap-bo">
      <div className={`ap-bo__lateral${menuAbierto ? " is-abierto" : ""}`}>{lateral}</div>
      {menuAbierto && <button type="button" className="ap-bo__velo" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />}
      <div className="ap-bo__cuerpo">
        <header className="ap-bo__barra">
          <button type="button" className="ec-btn ec-btn--ghost ec-btn--md ec-btn--icon ap-bo__hamburguesa" aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuAbierto} onClick={() => setMenuAbierto((v) => !v)}>
            {menuAbierto ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
          </button>
          <span className="ap-bo__saludo">Hola, {sesion.email.split("@")[0]}</span>
          <BotonTema />
        </header>
        <main className="ap-bo__main" id="contenido">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Cabecera de cada pantalla del backoffice. */
export function CabeceraPagina({ titulo, descripcion, migas, acciones }: { titulo: string; descripcion?: ReactNode; migas?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="ap-bo__cabeza">
      <div>
        {migas && <p className="ap-migas">{migas}</p>}
        <h1 className="ec-title">{titulo}</h1>
        {descripcion && <p className="ec-muted">{descripcion}</p>}
      </div>
      {acciones && <div className="ec-row">{acciones}</div>}
    </div>
  );
}
