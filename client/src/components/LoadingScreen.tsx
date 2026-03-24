import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({
  message = "Generating your learning content...",
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "editorial-shell neon-grid relative h-screen overflow-hidden bg-background",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(58,227,255,0.12),transparent_30%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <div className="glass-panel w-full max-w-lg rounded-[2rem] px-8 py-10 text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(58,227,255,0.22)]">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <Sparkles className="absolute h-14 w-14 animate-pulse text-primary/25" />
              <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-primary/75">
              FocusFeed Engine
            </p>
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
              Building your next swipe set
            </h2>
            <p
              className="mx-auto max-w-sm text-sm leading-7 text-muted-foreground md:text-base"
              data-testid="text-loading-message"
            >
              {message}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3" data-testid="loading-dots">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="h-2.5 w-8 rounded-full bg-primary/70 animate-pulse"
                style={{
                  animationDelay: `${i * 0.18}s`,
                  animationDuration: "1.4s",
                }}
              />
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-sm text-muted-foreground">
            High-contrast cards, adaptive pacing, and a reading-first layout are
            being prepared for this topic now.
          </div>
        </div>
      </div>
    </div>
  );
}
