const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "mock-secret-via-rapida";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hora

// sessionId -> { userId, expiresAt }
const sessions = new Map();

function createSession(userId) {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(sessionId, { userId, expiresAt });

  const token = jwt.sign({ sub: userId, sid: sessionId }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { sessionId, token };
}

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const [scheme, token] = authHeader.split(" ");
  const sessionId = req.cookies ? req.cookies.sessionId : undefined;

  if (scheme !== "Bearer" || !token || !sessionId) {
    return res.status(401).json({
      success: false,
      message:
        "Autorización requerida: se espera header 'Authorization: Bearer {jwt}' y cookie 'sessionId'",
    });
  }

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    return res
      .status(401)
      .json({ success: false, message: "Sesión inválida o expirada" });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token inválido" });
  }

  if (payload.sid !== sessionId) {
    return res
      .status(401)
      .json({ success: false, message: "El token no corresponde a la sesión indicada" });
  }

  req.userId = session.userId;
  next();
}

module.exports = { createSession, requireAuth, sessions };
