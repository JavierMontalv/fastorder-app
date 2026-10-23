# Comanda Admin Web

Panel operativo para restaurantes: pedidos, productos, categorías, analítica y configuración.

## Requisitos

- Node.js 22 (`.nvmrc`)
- npm 10+

## Variables de entorno

Base de referencia:

- [`.env.example`](/C:/Users/USER/comanda-app/admin-web/.env.example)
- [`.env.production.example`](/C:/Users/USER/comanda-app/admin-web/.env.production.example)

Claves:

- `VITE_API_URL`: base de API. Acepta `http://host:4000/api` o `/api`.
- `VITE_ASSETS_URL`: base de imágenes. Déjalo vacío si se sirven desde el mismo dominio.
- `VITE_SOCKET_URL`: URL del servidor Socket.IO sin `/api`. Si queda vacío, se deriva desde `VITE_API_URL`.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Despliegue

El flujo aprobado es GitHub → AWS. El artefacto de producción es `dist/` y debe publicarse en el destino AWS del panel. Para una SPA en S3 + CloudFront, configura `index.html` como documento raíz y respuesta para rutas no encontradas. Para EC2 + Nginx, usa el fallback mostrado abajo.

### Variables sugeridas en producción

```env
VITE_API_URL=/api
VITE_ASSETS_URL=
VITE_SOCKET_URL=
```

### AWS EC2 + Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location /api/ {
  proxy_pass http://127.0.0.1:4000/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

location /socket.io/ {
  proxy_pass http://127.0.0.1:4000/socket.io/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```
