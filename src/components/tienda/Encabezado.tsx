"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, Cpu, LayoutDashboard, LogIn, LogOut, Menu, Moon, Search, ShoppingCart, Sun, X } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTema } from "../BotonTema";
import { useDialogo } from "../useDialogo";
import { BuscadorPantalla } from "./BuscadorPantalla";
import { unidadesEnCarrito, useCarrito } from "@/lib/carrito";
import { esPersonal, useSesion } from "@/lib/sesion";
import { cerrarSesion } from "@/lib/cuenta";

const MENU = [
  { href: "/productos", texto: "Catálogo" },
  { href: "/categorias", texto: "Categorías" },
];

function activo(ruta: string | null, href: string) {
  if (ruta === null) return false;
  // El detalle de un producto (/producto/123) también cuenta como la sección Catálogo.
  return ruta === href || ruta.startsWith(href + "/") || (href === "/productos" && ruta.startsWith("/producto/"));
}

function Enlaces({ ruta, alElegir }: { ruta: string | null; alElegir?: () => void }) {
  return (
    <>
      {MENU.map(({ href, texto }) => (
        <Link key={href} href={href} aria-current={activo(ruta, href) ? "page" : undefined} onClick={alElegir}>
          {texto}
        </Link>
      ))}
    </>
  );
}

/** Lee la ruta actual para marcar la sección activa, así que va dentro de <Suspense> para no bloquear el prerender. */
function EnlacesConRuta({ alElegir }: { alElegir?: () => void }) {
  return <Enlaces ruta={usePathname()} alElegir={alElegir} />;
}

function OpcionTema({ clase }: { clase: string }) {
  const { tema, siguiente, cambiar } = useTema();
  return (
    <button type="button" className={clase} onClick={cambiar}>
      {tema === "dark" ? <Sun size={18} strokeWidth={2} aria-hidden /> : <Moon size={18} strokeWidth={2} aria-hidden />}
      {siguiente === "dark" ? "Tema oscuro" : "Tema claro"}
    </button>
  );
}

/**
 * Cuenta en el escritorio: "Ingresar" si no hay sesión; si la hay, un panel con cuenta, backoffice, tema y salir. Es una
 * lista de enlaces y botones normales (se recorre con Tab), anclada al botón que la abre.
 */
function MenuCuenta() {
  const sesion = useSesion();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  if (!sesion) {
    return (
      <Link href="/ingresar" className="ap-ingresar">
        <LogIn size={18} strokeWidth={2} aria-hidden />
        Ingresar
      </Link>
    );
  }

  return (
    <div className="ap-menu" ref={caja}>
      <button type="button" className="ap-icono" aria-label="Mi cuenta" aria-expanded={abierto} aria-controls="menu-cuenta" onClick={() => setAbierto((v) => !v)}>
        <CircleUser size={22} strokeWidth={2} aria-hidden />
      </button>
      {abierto && (
        <div className="ap-menu__lista" id="menu-cuenta">
          <p className="ap-menu__email">{sesion.email}</p>
          {esPersonal(sesion) && (
            <Link href="/backoffice" className="ap-menu__item" onClick={() => setAbierto(false)}>
              <LayoutDashboard size={18} strokeWidth={2} aria-hidden /> Backoffice
            </Link>
          )}
          <Link href={esPersonal(sesion) ? "/backoffice/cuenta" : "/cuenta"} className="ap-menu__item" onClick={() => setAbierto(false)}>
            <CircleUser size={18} strokeWidth={2} aria-hidden /> Mi cuenta
          </Link>
          <OpcionTema clase="ap-menu__item" />
          <button type="button" className="ap-menu__item" onClick={() => void cerrarSesion()}>
            <LogOut size={18} strokeWidth={2} aria-hidden /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

/** Panel de navegación para el celular: enlaces grandes y las opciones de cuenta y tema. */
function PanelMovil({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const sesion = useSesion();
  const { ref, onCancel } = useDialogo(abierto, alCerrar);

  return (
    <dialog ref={ref} className="ap-panel" aria-label="Menú" onCancel={onCancel} onClose={alCerrar}>
      <div className="ap-panel__cabeza">
        <span className="ap-marca">
          <Cpu size={24} strokeWidth={2} aria-hidden />
          <span>ECOMERS</span>
        </span>
        <button type="button" className="ap-icono" onClick={alCerrar} aria-label="Cerrar menú">
          <X size={22} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <nav className="ap-panel__enlaces" aria-label="Principal">
        <Link href="/" onClick={alCerrar}>
          Inicio
        </Link>
        <Suspense fallback={<Enlaces ruta={null} alElegir={alCerrar} />}>
          <EnlacesConRuta alElegir={alCerrar} />
        </Suspense>
        <Link href="/carrito" onClick={alCerrar}>
          Carrito
        </Link>
      </nav>
      <div className="ap-panel__cuenta">
        {!sesion ? (
          <>
            <Link href="/ingresar" className="ec-btn ec-btn--primary ec-btn--lg ec-btn--block" onClick={alCerrar}>
              Ingresar
            </Link>
            <Link href="/registro" className="ec-btn ec-btn--secondary ec-btn--lg ec-btn--block" onClick={alCerrar}>
              Crear cuenta
            </Link>
          </>
        ) : (
          <>
            {esPersonal(sesion) && (
              <Link href="/backoffice" className="ap-menu__item" onClick={alCerrar}>
                <LayoutDashboard size={18} strokeWidth={2} aria-hidden /> Backoffice
              </Link>
            )}
            <Link href={esPersonal(sesion) ? "/backoffice/cuenta" : "/cuenta"} className="ap-menu__item" onClick={alCerrar}>
              <CircleUser size={18} strokeWidth={2} aria-hidden /> Mi cuenta
            </Link>
            <button type="button" className="ap-menu__item" onClick={() => void cerrarSesion()}>
              <LogOut size={18} strokeWidth={2} aria-hidden /> Cerrar sesión
            </button>
          </>
        )}
        <OpcionTema clase="ap-menu__item" />
      </div>
    </dialog>
  );
}

/** Encabezado fijo y mínimo: marca, Catálogo y Categorías, y a la derecha búsqueda, cuenta y carrito. */
export function Encabezado() {
  const items = useCarrito();
  const unidades = unidadesEnCarrito(items);
  const [buscando, setBuscando] = useState(false);
  const [menuMovil, setMenuMovil] = useState(false);

  // Atajo "/" para buscar, salvo que la persona ya esté escribiendo en un campo.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const escribiendo = el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
      if (e.key === "/" && !escribiendo && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setBuscando(true);
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, []);

  return (
    <header className="ec-header ap-header">
      <div className="ap-barra">
        <Link href="/" className="ap-marca" aria-label="ECOMERS, inicio">
          <Cpu size={24} strokeWidth={2} aria-hidden />
          <span>ECOMERS</span>
        </Link>
        <nav className="ap-nav" aria-label="Principal">
          <Suspense fallback={<Enlaces ruta={null} />}>
            <EnlacesConRuta />
          </Suspense>
        </nav>
        <div className="ap-barra__acciones">
          <button type="button" className="ap-buscar" onClick={() => setBuscando(true)} aria-label="Buscar productos (atajo: tecla /)">
            <Search size={20} strokeWidth={2} aria-hidden />
            <span className="ap-buscar__texto">Buscar</span>
            <kbd className="ap-buscar__atajo" aria-hidden>
              /
            </kbd>
          </button>
          <span className="ap-solo-escritorio">
            <MenuCuenta />
          </span>
          <Link href="/carrito" className="ap-icono ec-cart" aria-label={`Carrito, ${unidades} ${unidades === 1 ? "producto" : "productos"}`}>
            <ShoppingCart size={22} strokeWidth={2} aria-hidden />
            {unidades > 0 && (
              <span key={unidades} className="ec-cart__count" aria-hidden>
                {unidades > 99 ? "99+" : unidades}
              </span>
            )}
          </Link>
          <button type="button" className="ap-icono ap-solo-movil" onClick={() => setMenuMovil(true)} aria-label="Abrir menú" aria-expanded={menuMovil}>
            <Menu size={22} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
      <BuscadorPantalla abierto={buscando} alCerrar={() => setBuscando(false)} />
      <PanelMovil abierto={menuMovil} alCerrar={() => setMenuMovil(false)} />
    </header>
  );
}
