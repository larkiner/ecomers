"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { ApiError, mensajeDeError } from "@/lib/api";
import { iniciarSesion } from "@/lib/cuenta";
import { destinoInicial, tomarAvisoSesion } from "@/lib/sesion";
import { Boton, Campo } from "@/components/ui/controles";
import { Alerta } from "@/components/ui/avisos";

/** Solo se vuelve a rutas internas: evita redirigir a otro sitio con ?vuelta=. */
function vueltaSegura(v: string | null): string | null {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export function Ingresar() {
  const router = useRouter();
  const params = useSearchParams();
  const vuelta = vueltaSegura(params.get("vuelta"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso] = useState(() => (typeof window === "undefined" ? null : tomarAvisoSesion()));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await iniciarSesion(email.trim(), password);
      if (!sesion) throw new Error("No pudimos leer tu sesión. Intenta de nuevo.");
      const destino = sesion.rol === "CLIENTE" ? (vuelta && !vuelta.startsWith("/backoffice") ? vuelta : "/") : vuelta?.startsWith("/backoffice") ? vuelta : destinoInicial(sesion.rol);
      router.replace(destino);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "El correo o la contraseña no coinciden. Revísalos e intenta de nuevo." : mensajeDeError(err));
      setEnviando(false);
    }
  }

  return (
    <>
      <div>
        <h1 className="ap-acceso__titulo">Ingresa a tu cuenta</h1>
        <p className="ec-muted">Clientes, trabajadores y el dueño entran por aquí.</p>
      </div>
      {aviso && <Alerta tono="info">{aviso}</Alerta>}
      {error && <Alerta tono="danger">{error}</Alerta>}
      <form className="ap-form" onSubmit={enviar} noValidate>
        <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Campo
          etiqueta="Contraseña"
          type={ver ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sufijo={
            <button type="button" className="ap-ver-clave" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}>
              {ver ? <EyeOff size={18} strokeWidth={2} aria-hidden /> : <Eye size={18} strokeWidth={2} aria-hidden />}
            </button>
          }
        />
        <Boton type="submit" tamano="lg" bloque icono={LogIn} cargando={enviando} disabled={!email || !password}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </Boton>
      </form>
      <p className="ap-acceso__pie">
        ¿No tienes cuenta?{" "}
        <Link href={vuelta ? `/registro?vuelta=${encodeURIComponent(vuelta)}` : "/registro"} className="ec-link">
          Crear cuenta
        </Link>
      </p>
    </>
  );
}
