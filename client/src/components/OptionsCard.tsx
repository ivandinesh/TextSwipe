import { useState } from "react";
import { ArrowRight, RefreshCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option {
  title: string;
  description: string;
}

interface OptionsCardProps {
  options: Option[];
  topic: string;
  onSelectOption: (option: string) => void;
  onGenerateMore: (findNewTopics?: boolean) => void;
  textColor?: string;
  mutedTextColor?: string;
  fontClass?: string;
  className?: string;
  panelStyle?: React.CSSProperties;
  tileStyle?: React.CSSProperties;
}

export function OptionsCard({
  options,
  topic,
  onSelectOption,
  onGenerateMore,
  textColor,
  mutedTextColor,
  fontClass,
  className,
  panelStyle,
  tileStyle,
}: OptionsCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (optionTitle: string) => {
    setSelectedOption(optionTitle);
    setTimeout(() => {
      onSelectOption(optionTitle);
    }, 300);
  };

  return (
    <div
      className={cn(
        "relative min-h-full w-full px-4 pb-24 pt-3 transition-all duration-300 md:px-8 md:pb-10 md:pt-4",
        className,
      )}
      data-testid="options-card"
    >
      <div className="mx-auto flex w-full max-w-[min(94vw,78rem)] flex-col">
        <div
          className="rounded-[2rem] border px-5 py-6 backdrop-blur-2xl md:px-8 md:py-8"
          style={panelStyle}
        >
          <div className="mb-6 flex justify-center md:hidden">
            <div className="h-1.5 w-14 rounded-full bg-white/15" />
          </div>

          <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                Continue The Session
              </p>
              <h2
                className={cn(
                  "mt-3 text-2xl font-semibold leading-tight md:text-4xl",
                  fontClass || "",
                )}
                style={textColor ? { color: textColor } : {}}
                data-testid="options-title"
              >
                Pick the next direction for {topic}
              </h2>
              <p
                className="mt-3 max-w-xl text-sm leading-6 md:text-base md:leading-7"
                style={{ color: mutedTextColor || textColor }}
              >
                Start a fresh 10-card branch, regenerate this topic, or ask for a
                new set of related directions.
              </p>
            </div>
            <div
              className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm"
              style={{ color: mutedTextColor || textColor }}
            >
              {options.length > 0 ? `${options.length} curated follow-ups` : "No follow-ups yet"}
            </div>
          </div>

          <div
            className="mb-5 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm md:hidden"
            style={{ color: mutedTextColor || textColor }}
          >
            Scroll to explore all follow-up branches.
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            {options.map((option, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative min-w-0"
              >
                <Button
                  onClick={() => handleOptionSelect(option.title)}
                  className={cn(
                    "flex h-full min-h-[12rem] w-full min-w-0 flex-col items-start justify-between whitespace-normal break-words rounded-[1.5rem] border p-4 text-left transition-all duration-200 hover:border-primary/35 hover:bg-white/[0.07] md:p-5",
                    selectedOption === option.title && "border-primary bg-primary/10",
                  )}
                  style={tileStyle}
                  data-testid={`option-${index}`}
                >
                  <div className="flex min-h-[9rem] w-full min-w-0 flex-col justify-between">
                    <div className="min-w-0">
                      <h3
                        className={cn("text-base font-semibold leading-tight break-words md:text-lg", fontClass || "")}
                        style={textColor ? { color: textColor } : {}}
                      >
                        {option.title}
                      </h3>
                      <p
                        className="mt-3 whitespace-normal break-words text-sm leading-6"
                        style={{ color: mutedTextColor || textColor }}
                      >
                        {option.description}
                      </p>
                    </div>
                    <div className="mt-5 flex w-full items-center gap-2 whitespace-normal text-sm font-medium text-primary">
                      Start new 10-card branch
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 md:mt-8 md:flex-row md:pt-6">
            <Button
              onClick={() => onGenerateMore(false)}
              variant="outline"
              className={cn(
                "min-h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 py-3 text-foreground",
                fontClass || "",
              )}
              data-testid="generate-more-button"
            >
              <RefreshCcw className="h-4 w-4" />
              Restart this topic with 10 new cards
            </Button>
            <Button
              onClick={() => onGenerateMore(true)}
              variant="outline"
              className={cn(
                "min-h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 py-3 text-foreground",
                fontClass || "",
              )}
              data-testid="find-more-topics-button"
            >
              <Search className="h-4 w-4" />
              Show different branch ideas
            </Button>
          </div>

          {options.length === 0 && (
            <div
              className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm"
              style={{ color: mutedTextColor || textColor }}
            >
              No related topics were returned this time, so you can refresh the
              deck or ask for a different set of branches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
