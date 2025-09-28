import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Sparkles, Book } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicInputProps {
  onSubmit: (topic: string, mode: 'ai' | 'demo') => void;
  isLoading?: boolean;
  className?: string;
}

const RANDOM_TOPICS = [
  "Python basics",
  "Italian recipes", 
  "Space facts",
  "Photography tips",
  "History trivia",
  "Math concepts",
  "Cooking techniques",
  "Science experiments",
  "Machine Learning",
  "Cryptocurrency",
  "Climate Change",
  "Psychology facts"
];

export function TopicInput({ onSubmit, isLoading = false, className }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const [selectedMode, setSelectedMode] = useState<'ai' | 'demo'>('demo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim(), selectedMode);
    }
  };

  const handleRandomTopic = () => {
    const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    setTopic(randomTopic);
    // Force AI mode for random topics to ensure content generation
    onSubmit(randomTopic, 'ai');
    console.log('Random topic selected:', randomTopic, 'Mode: ai');
  };

  return (
    <div className={cn("w-full max-w-md mx-auto space-y-6", className)}>
      {/* Mode Selection */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Choose your learning mode:</p>
        <div className="flex gap-3">
          <Button
            variant={selectedMode === 'demo' ? "default" : "outline"}
            onClick={() => setSelectedMode('demo')}
            className="flex-1 gap-2"
            data-testid="button-mode-demo"
          >
            <Book className="h-4 w-4" />
            Demo Mode
          </Button>
          <Button
            variant={selectedMode === 'ai' ? "default" : "outline"}
            onClick={() => setSelectedMode('ai')}
            className="flex-1 gap-2"
            data-testid="button-mode-ai"
          >
            <Sparkles className="h-4 w-4" />
            AI Mode
          </Button>
        </div>
        
        {selectedMode === 'ai' && (
          <Badge variant="secondary" className="w-full justify-center py-2">
            Requires OpenAI API key
          </Badge>
        )}
      </div>

      {/* Topic Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="What do you want to learn? (e.g., Python basics)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
            className="text-center"
            data-testid="input-topic"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="flex-1"
            data-testid="button-start-learning"
          >
            {isLoading ? "Loading..." : "Start Learning"}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleRandomTopic}
            disabled={isLoading}
            size="icon"
            data-testid="button-random-topic"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Quick Topic Suggestions */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Or try these popular topics:</p>
        <div className="flex flex-wrap gap-2">
          {RANDOM_TOPICS.slice(0, 4).map((suggestedTopic, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover-elevate"
              onClick={() => {
                setTopic(suggestedTopic);
                // Force AI mode for popular topics to ensure content generation
                onSubmit(suggestedTopic, 'ai');
                console.log('Popular topic selected:', suggestedTopic, 'Mode: ai');
              }}
              data-testid={`badge-topic-${index}`}
            >
              {suggestedTopic}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}