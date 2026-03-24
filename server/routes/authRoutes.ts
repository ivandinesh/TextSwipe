import express from "express";
import { z } from "zod";
import { createAccount, findUserByEmail, findUserById } from "../accountStore";
import { hashPassword, verifyPassword } from "../auth";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const router = express.Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

router.get("/api/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ user: null });
  }

  const user = await findUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => undefined);
    return res.status(401).json({ user: null });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
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

    const user = await createAccount({
      email,
      username: email.toLowerCase(),
      password: hashPassword(password),
    });

    req.session.userId = user.id;

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
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
    const user = await findUserByEmail(email);

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    req.session.userId = user.id;

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
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

export default router;
