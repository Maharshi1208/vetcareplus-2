// backend/src/server.ts
import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve the repo root .env by default; .env.test in test runs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnv = path.resolve(__dirname, "../../.env");
const testEnv = path.resolve(__dirname, "../../.env.test");

loadEnv({
  path: process.env.NODE_ENV === "test" ? testEnv : rootEnv,
});

// Import the Express app (expects env already loaded)
import app from "./app"; // <-- no .js

const port = Number(process.env.PORT || 4000);

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

export default server;
