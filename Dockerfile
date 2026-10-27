# Compila el frontend y lo sirve con Caddy, que además reenvía /api y /ws al backend
# y saca el certificado HTTPS del dominio automáticamente.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vacío = el backend está en el mismo dominio (detrás de Caddy).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
