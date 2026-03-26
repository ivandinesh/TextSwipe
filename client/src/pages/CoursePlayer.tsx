import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CourseModuleDots } from "@/components/CourseModuleDots";
import { appCopy } from "@/content/copy";
import { useAuth } from "@/hooks/use-auth";
import { getCardTextSizeTier } from "@/lib/cardText";
import { apiRequest } from "@/lib/queryClient";
import type { CourseData, CourseProgressSummary } from "@/types/courses";

interface CourseResponse {
  course: CourseData;
  progress: CourseProgressSummary;
}

const accentStyles = {
  midnight: {
    surface:
      "bg-[radial-gradient(circle_at_top,rgba(129,220,255,0.18),transparent_26%),linear-gradient(180deg,rgba(11,15,34,0.98),rgba(6,10,24,1))]",
    shell: "rgba(8, 12, 28, 0.88)",
    panel: "linear-gradient(180deg, rgba(20, 28, 64, 0.94), rgba(10, 15, 38, 0.88))",
    accent: "#3AE3FF",
    glow: "rgba(58,227,255,0.72)",
    border: "rgba(147, 186, 255, 0.26)",
    text: "#FCFDFF",
    muted: "#B8C4E4",
  },
  aurora: {
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(166,239,255,0.2),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(222,178,255,0.24),transparent_28%),linear-gradient(180deg,rgba(20,21,50,0.98),rgba(10,11,34,1))]",
    shell: "rgba(18, 19, 47, 0.88)",
    panel: "linear-gradient(180deg, rgba(39, 31, 83, 0.92), rgba(18, 20, 48, 0.88))",
    accent: "#C6B7FF",
    glow: "rgba(198,183,255,0.7)",
    border: "rgba(204, 178, 255, 0.28)",
    text: "#FFF9FF",
    muted: "#CBC2EA",
  },
  ember: {
    surface:
      "bg-[radial-gradient(circle_at_top_right,rgba(255,196,156,0.2),transparent_24%),linear-gradient(180deg,rgba(31,16,28,0.98),rgba(14,9,18,1))]",
    shell: "rgba(31, 16, 28, 0.88)",
    panel: "linear-gradient(180deg, rgba(54, 28, 40, 0.92), rgba(24, 12, 21, 0.88))",
    accent: "#FFC49C",
    glow: "rgba(255,196,156,0.68)",
    border: "rgba(255, 201, 174, 0.24)",
    text: "#FFF8F7",
    muted: "#E1BDC5",
  },
  petal: {
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(255,223,238,0.24),transparent_24%),linear-gradient(180deg,rgba(38,24,40,0.98),rgba(20,14,24,1))]",
    shell: "rgba(38, 24, 40, 0.88)",
    panel: "linear-gradient(180deg, rgba(80, 48, 79, 0.88), rgba(39, 24, 41, 0.88))",
    accent: "#FFD7EC",
    glow: "rgba(255,223,238,0.72)",
    border: "rgba(255, 220, 236, 0.28)",
    text: "#FFF9FC",
    muted: "#E9C8D9",
  },
  sage: {
    surface:
      "bg-[radial-gradient(circle_at_top,rgba(214,246,225,0.22),transparent_24%),linear-gradient(180deg,rgba(22,35,35,0.98),rgba(12,20,20,1))]",
    shell: "rgba(22, 35, 35, 0.88)",
    panel: "linear-gradient(180deg, rgba(37, 62, 58, 0.88), rgba(18, 31, 31, 0.88))",
    accent: "#D6FFF1",
    glow: "rgba(214,246,225,0.7)",
    border: "rgba(210, 245, 225, 0.24)",
    text: "#F8FFFB",
    muted: "#C5DED5",
  },
} as const;

export default function CoursePlayerPage() {
  const [, params] = useRoute("/courses/:courseId");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [moduleIndex, setModuleIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const { data } = useQuery<CourseResponse>({
    queryKey: [`/api/courses/${params?.courseId ?? ""}`],
    enabled: Boolean(user && params?.courseId),
  });

  useEffect(() => {
    if (!data || hydrated) {
      return;
    }

    const search = new URLSearchParams(window.location.search);
    const initialModule = Number.parseInt(search.get("module") || "", 10);
    const initialCard = Number.parseInt(search.get("card") || "", 10);
    const requestedModule = Number.isFinite(initialModule)
      ? Math.min(Math.max(initialModule, 0), data.course.modules.length - 1)
      : data.progress.isCompleted
        ? data.progress.totalModules - 1
        : data.progress.nextUnlockedIndex;
    const safeModule =
      !data.progress.isCompleted &&
      !data.progress.modules[requestedModule]?.isUnlocked
        ? data.progress.nextUnlockedIndex
        : requestedModule;
    const safeCard = Number.isFinite(initialCard)
      ? Math.min(Math.max(initialCard, 0), 9)
      : data.progress.modules[safeModule]?.highestCardIndex ?? 0;

    setModuleIndex(safeModule);
    setCardIndex(safeCard);
    setHydrated(true);
  }, [data, hydrated]);

  const progressMutation = useMutation({
    mutationFn: async (payload: { moduleId: string; highestCardIndex: number; completed?: boolean }) => {
      const response = await apiRequest(
        "POST",
        `/api/courses/${params?.courseId}/progress`,
        payload,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${params?.courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
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

  if (!data) {
    return (
      <div className="editorial-shell neon-grid flex min-h-screen items-center justify-center bg-background text-foreground">
        Loading course...
      </div>
    );
  }

  const course = data.course;
  const progress = data.progress;
  const accent = accentStyles[course.cover.accent];
  const module = course.modules[moduleIndex];
  const isModuleCompleted = cardIndex >= module.cards.length;
  const isCourseCompleted = progress.isCompleted && moduleIndex === course.modules.length - 1 && isModuleCompleted;

  const syncProgress = async (nextCardIndex: number, completed = false) => {
    await progressMutation.mutateAsync({
      moduleId: module.id,
      highestCardIndex: Math.min(nextCardIndex, 9),
      completed,
    });
  };

  const activeCard = module.cards[Math.min(cardIndex, module.cards.length - 1)];
  const sizeTier = getCardTextSizeTier(activeCard.content);

  return (
    <div className={`min-h-screen ${accent.surface} px-5 py-6 text-white md:px-8`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header
          className="rounded-[1.8rem] border px-5 py-4 backdrop-blur-xl"
          style={{ background: accent.shell, borderColor: accent.border }}
        >
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
              onClick={() => setLocation("/courses")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.26em]" style={{ color: accent.muted }}>
                {course.title}
              </p>
              <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{module.title}</h1>
              <p className="mt-2 max-w-2xl text-sm md:text-base" style={{ color: accent.muted }}>
                {module.summary}
              </p>
            </div>
            <div className="hidden rounded-full border px-3 py-1 text-xs md:block" style={{ borderColor: accent.border }}>
              {appCopy.courses.moduleLabel(moduleIndex + 1, course.modules.length)}
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 flex-col justify-center py-6">
          <div className="mx-auto w-full max-w-3xl">
            <div
              className="rounded-[2.4rem] border p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-12"
              style={{ background: accent.panel, borderColor: accent.border }}
            >
              {isModuleCompleted ? (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `${accent.accent}22` }}>
                    <CheckCircle2 className="h-8 w-8" style={{ color: accent.accent }} />
                  </div>
                  <h2 className="font-display text-3xl font-bold">
                    {isCourseCompleted
                      ? appCopy.courses.finishedCourseTitle
                      : appCopy.courses.completionTitle}
                  </h2>
                  <p className="mx-auto max-w-xl text-base leading-7" style={{ color: accent.muted }}>
                    {isCourseCompleted
                      ? appCopy.courses.finishedCourseDescription
                      : appCopy.courses.completionDescription}
                  </p>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    {!isCourseCompleted && (
                      <Button
                        onClick={async () => {
                          const nextModuleIndex = Math.min(moduleIndex + 1, course.modules.length - 1);
                          setModuleIndex(nextModuleIndex);
                          setCardIndex(0);
                        }}
                      >
                        {appCopy.courses.nextModuleCta}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setLocation("/courses")}>
                      {appCopy.courses.libraryCta}
                    </Button>
                    {isCourseCompleted && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setModuleIndex(0);
                          setCardIndex(0);
                        }}
                      >
                        {appCopy.courses.replayCta}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]" style={{ background: `${accent.accent}22`, color: accent.text }}>
                      {appCopy.courses.moduleLabel(moduleIndex + 1, course.modules.length)}
                    </span>
                    <span className="text-sm" style={{ color: accent.muted }}>
                      Card {cardIndex + 1} / {module.cards.length}
                    </span>
                  </div>
                  <div className="min-h-[240px] md:min-h-[300px]">
                    <p
                      className={
                        sizeTier === "short"
                          ? "text-[1.95rem] leading-[1.58] md:text-[3rem] md:leading-[1.68]"
                          : sizeTier === "medium"
                            ? "text-[1.82rem] leading-[1.62] md:text-[2.65rem] md:leading-[1.7]"
                            : sizeTier === "long"
                              ? "text-[1.64rem] leading-[1.68] md:text-[2.25rem] md:leading-[1.74]"
                              : "text-[1.48rem] leading-[1.74] md:text-[1.95rem] md:leading-[1.78]"
                      }
                    >
                      {activeCard.content}
                    </p>
                  </div>
                  <div className="mt-8 flex justify-between gap-3">
                    <Button
                      variant="outline"
                      disabled={cardIndex === 0}
                      onClick={() => setCardIndex((value) => Math.max(value - 1, 0))}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={async () => {
                        const nextIndex = cardIndex + 1;
                        const completed = nextIndex >= module.cards.length;
                        await syncProgress(nextIndex, completed);
                        setCardIndex(nextIndex);
                      }}
                    >
                      {cardIndex === module.cards.length - 1 ? appCopy.courses.nextModuleCta : "Next card"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <footer
          className="rounded-[1.8rem] border px-5 py-4 backdrop-blur-xl"
          style={{ background: accent.shell, borderColor: accent.border }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm" style={{ color: accent.muted }}>
              <span>{module.title}</span>
              <span>{course.metadata.category}</span>
            </div>
            <CourseModuleDots
              currentIndex={Math.min(cardIndex, 9)}
              total={10}
              accent={{
                surface: accent.accent,
                glow: accent.glow,
                border: accent.border,
                muted: accent.muted,
              }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
