import { useEffect, useRef, useState } from "react";

export interface Carga<T> {
  datos: T | null;
  error: unknown;
  cargando: boolean;
  recargar: () => void;
}

interface Estado<T> {
  clave: string | null;
  datos: T | null;
  error: unknown;
}

/**
 * Ejecuta una lectura de la API al montar y cada vez que cambian `deps` (o al llamar `recargar`). Cancela la petición
 * anterior y conserva los datos previos mientras llega la nueva, para que las tablas no parpadeen al paginar.
 */
export function useCarga<T>(leer: (signal: AbortSignal) => Promise<T>, deps: unknown[], activa = true): Carga<T> {
  const [vuelta, setVuelta] = useState(0);
  const clave = activa ? `${JSON.stringify(deps)}#${vuelta}` : null;
  const [estado, setEstado] = useState<Estado<T>>({ clave: null, datos: null, error: null });
  const leerActual = useRef(leer);

  useEffect(() => {
    leerActual.current = leer;
  });

  useEffect(() => {
    if (clave === null) return;
    const control = new AbortController();
    leerActual
      .current(control.signal)
      .then((datos) => setEstado({ clave, datos, error: null }))
      .catch((error) => {
        if (!control.signal.aborted) setEstado((e) => ({ clave, datos: e.datos, error }));
      });
    return () => control.abort();
  }, [clave]);

  const cargando = clave !== null && estado.clave !== clave;
  return { datos: estado.datos, error: cargando ? null : estado.error, cargando, recargar: () => setVuelta((v) => v + 1) };
}
