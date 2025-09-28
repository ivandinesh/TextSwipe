import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, X, Palette, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBackgroundChange: (color: string) => void;
  onFontChange: (font: string) => void;
}

const BACKGROUND_OPTIONS = [
  { name: "Dark", value: "dark", class: "bg-gray-900" },
  { name: "Light", value: "light", class: "bg-gray-100" },
  { name: "Blue", value: "blue", class: "bg-blue-900" },
  { name: "Purple", value: "purple", class: "bg-purple-900" },
  { name: "Green", value: "green", class: "bg-green-900" },
  { name: "Orange", value: "orange", class: "bg-orange-900" },
];

const FONT_OPTIONS = [
  { name: "Inter", value: "font-sans" },
  { name: "Serif", value: "font-serif" },
  { name: "Mono", value: "font-mono" },
];

export function CustomizationPanel({ 
  isOpen, 
  onClose, 
  onBackgroundChange,
  onFontChange 
}: CustomizationPanelProps) {
  const [selectedBackground, setSelectedBackground] = useState("dark");
  const [selectedFont, setSelectedFont] = useState("font-sans");

  useEffect(() => {
    // Load saved preferences
    const savedBg = localStorage.getItem('swipelearn-background') || 'dark';
    const savedFont = localStorage.getItem('swipelearn-font') || 'font-sans';
    setSelectedBackground(savedBg);
    setSelectedFont(savedFont);
  }, []);

  const handleBackgroundSelect = (bgOption: typeof BACKGROUND_OPTIONS[0]) => {
    setSelectedBackground(bgOption.value);
    localStorage.setItem('swipelearn-background', bgOption.value);
    onBackgroundChange(bgOption.value);
    console.log('Background changed to:', bgOption.value);
  };

  const handleFontSelect = (fontOption: typeof FONT_OPTIONS[0]) => {
    setSelectedFont(fontOption.value);
    localStorage.setItem('swipelearn-font', fontOption.value);
    onFontChange(fontOption.value);
    console.log('Font changed to:', fontOption.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Customize</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-customization"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Background Colors */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <h3 className="font-medium">Background</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.value}
                onClick={() => handleBackgroundSelect(bg)}
                className={cn(
                  "relative h-16 rounded-lg border-2 transition-all hover-elevate",
                  bg.class,
                  selectedBackground === bg.value
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                )}
                data-testid={`button-background-${bg.value}`}
              >
                <div className="absolute bottom-1 left-1 right-1">
                  <Badge 
                    variant="secondary" 
                    className="text-xs w-full justify-center"
                  >
                    {bg.name}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <h3 className="font-medium">Font</h3>
          </div>
          
          <div className="space-y-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                onClick={() => handleFontSelect(font)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all hover-elevate",
                  font.value,
                  selectedFont === font.value
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
                data-testid={`button-font-${font.value}`}
              >
                <div className="font-medium">The quick brown fox</div>
                <div className="text-sm text-muted-foreground">{font.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}