import { create } from 'zustand';

export interface AppConfig {
  id: string;
  title: string;
  icon: string;
}

export interface WindowState {
  id: string;
  appId: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  title: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface OSState {
  windows: WindowState[];
  activeWindowId: string | null;
  startMenuOpen: boolean;
  openApp: (app: AppConfig) => void;
  closeApp: (windowId: string) => void;
  minimizeApp: (windowId: string) => void;
  maximizeApp: (windowId: string) => void;
  focusApp: (windowId: string) => void;
  toggleStartMenu: () => void;
  updateWindowBounds: (id: string, bounds: { x?: number; y?: number; width?: number; height?: number }) => void;
}

let nextZIndex = 10;

export const useOSStore = create<OSState>((set) => ({
  windows: [],
  activeWindowId: null,
  startMenuOpen: false,

  openApp: (app) =>
    set((state) => {
      const existingWindow = state.windows.find((w) => w.appId === app.id);
      if (existingWindow) {
        if (existingWindow.isMinimized) {
          return {
            windows: state.windows.map((w) =>
              w.id === existingWindow.id ? { ...w, isMinimized: false, zIndex: ++nextZIndex } : w
            ),
            activeWindowId: existingWindow.id,
            startMenuOpen: false,
          };
        }
        return {
          windows: state.windows.map((w) =>
            w.id === existingWindow.id ? { ...w, zIndex: ++nextZIndex } : w
          ),
          activeWindowId: existingWindow.id,
          startMenuOpen: false,
        };
      }

      const newWindow: WindowState = {
        id: `win_${Date.now()}`,
        appId: app.id,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: ++nextZIndex,
        title: app.title,
        width: 800,
        height: 600,
      };

      return {
        windows: [...state.windows, newWindow],
        activeWindowId: newWindow.id,
        startMenuOpen: false,
      };
    }),

  closeApp: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),

  minimizeApp: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),

  maximizeApp: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
    })),

  focusApp: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: ++nextZIndex } : w)),
      activeWindowId: id,
      startMenuOpen: false,
    })),

  toggleStartMenu: () =>
    set((state) => ({
      startMenuOpen: !state.startMenuOpen,
    })),

  updateWindowBounds: (id, bounds) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...bounds } : w)),
    })),
}));
