# ============================================================
# ECOMERS · frontend (Next.js) en modo standalone
#
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.tu-dominio.co/api/v1 -t ecomers-frontend .
#   docker run -p 5173:5173 ecomers-frontend
#
# NEXT_PUBLIC_API_URL se fija al CONSTRUIR la imagen (Next la escribe en el JavaScript del navegador):
# cada entorno (local, pruebas, produccion) necesita su propia imagen. No lleva secretos: el frontend no tiene claves.
# ============================================================

# Etapa 1 - DEPENDENCIAS: solo se reinstalan si cambia package-lock.json (cache de capas).
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Etapa 2 - BUILD: compila y revisa los tipos.
FROM node:26-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Etapa 3 - RUNTIME: solo el servidor standalone y los estaticos, con usuario sin privilegios.
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=5173 \
    HOSTNAME=0.0.0.0
RUN addgroup -S next && adduser -S next -G next
COPY --from=build --chown=next:next /app/.next/standalone ./
COPY --from=build --chown=next:next /app/.next/static ./.next/static
USER next

# 5173 es el origen que la API permite por CORS en desarrollo; en produccion se ajusta CORS_ALLOWED_ORIGINS en la API.
EXPOSE 5173

# Docker sabe si la web responde (busybox trae wget).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:5173/ || exit 1

CMD ["node", "server.js"]
