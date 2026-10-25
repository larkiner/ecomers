"use client";

import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { ApiError, mensajeDeError } from "@/lib/api";
import { cambiarClave } from "@/lib/cuenta";
import { Boton, Campo } from "./ui/controles";
import { Alerta } from "./ui/avisos";

/** Cambio de contraseña. La API cierra todas las sesiones, así que al terminar se vuelve a ingresar. */
export function CambiarClave() {
  const router = useRouter();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const locales: Record<string, string> = {};
    if (!actual) locales.actual = "Escribe tu contraseña actual.";
    if (nueva.length < 8 || nueva.length > 72) locales.nueva = "Entre 8 y 72 caracteres.";
    if (nueva === actual && nueva) locales.nueva = "La nueva debe ser distinta de la actual.";
    if (confirmacion !== nueva) locales.confirmacion = "Las contraseñas no coinciden.";
    setErrores(locales);
    setError(null);
    if (Object.keys(locales).length) return;
    setEnviando(true);
    try {
      await cambiarClave(actual, nueva);
      router.replace("/ingresar");
    } catch (err) {
      setEnviando(false);
      if (err instanceof ApiError && err.codigo === "CREDENCIALES_INVALIDAS") setErrores({ actual: "La contraseña actual no es correcta." });
      else if (err instanceof ApiError && err.codigo === "PASSWORD_DEBIL") setErrores({ nueva: err.message });
      else setError(mensajeDeError(err));
    }
  }

  return (
    <form className="ap-form" onSubmit={enviar} noValidate>
      {error && <Alerta tono="danger">{error}</Alerta>}
      <Campo etiqueta="Contraseña actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} error={errores.actual} />
      <Campo etiqueta="Contraseña nueva" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} error={errores.nueva} ayuda="Mínimo 8 caracteres y que no sea obvia." />
      <Campo etiqueta="Confirma la contraseña nueva" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} error={errores.confirmacion} />
      <p className="ec-muted">Al cambiarla cerramos tu sesión en todos tus dispositivos.</p>
      <div>
        <Boton type="submit" icono={KeyRound} cargando={enviando}>
          Cambiar contraseña
        </Boton>
      </div>
    </form>
  );
}
