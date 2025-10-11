// backend/src/app.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

// === Routers ===
import authRoutes from "./auth/routes";
import ownerRoutes from "./owner/routes";
import vetRoutes from "./vet/routes";
import apptRoutes from "./appt/routes";
import petRoutes from "./pet/routes";          // ⬅️ ADD
import metricsRoutes from "./metrics/routes";  // ⬅️ ADD

const app = express();

const NODE_ENV = process.env.NODE_ENV ?? "development";
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/+$/, "");
const APP_URL = (process.env.APP_URL ?? "http://localhost:4000").replace(/\/+$/, "");

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
    `connect-src 'self' ${FRONTEND_URL} ${APP_URL} ${APP_URL}/api`,
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

// Health/root
app.get("/", (_req, res) => res.status(200).json({ ok: true, env: NODE_ENV }));
app.get("/ping", (_req, res) => res.json({ ok: true, pong: new Date().toISOString() }));
app.get("/api/ping", (_req, res) => res.json({ ok: true, pong: new Date().toISOString() }));

// === API Mounts (keep BEFORE 404) ===
app.use("/api/auth", authRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/vets", vetRoutes);
app.use("/api/appts", apptRoutes);
app.use("/api/pets", petRoutes);          // ⬅️ ADD
app.use("/api/metrics", metricsRoutes);   // ⬅️ ADD

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
