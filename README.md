# Frontend ECOMERS

App web de ECOMERS, tienda de tecnología: la tienda para clientes y el backoffice para trabajadores y el dueño.
Next.js 16 (App Router) con React 19 y TypeScript. Las reglas están en la sección "Frontend" del `CLAUDE.md` raíz.

## Comandos

```bash
npm install
npm run dev     # http://localhost:5173 (puerto permitido por CORS en la API)
npm run build
npm run lint
```

Antes de arrancar, copia `.env.example` a `.env.local` y llena los valores.

## Estructura

- `src/app/(tienda)/`: inicio, productos (con filtro por categoría), categorías, detalle de producto, carrito,
  resultado del pago y mi cuenta. El encabezado trae el menú Inicio, Productos y Categorías.
- `src/app/(auth)/`: ingresar y crear cuenta.
- `src/app/backoffice/`: resumen, productos (lista, nuevo, editar), categorías, inventario, reportes, trabajadores
  (solo el dueño) y mi cuenta. El menú depende del rol y los permisos del token.
- `src/components/ui/`: controles, avisos y datos del sistema de diseño.
- `src/components/tienda/` y `src/components/backoffice/`: piezas de cada zona.
- `src/lib/`: cliente HTTP (`api.ts`), sesión (`sesion.ts`), carrito local (`carrito.ts`), dinero y fechas
  (`formato.ts`) y fotos (`imagenes.ts`: compresión con `browser-image-compression` y subida a Supabase con la URL
  firmada de la API).
- `src/styles/`: `tokens.css` (tema claro y oscuro), `componentes.css` (clases `ec-`) y `app.css` (pantallas, `ap-`).

Íconos: `lucide-react` con `strokeWidth={2}`.

## Docker

La imagen usa el modo `standalone` de Next (solo el servidor y los archivos que necesita) y corre con un usuario sin
privilegios. `NEXT_PUBLIC_API_URL` se fija al construir: cada entorno necesita su propia imagen.

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1 -t ecomers-frontend .
```
```bash
docker run -p 5173:5173 ecomers-frontend
```

En producción, la API debe incluir el dominio del frontend en `CORS_ALLOWED_ORIGINS`.
