import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  content: string;
  index: number;
  total: number;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onLike?: (content: string) => void;
  className?: string;
}

export function SwipeCard({ 
  content, 
  index, 
  total, 
  isActive, 
  onNext, 
  onPrevious, 
  onLike,
  className 
}: SwipeCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(content);
    console.log(`Card ${index + 1} ${!isLiked ? 'liked' : 'unliked'}`);
  };

  return (
    <div 
      className={cn(
        "relative h-screen w-full flex flex-col justify-center items-center p-8 transition-all duration-300",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      data-testid={`card-learn-${index}`}
    >
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto">
        <p 
          className="text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed text-center text-foreground"
          data-testid={`text-content-${index}`}
        >
          {content}
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
        {/* Like Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLike}
          className={cn(
            "h-12 w-12 rounded-full",
            isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"
          )}
          data-testid={`button-like-${index}`}
        >
          <Heart 
            className={cn("h-6 w-6", isLiked && "fill-current")} 
          />
        </Button>

        {/* Progress Dots */}
        <div className="flex gap-2" data-testid="progress-dots">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === index ? "bg-primary w-6" : "bg-muted"
              )}
              data-testid={`dot-${i}`}
            />
          ))}
        </div>

        {/* Empty space for symmetry */}
        <div className="w-12"></div>
      </div>
    </div>
  );
}