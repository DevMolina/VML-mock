# Mock Server - API Via Rápida

Servidor mock en Node.js/Express que implementa los 4 endpoints documentados en
`../API_ViaRapida_Mock_Actualizada.md` y `../API_ViaRapida_OpenAPI_3.0.yaml`.

## Flujo de integración

```text
1. POST /api/auth/login          -> obtiene cookie sessionId
2. GET  /api/auth/get-user-token -> obtiene token (JWT), usando la cookie
3. GET  /api/via-rapida/listar-paquetes   (Authorization: Bearer + cookie)
4. POST /api/via-rapida/registro-bro      (Authorization: Bearer + cookie)
```

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
> ⚠️ **Validación de auth desactivada TEMPORALMENTE** (ver `server.js`, busca
> el `TODO`). Ahora mismo responde sin necesidad de `Authorization`/`sessionId`,
> para depurar cómo llegan las peticiones del cliente real. Devuelve un
> catálogo de 3 paquetes de ejemplo.

### `POST /api/via-rapida/registro-bro`
> ⚠️ **Validación de auth desactivada TEMPORALMENTE**, mismo motivo que arriba.

Responde `200`:
- `success: true` si `paquete_id` existe en el catálogo.
- `success: false` si `paquete_id` no existe, **o** si se envía el header
  `X-Mock-Scenario: error` para forzar el escenario de fallo en cualquier
  prueba.

### `GET /api/_debug/requests?limit=50`
Devuelve las últimas peticiones registradas en la base de datos (ver
sección siguiente), en orden descendente. Útil para ver exactamente qué
headers/body/cookies mandó el cliente real en cada llamada.

## Escenarios de error para pruebas

| Escenario | Cómo forzarlo |
|---|---|
| Login inválido | Enviar `email`/`password` distintos al usuario de prueba |
| Token sin sesión | Llamar a `get-user-token` sin la cookie `sessionId` |
| Sin autorización | Omitir header `Authorization` o cookie `sessionId` en los endpoints protegidos |
| Sesión/token inválido | Enviar un `sessionId` o `token` que no coincidan entre sí |
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

## Notas de implementación

- Las sesiones se guardan **en memoria** (`Map`), se pierden al reiniciar el
  servidor y expiran a la hora de creadas.
- CORS está habilitado con `credentials: true` para poder probar desde un
  frontend en otro origen (recuerda usar `credentials: 'include'` en tus
  llamadas `fetch`/`axios`).
