// Модуль выбора активного ингредиента для размещения на стол / применения в рецепте.
// Хранится вне Zustand-store, т.к. чисто UI-state и не относится к save.
//
// activePick теперь объект с количеством — игрок может за один выбор взять
// сразу N штук (например, 2 яйца для омлета), и панель «Продукты» закрывается
// одной кнопкой «Взять N», а не открывается заново.

import { create } from "zustand";
import type { IngredientQuality } from "./types";

export interface ActivePick {
  ingredient_id: string;
  quality: IngredientQuality;
  /** Сколько единиц подготовлено к применению. >= 1. */
  quantity: number;
}

interface ActivePickState {
  pick: ActivePick | null;
  setPick: (v: ActivePick | null) => void;
  /** Уменьшить quantity на n. Если становится <= 0, снять выбор. */
  consumeQuantity: (n: number) => void;
}

export const useActivePick = create<ActivePickState>((set, get) => ({
  pick: null,
  setPick: (v) => set({ pick: v }),
  consumeQuantity: (n) => {
    const p = get().pick;
    if (!p) return;
    const left = p.quantity - n;
    if (left <= 0) set({ pick: null });
    else set({ pick: { ...p, quantity: left } });
  },
}));

/** Удобный ключ "id|quality" — для подсветки активной карточки в UI. */
export function pickKey(p: { ingredient_id: string; quality: IngredientQuality }): string {
  return `${p.ingredient_id}|${p.quality}`;
}
