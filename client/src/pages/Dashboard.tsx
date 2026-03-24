import { useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

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

  const maxWeeklyMinutes = useMemo(
    () => Math.max(...(summary?.weeklyMinutes.map((item) => item.minutes) ?? [1])),
    [summary],
  );

  if (!user) {
    return (
      <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">Sign in to view your dashboard.</h1>
          <p className="mt-3 text-muted-foreground">
            Your learning time, streaks, likes, and recommendations will show up here.
          </p>
          <Button className="mt-6" onClick={() => setLocation("/")}>
            Back to FocusFeed
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
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome back, {user.email}</h1>
            <p className="mt-2 text-muted-foreground">
              Keep the rhythm going with one more focused session today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Continue learning
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await logout.mutateAsync();
                setLocation("/");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Learning minutes", value: summary?.totalLearningMinutes ?? 0 },
            { label: "Current streak", value: `${summary?.currentStreak ?? 0} days` },
            { label: "Sessions this week", value: summary?.sessionsThisWeek ?? 0 },
            { label: "Cards completed", value: summary?.cardsCompleted ?? 0 },
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
              <h2 className="text-xl font-semibold">This week</h2>
              <p className="text-sm text-muted-foreground">
                {summary?.likedCardsCount ?? 0} liked cards saved
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
              <h2 className="text-xl font-semibold">Recommended topics</h2>
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
              <h2 className="text-xl font-semibold">Recent topics</h2>
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
          <h2 className="text-xl font-semibold">Liked cards</h2>
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
                Like cards while you learn and they’ll appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
