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
  isLiked?: boolean;
  className?: string;
  textColor?: string;
  mutedTextColor?: string;
  fontClass?: string;
  progressLabel?: string;
  panelStyle?: React.CSSProperties;
  backlightStyle?: React.CSSProperties;
  showChrome?: boolean;
  onSurfaceTap?: () => void;
}

export function SwipeCard({
  content,
  index,
  total,
  isActive,
  onNext,
  onPrevious,
  onLike,
  isLiked = false,
  className,
  textColor,
  mutedTextColor,
  fontClass,
  progressLabel,
  panelStyle,
  backlightStyle,
  showChrome = true,
  onSurfaceTap,
}: SwipeCardProps) {
  const handleLike = () => {
    onLike?.(content);
  };

  return (
    <div
      className={cn(
        "relative h-screen w-full px-5 pb-8 pt-6 transition-all duration-300 md:px-8 md:pb-10",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
      data-testid={`card-learn-${index}`}
    >
      <div className="mx-auto flex h-full w-full max-w-[min(92vw,72rem)] flex-col justify-between">
        <div className="relative flex-1">
          <div
            className={cn(
              "pointer-events-none absolute inset-x-[8%] top-[14%] h-[58%] rounded-full blur-3xl transition-all duration-300 md:inset-x-[16%]",
              showChrome ? "opacity-90 scale-100" : "opacity-75 scale-110",
            )}
            style={backlightStyle}
          />
          <div
            className="relative min-h-[68vh] rounded-[2rem] border px-6 py-8 backdrop-blur-2xl transition-all duration-300 md:min-h-[72vh] md:px-12 md:py-10"
            style={panelStyle}
            data-card-surface="true"
            onClick={() => {
              if (window.matchMedia("(hover: hover)").matches) {
                onSurfaceTap?.();
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSurfaceTap?.();
              }
            }}
          >
            <div
              className={cn(
                "mb-8 flex items-center justify-between gap-4 transition-all duration-250",
                showChrome
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0",
              )}
            >
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                Insight {index + 1}
              </div>
              <div
                className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs"
                style={{ color: mutedTextColor || textColor }}
              >
                Keep swiping
              </div>
            </div>

            <div className="flex min-h-[42vh] items-center justify-center overflow-visible py-4 md:min-h-[46vh]">
              <div className="w-full py-2">
                <p
                  className={cn(
                    "mx-auto max-w-[16ch] overflow-visible text-center text-2xl font-medium leading-[1.42] tracking-[-0.02em] md:max-w-[18ch] md:text-[clamp(2.8rem,4vw,4.4rem)] md:leading-[1.26]",
                    fontClass || "",
                  )}
                  style={
                    textColor
                      ? {
                          color: textColor,
                          textShadow: "0 8px 30px rgba(0,0,0,0.18)",
                        }
                      : {}
                  }
                  data-testid={`text-content-${index}`}
                >
                  {content}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "mt-8 flex items-center justify-center transition-all duration-250",
                showChrome
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              <div
                className="max-w-xl text-center text-sm leading-6"
                style={{ color: mutedTextColor || textColor }}
              >
                One focused idea per card. Tap to reveal controls when you want them.
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "safe-bottom mt-5 flex items-center justify-between gap-4 px-1 transition-all duration-250",
            showChrome
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={cn(
              "h-12 w-12 rounded-full border border-white/10 bg-white/[0.04]",
              isLiked
                ? "text-red-400 shadow-[0_0_24px_rgba(248,113,113,0.25)]"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`button-like-${index}`}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span
                className="text-xs uppercase tracking-[0.22em]"
                style={{ color: mutedTextColor || textColor }}
              >
                Progress
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: mutedTextColor || textColor }}
              >
                {progressLabel || `${index + 1} / ${total}`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, segment) => {
                const progress = ((index + 1) / Math.max(total, 1)) * 5;
                return (
                  <div
                    key={segment}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      progress > segment ? "bg-primary" : "bg-white/10",
                    )}
                    data-testid={`dot-${segment}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
