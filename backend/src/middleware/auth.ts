import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

// Расширяем тип Request, чтобы дальше по цепочке роутов был доступен userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Нет токена авторизации" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Токен недействителен или истёк" });
  }

  req.userId = payload.userId;
  next();
}
