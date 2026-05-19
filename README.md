# FromChat — Despliegue en Railway

## Variables de entorno requeridas en Railway

| Variable      | Descripción                                              |
|---------------|----------------------------------------------------------|
| `MONGO_URI`   | URI de MongoDB Atlas (ej: `mongodb+srv://...`)           |
| `PORT`        | Railway lo asigna automáticamente — no tocar             |
| `CLIENT_URL`  | URL de tu app en Railway (ej: `https://xxx.railway.app`) |
| `NODE_ENV`    | `production`                                             |
| `VITE_API_URL`    | `https://xxx.railway.app/api`                        |
| `VITE_SOCKET_URL` | `https://xxx.railway.app`                            |

> **Nota:** Las variables `VITE_*` deben estar disponibles en Railway **antes** del build,
> o el build las ignorará. Ve a Settings → Variables en Railway y añádelas primero.

## Pasos para subir

1. Push tu código a GitHub.
2. En [railway.app](https://railway.app) → New Project → Deploy from GitHub.
3. Conecta el repositorio.
4. Ve a **Variables** y añade las de la tabla de arriba.
5. Railway detecta `railway.json` y ejecuta `npm install && npm run build && node index.js`.
6. Copia la URL pública generada y ponla como `CLIENT_URL`, `VITE_API_URL` y `VITE_SOCKET_URL`.
7. Dispara un nuevo deploy (Settings → Redeploy).

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Levantar servidor (puerto 5000)
npm run server

# En otra terminal: levantar frontend Vite (puerto 5173)
npm run dev
```

Crea un archivo `.env` en la raíz:
```
MONGO_URI=mongodb://localhost:27017/fromchat
PORT=5000
NODE_ENV=development
```