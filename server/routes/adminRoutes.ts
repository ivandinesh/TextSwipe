import express from "express";
import { z } from "zod";
import {
  getAdminContentSnapshot,
  getAdminOverview,
  getAdminUsersSnapshot,
  recordAdminAuditEvent,
  updateUserAdminStatus,
} from "../accountStore";
import { requireAdmin } from "../authz";

const router = express.Router();

const updateAdminSchema = z.object({
  isAdmin: z.boolean(),
});

router.get("/api/admin/overview", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.overview.view",
    targetType: "dashboard",
    details: "Viewed admin overview",
  });

  const overview = await getAdminOverview();
  res.json(overview);
});

router.get("/api/admin/content", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.content.view",
    targetType: "content",
    details: "Viewed admin content snapshot",
  });

  const snapshot = await getAdminContentSnapshot();
  res.json(snapshot);
});

router.get("/api/admin/users", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.users.view",
    targetType: "user",
    details: "Viewed admin user snapshot",
  });

  const users = await getAdminUsersSnapshot();
  res.json({ users });
});

router.patch("/api/admin/users/:id/admin", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const payload = updateAdminSchema.parse(req.body);
  if (admin.id === req.params.id && !payload.isAdmin) {
    return res.status(400).json({ error: "You can't remove your own admin access here." });
  }

  const updatedUser = await updateUserAdminStatus(req.params.id, payload.isAdmin);
  if (!updatedUser) {
    return res.status(404).json({ error: "User not found." });
  }

  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: payload.isAdmin ? "admin.user.promote" : "admin.user.demote",
    targetType: "user",
    targetId: updatedUser.id,
    details: `Set admin access to ${payload.isAdmin} for ${updatedUser.email}`,
  });

  res.json({
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt,
    },
  });
});

export default router;

