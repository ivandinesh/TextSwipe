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
  className?: string;
}

export function CardProgressTrail({
  currentIndex,
  total,
  activeTheme,
  activeTextTone,
  className,
}: CardProgressTrailProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3 md:right-5",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] backdrop-blur-md"
        style={{
          color: activeTextTone.text,
          borderColor: activeTheme.overlay,
          background: activeTheme.tile,
        }}
      >
        {currentIndex + 1} / {total}
      </div>

      <div className="relative flex flex-col items-center gap-2 py-1">
        {Array.from({ length: total }).map((_, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={index} className="relative flex h-5 w-5 items-center justify-center">
              {index < total - 1 && (
                <div
                  className="absolute top-[calc(100%-2px)] h-4 w-px"
                  style={{
                    background:
                      index < currentIndex
                        ? "linear-gradient(180deg, rgba(58,227,255,0.75), rgba(58,227,255,0.18))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04))",
                  }}
                />
              )}

              {isCurrent && (
                <span className="absolute h-5 w-5 rounded-full bg-primary/25 animate-ping" />
              )}

              <span
                className="relative block rounded-full transition-all duration-300"
                style={{
                  width: isCurrent ? "10px" : isPast ? "8px" : "6px",
                  height: isCurrent ? "10px" : isPast ? "8px" : "6px",
                  background: isCurrent
                    ? "#3AE3FF"
                    : isPast
                      ? "rgba(58,227,255,0.72)"
                      : "rgba(255,255,255,0.34)",
                  boxShadow: isCurrent
                    ? "0 0 18px rgba(58,227,255,0.75)"
                    : isPast
                      ? "0 0 10px rgba(58,227,255,0.35)"
                      : "none",
                  border: isCurrent || isPast ? "0" : `1px solid ${activeTheme.overlay}`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
