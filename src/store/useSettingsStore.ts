import { create } from 'zustand';

type Theme = 'dark' | 'light';
type Density = 'compact' | 'normal' | 'spacious';
type AccentColor = 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'cyan';

interface SettingsState {
  theme: Theme;
  fontSize: number;
  density: Density;
  reducedMotion: boolean;
  highContrast: boolean;
  accentColor: AccentColor;
  setTheme: (t: Theme) => void;
  setFontSize: (n: number) => void;
  setDensity: (d: Density) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  setAccentColor: (c: AccentColor) => void;
}

// Persist to localStorage manually (avoid zustand/middleware import issues)
const load = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const s = localStorage.getItem(`vc_settings_${key}`);
    return s !== null ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(`vc_settings_${key}`, JSON.stringify(value)); } catch {}
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: load<Theme>('theme', 'dark'),
  fontSize: load<number>('fontSize', 14),
  density: load<Density>('density', 'normal'),
  reducedMotion: load<boolean>('reducedMotion', false),
  highContrast: load<boolean>('highContrast', false),
  accentColor: load<AccentColor>('accentColor', 'amber'),

  setTheme: (t) => { save('theme', t); set({ theme: t }); },
  setFontSize: (n) => { save('fontSize', n); set({ fontSize: n }); },
  setDensity: (d) => { save('density', d); set({ density: d }); },
  toggleReducedMotion: () => set((s) => { const v = !s.reducedMotion; save('reducedMotion', v); return { reducedMotion: v }; }),
  toggleHighContrast: () => set((s) => { const v = !s.highContrast; save('highContrast', v); return { highContrast: v }; }),
  setAccentColor: (c) => { save('accentColor', c); set({ accentColor: c }); },
}));
