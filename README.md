# Mock Server - API Via Rápida

Servidor mock en Node.js/Express que implementa los endpoints documentados en
`../API_ViaRapida_Mock_Actualizada.md` y `../API_ViaRapida_OpenAPI_3.0.yaml`.

## Flujo de integración

```text
1. POST /api/auth/login          -> obtiene cookie sessionId
2. GET  /api/auth/get-user-token -> obtiene token (JWT), usando la cookie
3. GET  /api/via-rapida/listar-paquetes   (solo Authorization: Bearer)
4. POST /api/via-rapida/registro-bro      (solo Authorization: Bearer)
5. POST /api/auth/logout
```

> Ajustado según tráfico real de integración: los pasos 3 y 4 **no**
> requieren la cookie `sessionId`, solo el header `Authorization`.

## Instalación y arranque

```bash
cd mock-server
npm install
npm start          # http://localhost:3000 (o PORT=xxxx npm start)
```

Modo desarrollo con recarga automática:

```bash
npm run dev
```

## Usuario de prueba

```json
{
  "email": "viarapidapruebas@peajes.com",
  "password": "123456789"
}
```

## Endpoints

### `POST /api/auth/login`
Valida el usuario de prueba. Si es correcto:
- Crea una sesión en memoria (con un JWT ya asociado, válido 1 hora) y
  devuelve la cookie `Set-Cookie: sessionId=<valor>`.
- Devuelve solo el `user` documentado (sin token; el token se obtiene en el
  siguiente paso).

Credenciales inválidas → `401`:
```json
{ "success": false, "message": "Credenciales inválidas" }
```

### `GET /api/auth/get-user-token`
Requiere la cookie `sessionId` obtenida en el login. Devuelve el JWT asociado
a esa sesión para usarlo como `Authorization: Bearer {token}` en los
endpoints protegidos.

```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

Sin cookie o sesión inválida/expirada → `401`:
```json
{ "success": false, "message": "Sesión inválida o expirada" }
```

### `GET /api/via-rapida/listar-paquetes`
Protegido: requiere `Authorization: Bearer {token}` de una sesión activa. La
cookie `sessionId` **no** es necesaria en este endpoint (ajustado tras ver
que el cliente real no la reenvía). Devuelve un catálogo de 3 paquetes de
ejemplo.

### `POST /api/via-rapida/registro-bro`
Protegido igual que el anterior (solo `Authorization: Bearer {token}`).
Responde `200`:
- `success: true` si `paquete_id` existe en el catálogo.
- `success: false` si `paquete_id` no existe, **o** si se envía el header
  `X-Mock-Scenario: error` para forzar el escenario de fallo en cualquier
  prueba.

### `POST /api/auth/logout`
Endpoint no incluido en la especificación original; agregado al confirmarse
en tráfico real que la aplicación lo consume. Cierra la sesión de la cookie
`sessionId` si está presente; si no lo está (como ocurre en el consumo real
observado), responde éxito igualmente.

```json
{ "success": true, "message": "Sesión cerrada correctamente" }
```

### `GET /api/_debug/requests?limit=50`
Devuelve las últimas peticiones registradas en la base de datos (ver
sección siguiente), en orden descendente. Útil para ver exactamente qué
headers/body/cookies mandó el cliente real en cada llamada.

## Escenarios de error para pruebas

| Escenario | Cómo forzarlo |
|---|---|
| Login inválido | Enviar `email`/`password` distintos al usuario de prueba |
| Token sin sesión | Llamar a `get-user-token` sin la cookie `sessionId` |
| Sin autorización | Omitir o dañar el header `Authorization` en `listar-paquetes`/`registro-bro` |
| Sesión cerrada/expirada | Llamar a `logout` y luego reusar el mismo `token` en un endpoint protegido |
| Registro fallido | Header `X-Mock-Scenario: error`, o un `paquete_id` que no exista |

## Registro de peticiones entrantes (SQLite)

Cada petición que llega al servidor (cualquier endpoint) se guarda en una
base de datos SQLite local: `data/requests.db` (se crea sola al arrancar; el
archivo no se versiona, está en `.gitignore`).

Se guarda: método, path, IP, headers, query, params, body y cookies, tal
como llegaron. Sirve para depurar cómo un cliente real está consumiendo el
mock (por ejemplo, si falta un header o el body no tiene el formato
esperado).

Formas de revisarlo:
- Vía API: `GET /api/_debug/requests?limit=50`
- Directamente con un cliente de SQLite (DB Browser for SQLite, extensión de
  VSCode, etc.) abriendo `mock-server/data/requests.db`, tabla `requests`.
- Ruta configurable con la variable de entorno `DB_PATH`.

> ⚠️ **En Render (free tier) el filesystem es efímero**: este archivo
> desaparece cada vez que el servicio se reinicia, redeploya o "duerme" por
> inactividad (~15 min). Sirve para depurar peticiones mientras el servicio
> está activo, no para conservar historial entre sesiones. Para persistencia
> real haría falta un plan pago con Persistent Disk, o migrar a Render
> Postgres.

## Notas de implementación

- Las sesiones se guardan **en memoria** (`Map`), se pierden al reiniciar el
  servidor y expiran a la hora de creadas.
- CORS está habilitado con `credentials: true` para poder probar desde un
  frontend en otro origen (recuerda usar `credentials: 'include'` en tus
  llamadas `fetch`/`axios`).
