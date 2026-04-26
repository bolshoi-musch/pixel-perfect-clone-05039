// Режим подсказок: detailed / short / off. Хранится в localStorage отдельно от save.

import { create } from "zustand";
import type { HintMode } from "./hint-content";

const KEY = "kitchen.hintMode.v1";

function loadMode(): HintMode {
  if (typeof window === "undefined") return "detailed";
  const v = window.localStorage.getItem(KEY);
  if (v === "detailed" || v === "short" || v === "off") return v;
  return "detailed";
}

function saveMode(mode: HintMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    // ignore
  }
}

interface HintModeState {
  mode: HintMode;
  setMode: (mode: HintMode) => void;
}

export const useHintMode = create<HintModeState>((set) => ({
  mode: loadMode(),
  setMode: (mode) => {
    saveMode(mode);
    set({ mode });
  },
}));
