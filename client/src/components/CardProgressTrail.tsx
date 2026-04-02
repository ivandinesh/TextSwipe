import { cn } from "@/lib/utils";

interface TextToneColors {
  text: string;
  muted: string;
}

interface ThemeSurface {
  overlay: string;
  tile: string;
}

interface CardProgressTrailProps {
  currentIndex: number;
  total: number;
  activeTheme: ThemeSurface;
  activeTextTone: TextToneColors;
  variant?: "steps" | "compact-bar";
  className?: string;
}

export function CardProgressTrail({
  currentIndex,
  total,
  activeTheme,
  activeTextTone,
  variant = "steps",
  className,
}: CardProgressTrailProps) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  if (variant === "compact-bar") {
    return (
      <div
        className={cn("pointer-events-none flex w-full items-center gap-3", className)}
        aria-hidden="true"
      >
        <span
          className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: activeTextTone.muted }}
        >
          {String(currentIndex + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <div
          className="relative h-2 flex-1 overflow-hidden rounded-full"
          style={{
            background: `linear-gradient(90deg, ${activeTheme.tile}, rgba(255,255,255,0.08))`,
            boxShadow: `inset 0 0 0 1px ${activeTheme.overlay}`,
          }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, rgba(58,227,255,0.9), rgba(117,160,255,0.88), rgba(211,172,255,0.8))",
              boxShadow: "0 0 22px rgba(58,227,255,0.38)",
            }}
          />
          <span
            className="absolute inset-y-[1px] left-0 rounded-full opacity-60"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0))",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none flex items-center justify-center",
        className,
      )}
      aria-hidden="true"
    >
      <div className="relative flex items-center gap-1.5 md:gap-2">
        {Array.from({ length: total }).map((_, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={index} className="relative flex h-6 w-6 items-center justify-center md:h-7 md:w-7">
              {index < total - 1 && (
                <div
                  className="absolute left-[calc(100%-1px)] h-px w-2 md:w-2.5"
                  style={{
                    background:
                      index < currentIndex
                        ? "linear-gradient(90deg, rgba(58,227,255,0.75), rgba(58,227,255,0.18))"
                        : "linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04))",
                  }}
                />
              )}

              {isCurrent && (
                <span className="absolute h-6 w-6 rounded-full bg-primary/20 animate-ping md:h-7 md:w-7" />
              )}

              <span
                className="relative flex items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300 md:text-[11px]"
                style={{
                  width: isCurrent ? "24px" : "22px",
                  height: isCurrent ? "24px" : "22px",
                  color: isCurrent
                    ? "#05131B"
                    : isPast
                      ? "#D7F8FF"
                      : activeTextTone.muted,
                  background: isCurrent
                    ? "#3AE3FF"
                    : isPast
                      ? "rgba(58,227,255,0.22)"
                      : activeTheme.tile,
                  boxShadow: isCurrent
                    ? "0 0 18px rgba(58,227,255,0.75)"
                    : isPast
                      ? "0 0 10px rgba(58,227,255,0.35)"
                      : "none",
                  border:
                    isCurrent || isPast
                      ? "0"
                      : `1px solid ${activeTheme.overlay}`,
                }}
              >
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
