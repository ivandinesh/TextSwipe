import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ 
  message = "Generating your learning content...", 
  className 
}: LoadingScreenProps) {
  return (
    <div className={cn(
      "h-screen flex flex-col items-center justify-center gap-6 bg-background",
      className
    )}>
      <div className="relative">
        <div className="absolute inset-0 animate-pulse">
          <Sparkles className="h-12 w-12 text-primary/20" />
        </div>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
      
      <div className="text-center space-y-2 max-w-sm mx-auto px-4">
        <h2 className="text-xl font-semibold">Learning in Progress</h2>
        <p className="text-muted-foreground" data-testid="text-loading-message">
          {message}
        </p>
      </div>

      {/* Loading animation dots */}
      <div className="flex gap-2" data-testid="loading-dots">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
    </div>
  );
}