import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeName = 'investor' | 'founder';

export interface ThemeColors {
  bg: string;
  text: string;
  border: string;
  accent: string;
  glow: string;
  mutedText: string;
  panelBg: string;
  pulseBg: string;
}

const themes: Record<ThemeName, ThemeColors> = {
  investor: {
    bg: 'bg-amber-950',
    text: 'text-amber-50',
    border: 'border-amber-500/50',
    accent: 'text-amber-400',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]', // Amber glow
    mutedText: 'text-amber-500/60',
    panelBg: 'bg-amber-900/30',
    pulseBg: 'bg-amber-500'
  },
  founder: {
    bg: 'bg-cyan-950',
    text: 'text-cyan-50',
    border: 'border-cyan-500/50',
    accent: 'text-cyan-400',
    glow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]', // Cyan glow
    mutedText: 'text-cyan-500/60',
    panelBg: 'bg-cyan-900/30',
    pulseBg: 'bg-cyan-500'
  }
};

interface ThemeContextType {
  themeName: ThemeName;
  colors: ThemeColors;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children, initialTheme = 'investor' }: { children: ReactNode, initialTheme?: ThemeName }) => {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);

  return (
    <ThemeContext.Provider value={{ themeName, colors: themes[themeName], setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
