import { useState, useEffect, useCallback, useRef } from "react";
import { SwipeCard } from "./SwipeCard";
import { CustomizationPanel } from "./CustomizationPanel";
import { RelatedTopicsPanel } from "./RelatedTopicsPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Sun, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeContainerProps {
  snippets: string[];
  topic: string;
  mode: 'ai' | 'demo';
  onBack: () => void;
  onLike?: (content: string) => void;
  onTopicChange?: (newTopic: string) => void;
  className?: string;
}

export function SwipeContainer({ 
  snippets, 
  topic,
  mode,
  onBack, 
  onLike,
  onTopicChange,
  className 
}: SwipeContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showRelatedTopics, setShowRelatedTopics] = useState(false);
  const [allSnippets, setAllSnippets] = useState<string[]>(snippets);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState("dark");
  const [fontClass, setFontClass] = useState("font-sans");
  
  // Use refs for touch coordinates to avoid async state issues
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Initialize preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    const savedBg = localStorage.getItem('swipelearn-background') || 'dark';
    const savedFont = localStorage.getItem('swipelearn-font') || 'font-sans';
    
    setIsDarkMode(shouldUseDark);
    setBackgroundStyle(savedBg);
    setFontClass(savedFont);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  // Update snippets when new ones are provided
  useEffect(() => {
    setAllSnippets(snippets);
  }, [snippets]);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
    console.log('Theme toggled to:', newDarkMode ? 'dark' : 'light');
  };

  // Generate more content for infinite scroll
  const generateMoreContent = useCallback(async () => {
    if (mode === 'demo' || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.snippets) {
          setAllSnippets(prev => [...prev, ...data.snippets]);
          console.log('Generated more content, total:', allSnippets.length + data.snippets.length);
        }
      }
    } catch (error) {
      console.error('Error generating more content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [topic, mode, isLoading, allSnippets.length]);

  const nextCard = useCallback(() => {
    setCurrentIndex((current) => {
      const next = (current + 1) % allSnippets.length;
      
      // If we're near the end and in AI mode, generate more content
      if (mode === 'ai' && current >= allSnippets.length - 3) {
        generateMoreContent();
      }
      
      console.log('Next card:', next);
      return next;
    });
  }, [allSnippets.length, mode, generateMoreContent]);

  const previousCard = useCallback(() => {
    setCurrentIndex((current) => {
      const prev = current > 0 ? current - 1 : allSnippets.length - 1;
      console.log('Previous card:', prev);
      return prev;
    });
  }, [allSnippets.length]);

  // Touch/swipe handlers with horizontal detection using refs
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Skip swipe handling when panels are open
    if (showCustomization || showRelatedTopics) return;
    
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, [showCustomization, showRelatedTopics]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Skip swipe handling when panels are open
    if (showCustomization || showRelatedTopics) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = touchStartRef.current.x - endX;
    const deltaY = touchStartRef.current.y - endY;
    
    const verticalThreshold = 50;
    const horizontalThreshold = 80; // Higher threshold for horizontal to prevent accidental triggers

    // Prioritize vertical swipes for card navigation
    // Only trigger horizontal if it's clearly dominant (2x more horizontal than vertical)
    if (Math.abs(deltaX) > horizontalThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      if (deltaX > 0) {
        // Swiped left - show customization
        setShowCustomization(true);
        console.log('Left swipe detected - showing customization');
      } else {
        // Swiped right - show related topics
        setShowRelatedTopics(true);
        console.log('Right swipe detected - showing related topics');
      }
    } else if (Math.abs(deltaY) > verticalThreshold) {
      // Vertical swipe for navigation
      if (deltaY > 0) {
        console.log('Swiping up - next card');
        nextCard();
      } else {
        console.log('Swiping down - previous card');
        previousCard();
      }
    }
  }, [showCustomization, showRelatedTopics, nextCard, previousCard]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        previousCard();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, previousCard, onBack]);

  // Background styles
  const getBackgroundClasses = () => {
    switch (backgroundStyle) {
      case 'light': return 'bg-gray-100';
      case 'blue': return 'bg-gradient-to-br from-blue-900 to-blue-800';
      case 'purple': return 'bg-gradient-to-br from-purple-900 to-purple-800';
      case 'green': return 'bg-gradient-to-br from-green-900 to-green-800';
      case 'orange': return 'bg-gradient-to-br from-orange-900 to-orange-800';
      case 'pink': return 'bg-gradient-to-br from-pink-900 to-pink-800';
      case 'teal': return 'bg-gradient-to-br from-teal-900 to-teal-800';
      case 'red': return 'bg-gradient-to-br from-red-900 to-red-800';
      case 'indigo': return 'bg-gradient-to-br from-indigo-900 to-indigo-800';
      case 'slate': return 'bg-gradient-to-br from-slate-900 to-slate-800';
      case 'emerald': return 'bg-gradient-to-br from-emerald-900 to-emerald-800';
      default: return 'bg-gray-900';
    }
  };

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
        "relative h-screen overflow-hidden transition-all duration-500 ease-in-out",
        getBackgroundClasses(),
        fontClass,
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="swipe-container"
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="font-semibold text-lg text-white" data-testid="text-topic-title">{topic}</h1>
          <p className="text-sm text-white/70">
            {currentIndex + 1} of {mode === 'ai' ? '∞' : allSnippets.length}
            {isLoading && ' • Loading...'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCustomization(true)}
            className="text-white hover:bg-white/20"
            data-testid="button-customize"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white hover:bg-white/20"
            data-testid="button-theme-toggle"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="relative h-full pt-16">
        {allSnippets.map((snippet, index) => (
          <SwipeCard
            key={index}
            content={snippet}
            index={index}
            total={allSnippets.length}
            isActive={index === currentIndex}
            onNext={nextCard}
            onPrevious={previousCard}
            onLike={onLike}
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-out",
              index === currentIndex 
                ? "opacity-100 translate-y-0 scale-100" 
                : index < currentIndex
                ? "opacity-0 -translate-y-full scale-95"
                : "opacity-0 translate-y-full scale-95"
            )}
          />
        ))}
      </div>

      {/* Swipe Instruction Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-white/60 md:hidden">
        <p>Swipe up/down to navigate</p>
        <p className="text-xs mt-1 opacity-80">Swipe left for settings • Swipe right for topics</p>
      </div>

      {/* Customization Panel */}
      <CustomizationPanel
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        onBackgroundChange={setBackgroundStyle}
        onFontChange={setFontClass}
      />

      {/* Related Topics Panel */}
      <RelatedTopicsPanel
        isOpen={showRelatedTopics}
        onClose={() => setShowRelatedTopics(false)}
        currentTopic={topic}
        onTopicSelect={(newTopic) => {
          onTopicChange?.(newTopic);
          console.log('New topic selected from related topics:', newTopic);
        }}
      />
    </div>
  );
}