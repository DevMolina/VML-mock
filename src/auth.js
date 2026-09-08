const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "mock-secret-via-rapida";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hora

// sessionId -> { userId, token, expiresAt }
const sessions = new Map();

function createSession(userId) {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;

  const token = jwt.sign({ sub: userId, sid: sessionId }, JWT_SECRET, {
    expiresIn: "1h",
  });

  sessions.set(sessionId, { userId, token, expiresAt });

  return { sessionId, token };
}

function getSessionToken(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return session.token;
}

function destroySession(sessionId) {
  return sessions.delete(sessionId);
}

// Ajustado según tráfico real: el cliente consumidor solo envía el header
// `Authorization: Bearer {jwt}` en listar-paquetes/registro-bro, sin
// reenviar la cookie `sessionId`. Se valida el JWT y que su sesión (sid)
// siga activa server-side; la cookie ya no es obligatoria aquí.
function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Autorización requerida: se espera header 'Authorization: Bearer {jwt}'",
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token inválido" });
  }

  const session = sessions.get(payload.sid);
  if (!session || session.expiresAt < Date.now()) {
    return res
      .status(401)
      .json({ success: false, message: "Sesión inválida o expirada" });
  }

  req.userId = session.userId;
  next();
}

module.exports = {
  createSession,
  getSessionToken,
  destroySession,
  requireAuth,
  sessions,
};
