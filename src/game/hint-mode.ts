// Режим подсказок: detailed / normal / minimal. Хранится в localStorage отдельно от save.
// Поддерживает миграцию со старых значений (short → normal, off → minimal).

import { create } from "zustand";
import { normalizeHintMode, type HintMode } from "./hint-content";

const KEY = "kitchen.hintMode.v1";

function loadMode(): HintMode {
  if (typeof window === "undefined") return "detailed";
  return normalizeHintMode(window.localStorage.getItem(KEY));
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
