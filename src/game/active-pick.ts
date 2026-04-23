// Модуль выбора активного ингредиента для размещения на стол.
// Хранится вне Zustand-store, т.к. чисто UI-state и не относится к save.

import { create } from "zustand";

interface ActivePickState {
  /** Формат: "ingredient_id|quality" */
  pick: string | null;
  setPick: (v: string | null) => void;
  consume: () => string | null;
}

export const useActivePick = create<ActivePickState>((set, get) => ({
  pick: null,
  setPick: (v) => set({ pick: v }),
  consume: () => {
    const v = get().pick;
    return v;
  },
}));
