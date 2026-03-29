import { useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { useAuth } from "@/hooks/use-auth";
import type { CourseProgressSummary } from "@/types/courses";

interface DashboardSummary {
  totalLearningMinutes: number;
  currentStreak: number;
  sessionsThisWeek: number;
  cardsCompleted: number;
  likedCardsCount: number;
  weeklyMinutes: { day: string; minutes: number }[];
  recentTopics: string[];
}

interface LikedCardsResponse {
  likedCards: { id: string; topic: string; content: string; createdAt: string }[];
}

interface RecommendedTopicsResponse {
  topics: string[];
}

interface DashboardCoursesResponse {
  courses: Array<{
    id: string;
    slug: string;
    title: string;
    tagline: string;
    progress: CourseProgressSummary;
  }>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
    enabled: Boolean(user),
  });
  const { data: likedCards } = useQuery<LikedCardsResponse>({
    queryKey: ["/api/dashboard/liked-cards"],
    enabled: Boolean(user),
  });
  const { data: recommendedTopics } = useQuery<RecommendedTopicsResponse>({
    queryKey: ["/api/dashboard/recommended-topics"],
    enabled: Boolean(user),
  });
  const { data: courses } = useQuery<DashboardCoursesResponse>({
    queryKey: ["/api/courses"],
    enabled: Boolean(user),
  });

  const maxWeeklyMinutes = useMemo(
    () => Math.max(...(summary?.weeklyMinutes.map((item) => item.minutes) ?? [1])),
    [summary],
  );
  const activeCourse = useMemo(
    () =>
      (courses?.courses ?? []).find((course) => !course.progress.isCompleted) ??
      (courses?.courses ?? [])[0],
    [courses],
  );

  if (!user) {
    return (
      <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">{appCopy.dashboard.signedOutTitle}</h1>
          <p className="mt-3 text-muted-foreground">
            {appCopy.dashboard.signedOutDescription}
          </p>
          <Button className="mt-6" onClick={() => setLocation("/")}>
            {appCopy.dashboard.signedOutCta}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
              {appCopy.dashboard.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{appCopy.dashboard.title(user.email)}</h1>
            <p className="mt-2 text-muted-foreground">
              {appCopy.dashboard.description}
            </p>
          </div>
          <div className="flex gap-3">
            {user.isAdmin && (
              <Button variant="outline" onClick={() => setLocation("/admin")}>
                {appCopy.dashboard.adminCta}
              </Button>
            )}
            <Button variant="outline" onClick={() => setLocation("/")}>
              {appCopy.dashboard.primaryCta}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              await logout.mutateAsync();
              setLocation("/");
            }}
          >
            {appCopy.dashboard.signOutCta}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: appCopy.dashboard.metrics.totalMinutes, value: summary?.totalLearningMinutes ?? 0 },
            { label: appCopy.dashboard.metrics.currentStreak, value: `${summary?.currentStreak ?? 0} days` },
            { label: appCopy.dashboard.metrics.sessionsThisWeek, value: summary?.sessionsThisWeek ?? 0 },
            { label: appCopy.dashboard.metrics.cardsCompleted, value: summary?.cardsCompleted ?? 0 },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{appCopy.dashboard.weekTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {appCopy.dashboard.likedSaved(summary?.likedCardsCount ?? 0)}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-7 gap-3">
              {(summary?.weeklyMinutes ?? []).map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-3">
                  <div className="flex h-36 items-end">
                    <div
                      className="w-8 rounded-full bg-primary/80"
                      style={{
                        height: `${Math.max((item.minutes / Math.max(maxWeeklyMinutes, 1)) * 100, 10)}%`,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{item.day}</p>
                    <p className="text-sm font-medium">{item.minutes}m</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{appCopy.dashboard.coursesTitle}</h2>
                <Button variant="outline" onClick={() => setLocation("/courses")}>
                  {appCopy.home.coursesButton}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {appCopy.dashboard.coursesDescription}
              </p>
              {activeCourse ? (
                <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{activeCourse.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activeCourse.progress.completedModulesCount} / {activeCourse.progress.totalModules} modules cleared
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setLocation(
                          `/courses/${activeCourse.slug}?module=${activeCourse.progress.nextUnlockedIndex}&card=${activeCourse.progress.modules[activeCourse.progress.nextUnlockedIndex]?.highestCardIndex ?? 0}`,
                        )
                      }
                    >
                      {appCopy.dashboard.coursesContinue}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Courses will land here once you start one.</p>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold">{appCopy.dashboard.recommendedTitle}</h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {(recommendedTopics?.topics ?? []).map((topic) => (
                  <button
                    key={topic}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-foreground"
                    onClick={() =>
                      setLocation(`/?view=learning&topic=${encodeURIComponent(topic)}&index=0`)
                    }
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold">{appCopy.dashboard.recentTitle}</h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {(summary?.recentTopics ?? []).map((topic) => (
                  <div
                    key={topic}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground"
                  >
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">{appCopy.dashboard.likedTitle}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(likedCards?.likedCards ?? []).slice(0, 8).map((card) => (
              <div
                key={card.id}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  {card.topic}
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground/90">{card.content}</p>
              </div>
            ))}
            {(!likedCards?.likedCards || likedCards.likedCards.length === 0) && (
              <p className="text-sm text-muted-foreground">
                {appCopy.dashboard.likedEmpty}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
