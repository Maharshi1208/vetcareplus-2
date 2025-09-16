import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET as string;
const EXPIRES_IN = process.env.JWT_EXPIRES || '1d';

export type JwtPayload = { sub: string; role: 'OWNER'|'VET'|'ADMIN'; email: string };

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
