import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthUser {
  _id: string;
  email: string;
  name?: string;
}

interface JwtUserPayLoad extends JwtPayload {
  sub: string;
  email: string;
  name?: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing `JWT_SECRET` in environment!");
  }
  return secret;
};

export const signToken = (user: AuthUser): string => {
  const secret = getJwtSecret();
  const payload: JwtUserPayLoad = { sub: user._id, email: user.email };
  if (user.name) {
    payload.name = user.name;
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

export const getUserFromAuthHeader = (
  authHeader: string | undefined
): AuthUser | null => {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") return null;
    const payload = decoded as JwtPayload & { email?: unknown; name?: unknown };
    if (!payload.sub || typeof payload.sub !== "string") return null;
    if (!payload.email || typeof payload.email !== "string") return null;

    const name = typeof payload.name === "string" ? payload.name : undefined;
    return name
      ? { _id: payload.sub, email: payload.email, name }
      : { _id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
};
