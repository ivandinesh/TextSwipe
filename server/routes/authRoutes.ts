import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import {
  createAccount,
  findUserByEmail,
  findUserById,
  createPasswordResetToken,
  getActivePasswordResetTokenByHash,
  invalidatePasswordResetTokensForUser,
  markPasswordResetTokenUsed,
  syncBootstrapAdminStatus,
  updateUserPassword,
} from "../accountStore";
import {
  generateSecureToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from "../auth";
import { getSessionUser } from "../authz";
import { sendPlainPasswordResetEmail, sendWelcomeEmail } from "../mailer";

const router = express.Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128),
});

const resetLinkResponse = {
  success: true,
  message: "If that account exists, a reset link is on the way.",
};

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  message: resetLinkResponse,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many reset attempts. Give it a second." },
});

function buildResetUrl(token: string) {
  const baseUrl = (process.env.APP_BASE_URL || "http://localhost:5000").trim();
  return `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

function getPasswordResetExpiry() {
  const ttlMinutes = Number.parseInt(
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || "60",
    10,
  );

  return new Date(Date.now() + Math.max(ttlMinutes, 5) * 60 * 1000).toISOString();
}

router.get("/api/auth/me", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ user: null });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  });
});

router.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const createdUser = await createAccount({
      email,
      username: email.toLowerCase(),
      password: hashPassword(password),
    });
    const user = await syncBootstrapAdminStatus(createdUser);

    req.session.userId = user.id;
    return req.session.save((sessionError) => {
      if (sessionError) {
        console.error("Registration session save failed:", sessionError);
        return res.status(500).json({ error: "Account created, but sign-in could not be completed." });
      }

      void sendWelcomeEmail(user.email).catch((mailError) => {
        console.error("Welcome email failed:", mailError);
      });

      return res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
        },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Please enter a valid email and password." });
    }

    console.error("Registration failed:", error);
    return res.status(500).json({ error: "Failed to create account." });
  }
});

router.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const existingUser = await findUserByEmail(email);
    const user = existingUser
      ? await syncBootstrapAdminStatus(existingUser)
      : undefined;

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    req.session.userId = user.id;
    return req.session.save((sessionError) => {
      if (sessionError) {
        console.error("Login session save failed:", sessionError);
        return res.status(500).json({ error: "Signed in, but your session could not be saved." });
      }

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
        },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Please enter a valid email and password." });
    }

    console.error("Login failed:", error);
    return res.status(500).json({ error: "Failed to sign in." });
  }
});

router.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error);
      return res.status(500).json({ error: "Failed to sign out." });
    }

    res.clearCookie("focusfeed.sid");
    return res.json({ success: true });
  });
});

router.post("/api/auth/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const existingUser = await findUserByEmail(email);

    if (!existingUser) {
      return res.json(resetLinkResponse);
    }

    const token = generateSecureToken();
    const tokenHash = hashResetToken(token);
    await createPasswordResetToken({
      userId: existingUser.id,
      tokenHash,
      expiresAt: getPasswordResetExpiry(),
    });

    await sendPlainPasswordResetEmail(existingUser.email, buildResetUrl(token));
    return res.json(resetLinkResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.json(resetLinkResponse);
    }

    console.error("Forgot-password flow failed:", error);
    return res.json(resetLinkResponse);
  }
});

router.get("/api/auth/reset-password/validate", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    return res.status(400).json({ valid: false, error: "Missing reset token." });
  }

  const record = await getActivePasswordResetTokenByHash(hashResetToken(token));
  if (!record) {
    return res.status(400).json({ valid: false, error: "That reset link is expired or invalid." });
  }

  return res.json({ valid: true });
});

router.post("/api/auth/reset-password", resetPasswordLimiter, async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const record = await getActivePasswordResetTokenByHash(hashResetToken(token));

    if (!record) {
      return res.status(400).json({ error: "That reset link is expired or invalid." });
    }

    const user = await findUserById(record.userId);
    if (!user) {
      return res.status(400).json({ error: "That reset link is expired or invalid." });
    }

    await updateUserPassword(user.id, hashPassword(password));
    await invalidatePasswordResetTokensForUser(user.id);
    await markPasswordResetTokenUsed(record.id);

    req.session.destroy(() => undefined);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Use a valid reset link and a password with at least 8 characters." });
    }

    console.error("Reset-password flow failed:", error);
    return res.status(500).json({ error: "Couldn't reset your password." });
  }
});

export default router;
