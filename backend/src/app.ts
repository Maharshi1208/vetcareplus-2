// backend/src/app.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

// === Routers ===
import authRoutes from "./auth/routes";
import ownerRoutes from "./owner/routes";
import vetRoutes from "./vet/routes";
import apptRoutes from "./appt/routes";
import petRoutes from "./pet/routes";
import metricsRoutes from "./metrics/routes";
import adminRoutes from "./admin/routes";

// Health/Docs helpers
import { openapiSpec } from "./docs/openapi";
// ⬇️ Use the named export and include .js for ESM consistency
import { prisma } from "./prisma.js";

const app = express();

const NODE_ENV = process.env.NODE_ENV ?? "development";
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/+$/, "");
const APP_URL = (process.env.APP_URL ?? "http://localhost:4000").replace(/\/+$/, "");

// ✅ Configurable API prefix. In tests, default to '' so routes mount at root.
const PREFIX = process.env.API_PREFIX ?? (NODE_ENV === "test" ? "" : "/api");

// CORS
const corsOrigins = new Set<string>([FRONTEND_URL, APP_URL]);
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
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

// Helmet base (CSP disabled here; set manually next)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Security headers + caching
app.use((_req: Request, res: Response, next: NextFunction) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' ${FRONTEND_URL} ${APP_URL} ${APP_URL}${PREFIX}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "script-src-attr 'none'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Permissions-Policy",
    [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "usb=()",
      "screen-wake-lock=()",
      "web-share=()",
    ].join(", ")
  );
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Noise-reduction endpoints
app.get("/robots.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("User-agent: *\nDisallow: /");
});
app.get("/sitemap.xml", (_req, res) => res.status(204).end());

// Root banner (tests expect a textual banner mentioning VetCare+)
app.get("/", (_req, res) =>
  res.status(200).send("VetCare+ API is running (env=" + NODE_ENV + ")")
);

// Ping
app.get(`${PREFIX}/ping`, (_req, res) =>
  res.json({ ok: true, pong: new Date().toISOString() })
);
if (PREFIX !== "/api") {
  app.get("/api/ping", (_req, res) =>
    res.json({ ok: true, pong: new Date().toISOString() })
  );
}

// ---- Health endpoints expected by tests ----
app.get(`${PREFIX}/health`, (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get(`${PREFIX}/health/db`, async (_req, res) => {
  try {
    // ensure a live connection first, then trivial query
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Health DB error:", (e as any)?.message || e);
    }
    res.status(500).json({ ok: false });
  }
});

// ---- Docs: serve OpenAPI JSON at /docs/openapi.json ----
import expressRouter from "express";
const docsRouter = expressRouter.Router();
docsRouter.get("/openapi.json", (_req, res) => res.json(openapiSpec));
app.use(`${PREFIX}/docs`, docsRouter);

// === API Mounts (keep BEFORE 404) ===
app.use(`${PREFIX}/auth`, authRoutes);
app.use(`${PREFIX}/owners`, ownerRoutes);
app.use(`${PREFIX}/vets`, vetRoutes);

// Support both /appointments and /appts
app.use(`${PREFIX}/appointments`, apptRoutes);
app.use(`${PREFIX}/appts`, apptRoutes);

app.use(`${PREFIX}/pets`, petRoutes);
app.use(`${PREFIX}/metrics`, metricsRoutes);
app.use(`${PREFIX}/admin`, adminRoutes);

// 404 LAST
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// Error handler
/* eslint-disable @typescript-eslint/no-unused-vars */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const code = Number(err?.status || err?.statusCode || 500);
  const body =
    NODE_ENV === "production"
      ? { error: "Internal Server Error" }
      : { error: err?.message || "Internal Server Error", stack: err?.stack };
  res.status(code).json(body);
});
/* eslint-enable @typescript-eslint/no-unused-vars */

export default app;
