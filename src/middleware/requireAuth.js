import { verifyToken } from "../auth/jwt.js";

/** Требует валидный Bearer-токен; при успехе кладёт req.userId */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  try {
    req.userId = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: "Недействительный или истёкший токен" });
  }
}
