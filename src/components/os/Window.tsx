"use client";

import React from "react";
import { Rnd } from "react-rnd";
import { X, Minus, Square } from "lucide-react";
import { useOSStore, WindowState } from "@/store/useOSStore";

interface WindowProps {
  windowState: WindowState;
  children: React.ReactNode;
}

export const WindowComponent: React.FC<WindowProps> = ({ windowState, children }) => {
  const { closeApp, minimizeApp, maximizeApp, focusApp, updateWindowBounds, activeWindowId } = useOSStore();

  if (windowState.isMinimized) return null;

  const isActive = activeWindowId === windowState.id;

  return (
    <Rnd
      size={
        windowState.isMaximized
          ? { width: "100%", height: "calc(100% - 48px)" } // Leave space for taskbar
          : { width: windowState.width ?? 800, height: windowState.height ?? 600 }
      }
      position={
        windowState.isMaximized
          ? { x: 0, y: 0 }
          : { x: windowState.x ?? 100, y: windowState.y ?? 100 }
      }
      onDragStop={(e, d) => {
        updateWindowBounds(windowState.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        updateWindowBounds(windowState.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      disableDragging={windowState.isMaximized}
      enableResizing={!windowState.isMaximized}
      dragHandleClassName="window-header"
      style={{ zIndex: windowState.zIndex }}
      onMouseDown={() => focusApp(windowState.id)}
      className={`glass-panel rounded-xl overflow-hidden shadow-2xl transition-all ${
        isActive 
          ? "shadow-[var(--accent-dim)] border-[var(--accent)] ring-1 ring-[var(--accent)]" 
          : "border-white/10 opacity-90 hover:opacity-100"
      }`}
    >
      {/* Title Bar */}
      <div
        className={`window-header h-12 border-b flex items-center justify-between px-4 cursor-grab active:cursor-grabbing transition-colors ${
          isActive 
            ? "bg-[#161616] border-[var(--accent-dim)]" 
            : "bg-[#121212] border-white/5"
        }`}
        onDoubleClick={() => maximizeApp(windowState.id)}
      >
        <div className="text-sm font-semibold tracking-wide text-white/90">
          {windowState.title}
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeApp(windowState.id);
            }}
            className="p-1 hover:bg-[#262626] rounded-md transition-colors text-white/70 hover:text-white"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              maximizeApp(windowState.id);
            }}
            className="p-1 hover:bg-[#262626] rounded-md transition-colors text-white/70 hover:text-white"
          >
            <Square size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeApp(windowState.id);
            }}
            className="p-1 hover:bg-red-500 rounded-md transition-colors text-white/70 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="absolute top-12 bottom-0 left-0 right-0 overflow-hidden bg-[#0a0a0a] app-window-content">
        {children}
      </div>
    </Rnd>
  );
};
