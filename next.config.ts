import type { NextConfig } from "next";

// Cabeceras de seguridad de todas las páginas. La más importante es la CSP: si alguien lograra inyectar HTML, el
// navegador no cargaría scripts de otros dominios ni enviaría datos (como el token de sesión) a otro servidor.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const ORIGEN_API = new URL(API_URL).origin;
const DESARROLLO = process.env.NODE_ENV !== "production";
const CSP = [
  "default-src 'self'",
  // 'unsafe-inline': el script de tema y los datos de arranque de Next van en línea. 'unsafe-eval' solo en desarrollo.
  `script-src 'self' 'unsafe-inline'${DESARROLLO ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self'",
  // La API, la subida de fotos a Supabase y, en desarrollo, la recarga en caliente.
  `connect-src 'self' ${ORIGEN_API} https://*.supabase.co${DESARROLLO ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const CABECERAS_SEGURIDAD = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Raíz del proyecto: evita que Turbopack tome un package-lock.json suelto de la carpeta del usuario.
  turbopack: { root: process.cwd() },
  // Docker: el build deja un servidor autocontenido en .next/standalone (ver Dockerfile), sin todo node_modules.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // /catalogo pasó a llamarse /productos: los enlaces y favoritos viejos siguen funcionando (la búsqueda se conserva).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS_SEGURIDAD }];
  },
  async redirects() {
    return [{ source: "/catalogo", destination: "/productos", permanent: false }];
  },
  images: {
    // Fotos de producto: URLs públicas del bucket de Supabase que entrega la API.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
