# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Particulares en Colombia que compran tecnología para sí mismos o su hogar (celulares, portátiles, accesorios), desde el celular o el computador. Comparan precio y modelo antes de pagar. Además hay empleados y el dueño que gestionan catálogo, inventario y pedidos en el backoffice (fuera del alcance de este rediseño).

## Product Purpose
ECOMERS es una tienda en línea de tecnología con precios en pesos colombianos, catálogo curado y pago seguro con Wompi (tarjeta, PSE, Nequi). Éxito: que el comprador encuentre el producto, entienda el precio final y complete el pago sin dudas.

## Positioning
Precios claros (se ve el descuento antes de comprar; el IVA se confirma al crear el pedido) y pago seguro, en una tienda pequeña y curada, no un hipermercado con miles de banners.

## Operating Context
Frontend Next.js 16 (App Router, React 19, TypeScript, CSS propio con tokens, sin Tailwind ni librerías de UI), `lucide-react` para íconos. API REST propia; las categorías salen solo de `GET /catalogo/categorias` (nunca fijas en el código). Fotos de producto y categoría desde Supabase, sobre fondo claro `--foto-fondo`. Carrito local en el navegador. Moneda COP con texto decimal.

## Capabilities and Constraints
- Navegación: Inicio, Catálogo (`/productos`, con filtro por categoría), Categorías (`/categorias`, con subcategorías y foto), detalle de producto, carrito, resultado de pago, cuenta, ingreso y registro.
- Tema claro y oscuro con `data-theme`; contraste 4.5:1; objetivos táctiles de 44 px; diseño desde 375 px sin scroll horizontal.
- Textos en español de Colombia con tuteo. "Eliminar" se escribe "Desactivar".
- La API no entrega calificaciones, colores, almacenamiento ni comparador: no se inventan.
- Sin librerías nuevas sin acordarlo con el dueño.

## Brand Commitments
Nombre ECOMERS. El dueño autorizó un rediseño libre, con toque moderno inspirado en Apple. La paleta y las tipografías actuales pueden reemplazarse.

## Evidence on Hand
Hay pocos productos reales (por ahora uno, xiaomi redmi note 11) y cinco categorías reales con fotos de Apple, Samsung y xiaomi. No hay testimonios, calificaciones ni cifras de ventas: no se fabrican.

## Product Principles
1. El precio y el stock siempre son claros y verdaderos.
2. La foto del producto manda; la interfaz se aparta.
3. Poco ruido: pocas cosas bien puestas, en lugar de banners por todas partes.
4. Nunca se muestran datos que la API no entrega.

## Accessibility & Inclusion
Contraste 4.5:1, foco visible, objetivos táctiles de 44 px, etiquetas visibles, tema claro y oscuro, movimiento reducido respetado.
