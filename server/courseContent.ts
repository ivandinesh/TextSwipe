import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

const courseCardSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1),
});

const courseModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  order: z.number().int().min(1),
  cards: z.array(courseCardSchema).length(10),
});

const accentSchema = z.enum(["midnight", "aurora", "ember", "petal", "sage"]);

const courseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  cover: z.object({
    eyebrow: z.string().min(1),
    accent: accentSchema,
    art: z.string().optional(),
  }),
  metadata: z.object({
    estimatedMinutes: z.number().int().positive(),
    level: z.string().min(1),
    category: z.string().min(1),
  }),
  modules: z.array(courseModuleSchema).length(6),
});

export type CourseCard = z.infer<typeof courseCardSchema>;
export type CourseModule = z.infer<typeof courseModuleSchema>;
export type Course = z.infer<typeof courseSchema>;

function getCoursesDir() {
  return path.resolve(process.cwd(), "content", "courses");
}

async function readCourseFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const course = courseSchema.parse(parsed);

  const hasSequentialModules = course.modules.every(
    (module, index) => module.order === index + 1,
  );

  if (!hasSequentialModules) {
    throw new Error(`Course ${course.id} must have sequential module order values.`);
  }

  return course;
}

export async function listCourses() {
  const dir = getCoursesDir();
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
  const courses = await Promise.all(
    files.map((file) => readCourseFile(path.join(dir, file.name))),
  );

  return courses.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getCourseById(courseId: string) {
  const courses = await listCourses();
  return courses.find((course) => course.id === courseId || course.slug === courseId);
}

