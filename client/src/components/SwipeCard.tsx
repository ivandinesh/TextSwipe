import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  content: string;
  index: number;
  total: number;
  isActive: boolean;
  className?: string;
  textColor?: string;
  mutedTextColor?: string;
  fontClass?: string;
  progressLabel?: string;
  panelStyle?: React.CSSProperties;
  backlightStyle?: React.CSSProperties;
  showChrome?: boolean;
  showSwipeHint?: boolean;
  isLiked?: boolean;
  onLike?: () => void;
  onSurfaceTap?: () => void;
}

export function SwipeCard({
  content,
  index,
  total,
  isActive,
  className,
  textColor,
  mutedTextColor,
  fontClass,
  progressLabel,
  panelStyle,
  backlightStyle,
  showChrome = true,
  showSwipeHint = false,
  isLiked = false,
  onLike,
  onSurfaceTap,
}: SwipeCardProps) {
  return (
    <div
      className={cn(
        "relative h-full w-full px-4 pb-4 pt-3 transition-all duration-300 md:h-full md:px-8 md:pb-8 md:pt-5",
        isActive ? "opacity-100" : "opacity-0",
        className,
      )}
      data-testid={`card-learn-${index}`}
    >
      <div className="mx-auto flex h-full w-full max-w-[min(92vw,72rem)] flex-col">
        <div className="relative h-full flex-1">
          <div
            className={cn(
              "pointer-events-none absolute inset-x-[8%] top-[14%] h-[58%] rounded-full blur-3xl transition-all duration-300 md:inset-x-[16%]",
              showChrome ? "opacity-90 scale-100" : "opacity-75 scale-110",
            )}
            style={backlightStyle}
          />
          <div
            className="relative flex h-full min-h-0 flex-col rounded-[2rem] border px-5 py-5 backdrop-blur-2xl transition-all duration-300 md:px-12 md:py-8"
            style={panelStyle}
            data-card-surface="true"
            onClick={() => {
              if (window.matchMedia("(hover: hover)").matches) {
                onSurfaceTap?.();
              }
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              onLike?.();
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
                Focus mode
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-visible py-2 md:py-3">
              <div className="w-full py-1">
                <p
                  className={cn(
                    "mx-auto max-w-[15ch] overflow-visible text-center text-[clamp(1.9rem,7vw,2.55rem)] font-medium leading-[1.34] tracking-[-0.02em] md:max-w-[18ch] md:text-[clamp(2.8rem,4vw,4.4rem)] md:leading-[1.26]",
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

            <div className="absolute bottom-5 right-5 md:bottom-6 md:right-6">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onLike?.();
                }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200",
                  isLiked
                    ? "border-primary/50 bg-primary/20 text-primary"
                    : "border-white/10 bg-black/20 text-white/75 hover:bg-white/10",
                )}
                aria-label={isLiked ? "Remove favorite" : "Save favorite"}
                data-chrome-control="true"
              >
                <Heart className={cn("h-4.5 w-4.5", isLiked && "fill-current")} />
              </button>
            </div>

            <div
              className={cn(
                "pointer-events-none absolute inset-x-5 bottom-20 flex items-center justify-between gap-3 transition-all duration-300 md:inset-x-10 md:bottom-24",
                showSwipeHint ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
            >
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-medium tracking-[0.16em] text-white/80 backdrop-blur-md md:text-xs">
                Swipe left for previous
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-medium tracking-[0.16em] text-white/80 backdrop-blur-md md:text-xs">
                Swipe right for next
              </div>
            </div>

            <div
              className={cn(
                "mt-5 flex items-center justify-center transition-all duration-250 md:mt-6",
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
            <div
              className={cn(
                "mt-5 transition-all duration-250 md:mt-6",
                showChrome
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-4 opacity-0",
              )}
            >
              <div className="min-w-0">
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
      </div>
    </div>
  );
}
