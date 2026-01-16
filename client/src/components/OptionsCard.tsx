import { useState } from "react";
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
  onGenerateMore: () => void;
  textColor?: string;
  fontClass?: string;
  className?: string;
}

export function OptionsCard({
  options,
  topic,
  onSelectOption,
  onGenerateMore,
  textColor,
  fontClass,
  className,
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
        "relative h-screen w-full flex flex-col justify-center items-center p-8 transition-all duration-300",
        className
      )}
      data-testid="options-card"
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
        <h2
          className={`text-2xl md:text-3xl font-bold mb-8 text-center ${fontClass || ''}`}
          style={textColor ? { color: textColor } : {}}
          data-testid="options-title"
        >
          Explore Related Topics
        </h2>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {options.map((option, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button
                onClick={() => handleOptionSelect(option.title)}
                className={cn(
                  "w-full h-32 p-4 text-left flex flex-col items-start justify-between border-2 border-primary/20 hover:border-primary/40 transition-all duration-200",
                  selectedOption === option.title && "border-primary bg-primary/10"
                )}
                data-testid={`option-${index}`}
              >
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-2 ${fontClass || ''}`}
                    style={textColor ? { color: textColor } : {}}
                  >
                    {option.title}
                  </h3>
                  <p
                    className={`text-sm ${fontClass || ''}`}
                    style={textColor ? { color: textColor, opacity: 0.8 } : { opacity: 0.8 }}
                  >
                    {option.description}
                  </p>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        <Button
          onClick={onGenerateMore}
          variant="outline"
          className={cn(
            "flex items-center gap-2 px-6 py-2",
            fontClass || ''
          )}
          style={textColor ? { color: textColor, borderColor: textColor } : {}}
          data-testid="generate-more-button"
        >
          🔄 Generate More on {topic}
        </Button>
      </div>

      {/* Bottom Controls (empty for symmetry) */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
        <div className="w-12"></div>
        <div className="flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === 9 ? "bg-primary w-6" : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="w-12"></div>
      </div>
    </div>
  );
}
