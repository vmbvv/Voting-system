import { parse, serialize } from "cookie";
import type { ServerResponse } from "node:http";

const COOKIE_NAME = "voting_token";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export const setAuthCookie = (res: ServerResponse, token: string) => {
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, token, baseCookieOptions));
};

export const clearAuthCookie = (res: ServerResponse) => {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", { ...baseCookieOptions, maxAge: 0 }),
  );
};

export const getTokenFromCookieHeader = (cookieHeader: string | undefined) => {
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  return cookies[COOKIE_NAME] ?? null;
};
