import { useEffect, useState } from "react";
import { Sparkles, Waves } from "lucide-react";
import { useTopicService } from "@/services/topicService";
import { LoadingScreen } from "./LoadingScreen";
import { SwipeContainer } from "./SwipeContainer";
import { TopicInput } from "./TopicInput";

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
  const topicService = useTopicService();
  const [currentView, setCurrentView] = useState<"input" | "loading" | "learning">(
    "input",
  );
  const [currentTopic, setCurrentTopic] = useState("");
  const [learningSnippets, setLearningSnippets] = useState<string[]>([]);
  const [currentOptions, setCurrentOptions] = useState<TopicOption[]>([]);
  const [likedSnippets, setLikedSnippets] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateLearningUrl = (topic: string, index: number) => {
    window.history.pushState(
      { view: "learning", topic, index },
      "",
      `?view=learning&topic=${encodeURIComponent(topic)}&index=${index}`,
    );
  };

  const loadTopic = async (topic: string, index = 0) => {
    setCurrentTopic(topic);
    setCurrentIndex(index);
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
    } catch (error) {
      console.error("Error loading content:", error);
      setLearningSnippets([
        "Could not generate content. Please check your connection and try again.",
        ...DEMO_CONTENT["python basics"].slice(1),
      ]);
      setCurrentOptions([]);
      setCurrentIndex(0);
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
    setCurrentView("input");
    setCurrentTopic("");
    setLearningSnippets([]);
    setCurrentOptions([]);
    setCurrentIndex(0);
    window.history.pushState({ view: "input", index: 0 }, "", "?view=input&index=0");
  };

  const handleLike = (content: string) => {
    const updatedLiked = likedSnippets.includes(content)
      ? likedSnippets.filter((snippet) => snippet !== content)
      : [...likedSnippets, content];

    setLikedSnippets(updatedLiked);
    localStorage.setItem("focusfeed-liked", JSON.stringify(updatedLiked));
    topicService.trackTopicLike(currentTopic, !likedSnippets.includes(content));
  };

  return (
    <div className="editorial-shell neon-grid min-h-screen bg-background">
      {currentView === "input" && (
        <div className="relative min-h-screen overflow-hidden px-5 py-8 md:px-8 md:py-10">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between gap-10">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.28em] text-primary/80">
                <Sparkles className="h-3.5 w-3.5" />
                FocusFeed
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground md:flex">
                <Waves className="h-3.5 w-3.5 text-primary" />
                Minimal reading mode
              </div>
            </header>

            <section className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-xl">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.34em] text-primary/80">
                  Swipeable learning
                </p>
                <h1 className="text-glow mt-5 max-w-3xl font-display text-5xl font-bold leading-[0.94] text-foreground md:text-7xl">
                  Learn one clear idea at a time.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground md:text-lg">
                  Enter a topic and move through a clean 10-card deck built for focus.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="chip-surface rounded-full px-4 py-2 text-sm text-foreground">
                    10-card focus deck
                  </div>
                  <div className="chip-surface rounded-full px-4 py-2 text-sm text-foreground">
                    Smart next branches
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-4 top-10 hidden h-28 w-28 rounded-full bg-primary/20 blur-3xl md:block" />
                <div className="absolute -bottom-6 right-0 hidden h-36 w-36 rounded-full bg-secondary/25 blur-3xl md:block" />
                <TopicInput onSubmit={handleTopicSubmit} />
              </div>
            </section>

            <footer className="flex flex-col gap-3 border-t border-white/8 pt-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>
                {likedSnippets.length > 0
                  ? `${likedSnippets.length} saved insights ready to revisit`
                  : "Start with a topic you want to understand better."}
              </p>
            </footer>
          </div>
        </div>
      )}

      {currentView === "loading" && (
        <LoadingScreen
          message={`Creating amazing ${currentTopic} lessons just for you...`}
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
        />
      )}
    </div>
  );
}
