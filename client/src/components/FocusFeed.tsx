import { useEffect, useRef, useState } from "react";
import { GraduationCap, LayoutDashboard, LogOut, Shield, Sparkles, Waves } from "lucide-react";
import { useLocation } from "wouter";
import { appCopy } from "@/content/copy";
import { useTopicService } from "@/services/topicService";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "./AuthDialog";
import { LoadingScreen } from "./LoadingScreen";
import { SwipeContainer } from "./SwipeContainer";
import { TopicInput } from "./TopicInput";
import { CoursesTeaser } from "@/pages/Courses";

interface DemoContent {
  [key: string]: string[];
}

interface TopicOption {
  title: string;
  description: string;
}

interface GeneratedContentResponse {
  success: boolean;
  snippets?: string[];
  options?: TopicOption[];
  error?: string;
}

const DEMO_CONTENT: DemoContent = {
  "python basics": [
    "Python is a high-level, interpreted programming language.",
    "It was created by Guido van Rossum and first released in 1991.",
    "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
    "It has a large standard library and extensive third-party support through the Python Package Index (PyPI).",
    "Python's syntax emphasizes readability and uses indentation for code blocks.",
    "It's widely used in web development, data science, machine learning, and automation.",
  ],
  "javascript basics": [
    "JavaScript is a versatile programming language used for web development.",
    "It runs in web browsers and can also be used on servers with Node.js.",
    "JavaScript supports both procedural and object-oriented programming styles.",
    "Modern JavaScript includes features like arrow functions, classes, and modules.",
    "It's essential for creating interactive web pages and web applications.",
    "JavaScript has a large ecosystem with frameworks like React, Vue, and Angular.",
  ],
};

function getUrlState() {
  const params = new URLSearchParams(window.location.search);
  return {
    view: params.get("view"),
    topic: params.get("topic"),
    index: Number.parseInt(params.get("index") || "0", 10) || 0,
  };
}

export function FocusFeed() {
  const [, setLocation] = useLocation();
  const topicService = useTopicService();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<"input" | "loading" | "learning">(
    "input",
  );
  const [currentTopic, setCurrentTopic] = useState("");
  const [learningSnippets, setLearningSnippets] = useState<string[]>([]);
  const [currentOptions, setCurrentOptions] = useState<TopicOption[]>([]);
  const [likedSnippets, setLikedSnippets] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sessionStartRef = useRef<string | null>(null);
  const highestCardSeenRef = useRef(0);

  const updateLearningUrl = (topic: string, index: number) => {
    window.history.pushState(
      { view: "learning", topic, index },
      "",
      `?view=learning&topic=${encodeURIComponent(topic)}&index=${index}`,
    );
  };

  const syncTopicInteraction = async (topic: string, isLiked?: boolean, increment = 1) => {
    if (!user) {
      return;
    }

    try {
      await apiRequest("POST", "/api/dashboard/topic-interactions", {
        topic,
        increment,
        isLiked,
      });
    } catch (error) {
      console.error("Failed to sync topic interaction:", error);
    }
  };

  const flushLearningSession = async () => {
    if (!user || !sessionStartRef.current || !currentTopic) {
      return;
    }

    const startedAt = new Date(sessionStartRef.current);
    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    sessionStartRef.current = null;

    if (durationSeconds < 5) {
      return;
    }

    try {
      await apiRequest("POST", "/api/dashboard/learning-sessions", {
        topic: currentTopic,
        durationSeconds,
        cardsCompleted: Math.max(highestCardSeenRef.current, 1),
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
      });
    } catch (error) {
      console.error("Failed to save learning session:", error);
    }
  };

  const loadTopic = async (topic: string, index = 0) => {
    await flushLearningSession();
    setCurrentTopic(topic);
    setCurrentIndex(index);
    highestCardSeenRef.current = Math.max(index + 1, 1);
    sessionStartRef.current = new Date().toISOString();
    setCurrentView("loading");

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          count: 10,
          generateOptions: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: GeneratedContentResponse = await response.json();
      if (!data.success || !data.snippets) {
        throw new Error(data.error || "Failed to generate content");
      }

      const boundedIndex = Math.min(index, Math.max(data.snippets.length - 1, 0));
      setLearningSnippets(data.snippets);
      setCurrentOptions(data.options ?? []);
      setCurrentIndex(boundedIndex);
      setCurrentView("learning");
      updateLearningUrl(topic, boundedIndex);
      await syncTopicInteraction(topic, undefined, 1);
    } catch (error) {
      console.error("Error loading content:", error);
      setLearningSnippets([
        appCopy.errors.generateFailureCard,
        ...DEMO_CONTENT["python basics"].slice(1),
      ]);
      setCurrentOptions([]);
      setCurrentIndex(0);
      highestCardSeenRef.current = 1;
      setCurrentView("learning");
      updateLearningUrl(topic, 0);
    }
  };

  useEffect(() => {
    const { view, topic, index } = getUrlState();
    if (view === "learning" && topic) {
      void loadTopic(topic, index);
    }
  }, []);

  useEffect(() => {
    if (currentView === "learning") {
      highestCardSeenRef.current = Math.max(highestCardSeenRef.current, currentIndex + 1);
    }
  }, [currentIndex, currentView]);

  useEffect(() => {
    const saved = localStorage.getItem("focusfeed-liked");
    if (!saved) {
      return;
    }

    try {
      setLikedSnippets(JSON.parse(saved));
    } catch (error) {
      console.error("Error loading liked snippets:", error);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!user || !sessionStartRef.current || !currentTopic) {
        return;
      }

      const startedAt = new Date(sessionStartRef.current);
      const endedAt = new Date();
      const durationSeconds = Math.max(
        0,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
      );

      if (durationSeconds < 5) {
        return;
      }

      navigator.sendBeacon(
        "/api/dashboard/learning-sessions",
        new Blob(
          [
            JSON.stringify({
              topic: currentTopic,
              durationSeconds,
              cardsCompleted: Math.max(highestCardSeenRef.current, 1),
              startedAt: startedAt.toISOString(),
              endedAt: endedAt.toISOString(),
            }),
          ],
          { type: "application/json" },
        ),
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentTopic, user]);

  useEffect(() => {
    const handlePopState = () => {
      const { view, topic, index } = getUrlState();
      if (view === "learning" && topic) {
        if (topic === currentTopic && learningSnippets.length > 0) {
          setCurrentView("learning");
          setCurrentIndex(index);
          return;
        }

        void loadTopic(topic, index);
        return;
      }

      setCurrentView("input");
      setCurrentTopic("");
      setLearningSnippets([]);
      setCurrentOptions([]);
      setCurrentIndex(0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentTopic, learningSnippets.length]);

  const handleTopicSubmit = async (topic: string) => {
    await loadTopic(topic, 0);
  };

  const handleBack = () => {
    void flushLearningSession();
    setCurrentView("input");
    setCurrentTopic("");
    setLearningSnippets([]);
    setCurrentOptions([]);
    setCurrentIndex(0);
    window.history.pushState({ view: "input", index: 0 }, "", "?view=input&index=0");
  };

  const handleLike = (content: string) => {
    const isCurrentlyLiked = likedSnippets.includes(content);
    const updatedLiked = isCurrentlyLiked
      ? likedSnippets.filter((snippet) => snippet !== content)
      : [...likedSnippets, content];

    setLikedSnippets(updatedLiked);
    localStorage.setItem("focusfeed-liked", JSON.stringify(updatedLiked));
    topicService.trackTopicLike(currentTopic, !isCurrentlyLiked);
    void syncTopicInteraction(currentTopic, !isCurrentlyLiked, 0);

    if (user) {
      void apiRequest("POST", "/api/dashboard/liked-cards", {
        topic: currentTopic,
        content,
        liked: !isCurrentlyLiked,
      }).catch((error) => {
        console.error("Failed to sync liked card:", error);
      });
    }
  };

  return (
    <div className="editorial-shell neon-grid min-h-screen bg-background">
      {currentView === "input" && (
        <div className="relative min-h-screen overflow-hidden px-5 py-8 md:px-8 md:py-10">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between gap-10">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary/80">
                <Sparkles className="h-3.5 w-3.5" />
                {appCopy.home.badge}
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground md:flex">
                  <Waves className="h-3.5 w-3.5 text-primary" />
                  {appCopy.home.utilityBadge}
                </div>
                {user ? (
                  <>
                    {user.isAdmin && (
                      <Button
                        variant="outline"
                        className="rounded-full border-white/10 bg-white/[0.04] text-foreground"
                        onClick={() => setLocation("/admin")}
                      >
                        <Shield className="h-4 w-4" />
                        {appCopy.home.adminButton}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/[0.04] text-foreground"
                      onClick={() => setLocation("/courses")}
                    >
                      <GraduationCap className="h-4 w-4" />
                      {appCopy.home.coursesButton}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/[0.04] text-foreground"
                      onClick={() => setLocation("/dashboard")}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {appCopy.home.dashboardButton}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/[0.04] text-foreground"
                      onClick={async () => {
                        await logout.mutateAsync();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      {appCopy.home.signOutButton}
                    </Button>
                  </>
                ) : (
                  <AuthDialog />
                )}
              </div>
            </header>

            <section className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-xl">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.34em] text-primary/80">
                  {appCopy.home.heroEyebrow}
                </p>
                <h1 className="text-glow mt-5 max-w-3xl font-display text-5xl font-bold leading-[0.94] text-foreground md:text-7xl">
                  {appCopy.home.heroTitle}
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground md:text-lg">
                  {appCopy.home.heroDescription}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  {appCopy.home.heroChips.map((chip) => (
                    <div key={chip} className="chip-surface rounded-full px-4 py-2 text-sm text-foreground">
                      {chip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-4 top-10 hidden h-28 w-28 rounded-full bg-primary/20 blur-3xl md:block" />
                <div className="absolute -bottom-6 right-0 hidden h-36 w-36 rounded-full bg-secondary/25 blur-3xl md:block" />
                <TopicInput onSubmit={handleTopicSubmit} />
              </div>
            </section>

            {!user && (
              <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <CoursesTeaser />
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.26em] text-primary/80">
                    {appCopy.home.coursesTeaserMeta}
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground">
                    Guided runs are the upgrade.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Drop into structured 60-card courses that feel like a premium scroll lane, then keep your place every time you come back.
                  </p>
                  <div className="mt-5">
                    <AuthDialog triggerLabel={appCopy.home.coursesTeaserCta} />
                  </div>
                </div>
              </section>
            )}

            <footer className="flex flex-col gap-3 border-t border-white/8 pt-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>
                {likedSnippets.length > 0
                  ? appCopy.home.footerSaved(likedSnippets.length)
                  : appCopy.home.footerEmpty}
              </p>
            </footer>
          </div>
        </div>
      )}

      {currentView === "loading" && (
        <LoadingScreen
          message={appCopy.loading.customMessage(currentTopic)}
        />
      )}

      {currentView === "learning" && (
        <SwipeContainer
          snippets={learningSnippets}
          options={currentOptions}
          topic={currentTopic}
          onBack={handleBack}
          onLike={handleLike}
          likedSnippets={likedSnippets}
          currentIndex={currentIndex}
          onIndexChange={(index) => {
            setCurrentIndex(index);
            updateLearningUrl(currentTopic, index);
          }}
          onOptionsChange={setCurrentOptions}
          user={user}
          onOpenAdmin={() => setLocation("/admin")}
          onOpenCourses={() => setLocation("/courses")}
          onOpenDashboard={() => setLocation("/dashboard")}
          onLogout={async () => {
            await logout.mutateAsync();
          }}
        />
      )}
    </div>
  );
}
