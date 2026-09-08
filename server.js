const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { TEST_USER, PACKAGES } = require("./src/data");
const { createSession, getSessionToken, requireAuth } = require("./src/auth");
const { logRequest, getRequests } = require("./src/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Registra en SQLite (data/requests.db) cada petición entrante para poder
// inspeccionar cómo llega (headers, query, body, cookies) desde el cliente real.
app.use((req, res, next) => {
  logRequest(req);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Consulta las últimas peticiones registradas: GET /api/_debug/requests?limit=50
app.get("/api/_debug/requests", (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.status(200).json({ requests: getRequests(limit) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (email !== TEST_USER.email || password !== TEST_USER.password) {
    return res
      .status(401)
      .json({ success: false, message: "Credenciales inválidas" });
  }

  const { sessionId } = createSession(TEST_USER.id);

  res.cookie("sessionId", sessionId, { httpOnly: true, sameSite: "lax" });
  res.status(200).json({
    user: {
      id: TEST_USER.id,
      nombre: TEST_USER.nombre,
      email: TEST_USER.email,
      admin: TEST_USER.admin,
      tokenId: TEST_USER.tokenId,
    },
  });
});

app.get("/api/auth/get-user-token", (req, res) => {
  const sessionId = req.cookies ? req.cookies.sessionId : undefined;

  if (!sessionId) {
    return res.status(401).json({
      success: false,
      message: "Cookie 'sessionId' requerida (inicia sesión primero)",
    });
  }

  const token = getSessionToken(sessionId);
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Sesión inválida o expirada" });
  }

  res.status(200).json({ token });
});

// TODO: validación de auth (requireAuth) quitada TEMPORALMENTE en
// listar-paquetes y registro-bro para depurar el consumo real del cliente.
// Volver a agregar `requireAuth` como segundo argumento cuando ya no se
// necesite.
app.get("/api/via-rapida/listar-paquetes", (req, res) => {
  res.status(200).json({ paquetes: PACKAGES });
});

app.post("/api/via-rapida/registro-bro", (req, res) => {
  const body = req.body || {};
  const forceError = req.headers["x-mock-scenario"] === "error";
  const paqueteExiste = PACKAGES.some((p) => p.paquete_id === body.paquete_id);

  if (forceError || !paqueteExiste) {
    return res.status(200).json({
      success: false,
      message: "Error realizando el registro",
      rawResponse: forceError
        ? "Escenario de error forzado (header X-Mock-Scenario: error)"
        : `paquete_id ${body.paquete_id} no existe en el catálogo`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Registro realizado correctamente",
    rawResponse: "Respuesta original del proveedor (mock)",
  });
});

app.listen(PORT, () => {
  console.log(`Mock Via Rápida escuchando en http://localhost:${PORT}`);
});
