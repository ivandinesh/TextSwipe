import { useState, useEffect, useCallback, useRef } from "react";
import { SwipeCard } from "./SwipeCard";
import { OptionsCard } from "./OptionsCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette, Type, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple debounce function
const debounce = (func: () => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(func, delay);
  };
};

interface SwipeContainerProps {
  snippets: string[];
  topic: string;
  mode: "ai";
  onBack: () => void;
  onLike?: (content: string) => void;
  onTopicChange?: (newTopic: string) => void;
  className?: string;
  currentTopic?: string;
  chatId?: string;
}

export function SwipeContainer({
  snippets,
  topic,
  mode,
  onBack,
  onLike,
  onTopicChange,
  className,
  currentTopic,
  chatId,
}: SwipeContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCards, setTotalCards] = useState(10);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allSnippets, setAllSnippets] = useState<string[]>(snippets);
  const [backgroundStyle, setBackgroundStyle] = useState("bg-[#FFFFFF]"); // Default: white
  const [fontClass, setFontClass] = useState("font-sans"); // Default: Inter
  const [textColor, setTextColor] = useState("#000000"); // Default: black
  const [showOptions, setShowOptions] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<{title: string; description: string}[]>([]);

  // Use refs for touch coordinates to avoid async state issues
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize theme from localStorage or use defaults
  useEffect(() => {
    const savedBg = localStorage.getItem('focusfeed-background') || 'bg-[#FFFFFF]';
    const savedFont = localStorage.getItem('focusfeed-font') || 'font-sans';
    const savedTextColor = localStorage.getItem('focusfeed-text-color') || '#000000';

    setBackgroundStyle(savedBg);
    setFontClass(savedFont);
    setTextColor(savedTextColor);
  }, []);

  // Update snippets when new ones are provided
  useEffect(() => {
    setAllSnippets(snippets);
  }, [snippets]);

  // Reset content when topic changes
  useEffect(() => {
    setAllSnippets(snippets);
    setCurrentIndex(0);
    console.log('Topic changed, resetting content:', topic);
  }, [topic, snippets]);

  // Cycle through background colors with debouncing
  const cycleBackground = useCallback(
    debounce(() => {
      const colors = ['bg-[#FFFFFF]', 'bg-[#E6E6FA]', 'bg-[#98FF98]', 'bg-[#FFDAB9]', 'bg-[#87CEEB]', 'bg-[#FFFACD]', 'bg-[#FFC0CB]'];
      const currentIndex = colors.indexOf(backgroundStyle);
      const nextIndex = (currentIndex + 1) % colors.length;
      const nextColor = colors[nextIndex];
      setBackgroundStyle(nextColor);
      localStorage.setItem('focusfeed-background', nextColor);
    }, 300),
    [backgroundStyle]
  );

  // Cycle through fonts
  const cycleFont = () => {
    const fonts = ['font-sans', 'font-serif', 'font-mono', 'font-roboto', 'font-open-sans', 'font-lora', 'font-source-code-pro'];
    const currentIndex = fonts.indexOf(fontClass);
    const nextIndex = (currentIndex + 1) % fonts.length;
    const nextFont = fonts[nextIndex];
    setFontClass(nextFont);
    localStorage.setItem('focusfeed-font', nextFont);
  };

  // Cycle through text colors
  const cycleTextColor = () => {
    const textColors = ['#000000', '#4B0082', '#2E8B57', '#CD853F', '#1E90FF', '#B8860B', '#C71585'];
    const currentIndex = textColors.indexOf(textColor);
    const nextIndex = (currentIndex + 1) % textColors.length;
    const nextTextColor = textColors[nextIndex];
    setTextColor(nextTextColor);
    localStorage.setItem('focusfeed-text-color', nextTextColor);
    console.log('Text color changed to:', nextTextColor);
  };

  // Determine appropriate text color based on background
  const getTextColor = () => {
    const darkBackgrounds = ["dark", "blue", "purple", "green", "red", "indigo", "slate", "emerald"];
    return darkBackgrounds.includes(backgroundStyle) ? "text-white" : "text-black";
  };

  // Generate more content for infinite scroll
  const generateMoreContent = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          chatId,
          generateOptions: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cards) {
          // If we have exactly 10 cards, show options after the 10th
          if (allSnippets.length === 10) {
            setCurrentOptions(data.options || []);
            setShowOptions(true);
          } else {
            setAllSnippets(prev => [...prev, ...data.cards.map((c: {content: string}) => c.content)]);
          }
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [topic, chatId, isLoading]);

  const nextCard = useCallback(() => {
    setCurrentIndex((current) => {
      // If we're showing options, close them and stay on current card
      if (showOptions) {
        setShowOptions(false);
        return current;
      }

      const next = (current + 1) % allSnippets.length;

      // Show options after 10th card (when we've shown all 10 cards)
      if (current === 9 && allSnippets.length === 10) {
        setShowOptions(true);
        setTotalCards(10); // We've shown all 10 cards
        return current; // Stay on last card to show options
      }

      // If we're near the end, generate more content
      if (current >= allSnippets.length - 3 && !showOptions) {
        generateMoreContent();
      }

      console.log("Next card:", next);
      // Update URL to preserve card index
      window.history.pushState(
        { view: 'learning', topic: topic, index: next },
        '',
        `?view=learning&topic=${encodeURIComponent(topic)}&index=${next}`
      );
      return next;
    });
  }, [allSnippets.length, generateMoreContent, topic, showOptions]);

  const previousCard = useCallback(() => {
    setCurrentIndex((current) => {
      // If we're showing options, hide them and go back to last card
      if (showOptions) {
        setShowOptions(false);
        return allSnippets.length - 1;
      }

      const prev = current > 0 ? current - 1 : allSnippets.length - 1;
      console.log("Previous card:", prev);
      // Update URL to preserve card index
      window.history.pushState(
        { view: 'learning', topic: topic, index: prev },
        '',
        `?view=learning&topic=${encodeURIComponent(topic)}&index=${prev}`
      );
      return prev;
    });
  }, [allSnippets.length, showOptions, currentTopic]);

  // Touch/swipe handlers for vertical navigation only
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = touchStartRef.current.x - endX;
      const deltaY = touchStartRef.current.y - endY;

      const verticalThreshold = 50;

      // Only handle vertical swipes for navigation
      if (Math.abs(deltaY) > verticalThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          console.log('Swiping up - next card');
          nextCard();
        } else {
          console.log('Swiping down - previous card');
          previousCard();
        }
      }
    },
    [nextCard, previousCard]
  );

  // Keyboard navigation
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
  }, [nextCard, previousCard, onBack, showOptions]);

  // Background styles
  const getBackgroundClasses = () => {
    // Directly return the backgroundStyle since it's already a Tailwind class
    return backgroundStyle;
  };

  const handleOptionSelect = useCallback((optionTitle: string) => {
    setShowOptions(false);
    // Generate content for the selected sub-topic
    generateMoreContentWithSubtopic(optionTitle);
  }, [generateMoreContent]);

  const generateMoreContentWithSubtopic = useCallback(async (subtopic: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: `Focus on ${subtopic} aspect of ${topic}`,
          chatId,
          generateOptions: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cards) {
          setAllSnippets(prev => [...prev, ...data.cards.map((c: {content: string}) => c.content)]);
          setShowOptions(false);
        }
      }
    } catch (error) {
      console.error('Error generating subtopic content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [topic, chatId]);

  // Update total cards when snippets change
  useEffect(() => {
    if (allSnippets.length > 0) {
      setTotalCards(showOptions ? 10 : allSnippets.length);
    }
  }, [allSnippets.length, showOptions]);

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
        backgroundStyle,
        fontClass,
        className,
      )}
      style={{
        fontFamily: fontClass.replace('font-', ''),
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="swipe-container"
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="text-center">
          <h1
            className={`font-semibold text-lg ${textColor}`}
            data-testid="text-topic-title"
          >
            {topic}
          </h1>
          <p className={`text-sm ${textColor}/70`}>
            {currentIndex + 1} of {totalCards}
            {isLoading && " • Loading..."}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleBackground}
            className="hover:bg-primary/10"
            aria-label="Cycle background color"
          >
            <Palette className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleFont}
            className="hover:bg-primary/10"
            aria-label="Cycle font"
          >
            <Type className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTextColor}
            className="hover:bg-primary/10"
            aria-label="Cycle text color"
          >
            <Paintbrush className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="relative h-full pt-16">
        {showOptions ? (
          <OptionsCard
            options={currentOptions}
            topic={topic}
            onSelectOption={handleOptionSelect}
            onGenerateMore={() => {
              setShowOptions(false);
              generateMoreContent();
            }}
            textColor={textColor}
            fontClass={fontClass}
          />
        ) : (
          allSnippets.map((snippet, index) => (
            <SwipeCard
              key={index}
              content={snippet}
              index={index}
              total={allSnippets.length}
              isActive={index === currentIndex}
              onNext={nextCard}
              onPrevious={previousCard}
              onLike={onLike}
              textColor={textColor}
              fontClass={fontClass}
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

      {/* Swipe Instruction Hint */}
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm ${textColor}/60 md:hidden`}>
        <p>Swipe up/down to navigate</p>
        <p className="text-xs mt-1 opacity-80">
          Swipe up/down to navigate cards
        </p>
      </div>
    </div>
  );
}
