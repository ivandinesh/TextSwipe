import { Heart } from "lucide-react";
import { appCopy } from "@/content/copy";
import { getCardTextSizeTier } from "@/lib/cardText";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  content: string;
  index: number;
  isActive: boolean;
  className?: string;
  textColor?: string;
  mutedTextColor?: string;
  fontClass?: string;
  panelStyle?: React.CSSProperties;
  backlightStyle?: React.CSSProperties;
  showSwipeHint?: boolean;
  isLiked?: boolean;
  onLike?: () => void;
}

export function SwipeCard({
  content,
  index,
  isActive,
  className,
  textColor,
  mutedTextColor,
  fontClass,
  panelStyle,
  backlightStyle,
  showSwipeHint = false,
  isLiked = false,
  onLike,
}: SwipeCardProps) {
  const sizeTier = getCardTextSizeTier(content);

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
              "opacity-90 scale-100",
            )}
            style={backlightStyle}
          />
          <div
            className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border px-5 py-5 backdrop-blur-2xl transition-all duration-300 md:px-12 md:py-8"
            style={panelStyle}
            data-card-surface="true"
            onDoubleClick={(event) => {
              event.stopPropagation();
              onLike?.();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key.toLowerCase() === "f") {
                event.preventDefault();
                onLike?.();
              }
            }}
          >
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-visible py-2 md:py-3">
              <div className="w-full">
                <p
                  className={cn(
                    "mx-auto overflow-visible text-center font-medium tracking-[-0.02em]",
                    sizeTier === "short" &&
                      "max-w-[15ch] text-[clamp(1.85rem,6.6vw,2.45rem)] leading-[1.32] md:max-w-[18ch] md:text-[clamp(2.8rem,4vw,4.4rem)] md:leading-[1.24]",
                    sizeTier === "medium" &&
                      "max-w-[17ch] text-[clamp(1.72rem,5.9vw,2.24rem)] leading-[1.38] md:max-w-[19ch] md:text-[clamp(2.45rem,3.6vw,3.7rem)] md:leading-[1.28]",
                    sizeTier === "long" &&
                      "max-w-[19ch] text-[clamp(1.52rem,5vw,1.96rem)] leading-[1.44] md:max-w-[21ch] md:text-[clamp(2.05rem,3vw,3.05rem)] md:leading-[1.34]",
                    sizeTier === "xlong" &&
                      "max-w-[21ch] text-[clamp(1.36rem,4.2vw,1.76rem)] leading-[1.5] md:max-w-[23ch] md:text-[clamp(1.78rem,2.55vw,2.6rem)] md:leading-[1.4]",
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
                aria-label={isLiked ? appCopy.card.unsaveLabel : appCopy.card.saveLabel}
                data-chrome-control="true"
              >
                <Heart className={cn("h-4.5 w-4.5", isLiked && "fill-current")} />
              </button>
            </div>

            <div
              className={cn(
                "pointer-events-none absolute inset-x-4 bottom-20 flex items-center justify-between gap-2 transition-all duration-300 md:inset-x-10 md:bottom-24 md:gap-3",
                showSwipeHint ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
            >
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-medium tracking-[0.14em] text-white/80 backdrop-blur-md md:text-xs">
                {appCopy.card.previousHint}
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-medium tracking-[0.14em] text-white/80 backdrop-blur-md md:text-xs">
                {appCopy.card.nextHint}
              </div>
            </div>

            {index === 0 && (
              <div className="mt-5 flex items-center justify-center md:mt-6">
                <div
                  className="max-w-xl text-center text-sm leading-6"
                  style={{ color: mutedTextColor || textColor }}
                >
                  {appCopy.card.helper}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
