import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Palette, Type, Paintbrush } from "lucide-react";

// Pastel color palette - 7 colors
const PASTEL_COLORS = [
  { name: "White", value: "bg-[#FFFFFF]", text: "text-[#000000]" },
  { name: "Lavender", value: "bg-[#E6E6FA]", text: "text-[#4B0082]" },
  { name: "Mint", value: "bg-[#98FF98]", text: "text-[#2E8B57]" },
  { name: "Peach", value: "bg-[#FFDAB9]", text: "text-[#CD853F]" },
  { name: "Sky", value: "bg-[#87CEEB]", text: "text-[#1E90FF]" },
  { name: "Lemon", value: "bg-[#FFFACD]", text: "text-[#B8860B]" },
  { name: "Rose", value: "bg-[#FFC0CB]", text: "text-[#C71585]" },
];

// 7 Font families
const FONT_FAMILIES = [
  { name: "Inter", class: "font-sans" },
  { name: "Georgia", class: "font-serif" },
  { name: "Monaco", class: "font-mono" },
  { name: "Comic Sans", class: "font-comic" },
  { name: "Arial", class: "font-arial" },
  { name: "Times", class: "font-times" },
  { name: "Courier", class: "font-courier" },
];

// 7 Text colors that work on any background
const TEXT_COLORS = [
  { name: "Charcoal", value: "text-[#333333]" },
  { name: "Navy", value: "text-[#000080]" },
  { name: "Forest", value: "text-[#228B22]" },
  { name: "Maroon", value: "text-[#800000]" },
  { name: "Slate", value: "text-[#2F4F4F]" },
  { name: "Teal", value: "text-[#008080]" },
  { name: "Purple", value: "text-[#800080]" },
];

export function ThemeControls() {
  const [colorIndex, setColorIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [textColorIndex, setTextColorIndex] = useState(0);

  // Load saved preferences or use defaults
  useEffect(() => {
    const savedColor = localStorage.getItem('focusfeed-color-index');
    const savedFont = localStorage.getItem('focusfeed-font-index');
    const savedTextColor = localStorage.getItem('focusfeed-text-color-index');

    // Set default to white background with black text if no preferences saved
    if (!savedColor && !savedFont && !savedTextColor) {
      setColorIndex(0); // White background (index 0)
      setTextColorIndex(0); // Black text (index 0)
    } else {
      if (savedColor) setColorIndex(parseInt(savedColor));
      if (savedFont) setFontIndex(parseInt(savedFont));
      if (savedTextColor) setTextColorIndex(parseInt(savedTextColor));
    }
  }, []);

  // Apply current theme
  useEffect(() => {
    const currentColor = PASTEL_COLORS[colorIndex];
    const currentFont = FONT_FAMILIES[fontIndex];
    const currentTextColor = TEXT_COLORS[textColorIndex];

    // Remove only theme-related classes first
    document.documentElement.classList.remove(
      ...PASTEL_COLORS.map(c => c.value.split('bg-')[1]),
      ...FONT_FAMILIES.map(f => f.class),
      ...TEXT_COLORS.map(t => t.value.split('text-')[1])
    );

    // Apply new theme classes
    document.documentElement.classList.add(
      currentColor.value.split('bg-')[1],
      currentFont.class,
      currentTextColor.value.split('text-')[1]
    );

    // Save preferences
    localStorage.setItem('focusfeed-color-index', colorIndex.toString());
    localStorage.setItem('focusfeed-font-index', fontIndex.toString());
    localStorage.setItem('focusfeed-text-color-index', textColorIndex.toString());
  }, [colorIndex, fontIndex, textColorIndex]);

  // Cycle to next color
  const cycleColor = () => {
    setColorIndex((prev) => (prev + 1) % PASTEL_COLORS.length);
  };

  // Cycle to next font
  const cycleFont = () => {
    setFontIndex((prev) => (prev + 1) % FONT_FAMILIES.length);
  };

  // Cycle to next text color
  const cycleTextColor = () => {
    setTextColorIndex((prev) => (prev + 1) % TEXT_COLORS.length);
  };

  return (
    <div className="flex gap-2">
      {/* Color Cycle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleColor}
        className="hover:bg-primary/10"
        aria-label="Cycle background color"
      >
        <Palette className="h-5 w-5" />
      </Button>

      {/* Font Cycle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleFont}
        className="hover:bg-primary/10"
        aria-label="Cycle font"
      >
        <Type className="h-5 w-5" />
      </Button>

      {/* Text Color Cycle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTextColor}
        className="hover:bg-primary/10"
        aria-label="Cycle text color"
      >
        <Paintbrush className="h-5 w-5" />
      </Button>
    </div>
  );
}
