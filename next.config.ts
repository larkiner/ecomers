import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Raíz del proyecto: evita que Turbopack tome un package-lock.json suelto de la carpeta del usuario.
  turbopack: { root: process.cwd() },
  // Docker: el build deja un servidor autocontenido en .next/standalone (ver Dockerfile), sin todo node_modules.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // /catalogo pasó a llamarse /productos: los enlaces y favoritos viejos siguen funcionando (la búsqueda se conserva).
  async redirects() {
    return [{ source: "/catalogo", destination: "/productos", permanent: false }];
  },
  images: {
    // Fotos de producto: URLs públicas del bucket de Supabase que entrega la API.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
