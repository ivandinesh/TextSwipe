import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { courseModuleProgress, type CourseModuleProgress } from "../shared/schema";
import { db } from "./db";
import type { Course } from "./courseContent";

const memoryCourseProgress: CourseModuleProgress[] = [];

export async function getUserCourseModuleProgress(userId: string, courseId: string) {
  if (db) {
    return db
      .select()
      .from(courseModuleProgress)
      .where(
        and(
          eq(courseModuleProgress.userId, userId),
          eq(courseModuleProgress.courseId, courseId),
        ),
      );
  }

  return memoryCourseProgress.filter(
    (row) => row.userId === userId && row.courseId === courseId,
  );
}

export async function upsertCourseModuleProgress(input: {
  userId: string;
  courseId: string;
  moduleId: string;
  highestCardIndex: number;
  completedAt?: string | null;
}) {
  const lastViewedAt = new Date().toISOString();

  if (db) {
    const existing = await db
      .select()
      .from(courseModuleProgress)
      .where(
        and(
          eq(courseModuleProgress.userId, input.userId),
          eq(courseModuleProgress.courseId, input.courseId),
          eq(courseModuleProgress.moduleId, input.moduleId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const updated = await db
        .update(courseModuleProgress)
        .set({
          highestCardIndex: Math.max(existing[0].highestCardIndex, input.highestCardIndex),
          completedAt: input.completedAt ?? existing[0].completedAt,
          lastViewedAt,
        })
        .where(eq(courseModuleProgress.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(courseModuleProgress)
      .values({
        userId: input.userId,
        courseId: input.courseId,
        moduleId: input.moduleId,
        highestCardIndex: input.highestCardIndex,
        completedAt: input.completedAt ?? null,
        lastViewedAt,
      })
      .returning();
    return inserted[0];
  }

  const index = memoryCourseProgress.findIndex(
    (row) =>
      row.userId === input.userId &&
      row.courseId === input.courseId &&
      row.moduleId === input.moduleId,
  );

  if (index >= 0) {
    memoryCourseProgress[index] = {
      ...memoryCourseProgress[index],
      highestCardIndex: Math.max(
        memoryCourseProgress[index].highestCardIndex,
        input.highestCardIndex,
      ),
      completedAt: input.completedAt ?? memoryCourseProgress[index].completedAt,
      lastViewedAt,
    };
    return memoryCourseProgress[index];
  }

  const entry: CourseModuleProgress = {
    id: randomUUID(),
    userId: input.userId,
    courseId: input.courseId,
    moduleId: input.moduleId,
    highestCardIndex: input.highestCardIndex,
    completedAt: input.completedAt ?? null,
    lastViewedAt,
    createdAt: lastViewedAt,
  };
  memoryCourseProgress.push(entry);
  return entry;
}

export function buildCourseProgressSummary(course: Course, progressRows: CourseModuleProgress[]) {
  const orderedModules = [...course.modules].sort((a, b) => a.order - b.order);
  const rowsByModule = new Map(progressRows.map((row) => [row.moduleId, row]));
  const completedModulesCount = orderedModules.filter(
    (module) => Boolean(rowsByModule.get(module.id)?.completedAt),
  ).length;
  const lastRow = [...progressRows].sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt))[0];

  const lastModuleIndex = lastRow
    ? Math.max(
        orderedModules.findIndex((module) => module.id === lastRow.moduleId),
        0,
      )
    : 0;

  const highestCompletedIndex = orderedModules.findIndex(
    (module) => !rowsByModule.get(module.id)?.completedAt,
  );

  const nextUnlockedIndex =
    highestCompletedIndex === -1 ? orderedModules.length - 1 : highestCompletedIndex;

  return {
    courseId: course.id,
    completedModulesCount,
    totalModules: orderedModules.length,
    isCompleted: completedModulesCount === orderedModules.length,
    lastModuleIndex,
    lastCardIndex: lastRow?.highestCardIndex ?? 0,
    nextUnlockedIndex,
    modules: orderedModules.map((module, index) => {
      const row = rowsByModule.get(module.id);
      return {
        moduleId: module.id,
        title: module.title,
        summary: module.summary,
        order: module.order,
        highestCardIndex: row?.highestCardIndex ?? 0,
        completedAt: row?.completedAt ?? null,
        isUnlocked: index <= nextUnlockedIndex,
      };
    }),
  };
}

export async function getUserCoursesOverview(userId: string, courses: Course[]) {
  const allProgressRows = db
    ? await db
        .select()
        .from(courseModuleProgress)
        .where(eq(courseModuleProgress.userId, userId))
    : memoryCourseProgress;

  return courses.map((course) => {
    const progressRows = allProgressRows.filter(
      (row) => row.userId === userId && row.courseId === course.id,
    );
    const progress = buildCourseProgressSummary(course, progressRows);

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      description: course.description,
      cover: course.cover,
      metadata: course.metadata,
      progress,
    };
  });
}
