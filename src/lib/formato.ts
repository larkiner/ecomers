/**
 * Dinero y fechas. El dinero de la API es texto decimal ("2250000.00"): se opera en centavos con BigInt, nunca con
 * números de punto flotante.
 */

export function aCentavos(valor: string | number | null | undefined): bigint {
  if (valor === null || valor === undefined || valor === "") return BigInt(0);
  const s = String(valor).trim();
  const negativo = s.startsWith("-");
  const [entero = "0", dec = ""] = s.replace(/^[-+]/, "").split(".");
  const c = BigInt(entero || "0") * BigInt(100) + BigInt((dec + "00").slice(0, 2));
  return negativo ? -c : c;
}

export function deCentavos(c: bigint): string {
  const negativo = c < BigInt(0);
  const abs = negativo ? -c : c;
  const entero = abs / BigInt(100);
  const dec = (abs % BigInt(100)).toString().padStart(2, "0");
  return `${negativo ? "-" : ""}${entero}.${dec}`;
}

export function sumarDinero(...valores: (string | null | undefined)[]): string {
  return deCentavos(valores.reduce((acc, v) => acc + aCentavos(v), BigInt(0)));
}

export function multiplicarDinero(valor: string, cantidad: number): string {
  return deCentavos(aCentavos(valor) * BigInt(Math.trunc(cantidad)));
}

export function tieneValor(valor: string | null | undefined): boolean {
  return aCentavos(valor) !== BigInt(0);
}

/** "2250000.00" → "$ 2.250.000"; con centavos distintos de cero → "$ 12.500,50". */
export function formatCOP(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "";
  const c = aCentavos(valor);
  const negativo = c < BigInt(0);
  const abs = negativo ? -c : c;
  const entero = (abs / BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = abs % BigInt(100);
  const conDec = dec === BigInt(0) ? "" : "," + dec.toString().padStart(2, "0");
  return `${negativo ? "−" : ""}$ ${entero}${conDec}`;
}

/** Fracción de la API a porcentaje: "0.19" → "19 %", "0.055" → "5,5 %". */
export function formatPorcentaje(tasa: string | null | undefined): string {
  if (!tasa) return "";
  const [entero = "0", dec = ""] = String(tasa).trim().split(".");
  const puntosBasicos = Number(entero) * 10000 + Number((dec + "0000").slice(0, 4));
  const texto = (puntosBasicos / 100).toLocaleString("es-CO", { maximumFractionDigits: 2 });
  return `${texto} %`;
}

const fmtFecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" });
const fmtFechaHora = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00-05:00" : iso);
  return Number.isNaN(d.getTime()) ? iso : fmtFecha.format(d);
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fmtFechaHora.format(d);
}

/** Fecha local "yyyy-MM-dd", el formato de los filtros de reportes. */
export function fechaISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
