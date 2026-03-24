import express, { type NextFunction, type Request, type Response } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import url from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { initializeDB } from "./db";
import chatRoutes from "./routes/chats";
import topicRoutes from "./routes/topicRoutes";

// Load environment variables from .env file
const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.error("⚠️ Failed to load environment variables:", dotenvResult.error.message);
}

// Validate required environment variables
const requiredEnvVars = ["NODE_ENV"];
if (process.env.NODE_ENV === "production") {
  requiredEnvVars.push("OPENROUTER_API_KEY", "SESSION_SECRET");
}

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars.join(", "));
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const allowedOrigins = (process.env.APP_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security middleware
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
  })
);

// CORS configuration - restrict to your domain in production
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? allowedOrigins.length > 0
          ? allowedOrigins
          : false
        : true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestPath = req.path;
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (requestPath.startsWith("/api")) {
        let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        log(logLine);
      }
    });
    next();
  },
);
(async () => {
  await initializeDB();
  const server = await registerRoutes(app);
  app.use(topicRoutes);
  app.use(chatRoutes);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // Removed throw err; not needed in error handler
  });
  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("❌ Server error:", err.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      // Don't expose stack traces in production
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // does not interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    // Add SPA fallback for prod
    const publicPath = path.join(__dirname, "../dist/public");
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(publicPath, "index.html"));
    });
  }
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
