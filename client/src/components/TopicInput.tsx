import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Sparkles, Book } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTopicService } from "@/services/topicService";

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isLoading?: boolean;
  className?: string;
}

// Surprising and lesser-known topics
const SURPRISE_TOPICS = [
  "The Science of Lucid Dreaming",
  "How Fungi Control Our Minds",
  "The Mystery of Dark Flow",
  "Quantum Biology in Birds",
  "The Hidden World of Soil",
  "The Physics of Black Holes",
  "The Secret Life of Plants",
  "The Science of Synesthesia",
  "The Mystery of Ball Lightning",
  "The Hidden Universe of Microbes",
  "The Science of Déjà Vu",
  "The Mystery of Dark Energy"
];

export function TopicInput({ onSubmit, isLoading = false, className }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const topicService = useTopicService();
  const [popularTopics, setPopularTopics] = useState<string[]>([]);

  // Load popular topics
  useEffect(() => {
    setPopularTopics(topicService.getPopularTopics(6));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim());
    }
  };

  const handleRandomTopic = () => {
    const allTopics = topicService.getPopularTopics(12);
    const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
    setTopic(randomTopic);
    onSubmit(randomTopic);
    topicService.trackTopicSelection(randomTopic);
    console.log('Random topic selected:', randomTopic);
  };

  const handleSurpriseTopic = () => {
    const surpriseTopic = SURPRISE_TOPICS[Math.floor(Math.random() * SURPRISE_TOPICS.length)];
    setTopic(surpriseTopic);
    onSubmit(surpriseTopic);
    console.log('Surprise topic selected:', surpriseTopic);
  };

  return (
    <div className={cn("w-full max-w-md mx-auto space-y-6", className)}>
      {/* FocusFeed Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="What do you want to focus on? (e.g., Quantum Computing)"
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
            data-testid="button-start-focusing"
          >
            {isLoading ? "Loading..." : "Start Focusing"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleSurpriseTopic}
            disabled={isLoading}
            className="flex-1 gap-2"
            data-testid="button-surprise-me"
          >
            <Sparkles className="h-4 w-4" />
            Surprise Me
          </Button>
        </div>
      </form>

      {/* Popular Topics */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Popular Focus Topics:</p>
        <div className="flex flex-wrap gap-2">
          {popularTopics.map((popularTopic, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => {
                setTopic(popularTopic);
                onSubmit(popularTopic);
                topicService.trackTopicSelection(popularTopic);
                console.log('Popular topic selected:', popularTopic);
              }}
              data-testid={`badge-popular-${index}`}
            >
              {popularTopic}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
