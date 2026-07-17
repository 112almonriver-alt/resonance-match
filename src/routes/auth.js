import { Router } from "express";
import { createUser, findUserByEmail, findUserById } from "../db/users.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signToken } from "../auth/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createAuthRouter() {
  const router = Router();

  /**
   * POST /api/auth/register
   * body: { email, password, name, age? }
   */
  router.post("/auth/register", async (req, res) => {
    const { email, password, name, age } = req.body;

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Некорректный email" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Пароль должен быть не короче 8 символов" });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Имя обязательно" });
    }

    try {
      const existing = await findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Пользователь с таким email уже зарегистрирован" });
      }

      const passwordHash = await hashPassword(password);
      const user = await createUser({ email, passwordHash, name: name.trim(), age });
      const token = signToken(user.id);

      res.status(201).json({ token, user });
    } catch (err) {
      res.status(500).json({ error: "Не удалось зарегистрировать пользователя: " + err.message });
    }
  });

  /**
   * POST /api/auth/login
   * body: { email, password }
   */
  router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email и password обязательны" });
    }

    try {
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Неверный email или пароль" });
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Неверный email или пароль" });
      }

      const token = signToken(user.id);
      delete user.password_hash;

      res.json({ token, user });
    } catch (err) {
      res.status(500).json({ error: "Ошибка входа: " + err.message });
    }
  });

  /**
   * GET /api/auth/me — вернуть текущего пользователя по токену
   */
  router.get("/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await findUserById(req.userId);
      if (!user) return res.status(404).json({ error: "Пользователь не найден" });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
