import { useState, useEffect, useCallback } from "react";
import { SwipeCard } from "./SwipeCard";
import { CustomizationPanel } from "./CustomizationPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Sun, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeContainerProps {
  snippets: string[];
  topic: string;
  mode: 'ai' | 'demo';
  onBack: () => void;
  onLike?: (content: string) => void;
  className?: string;
}

export function SwipeContainer({ 
  snippets, 
  topic,
  mode,
  onBack, 
  onLike,
  className 
}: SwipeContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [allSnippets, setAllSnippets] = useState<string[]>(snippets);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState("dark");
  const [fontClass, setFontClass] = useState("font-sans");

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

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    console.log('Touch start at:', e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY - endY;
    const threshold = 50;

    console.log('Touch end - startY:', startY, 'endY:', endY, 'deltaY:', deltaY);

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        console.log('Swiping up - next card');
        nextCard();
      } else {
        console.log('Swiping down - previous card');
        previousCard();
      }
    }
  }, [startY, nextCard, previousCard]);

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
      </div>

      {/* Customization Panel */}
      <CustomizationPanel
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        onBackgroundChange={setBackgroundStyle}
        onFontChange={setFontClass}
      />
    </div>
  );
}