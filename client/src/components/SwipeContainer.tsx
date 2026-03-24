import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Paintbrush,
  Palette,
  Sparkles,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OptionsCard } from "./OptionsCard";
import { SwipeCard } from "./SwipeCard";

interface TopicOption {
  title: string;
  description: string;
}

interface SwipeContainerProps {
  snippets: string[];
  options: TopicOption[];
  topic: string;
  onBack: () => void;
  onLike?: (content: string) => void;
  likedSnippets?: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onOptionsChange: (options: TopicOption[]) => void;
  className?: string;
}

interface GenerateResponse {
  cards?: { content: string }[];
  options?: TopicOption[];
}

type ThemeName = "midnight" | "aurora" | "ember";
type FontName = "sans" | "display" | "mono";

const THEMES: Record<
  ThemeName,
  {
    surface: string;
    shell: string;
    overlay: string;
    panel: string;
    panelBorder: string;
    panelGlow: string;
    tile: string;
    text: string;
    muted: string;
  }
> = {
  midnight: {
    surface:
      "bg-[radial-gradient(circle_at_top,rgba(58,227,255,0.12),transparent_24%),linear-gradient(180deg,rgba(12,15,34,0.95),rgba(6,10,24,1))]",
    shell: "rgba(8, 12, 28, 0.86)",
    overlay: "rgba(255,255,255,0.06)",
    panel: "linear-gradient(180deg, rgba(18, 24, 54, 0.92), rgba(10, 14, 34, 0.82))",
    panelBorder: "rgba(116, 161, 255, 0.18)",
    panelGlow: "0 24px 80px rgba(4, 10, 34, 0.52), inset 0 1px 0 rgba(255,255,255,0.08)",
    tile: "rgba(255,255,255,0.04)",
    text: "#F6F8FF",
    muted: "#A6B1CF",
  },
  aurora: {
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(58,227,255,0.15),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(152,92,255,0.22),transparent_26%),linear-gradient(180deg,rgba(18,19,47,0.96),rgba(9,11,33,1))]",
    shell: "rgba(18, 19, 47, 0.86)",
    overlay: "rgba(255,255,255,0.08)",
    panel: "linear-gradient(180deg, rgba(33, 25, 70, 0.9), rgba(16, 18, 45, 0.84))",
    panelBorder: "rgba(160, 132, 255, 0.22)",
    panelGlow: "0 24px 80px rgba(22, 12, 62, 0.46), inset 0 1px 0 rgba(255,255,255,0.1)",
    tile: "rgba(255,255,255,0.05)",
    text: "#F7F4FF",
    muted: "#B4AED1",
  },
  ember: {
    surface:
      "bg-[radial-gradient(circle_at_top_right,rgba(255,153,92,0.18),transparent_24%),radial-gradient(circle_at_left,rgba(255,96,143,0.14),transparent_20%),linear-gradient(180deg,rgba(31,16,28,0.96),rgba(14,9,18,1))]",
    shell: "rgba(31, 16, 28, 0.86)",
    overlay: "rgba(255,255,255,0.07)",
    panel: "linear-gradient(180deg, rgba(48, 24, 36, 0.9), rgba(22, 12, 20, 0.84))",
    panelBorder: "rgba(255, 154, 115, 0.2)",
    panelGlow: "0 24px 80px rgba(34, 10, 18, 0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
    tile: "rgba(255,255,255,0.045)",
    text: "#FFF5F5",
    muted: "#D7B3BE",
  },
};

const FONT_CLASSES: Record<FontName, string> = {
  sans: "font-sans",
  display: "font-display",
  mono: "font-mono",
};

const themeOrder: ThemeName[] = ["midnight", "aurora", "ember"];
const fontOrder: FontName[] = ["sans", "display", "mono"];

const debounce = (func: () => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(func, delay);
  };
};

export function SwipeContainer({
  snippets,
  options,
  topic,
  onBack,
  onLike,
  likedSnippets = [],
  currentIndex,
  onIndexChange,
  onOptionsChange,
  className,
}: SwipeContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [allSnippets, setAllSnippets] = useState<string[]>(snippets);
  const [themeName, setThemeName] = useState<ThemeName>("midnight");
  const [fontName, setFontName] = useState<FontName>("sans");
  const [showOptions, setShowOptions] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

  const activeTheme = THEMES[themeName];
  const fontClass = FONT_CLASSES[fontName];
  const likedSet = new Set(likedSnippets);

  useEffect(() => {
    const savedTheme = localStorage.getItem("focusfeed-theme") as ThemeName | null;
    const savedFont = localStorage.getItem("focusfeed-font-theme") as FontName | null;

    if (savedTheme && savedTheme in THEMES) {
      setThemeName(savedTheme);
    }
    if (savedFont && savedFont in FONT_CLASSES) {
      setFontName(savedFont);
    }
  }, []);

  useEffect(() => {
    setAllSnippets(snippets);
    setShowOptions(false);
  }, [snippets, topic]);

  const cycleBackground = useCallback(
    debounce(() => {
      const currentThemeIndex = themeOrder.indexOf(themeName);
      const nextTheme = themeOrder[(currentThemeIndex + 1) % themeOrder.length];
      setThemeName(nextTheme);
      localStorage.setItem("focusfeed-theme", nextTheme);
    }, 240),
    [themeName],
  );

  const cycleFont = () => {
    const currentFontIndex = fontOrder.indexOf(fontName);
    const nextFont = fontOrder[(currentFontIndex + 1) % fontOrder.length];
    setFontName(nextFont);
    localStorage.setItem("focusfeed-font-theme", nextFont);
  };

  const rotateThemeAccent = () => {
    cycleBackground();
  };

  const generateMoreContent = useCallback(
    async (findNewTopics = false, subtopic?: string) => {
      if (isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        const requestTopic = subtopic
          ? `Focus on ${subtopic} aspect of ${topic}`
          : findNewTopics
            ? `Related topics about ${topic}`
            : topic;

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: requestTopic,
            count: 10,
            generateOptions: true,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            setAllSnippets((prev) => [
              ...prev,
              "Rate limit reached. Please wait a moment before generating more content.",
            ]);
            return;
          }

          throw new Error(`HTTP error ${response.status}`);
        }

        const data: GenerateResponse = await response.json();
        const nextSnippets = data.cards?.map((card) => card.content) ?? [];
        const nextOptions = data.options ?? [];
        onOptionsChange(nextOptions);

        setAllSnippets(nextSnippets);
        onIndexChange(0);
        setShowOptions(false);
      } catch (error) {
        console.error("Error generating content:", error);
        setAllSnippets(["Error generating content. Please try again."]);
        onIndexChange(0);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, onIndexChange, onOptionsChange, topic],
  );

  const nextCard = useCallback(() => {
    if (showOptions) {
      setShowOptions(false);
      return;
    }

    if (currentIndex >= allSnippets.length - 1) {
      setShowOptions(true);
      return;
    }

    const next = currentIndex + 1;
    onIndexChange(next);
  }, [allSnippets.length, currentIndex, onIndexChange, showOptions]);

  const previousCard = useCallback(() => {
    if (showOptions) {
      setShowOptions(false);
      return;
    }

    const previous = currentIndex > 0 ? currentIndex - 1 : 0;
    onIndexChange(previous);
  }, [allSnippets.length, currentIndex, onIndexChange, showOptions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        nextCard();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        previousCard();
      } else if (e.key === "Escape") {
        if (showOptions) {
          setShowOptions(false);
        } else {
          onBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextCard, onBack, previousCard, showOptions]);

  if (!allSnippets.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No learning content available</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-screen overflow-hidden transition-all duration-300 ease-in-out",
        activeTheme.surface,
        fontClass,
        className,
      )}
      style={{ transition: "background-color 0.3s ease, color 0.3s ease" }}
      onTouchStart={(e) =>
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      }
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = touchStart.x - endX;
        const deltaY = touchStart.y - endY;

        if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
          if (deltaY > 0) {
            nextCard();
          } else {
            previousCard();
          }
        }
      }}
      data-testid="swipe-container"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4 md:px-6">
        <div
          className="glass-panel pointer-events-auto rounded-[1.6rem] px-4 py-3 md:px-5"
          style={{
            background: `linear-gradient(180deg, ${activeTheme.shell}, rgba(10,12,24,0.64))`,
            borderColor: activeTheme.overlay,
          }}
        >
          <div className="flex items-start gap-3 md:items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/80">
                  Active Topic
                </span>
                {isLoading && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    Loading
                  </span>
                )}
              </div>
              <h1
                className="mt-1 truncate text-left text-lg font-semibold md:text-2xl"
                style={{ color: activeTheme.text }}
                data-testid="text-topic-title"
              >
                {topic}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-xs md:text-sm" style={{ color: activeTheme.muted }}>
                  Card {Math.min(currentIndex + 1, allSnippets.length)} of {allSnippets.length}
                </p>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${Math.max(((Math.min(currentIndex + 1, allSnippets.length)) / Math.max(allSnippets.length, 1)) * 100, 8)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleBackground}
                className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
                aria-label="Change visual theme"
              >
                <Palette className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleFont}
                className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
                aria-label="Change font"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={rotateThemeAccent}
                className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
                aria-label="Rotate theme accent"
              >
                <Paintbrush className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleBackground}
              className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
              aria-label="Change visual theme"
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleFont}
              className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
              aria-label="Change font"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={rotateThemeAccent}
              className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
              aria-label="Rotate theme accent"
            >
              <Paintbrush className="h-4 w-4" />
            </Button>
            <div className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Swipe Mode
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-full pt-28 sm:pt-32">
        {showOptions ? (
          <OptionsCard
            options={options}
            topic={topic}
            onSelectOption={(optionTitle) => {
              setShowOptions(false);
              void generateMoreContent(false, optionTitle);
            }}
            onGenerateMore={(findNewTopics = false) => {
              setShowOptions(false);
              void generateMoreContent(findNewTopics);
            }}
            textColor={activeTheme.text}
            mutedTextColor={activeTheme.muted}
            fontClass={fontClass}
            panelStyle={{
              background: activeTheme.panel,
              borderColor: activeTheme.panelBorder,
              boxShadow: activeTheme.panelGlow,
            }}
            tileStyle={{
              background: activeTheme.tile,
              borderColor: activeTheme.panelBorder,
            }}
          />
        ) : (
          allSnippets.map((snippet, index) => (
            <SwipeCard
              key={`${topic}-${index}-${snippet.slice(0, 16)}`}
              content={snippet}
              index={index}
              total={allSnippets.length}
              isActive={index === currentIndex}
              onNext={nextCard}
              onPrevious={previousCard}
              onLike={onLike}
              isLiked={likedSet.has(snippet)}
              textColor={activeTheme.text}
              mutedTextColor={activeTheme.muted}
              fontClass={fontClass}
              progressLabel={`${Math.min(currentIndex + 1, allSnippets.length)} / ${allSnippets.length}`}
              panelStyle={{
                background: activeTheme.panel,
                borderColor: activeTheme.panelBorder,
                boxShadow: activeTheme.panelGlow,
              }}
              className={cn(
                "absolute inset-0 transition-all duration-300 ease-out",
                index === currentIndex
                  ? "opacity-100 translate-y-0 scale-100"
                  : index < currentIndex
                    ? "opacity-0 -translate-y-full scale-95"
                    : "opacity-0 translate-y-full scale-95",
              )}
            />
          ))
        )}
      </div>

      <div
        className="safe-bottom absolute bottom-0 left-1/2 w-full max-w-sm -translate-x-1/2 px-6 pb-4 text-center text-sm md:hidden"
        style={{ color: activeTheme.muted }}
      >
        <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 backdrop-blur-md">
          <p>Swipe up or down to move through the deck</p>
        </div>
      </div>
    </div>
  );
}
