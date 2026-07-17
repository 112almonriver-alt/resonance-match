import jwt from "jsonwebtoken";

const EXPIRES_IN = "30d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET не задан в .env — сгенерируйте случайную строку и впишите её");
  }
  return secret;
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  const payload = jwt.verify(token, getSecret());
  return payload.sub;
}
