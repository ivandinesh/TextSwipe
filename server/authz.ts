import type express from "express";
import { findUserById, syncBootstrapAdminStatus } from "./accountStore";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export type SessionUser = Awaited<ReturnType<typeof findUserById>>;

export async function getSessionUser(
  req: express.Request,
): Promise<SessionUser | null> {
  if (!req.session.userId) {
    return null;
  }

  const user = await findUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => undefined);
    return null;
  }

  return syncBootstrapAdminStatus(user);
}

export async function requireAuth(
  req: express.Request,
  res: express.Response,
) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return user;
}

export async function requireAdmin(
  req: express.Request,
  res: express.Response,
) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (!user.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return user;
}

