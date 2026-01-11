import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, Lightbulb, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelatedTopicsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopic: string;
  onTopicSelect: (topic: string) => void;
}

// Generate related topics based on the current topic
const getRelatedTopics = (topic: string): string[] => {
  const topicLower = topic.toLowerCase();

  // Topic categories with related suggestions
  const topicMappings: Record<string, string[]> = {
    // Programming
    python: ["JavaScript fundamentals", "Data Science with Python", "Web scraping", "Django framework", "Machine Learning basics"],
    javascript: ["React development", "Node.js basics", "TypeScript", "Web APIs", "Frontend frameworks"],
    programming: ["Algorithms", "Data structures", "System design", "Database basics", "API development"],

    // Science & Tech
    space: ["Astronomy basics", "Mars exploration", "Solar system", "Black holes", "Space missions"],
    science: ["Physics concepts", "Chemistry basics", "Biology facts", "Scientific method", "Lab experiments"],
    physics: ["Quantum mechanics", "Relativity theory", "Thermodynamics", "Electromagnetism", "Nuclear physics"],

    // Food & Cooking
    cooking: ["Knife skills", "Sauce making", "Baking basics", "International cuisines", "Food safety"],
    italian: ["French cuisine", "Mediterranean diet", "Wine pairing", "Pasta varieties", "European cooking"],
    recipes: ["Meal planning", "Nutrition facts", "Cooking techniques", "Kitchen tools", "Food storage"],

    // Arts & Creativity
    photography: ["Photo editing", "Camera settings", "Composition rules", "Portrait techniques", "Landscape photography"],
    art: ["Drawing basics", "Color theory", "Art history", "Digital art", "Painting techniques"],

    // History & Culture
    history: ["World wars", "Ancient civilizations", "Historical figures", "Cultural movements", "Archaeological discoveries"],

    // Health & Fitness
    fitness: ["Nutrition basics", "Workout routines", "Mental health", "Sleep hygiene", "Meditation techniques"],
    health: ["Exercise science", "Healthy eating", "Stress management", "Preventive care", "Wellness tips"],

    // Business & Finance
    business: ["Entrepreneurship", "Marketing basics", "Financial planning", "Leadership skills", "Business strategy"],
    finance: ["Investment basics", "Cryptocurrency", "Personal budgeting", "Economic principles", "Financial markets"],

    // Technology
    ai: ["Machine Learning", "Neural networks", "Data analysis", "Automation", "Future of AI"],
    technology: ["Cybersecurity", "Cloud computing", "Internet of Things", "Blockchain", "Virtual reality"],
  };

  // Find matching categories
  for (const [key, relatedTopics] of Object.entries(topicMappings)) {
    if (topicLower.includes(key)) {
      return relatedTopics;
    }
  }

  // Default related topics if no specific match
  return [
    "Personal development",
    "Creative writing",
    "Problem solving",
    "Critical thinking",
    "Communication skills"
  ];
};

const POPULAR_TOPICS = [
  "Artificial Intelligence", "Climate Science", "Psychology", "Philosophy",
  "Economics", "Astronomy", "Biology", "Chemistry", "Mathematics",
  "Literature", "Music Theory", "Film Studies", "Architecture", "Design Thinking"
];

export function RelatedTopicsPanel({
  isOpen,
  onClose,
  currentTopic,
  onTopicSelect,
}: RelatedTopicsPanelProps) {
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [popularTopics] = useState(POPULAR_TOPICS);

  useEffect(() => {
    if (currentTopic) {
      const related = getRelatedTopics(currentTopic);
      setRelatedTopics(related);
    }
  }, [currentTopic]);

  const handleTopicClick = (topic: string) => {
    onTopicSelect(topic);
    onClose();
    console.log('Related topic selected:', topic);
  };

  if (!isOpen) return null;

  // Swipe-to-close functionality for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return;
      const touchEnd = e.touches[0].clientY;
      const diff = touchStart - touchEnd;

      if (diff > 50) { // Swipe down more than 50px to close
        onClose();
      }
    };

    const panel = panelRef.current;
    if (panel) {
      panel.addEventListener('touchstart', handleTouchStart);
      panel.addEventListener('touchmove', handleTouchMove);
      return () => {
        panel.removeEventListener('touchstart', handleTouchStart);
        panel.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [touchStart, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={panelRef}
        className={`bg-card rounded-lg p-6 w-full max-w-md border transition-transform duration-200 ${
          touchStart ? 'translate-y-2' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="bg-card rounded-lg p-6 w-full max-w-md border max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Explore More</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-related-topics"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <h3 className="font-medium">Related to "{currentTopic}"</h3>
            </div>

            <div className="space-y-2">
              {relatedTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTopicClick(topic)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all hover-elevate",
                    "border-border hover:border-primary/50"
                  )}
                  data-testid={`button-related-topic-${index}`}
                >
                  <div className="font-medium">{topic}</div>
                  <div className="text-sm text-muted-foreground">Explore this topic</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Topics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <h3 className="font-medium">Popular Topics</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {popularTopics.map((topic, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover-elevate"
                onClick={() => handleTopicClick(topic)}
                data-testid={`badge-popular-topic-${index}`}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Mobile-friendly bottom close button */}
        <div className="mt-6 pt-4 border-t border-border md:hidden">
          <Button
            variant="outline"
            className="w-full py-3"
            onClick={onClose}
            data-testid="button-close-bottom"
          >
            Close Topics
          </Button>
        </div>

        {/* Swipe hint for mobile users */}
        <div className="flex justify-center mb-4 md:hidden">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDown className="h-4 w-4" />
            <span>Swipe down to close</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
