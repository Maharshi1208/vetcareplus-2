// backend/src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const APP_URL = process.env.APP_URL ?? 'http://localhost:4000';

// CORS
const corsOrigins = new Set<string>(
  [FRONTEND_URL, APP_URL].filter(Boolean).map((s) => s.replace(/\/+$/, ''))
);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      try {
        const o = new URL(origin).origin;
        return cb(null, corsOrigins.has(o));
      } catch {
        return cb(null, false);
      }
    },
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', 1);

// Helmet base (CSP disabled here; we set it manually next)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Security headers + caching
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Strict, dev-friendly CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' ${FRONTEND_URL} ${APP_URL}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
    "script-src-attr 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Permissions-Policy (explicit)
  res.setHeader(
    'Permissions-Policy',
    [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'usb=()',
      'screen-wake-lock=()',
      'web-share=()',
    ].join(', ')
  );

  // Extra isolation (ok for APIs)
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // 🚫 Always disable caching for API responses (clears ZAP 10049)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Optional: CDNs
  res.setHeader('Surrogate-Control', 'no-store');

  next();
});

// Noise-reduction endpoints
app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('User-agent: *\nDisallow: /');
});

app.get('/sitemap.xml', (_req, res) => {
  res.status(204).end();
});

// Health/root
app.get('/', (_req, res) => {
  res.status(200).json({ ok: true, env: NODE_ENV });
});

// Mount your real routers below, e.g.
// import authRouter from './routes/auth';
// app.use('/auth', authRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
/* eslint-disable @typescript-eslint/no-unused-vars */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const code = Number(err?.status || err?.statusCode || 500);
  const body =
    NODE_ENV === 'production'
      ? { error: 'Internal Server Error' }
      : { error: err?.message || 'Internal Server Error', stack: err?.stack };
  res.status(code).json(body);
});
/* eslint-enable @typescript-eslint/no-unused-vars */

export default app;
