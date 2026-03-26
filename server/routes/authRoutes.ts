import express from "express";
import { z } from "zod";
import {
  createAccount,
  findUserByEmail,
  syncBootstrapAdminStatus,
} from "../accountStore";
import { hashPassword, verifyPassword } from "../auth";
import { getSessionUser } from "../authz";

const router = express.Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

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

export default router;
