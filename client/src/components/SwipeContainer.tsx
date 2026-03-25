import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Paintbrush,
  Palette,
  Type,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { cn } from "@/lib/utils";
import { CardProgressTrail } from "./CardProgressTrail";
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

type ThemeName = "midnight" | "aurora" | "ember" | "petal" | "sage";
type FontName = "sans" | "display" | "mono";
type TextToneName = "default" | "soft" | "high-contrast";

type ThemeChoice = {
  id: ThemeName;
  swatch: string;
};

type FontChoice = {
  id: FontName;
  icon: typeof Type;
};

type TextToneChoice = {
  id: TextToneName;
};

const THEMES: Record<
  ThemeName,
  {
    surface: string;
    shell: string;
    overlay: string;
    panel: string;
    panelBorder: string;
    panelGlow: string;
    backlight: string;
    tile: string;
    text: string;
    muted: string;
    textTones: Record<
      TextToneName,
      {
        text: string;
        muted: string;
      }
    >;
  }
> = {
  midnight: {
    surface:
      "bg-[radial-gradient(circle_at_top,rgba(129,220,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(181,197,255,0.18),transparent_24%),linear-gradient(180deg,rgba(11,15,34,0.98),rgba(6,10,24,1))]",
    shell: "rgba(8, 12, 28, 0.86)",
    overlay: "rgba(255,255,255,0.06)",
    panel: "linear-gradient(180deg, rgba(20, 28, 64, 0.94), rgba(10, 15, 38, 0.86))",
    panelBorder: "rgba(147, 186, 255, 0.26)",
    panelGlow: "0 24px 80px rgba(4, 10, 34, 0.52), inset 0 1px 0 rgba(255,255,255,0.08)",
    backlight:
      "radial-gradient(circle, rgba(156,210,255,0.42) 0%, rgba(140,170,255,0.18) 38%, rgba(156,210,255,0) 74%)",
    tile: "rgba(255,255,255,0.06)",
    text: "#FCFDFF",
    muted: "#B8C4E4",
    textTones: {
      default: { text: "#FCFDFF", muted: "#B8C4E4" },
      soft: { text: "#D7F1FF", muted: "#A5CCE7" },
      "high-contrast": { text: "#FFFFFF", muted: "#E1E8FF" },
    },
  },
  aurora: {
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(166,239,255,0.2),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(222,178,255,0.24),transparent_28%),linear-gradient(180deg,rgba(20,21,50,0.98),rgba(10,11,34,1))]",
    shell: "rgba(18, 19, 47, 0.86)",
    overlay: "rgba(255,255,255,0.08)",
    panel: "linear-gradient(180deg, rgba(39, 31, 83, 0.92), rgba(18, 20, 48, 0.86))",
    panelBorder: "rgba(204, 178, 255, 0.26)",
    panelGlow: "0 24px 80px rgba(22, 12, 62, 0.46), inset 0 1px 0 rgba(255,255,255,0.1)",
    backlight:
      "radial-gradient(circle, rgba(234,205,255,0.42) 0%, rgba(161,236,255,0.2) 36%, rgba(234,205,255,0) 74%)",
    tile: "rgba(255,255,255,0.07)",
    text: "#FFF9FF",
    muted: "#CBC2EA",
    textTones: {
      default: { text: "#FFF9FF", muted: "#CBC2EA" },
      soft: { text: "#FFE2F8", muted: "#EABCE0" },
      "high-contrast": { text: "#FFFFFF", muted: "#E5DBFF" },
    },
  },
  ember: {
    surface:
      "bg-[radial-gradient(circle_at_top_right,rgba(255,196,156,0.2),transparent_24%),radial-gradient(circle_at_left,rgba(255,173,201,0.18),transparent_22%),linear-gradient(180deg,rgba(31,16,28,0.98),rgba(14,9,18,1))]",
    shell: "rgba(31, 16, 28, 0.86)",
    overlay: "rgba(255,255,255,0.07)",
    panel: "linear-gradient(180deg, rgba(54, 28, 40, 0.92), rgba(24, 12, 21, 0.86))",
    panelBorder: "rgba(255, 201, 174, 0.24)",
    panelGlow: "0 24px 80px rgba(34, 10, 18, 0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
    backlight:
      "radial-gradient(circle, rgba(255,212,185,0.4) 0%, rgba(255,171,197,0.2) 40%, rgba(255,212,185,0) 74%)",
    tile: "rgba(255,255,255,0.06)",
    text: "#FFF8F7",
    muted: "#E1BDC5",
    textTones: {
      default: { text: "#FFF8F7", muted: "#E1BDC5" },
      soft: { text: "#FFE4C5", muted: "#EDC29F" },
      "high-contrast": { text: "#FFFFFF", muted: "#F4D7DE" },
    },
  },
  petal: {
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(255,223,238,0.24),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,245,204,0.22),transparent_26%),linear-gradient(180deg,rgba(38,24,40,0.98),rgba(20,14,24,1))]",
    shell: "rgba(38, 24, 40, 0.84)",
    overlay: "rgba(255,255,255,0.08)",
    panel: "linear-gradient(180deg, rgba(80, 48, 79, 0.88), rgba(39, 24, 41, 0.84))",
    panelBorder: "rgba(255, 220, 236, 0.28)",
    panelGlow: "0 24px 80px rgba(57, 26, 56, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
    backlight:
      "radial-gradient(circle, rgba(255,224,238,0.44) 0%, rgba(255,244,202,0.2) 42%, rgba(255,224,238,0) 74%)",
    tile: "rgba(255,255,255,0.075)",
    text: "#FFF9FC",
    muted: "#E9C8D9",
    textTones: {
      default: { text: "#FFF9FC", muted: "#E9C8D9" },
      soft: { text: "#FFE6F4", muted: "#F2C4DD" },
      "high-contrast": { text: "#FFFFFF", muted: "#FFE7F2" },
    },
  },
  sage: {
    surface:
      "bg-[radial-gradient(circle_at_top,rgba(214,246,225,0.22),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(199,234,255,0.2),transparent_26%),linear-gradient(180deg,rgba(22,35,35,0.98),rgba(12,20,20,1))]",
    shell: "rgba(22, 35, 35, 0.84)",
    overlay: "rgba(255,255,255,0.08)",
    panel: "linear-gradient(180deg, rgba(37, 62, 58, 0.88), rgba(18, 31, 31, 0.84))",
    panelBorder: "rgba(210, 245, 225, 0.24)",
    panelGlow: "0 24px 80px rgba(9, 30, 24, 0.48), inset 0 1px 0 rgba(255,255,255,0.1)",
    backlight:
      "radial-gradient(circle, rgba(219,247,229,0.38) 0%, rgba(199,232,255,0.2) 40%, rgba(219,247,229,0) 74%)",
    tile: "rgba(255,255,255,0.065)",
    text: "#F8FFFB",
    muted: "#C5DED5",
    textTones: {
      default: { text: "#F8FFFB", muted: "#C5DED5" },
      soft: { text: "#D6FFF1", muted: "#A8DFCB" },
      "high-contrast": { text: "#FFFFFF", muted: "#E0F7EC" },
    },
  },
};

const FONT_CLASSES: Record<FontName, string> = {
  sans: "font-sans",
  display: "font-display",
  mono: "font-mono",
};

const THEME_CHOICES: ThemeChoice[] = [
  {
    id: "midnight",
    swatch:
      "linear-gradient(135deg, rgba(129,220,255,0.8), rgba(11,15,34,1) 58%, rgba(6,10,24,1))",
  },
  {
    id: "aurora",
    swatch:
      "linear-gradient(135deg, rgba(166,239,255,0.82), rgba(95,72,168,0.95) 52%, rgba(10,11,34,1))",
  },
  {
    id: "ember",
    swatch:
      "linear-gradient(135deg, rgba(255,196,156,0.82), rgba(182,76,118,0.92) 48%, rgba(14,9,18,1))",
  },
  {
    id: "petal",
    swatch:
      "linear-gradient(135deg, rgba(255,223,238,0.9), rgba(171,107,146,0.9) 46%, rgba(20,14,24,1))",
  },
  {
    id: "sage",
    swatch:
      "linear-gradient(135deg, rgba(214,246,225,0.84), rgba(77,133,120,0.92) 50%, rgba(12,20,20,1))",
  },
];
const FONT_CHOICES: FontChoice[] = [
  { id: "sans", icon: Type },
  { id: "display", icon: Palette },
  { id: "mono", icon: Paintbrush },
];
const TEXT_TONE_CHOICES: TextToneChoice[] = [
  { id: "default" },
  { id: "soft" },
  { id: "high-contrast" },
];
const swipeThreshold = 42;

export function SwipeContainer({
  snippets,
  options,
  topic,
  onBack,
  onLike,
  likedSnippets: _likedSnippets = [],
  currentIndex,
  onIndexChange,
  onOptionsChange,
  className,
}: SwipeContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [allSnippets, setAllSnippets] = useState<string[]>(snippets);
  const [themeName, setThemeName] = useState<ThemeName>("midnight");
  const [fontName, setFontName] = useState<FontName>("sans");
  const [textToneName, setTextToneName] = useState<TextToneName>("default");
  const [showOptions, setShowOptions] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const themePanelRef = useRef<HTMLDivElement | null>(null);

  const activeTheme = THEMES[themeName];
  const activeTextTone = activeTheme.textTones[textToneName];
  const fontClass = FONT_CLASSES[fontName];

  useEffect(() => {
    const savedTheme = localStorage.getItem("focusfeed-theme") as ThemeName | null;
    const savedFont = localStorage.getItem("focusfeed-font-theme") as FontName | null;
    const savedTextTone = localStorage.getItem("focusfeed-text-tone") as TextToneName | null;

    if (savedTheme && savedTheme in THEMES) {
      setThemeName(savedTheme);
    }
    if (savedFont && savedFont in FONT_CLASSES) {
      setFontName(savedFont);
    }
    if (
      savedTextTone &&
      TEXT_TONE_CHOICES.some((choice) => choice.id === savedTextTone)
    ) {
      setTextToneName(savedTextTone);
    }
  }, []);

  useEffect(() => {
    setAllSnippets(snippets);
    setShowOptions(false);
    setControlsOpen(false);
    setShowSwipeHint(true);
    setSwipeDirection(1);
  }, [snippets, topic]);

  const selectTheme = useCallback((nextTheme: ThemeName) => {
    setThemeName(nextTheme);
    localStorage.setItem("focusfeed-theme", nextTheme);
  }, []);

  const selectFont = useCallback((nextFont: FontName) => {
    setFontName(nextFont);
    localStorage.setItem("focusfeed-font-theme", nextFont);
  }, []);

  const selectTextTone = useCallback((nextTextTone: TextToneName) => {
    setTextToneName(nextTextTone);
    localStorage.setItem("focusfeed-text-tone", nextTextTone);
  }, []);

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
              appCopy.errors.rateLimit,
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
        setControlsOpen(false);
      } catch (error) {
        console.error("Error generating content:", error);
        setAllSnippets([appCopy.errors.genericGenerate]);
        onIndexChange(0);
        setControlsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, onIndexChange, onOptionsChange, topic],
  );

  const nextCard = useCallback(() => {
    setShowSwipeHint(false);
    setSwipeDirection(1);

    if (showOptions) {
      setShowOptions(false);
      return;
    }

    if (currentIndex >= allSnippets.length - 1) {
      setShowOptions(true);
      setControlsOpen(false);
      return;
    }

    const next = currentIndex + 1;
    onIndexChange(next);
    setControlsOpen(false);
  }, [allSnippets.length, currentIndex, onIndexChange, showOptions]);

  const previousCard = useCallback(() => {
    setShowSwipeHint(false);
    setSwipeDirection(-1);

    if (showOptions) {
      setShowOptions(false);
      setControlsOpen(false);
      return;
    }

    if (currentIndex <= 0) {
      setControlsOpen(false);
      return;
    }

    onIndexChange(currentIndex - 1);
    setControlsOpen(false);
  }, [currentIndex, onIndexChange, showOptions]);

  const toggleLikeCurrent = useCallback(() => {
    const currentSnippet = allSnippets[currentIndex];
    if (currentSnippet) {
      onLike?.(currentSnippet);
    }
  }, [allSnippets, currentIndex, onLike]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        nextCard();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        previousCard();
      } else if (e.key.toLowerCase() === "w") {
        e.preventDefault();
        setControlsOpen(true);
      } else if (e.key === "Escape" && controlsOpen) {
        e.preventDefault();
        setControlsOpen(false);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleLikeCurrent();
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
  }, [controlsOpen, nextCard, onBack, previousCard, showOptions, toggleLikeCurrent]);

  useEffect(() => {
    if (!controlsOpen || showOptions) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (themePanelRef.current?.contains(target)) {
        return;
      }

      setControlsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [controlsOpen, showOptions]);

  if (!allSnippets.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{appCopy.errors.noCards}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-screen transition-all duration-300 ease-in-out",
        showOptions ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden",
        activeTheme.surface,
        fontClass,
        className,
      )}
      style={{ transition: "background-color 0.3s ease, color 0.3s ease" }}
      onTouchStart={(e) => {
        if (showOptions) {
          return;
        }

        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }}
      onTouchEnd={(e) => {
        if (showOptions) {
          return;
        }

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = touchStart.x - endX;
        const deltaY = touchStart.y - endY;

        if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
          setControlsOpen(false);
          if (deltaX > 0) {
            previousCard();
          } else {
            nextCard();
          }
          return;
        }

        if (Math.abs(deltaY) > 34 && Math.abs(deltaY) > Math.abs(deltaX)) {
          if (deltaY > 0) {
            setControlsOpen(true);
          } else if (controlsOpen) {
            setControlsOpen(false);
          }
          return;
        }

        if (Math.abs(deltaY) < 12 && Math.abs(deltaX) < 12) {
          const target = e.target;
          if (!(target instanceof Element) || !target.closest("[data-card-surface='true']")) {
            return;
          }

          const now = Date.now();
          if (now - lastTapRef.current < 280) {
            lastTapRef.current = 0;
            toggleLikeCurrent();
            return;
          }

          lastTapRef.current = now;
        }
      }}
      data-testid="swipe-container"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4 transition-all duration-300 md:px-6",
          showOptions || controlsOpen ? "translate-y-0 opacity-100" : "translate-y-0 opacity-100",
        )}
      >
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
              data-chrome-control="true"
              className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/10"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/80">
                  {appCopy.card.topicEyebrow}
                </span>
                {isLoading && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    {appCopy.card.loadingBadge}
                  </span>
                )}
              </div>
              <h1
                className="mt-1 truncate text-left text-lg font-semibold md:text-2xl"
                style={{ color: activeTextTone.text }}
                data-testid="text-topic-title"
              >
                {topic}
              </h1>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setControlsOpen((open) => !open)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground transition hover:bg-white/[0.08]"
                data-chrome-control="true"
              >
                {appCopy.card.styleHintDesktop}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {controlsOpen && !showOptions && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-5 md:px-8 md:pb-8"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mx-auto flex max-w-3xl justify-center">
              <div
                ref={themePanelRef}
                className="pointer-events-auto w-full rounded-[2rem] border px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl md:px-5"
                style={{
                  background: `linear-gradient(180deg, ${activeTheme.shell}, rgba(10,12,24,0.48))`,
                  borderColor: activeTheme.overlay,
                }}
                data-theme-panel="true"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="font-display text-sm font-semibold"
                      style={{ color: activeTextTone.text }}
                    >
                      {appCopy.card.controlsTitle}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: activeTextTone.muted }}
                    >
                      {appCopy.card.controlsDescription}
                    </p>
                  </div>
                  <div
                    className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em]"
                    style={{
                      color: activeTextTone.muted,
                      borderColor: activeTheme.overlay,
                      background: activeTheme.tile,
                    }}
                  >
                    {appCopy.card.controlsCloseHint}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-3 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium" style={{ color: activeTextTone.text }}>
                        {appCopy.card.controls.backdropTitle}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {THEME_CHOICES.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => selectTheme(choice.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-full border px-2.5 py-2 text-xs transition-transform hover:-translate-y-0.5",
                            themeName === choice.id && "ring-2 ring-primary/40",
                          )}
                          style={{
                            color: activeTextTone.text,
                            borderColor:
                              themeName === choice.id
                                ? "rgba(58,227,255,0.44)"
                                : activeTheme.overlay,
                            background:
                              themeName === choice.id ? "rgba(255,255,255,0.12)" : activeTheme.tile,
                          }}
                        >
                          <span
                            className="h-5 w-5 rounded-full border border-white/20"
                            style={{ background: choice.swatch }}
                            aria-hidden="true"
                          />
                          {appCopy.card.controls.themes[choice.id]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-3 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Type className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium" style={{ color: activeTextTone.text }}>
                        {appCopy.card.controls.typeTitle}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {FONT_CHOICES.map((choice) => {
                        const Icon = choice.icon;
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => selectFont(choice.id)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-transform hover:-translate-y-0.5",
                              FONT_CLASSES[choice.id],
                              fontName === choice.id && "ring-2 ring-primary/40",
                            )}
                            style={{
                              color: activeTextTone.text,
                              borderColor:
                                fontName === choice.id
                                  ? "rgba(58,227,255,0.44)"
                                  : activeTheme.overlay,
                              background:
                                fontName === choice.id ? "rgba(255,255,255,0.12)" : activeTheme.tile,
                            }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {appCopy.card.controls.fonts[choice.id]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-3 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Paintbrush className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium" style={{ color: activeTextTone.text }}>
                        {appCopy.card.controls.contrastTitle}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TEXT_TONE_CHOICES.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => selectTextTone(choice.id)}
                          className={cn(
                            "rounded-full border px-3 py-2 text-sm transition-transform hover:-translate-y-0.5",
                            textToneName === choice.id && "ring-2 ring-primary/40",
                          )}
                          style={{
                            color: activeTheme.textTones[choice.id].text,
                            borderColor:
                              textToneName === choice.id
                                ? "rgba(58,227,255,0.44)"
                                : activeTheme.overlay,
                            background:
                              textToneName === choice.id
                                ? "rgba(255,255,255,0.12)"
                                : activeTheme.tile,
                          }}
                        >
                          {appCopy.card.controls.textTones[choice.id]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative transition-all duration-300",
          "pt-28 sm:pt-32",
          showOptions
            ? "min-h-full"
            : "h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-1.5rem)]",
        )}
      >
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
            textColor={activeTextTone.text}
            mutedTextColor={activeTextTone.muted}
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
        <div className="relative h-full">
            <CardProgressTrail
              currentIndex={currentIndex}
              total={allSnippets.length}
              activeTheme={{
                overlay: activeTheme.overlay,
                tile: activeTheme.tile,
              }}
              activeTextTone={activeTextTone}
            />
            <div
              className="pointer-events-none absolute inset-x-4 inset-y-3 rounded-[2.1rem] border opacity-45 md:inset-x-8 md:inset-y-5"
              style={{
                background: activeTheme.panel,
                borderColor: activeTheme.panelBorder,
                boxShadow: activeTheme.panelGlow,
                transform: "translate3d(0, 12px, 0) scale(0.975)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-x-4 inset-y-3 rounded-[2.1rem] border opacity-22 md:inset-x-8 md:inset-y-5"
              style={{
                background: activeTheme.panel,
                borderColor: activeTheme.panelBorder,
                transform: "translate3d(0, 22px, 0) scale(0.95)",
              }}
            />
            <AnimatePresence initial={false} custom={swipeDirection} mode="popLayout">
              <motion.div
                key={`${topic}-${currentIndex}-${allSnippets[currentIndex]?.slice(0, 24) ?? "card"}`}
                custom={swipeDirection}
                variants={{
                  enter: (direction: 1 | -1) => ({
                    x: direction > 0 ? -88 : 88,
                    opacity: 0,
                    scale: 0.97,
                    rotateZ: direction > 0 ? -1.5 : 1.5,
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    rotateZ: 0,
                    transition: {
                      x: { type: "spring", stiffness: 260, damping: 28, mass: 0.95 },
                      scale: { type: "spring", stiffness: 240, damping: 26, mass: 0.92 },
                      rotateZ: { type: "spring", stiffness: 260, damping: 30 },
                      opacity: { duration: 0.18 },
                    },
                  },
                  exit: (direction: 1 | -1) => ({
                    x: direction > 0 ? 132 : -132,
                    opacity: 0,
                    scale: 0.985,
                    rotateZ: direction > 0 ? 1.8 : -1.8,
                    transition: {
                      x: { type: "spring", stiffness: 260, damping: 30, mass: 0.95 },
                      opacity: { duration: 0.16 },
                      scale: { duration: 0.2 },
                    },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
              >
                <SwipeCard
                  key={`${topic}-${currentIndex}`}
                  content={allSnippets[currentIndex]}
                  index={currentIndex}
                  total={allSnippets.length}
                  isActive
                  textColor={activeTextTone.text}
                  mutedTextColor={activeTextTone.muted}
                  fontClass={fontClass}
                  cardLabel={appCopy.card.cardLabel(
                    Math.min(currentIndex + 1, allSnippets.length),
                    allSnippets.length,
                  )}
                  showSwipeHint={showSwipeHint && currentIndex === 0}
                  isLiked={Boolean(
                    allSnippets[currentIndex] &&
                      _likedSnippets.includes(allSnippets[currentIndex]),
                  )}
                  onLike={toggleLikeCurrent}
                  panelStyle={{
                    background: activeTheme.panel,
                    borderColor: activeTheme.panelBorder,
                    boxShadow: activeTheme.panelGlow,
                  }}
                  backlightStyle={{ background: activeTheme.backlight }}
                  className="absolute inset-0"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
