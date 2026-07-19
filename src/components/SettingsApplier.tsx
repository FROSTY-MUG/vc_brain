"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

const ACCENT_COLORS: Record<string, string> = {
  amber:   "#fbbf24",
  emerald: "#34d399",
  blue:    "#60a5fa",
  purple:  "#c084fc",
  rose:    "#fb7185",
  cyan:    "#22d3ee",
};

export default function SettingsApplier() {
  const { theme, fontSize, density, reducedMotion, highContrast, accentColor } = useSettingsStore();

  useEffect(() => {
    const html = document.documentElement;

    // Theme
    html.setAttribute("data-theme", theme);

    // Density
    html.setAttribute("data-density", density);

    // Contrast
    html.setAttribute("data-contrast", highContrast ? "high" : "normal");

    // Motion
    html.setAttribute("data-motion", reducedMotion ? "reduced" : "full");

    // Font size
    html.style.fontSize = `${fontSize}px`;

    // Accent color — write CSS variable so all components can use var(--accent)
    const color = ACCENT_COLORS[accentColor] ?? ACCENT_COLORS.amber;
    html.style.setProperty("--accent", color);
    html.style.setProperty("--accent-dim", color + "20");
  }, [theme, fontSize, density, reducedMotion, highContrast, accentColor]);

  return null;
}
