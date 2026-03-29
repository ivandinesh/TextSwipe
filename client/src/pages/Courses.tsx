import { ArrowLeft, Play } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { useAuth } from "@/hooks/use-auth";
import type { CourseData, CourseProgressSummary } from "@/types/courses";

interface CourseOverviewItem extends Omit<CourseData, "modules"> {
  progress: CourseProgressSummary;
}

interface CoursesResponse {
  courses: CourseOverviewItem[];
}

const accentStyles = {
  midnight: {
    gradient: "linear-gradient(135deg, rgba(129,220,255,0.22), rgba(9,15,33,0.96))",
    chip: "rgba(129,220,255,0.24)",
  },
  aurora: {
    gradient: "linear-gradient(135deg, rgba(196,183,255,0.28), rgba(13,18,44,0.96))",
    chip: "rgba(196,183,255,0.24)",
  },
  ember: {
    gradient: "linear-gradient(135deg, rgba(255,196,156,0.28), rgba(34,10,18,0.96))",
    chip: "rgba(255,196,156,0.24)",
  },
  petal: {
    gradient: "linear-gradient(135deg, rgba(255,223,238,0.3), rgba(30,16,31,0.96))",
    chip: "rgba(255,223,238,0.24)",
  },
  sage: {
    gradient: "linear-gradient(135deg, rgba(214,246,225,0.28), rgba(12,23,22,0.96))",
    chip: "rgba(214,246,225,0.24)",
  },
  electric: {
    gradient: "linear-gradient(135deg, rgba(86,162,255,0.3), rgba(15,18,59,0.98))",
    chip: "rgba(86,162,255,0.24)",
  },
} as const;

function getCourseHref(course: CourseOverviewItem) {
  const moduleIndex = course.progress.isCompleted
    ? course.progress.totalModules - 1
    : course.progress.nextUnlockedIndex;
  const module = course.progress.modules[moduleIndex];
  const cardIndex =
    module.completedAt && moduleIndex < course.progress.totalModules - 1
      ? 0
      : module.highestCardIndex;

  return `/courses/${course.slug}?module=${moduleIndex}&card=${cardIndex}`;
}

export default function CoursesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data, error, isLoading } = useQuery<CoursesResponse>({
    queryKey: ["/api/courses"],
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">{appCopy.courses.gateTitle}</h1>
          <p className="mt-3 text-muted-foreground">{appCopy.courses.gateDescription}</p>
          <Button className="mt-6" onClick={() => setLocation("/")}>
            {appCopy.courses.gateCta}
          </Button>
        </div>
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const featured = courses[0];

  return (
    <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2.4rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              className="border-white/10 bg-white/[0.03]"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to feed
            </Button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                {appCopy.courses.heroEyebrow}
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-6xl">
                {appCopy.courses.heroTitle}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                {appCopy.courses.heroDescription}
              </p>
            </div>

            {featured && (
              <div
                className="w-full max-w-md rounded-[2rem] border border-white/10 p-5"
                style={{ background: accentStyles[featured.cover.accent].gradient }}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/80">
                    {featured.cover.eyebrow}
                  </span>
                  <span className="text-sm text-white/75">
                    {featured.progress.completedModulesCount} / {featured.progress.totalModules}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">{featured.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/75">{featured.tagline}</p>
                <Button className="mt-5" onClick={() => setLocation(getCourseHref(featured))}>
                  {featured.progress.completedModulesCount > 0
                    ? appCopy.courses.continueCta
                    : appCopy.courses.startCta}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-muted-foreground backdrop-blur-xl">
              Loading courses...
            </div>
          )}
          {error instanceof Error && (
            <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-100 backdrop-blur-xl md:col-span-2 xl:col-span-3">
              Courses could not load right now: {error.message}
            </div>
          )}
          {!isLoading && !error && courses.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm text-muted-foreground backdrop-blur-xl md:col-span-2 xl:col-span-3">
              No courses are available right now.
            </div>
          )}
          {courses.map((course) => {
            const accent = accentStyles[course.cover.accent];
            const isStarted = course.progress.completedModulesCount > 0;
            const statusLabel = course.progress.isCompleted
              ? appCopy.courses.completedLabel
              : isStarted
                ? appCopy.courses.resumeLabel
                : appCopy.courses.startLabel;

            return (
              <article
                key={course.id}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
              >
                <div className="p-5" style={{ background: accent.gradient }}>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/80">
                      {course.metadata.level}
                    </span>
                    <span className="text-sm text-white/75">{statusLabel}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-white">{course.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/75">{course.description}</p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs"
                      style={{ background: accent.chip }}
                    >
                      {appCopy.courses.modulesLabel(course.progress.totalModules)}
                    </span>
                    <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs">
                      {appCopy.courses.cardsLabel}
                    </span>
                    <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs">
                      {course.metadata.estimatedMinutes} min
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: course.progress.totalModules }).map((_, index) => (
                      <span
                        key={index}
                        className="h-2.5 flex-1 rounded-full"
                        style={{
                          background:
                            index < course.progress.completedModulesCount
                              ? accent.chip
                              : "rgba(255,255,255,0.08)",
                          boxShadow:
                            index < course.progress.completedModulesCount
                              ? `0 0 12px ${accent.chip}`
                              : "none",
                        }}
                      />
                    ))}
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Next up
                    </p>
                    <p className="mt-2 font-medium">
                      {
                        course.progress.modules[
                          Math.min(
                            course.progress.nextUnlockedIndex,
                            course.progress.totalModules - 1,
                          )
                        ]?.title
                      }
                    </p>
                  </div>

                  <Button className="w-full" onClick={() => setLocation(getCourseHref(course))}>
                    <Play className="mr-2 h-4 w-4" />
                    {course.progress.isCompleted
                      ? appCopy.courses.replayCta
                      : isStarted
                        ? appCopy.courses.continueCta
                        : appCopy.courses.startCta}
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
