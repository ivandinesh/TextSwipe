import { cn } from "@/lib/utils";

interface AccentSurface {
  surface: string;
  glow: string;
  border: string;
  muted: string;
}

interface CourseModuleDotsProps {
  currentIndex: number;
  total: number;
  accent: AccentSurface;
  className?: string;
}

export function CourseModuleDots({
  currentIndex,
  total,
  accent,
  className,
}: CourseModuleDotsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} aria-hidden="true">
      {Array.from({ length: total }).map((_, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <span
            key={index}
            className="relative h-3.5 w-3.5 rounded-full transition-all duration-300"
            style={{
              background: isCurrent
                ? accent.surface
                : isPast
                  ? `${accent.surface}88`
                  : "rgba(255,255,255,0.08)",
              boxShadow: isCurrent
                ? `0 0 18px ${accent.glow}`
                : isPast
                  ? `0 0 10px ${accent.glow}`
                  : "none",
              border: isPast || isCurrent ? "none" : `1px solid ${accent.border}`,
            }}
          />
        );
      })}
    </div>
  );
}

