import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTopicService } from "@/services/topicService";
import { cn } from "@/lib/utils";

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isLoading?: boolean;
  className?: string;
}

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
  "The Science of Deja Vu",
  "The Mystery of Dark Energy",
];

export function TopicInput({ onSubmit, isLoading = false, className }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const topicService = useTopicService();
  const [popularTopics, setPopularTopics] = useState<string[]>([]);

  useEffect(() => {
    setPopularTopics(topicService.getPopularTopics(6));
  }, [topicService]);

  const submitTopic = (nextTopic: string) => {
    topicService.trackTopicSelection(nextTopic);
    onSubmit(nextTopic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      submitTopic(topic.trim());
    }
  };

  const handleSurpriseTopic = () => {
    const surpriseTopic = SURPRISE_TOPICS[Math.floor(Math.random() * SURPRISE_TOPICS.length)];
    setTopic(surpriseTopic);
    submitTopic(surpriseTopic);
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-7", className)}>
      <div className="glass-panel rounded-[2rem] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)] md:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-primary/75">
              Learning Prompt
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground md:text-2xl">
              Drop into a focus stream
            </h2>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground md:block">
            Swipe-ready in seconds
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="What do you want to focus on? Example: quantum computing, lucid dreaming, dark matter"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
            className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-left text-base text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-primary"
            data-testid="input-topic"
          />

          <div className="flex flex-col gap-3 md:flex-row">
            <Button
              type="submit"
              disabled={!topic.trim() || isLoading}
              className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_34px_rgba(58,227,255,0.28)]"
              data-testid="button-start-focusing"
            >
              {isLoading ? "Loading..." : "Start Focus Session"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSurpriseTopic}
              disabled={isLoading}
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-foreground"
              data-testid="button-surprise-me"
            >
              <Sparkles className="h-4 w-4" />
              Surprise Me
            </Button>
          </div>
        </form>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <Wand2 className="mt-0.5 h-4 w-4 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            FocusFeed turns any topic into a vertical deck of concise, swipeable
            insights with optional next-step topics when you want to go deeper.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Trending Focus Topics
          </p>
          <p className="hidden text-xs text-muted-foreground md:block">
            Tap a chip to jump straight in
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {popularTopics.map((popularTopic, index) => (
            <button
              key={index}
              type="button"
              className="chip-surface rounded-full px-4 py-2 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
              onClick={() => {
                setTopic(popularTopic);
                submitTopic(popularTopic);
              }}
              data-testid={`badge-popular-${index}`}
            >
              {popularTopic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
