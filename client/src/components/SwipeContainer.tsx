import { useState, useEffect } from "react";
import { SwipeCard } from "./SwipeCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeContainerProps {
  snippets: string[];
  topic: string;
  onBack: () => void;
  onLike?: (content: string) => void;
  className?: string;
}

export function SwipeContainer({ 
  snippets, 
  topic, 
  onBack, 
  onLike,
  className 
}: SwipeContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
    console.log('Theme toggled to:', newDarkMode ? 'dark' : 'light');
  };

  const nextCard = () => {
    if (currentIndex < snippets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      console.log('Next card:', currentIndex + 1);
    } else {
      // Loop back to first card
      setCurrentIndex(0);
      console.log('Looped back to first card');
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      console.log('Previous card:', currentIndex - 1);
    } else {
      // Loop to last card
      setCurrentIndex(snippets.length - 1);
      console.log('Looped to last card');
    }
  };

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY - endY;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        nextCard();
      } else {
        previousCard();
      }
    }
  };

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
  }, [currentIndex]);

  if (!snippets.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No learning content available</p>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative h-screen overflow-hidden bg-background", className)}
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
          <h1 className="font-semibold text-lg" data-testid="text-topic-title">{topic}</h1>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {snippets.length}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Cards Container */}
      <div className="relative h-full pt-16">
        {snippets.map((snippet, index) => (
          <SwipeCard
            key={index}
            content={snippet}
            index={index}
            total={snippets.length}
            isActive={index === currentIndex}
            onNext={nextCard}
            onPrevious={previousCard}
            onLike={onLike}
            className="absolute inset-0"
          />
        ))}
      </div>

      {/* Swipe Instruction Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-muted-foreground md:hidden">
        <p>Swipe up/down to navigate</p>
      </div>
    </div>
  );
}