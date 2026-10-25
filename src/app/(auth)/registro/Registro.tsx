"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { ApiError, erroresPorCampo, mensajeDeError } from "@/lib/api";
import { registrarCliente, TIPOS_DOCUMENTO, type DatosRegistro } from "@/lib/cuenta";
import { Boton, Campo, Selector } from "@/components/ui/controles";
import { Alerta } from "@/components/ui/avisos";

const INICIAL: DatosRegistro = { nombre: "", email: "", tipoDocumento: "CC", numeroDocumento: "", telefono: "", password: "" };

/** Validación en el navegador con las mismas reglas de la API; la API vuelve a validar. */
function validar(d: DatosRegistro, confirmacion: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.nombre.trim()) e.nombre = "Escribe tu nombre.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Escribe un correo válido.";
  if (!/^[A-Za-z0-9-]{4,30}$/.test(d.numeroDocumento.trim())) e.numeroDocumento = "Entre 4 y 30 letras, números o guion.";
  if (!/^\d{10}$/.test(d.telefono)) e.telefono = "El teléfono debe tener exactamente 10 dígitos.";
  if (d.password.length < 8 || d.password.length > 72) e.password = "Entre 8 y 72 caracteres.";
  if (confirmacion !== d.password) e.confirmacion = "Las contraseñas no coinciden.";
  return e;
}

export function Registro() {
  const router = useRouter();
  const params = useSearchParams();
  const vuelta = params.get("vuelta");
  const [datos, setDatos] = useState(INICIAL);
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const campo = (k: keyof DatosRegistro) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDatos((d) => ({ ...d, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const locales = validar(datos, confirmacion);
    setErrores(locales);
    if (Object.keys(locales).length) return;
    setEnviando(true);
    try {
      await registrarCliente({ ...datos, nombre: datos.nombre.trim(), email: datos.email.trim(), numeroDocumento: datos.numeroDocumento.trim() });
      router.replace(vuelta && vuelta.startsWith("/") && !vuelta.startsWith("//") ? vuelta : "/");
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      if (err instanceof ApiError) {
        if (err.codigo === "EMAIL_YA_REGISTRADO") porCampo.email = "Ya existe una cuenta con este correo.";
        if (err.codigo === "DOCUMENTO_YA_REGISTRADO") porCampo.numeroDocumento = "Ya existe una cuenta con este documento.";
        if (err.codigo === "PASSWORD_DEBIL") porCampo.password = err.message;
      }
      setErrores(porCampo);
      if (!Object.keys(porCampo).length) setError(mensajeDeError(err));
      setEnviando(false);
    }
  }

  return (
    <>
      <div>
        <h1 className="ap-acceso__titulo">Crea tu cuenta</h1>
        <p className="ec-muted">Con tu cuenta compras más rápido y sigues tus pedidos.</p>
      </div>
      {error && <Alerta tono="danger">{error}</Alerta>}
      <form className="ap-form" onSubmit={enviar} noValidate>
        <Campo etiqueta="Nombre completo" autoComplete="name" autoFocus required maxLength={200} value={datos.nombre} onChange={campo("nombre")} error={errores.nombre} />
        <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" required maxLength={254} value={datos.email} onChange={campo("email")} error={errores.email} />
        <div className="ap-form__dos">
          <Selector etiqueta="Tipo de documento" required value={datos.tipoDocumento} onChange={campo("tipoDocumento")} opciones={TIPOS_DOCUMENTO} />
          <Campo etiqueta="Número de documento" required value={datos.numeroDocumento} onChange={campo("numeroDocumento")} error={errores.numeroDocumento} />
        </div>
        <Campo
          etiqueta="Celular"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          prefijo="+57"
          maxLength={10}
          value={datos.telefono}
          onChange={(e) => setDatos((d) => ({ ...d, telefono: e.target.value.replace(/\D/g, "") }))}
          error={errores.telefono}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={datos.password}
          onChange={campo("password")}
          error={errores.password}
          ayuda="Mínimo 8 caracteres. Evita claves obvias como 12345678 o password1."
        />
        <Campo etiqueta="Confirma la contraseña" type="password" autoComplete="new-password" required value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} error={errores.confirmacion} />
        <Boton type="submit" tamano="lg" bloque icono={UserPlus} cargando={enviando}>
          {enviando ? "Creando tu cuenta…" : "Crear cuenta"}
        </Boton>
      </form>
      <p className="ap-acceso__pie">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="ec-link">
          Ingresa
        </Link>
      </p>
    </>
  );
}
