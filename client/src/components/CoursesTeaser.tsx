import { Lock, Sparkles } from "lucide-react";
import { appCopy } from "@/content/copy";

export function CoursesTeaser() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-primary/80">
        <Lock className="h-3.5 w-3.5" />
        {appCopy.home.coursesTeaserEyebrow}
      </div>
      <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground">
        {appCopy.home.coursesTeaserTitle}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {appCopy.home.coursesTeaserDescription}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm text-foreground/85">{appCopy.home.coursesTeaserMeta}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {["AI Foundations", "Startup Basics", "Body Language"].map((title, index) => (
          <div
            key={title}
            className="flex items-center justify-between rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <span className="text-sm">{title}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 6 }).map((_, dotIndex) => (
                <span
                  key={`${title}-${dotIndex}`}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      dotIndex <= index ? "rgba(58,227,255,0.45)" : "rgba(255,255,255,0.08)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
