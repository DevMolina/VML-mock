# Mock Server - API Via Rápida

Servidor mock en Node.js/Express que implementa los 3 endpoints documentados en
`../API_ViaRapida_Mock_Actualizada.md` y `../API_ViaRapida_OpenAPI_3.0.yaml`.

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
- Crea una sesión en memoria y devuelve la cookie `Set-Cookie: sessionId=<valor>`.
- Devuelve el `user` documentado **más un campo adicional `token`** (JWT firmado,
  válido 1 hora). Ese `token` es el que debes enviar como
  `Authorization: Bearer {token}` en los endpoints protegidos.

  > Nota: el documento original no especifica cómo se emite el JWT usado en
  > `Authorization: Bearer {jwt}`. Este mock lo genera y lo expone en la
  > respuesta de login para poder validar sesión estricta extremo a extremo.

Credenciales inválidas → `401`:
```json
{ "success": false, "message": "Credenciales inválidas" }
```

### `GET /api/via-rapida/listar-paquetes`
Protegido. Requiere `Authorization: Bearer {token}` **y** cookie `sessionId`
válidos y correspondientes a la misma sesión (validación estricta). Devuelve
un catálogo de 3 paquetes de ejemplo.

### `POST /api/via-rapida/registro-bro`
Protegido igual que el anterior. Responde `200`:
- `success: true` si `paquete_id` existe en el catálogo.
- `success: false` si `paquete_id` no existe, **o** si se envía el header
  `X-Mock-Scenario: error` para forzar el escenario de fallo en cualquier
  prueba.

## Escenarios de error para pruebas

| Escenario | Cómo forzarlo |
|---|---|
| Login inválido | Enviar `email`/`password` distintos al usuario de prueba |
| Sin autorización | Omitir header `Authorization` o cookie `sessionId` |
| Sesión/token inválido | Enviar un `sessionId` o `token` que no coincidan entre sí |
| Registro fallido | Header `X-Mock-Scenario: error`, o un `paquete_id` que no exista |

## Notas de implementación

- Las sesiones se guardan **en memoria** (`Map`), se pierden al reiniciar el
  servidor y expiran a la hora de creadas.
- No hay base de datos ni persistencia en disco; es solo para pruebas de
  integración/frontend.
- CORS está habilitado con `credentials: true` para poder probar desde un
  frontend en otro origen (recuerda usar `credentials: 'include'` en tus
  llamadas `fetch`/`axios`).
