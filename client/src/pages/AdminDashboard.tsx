import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface AdminOverviewResponse {
  totals: {
    users: number;
    admins: number;
    sessions: number;
    savedHits: number;
    activeToday: number;
  };
  topTopics: { topic: string; score: number }[];
  recentAudit: {
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
  }[];
}

interface AdminContentResponse {
  totals: {
    sessions: number;
    topicSignals: number;
    savedHits: number;
    chats: number;
    generatedCards: number;
  };
  recentSessions: {
    id: string;
    topic: string;
    endedAt: string;
    cardsCompleted: number;
  }[];
  hotTopics: { topic: string; score: number }[];
  recentGeneratedCards: {
    id: string;
    topic: string;
    content: string;
    createdAt: string;
  }[];
}

interface AdminUsersResponse {
  users: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    createdAt: string;
    sessionCount: number;
    savedHits: number;
    cardsCompleted: number;
    currentStreak: number;
    lastSeenAt: string;
  }[];
}

type AdminSection = "overview" | "content" | "users";

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function extractCardPreview(content: string) {
  try {
    const parsed = JSON.parse(content) as { content?: string };
    return parsed.content ?? content;
  } catch {
    return content;
  }
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [section, setSection] = useState<AdminSection>("overview");

  const overviewQuery = useQuery<AdminOverviewResponse>({
    queryKey: ["/api/admin/overview"],
    enabled: Boolean(user?.isAdmin),
  });

  const contentQuery = useQuery<AdminContentResponse>({
    queryKey: ["/api/admin/content"],
    enabled: Boolean(user?.isAdmin),
  });

  const usersQuery = useQuery<AdminUsersResponse>({
    queryKey: ["/api/admin/users"],
    enabled: Boolean(user?.isAdmin),
  });

  const accessDenied =
    overviewQuery.error instanceof Error &&
    /forbidden|unauthorized/i.test(overviewQuery.error.message);

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/admin`, {
        isAdmin,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    },
  });

  if (!user) {
    return (
      <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">{appCopy.admin.signedOutTitle}</h1>
          <p className="mt-3 text-muted-foreground">{appCopy.admin.signedOutDescription}</p>
          <Button className="mt-6" onClick={() => setLocation("/")}>
            {appCopy.admin.signedOutCta}
          </Button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">{appCopy.admin.forbiddenTitle}</h1>
          <p className="mt-3 text-muted-foreground">{appCopy.admin.forbiddenDescription}</p>
          <Button className="mt-6" onClick={() => setLocation("/")}>
            {appCopy.admin.backCta}
          </Button>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <h1 className="text-3xl font-semibold">{appCopy.admin.forbiddenTitle}</h1>
          <p className="mt-3 text-muted-foreground">{appCopy.admin.forbiddenDescription}</p>
          <Button className="mt-6" onClick={() => setLocation("/")}>
            {appCopy.admin.backCta}
          </Button>
        </div>
      </div>
    );
  }

  const overview = overviewQuery.data;
  const content = contentQuery.data;
  const users = usersQuery.data?.users ?? [];

  return (
    <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
              {appCopy.admin.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{appCopy.admin.title}</h1>
            <p className="mt-2 text-muted-foreground">{appCopy.admin.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              {appCopy.home.dashboardButton}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")}>
              {appCopy.admin.backCta}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["overview", appCopy.admin.sections.overview],
              ["content", appCopy.admin.sections.content],
              ["users", appCopy.admin.sections.users],
            ] as [AdminSection, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className="rounded-full border px-4 py-2 text-sm transition"
              style={{
                borderColor: section === id ? "rgba(58,227,255,0.4)" : "rgba(255,255,255,0.1)",
                background: section === id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {section === "overview" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                [appCopy.admin.metrics.totalUsers, overview?.totals.users ?? 0],
                [appCopy.admin.metrics.adminUsers, overview?.totals.admins ?? 0],
                [appCopy.admin.metrics.runsToday, overview?.totals.activeToday ?? 0],
                [appCopy.admin.metrics.savedHits, overview?.totals.savedHits ?? 0],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <h2 className="text-xl font-semibold">{appCopy.admin.topTopics}</h2>
                <div className="mt-4 space-y-3">
                  {(overview?.topTopics ?? []).map((topic) => (
                    <div
                      key={topic.topic}
                      className="flex items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <span>{topic.topic}</span>
                      <span className="text-sm text-muted-foreground">{topic.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <h2 className="text-xl font-semibold">{appCopy.admin.recentAudit}</h2>
                <div className="mt-4 space-y-3">
                  {(overview?.recentAudit ?? []).length > 0 ? (
                    overview?.recentAudit.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.details || formatTime(entry.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{appCopy.admin.noAudit}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "content" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                [appCopy.admin.metrics.contentRuns, content?.totals.sessions ?? 0],
                [appCopy.admin.metrics.savedHits, content?.totals.savedHits ?? 0],
                [appCopy.admin.metrics.generatedCards, content?.totals.generatedCards ?? 0],
                ["Chats", content?.totals.chats ?? 0],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <h2 className="text-xl font-semibold">{appCopy.admin.recentSessions}</h2>
                <div className="mt-4 space-y-3">
                  {(content?.recentSessions ?? []).map((session) => (
                    <div
                      key={session.id}
                      className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium">{session.topic}</span>
                        <span className="text-sm text-muted-foreground">
                          {session.cardsCompleted} cards
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatTime(session.endedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                  <h2 className="text-xl font-semibold">{appCopy.admin.hotTopics}</h2>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {(content?.hotTopics ?? []).map((topic) => (
                      <div
                        key={topic.topic}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm"
                      >
                        {topic.topic} <span className="text-muted-foreground">({topic.score})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                  <h2 className="text-xl font-semibold">{appCopy.admin.recentCards}</h2>
                  <div className="mt-4 space-y-3">
                    {(content?.recentGeneratedCards ?? []).length ? (
                      content?.recentGeneratedCards.map((card) => (
                        <div
                          key={card.id}
                          className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
                            {card.topic}
                          </p>
                          <p className="mt-2 text-sm text-foreground/90">
                            {extractCardPreview(card.content)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{appCopy.admin.noCards}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "users" && (
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">{appCopy.admin.usersTitle}</h2>
            <div className="mt-4 grid gap-3">
              {users.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.email}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.sessionCount} runs • {entry.savedHits} saved • {entry.cardsCompleted} cards • streak {entry.currentStreak}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last seen {formatTime(entry.lastSeenAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={toggleAdminMutation.isPending}
                    onClick={() =>
                      toggleAdminMutation.mutate({
                        userId: entry.id,
                        isAdmin: !entry.isAdmin,
                      })
                    }
                  >
                    {entry.isAdmin ? appCopy.admin.removeAdmin : appCopy.admin.makeAdmin}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
