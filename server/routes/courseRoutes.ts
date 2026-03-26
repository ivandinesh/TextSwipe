import express from "express";
import { z } from "zod";
import { requireAuth } from "../authz";
import { getCourseById, listCourses } from "../courseContent";
import {
  buildCourseProgressSummary,
  getUserCourseModuleProgress,
  getUserCoursesOverview,
  upsertCourseModuleProgress,
} from "../courseStore";

const router = express.Router();

const progressSchema = z.object({
  moduleId: z.string().min(1),
  highestCardIndex: z.number().int().min(0).max(9),
  completed: z.boolean().optional(),
});

router.get("/api/courses", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const courses = await listCourses();
  const overview = await getUserCoursesOverview(user.id, courses);
  res.json({ courses: overview });
});

router.get("/api/courses/:courseId", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const course = await getCourseById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  const progressRows = await getUserCourseModuleProgress(user.id, course.id);
  const progress = buildCourseProgressSummary(course, progressRows);
  res.json({ course, progress });
});

router.post("/api/courses/:courseId/progress", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const course = await getCourseById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  const payload = progressSchema.parse(req.body);
  const module = course.modules.find((item) => item.id === payload.moduleId);
  if (!module) {
    return res.status(400).json({ error: "Module not found." });
  }

  await upsertCourseModuleProgress({
    userId: user.id,
    courseId: course.id,
    moduleId: module.id,
    highestCardIndex: payload.highestCardIndex,
    completedAt: payload.completed ? new Date().toISOString() : null,
  });

  const progressRows = await getUserCourseModuleProgress(user.id, course.id);
  const progress = buildCourseProgressSummary(course, progressRows);
  res.status(201).json({ success: true, progress });
});

export default router;

