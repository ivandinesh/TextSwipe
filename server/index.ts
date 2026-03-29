import express, { type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import url from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import MemoryStoreFactory from "memorystore";
import { getPool, initializeDB } from "./db";
import chatRoutes from "./routes/chatsRuntime";
import topicRoutes from "./routes/topicRoutesRuntime";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import courseRoutes from "./routes/courseRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { PostgresSessionStore } from "./sessionStore";

function isSecureCookieEnabled() {
  const override = process.env.SESSION_COOKIE_SECURE;
  if (override === "true") {
    return true;
  }
  if (override === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.error("Failed to load environment variables:", dotenvResult.error.message);
}

const requiredEnvVars = ["NODE_ENV"];
if (process.env.NODE_ENV === "production") {
  requiredEnvVars.push("OPENROUTER_API_KEY", "SESSION_SECRET");
}

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("Missing required environment variables:", missingVars.join(", "));
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const MemoryStore = MemoryStoreFactory(session);
const allowedOrigins = (process.env.APP_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  }),
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? allowedOrigins.length > 0
          ? allowedOrigins
          : false
        : true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const start = Date.now();
  const requestPath = req.path;

  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      log(
        JSON.stringify({
          requestId,
          method: req.method,
          path: requestPath,
          statusCode: res.statusCode,
          durationMs: duration,
          ip: req.ip,
        }),
        "api",
      );
    }
  });

  next();
});

(async () => {
  await initializeDB();
  const pool = getPool();
  const sessionStore =
    process.env.NODE_ENV === "production" && pool
      ? new PostgresSessionStore(pool)
      : new MemoryStore({
          checkPeriod: 1000 * 60 * 60 * 24,
        });

  app.use(
    session({
      name: "focusfeed.sid",
      secret: process.env.SESSION_SECRET || "focusfeed-dev-secret",
      resave: false,
      saveUninitialized: false,
      proxy: process.env.NODE_ENV === "production",
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecureCookieEnabled(),
        maxAge: 1000 * 60 * 60 * 24 * 30,
      },
      store: sessionStore,
    }),
  );

  const server = await registerRoutes(app);
  app.use(authRoutes);
  app.use(adminRoutes);
  app.use(courseRoutes);
  app.use(dashboardRoutes);
  app.use(topicRoutes);
  app.use(chatRoutes);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server error:", err);
    res.status(status).json({
      success: false,
      error: status >= 500 ? "Internal server error" : message,
      ...(process.env.NODE_ENV === "development" && err?.stack
        ? { stack: err.stack }
        : {}),
    });
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    const publicPath = path.join(__dirname, "../dist/public");
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(publicPath, "index.html"));
    });
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
