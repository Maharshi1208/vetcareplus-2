import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

const SECRET: string = env.JWT_SECRET;

// re-export for other modules
export type { JwtPayload };

export function signAccessToken(
  payload: object,
  opts: SignOptions = { expiresIn: "1d" }
): string {
  return jwt.sign(payload, SECRET, opts);
}

export function verifyAccessToken<T extends object = JwtPayload>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}

// keep the newer names too (aliases)
export const signJwt = signAccessToken;
export const verifyJwt = verifyAccessToken;
