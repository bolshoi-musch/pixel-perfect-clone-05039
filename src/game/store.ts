// Zustand store. SSR-safe: ленивая инициализация из localStorage в effect.

import { create } from "zustand";
import { loadSave, makeInitialSave, saveNow, resetSave, type SaveData } from "./save";
import type {
  InventoryEntry,
  TableSlot,
  ReviewEntry,
  OnboardingFlags,
  IngredientQuality,
  IngredientCategory,
} from "./types";
import type { ActionLogEntry } from "./interactions";
import { INGREDIENTS_BY_ID } from "./data";

interface GameState extends SaveData {
  hydrated: boolean;

  // Ephemeral UI state (не сохраняется)
  action_log: ActionLogEntry[];
  pending_overflow: { entry: InventoryEntry } | null;

  // actions
  hydrate: () => void;
  startNewGame: () => void;
  persist: () => void;

  log: (text: string) => void;

  setMoney: (money: number) => void;
  addMoney: (delta: number) => void;

  addToInventory: (entry: InventoryEntry) => void;
  removeFromInventory: (ingredient_id: string, quality: IngredientQuality, count: number) => boolean;

  setTableSlot: (index: number, slot: TableSlot) => void;
  clearTableSlot: (index: number) => void;

  /** Положить из инвентаря на стол. Возвращает индекс слота или -1 если переполнено. */
  placeFromInventory: (ingredient_id: string, quality: IngredientQuality) => number;
  /** Убрать предмет со стола в инвентарь. */
  pickupToInventory: (slot_index: number) => boolean;
  /** Съесть raw-предмет со стола. Возвращает true если съеден. */
  eatFromTable: (slot_index: number) => "ok" | "not_raw" | "empty";
  /** Разрешить переполнение, освободив указанный слот. */
  resolveOverflow: (slot_index_to_free: number) => void;
  cancelOverflow: () => void;

  buyEquipment: (id: string, price: number) => boolean;

  setCurrentOrder: (recipe_id: string | null) => void;
  completeOrder: (recipe_id: string, stars: number, review: ReviewEntry, reward: number) => void;

  setOnboardingFlag: (key: keyof OnboardingFlags, value: boolean) => void;

  resetGame: () => void;
}

const EMPTY_SLOT: TableSlot = { ingredient_id: null, quality: null, category: null };

export const useGame = create<GameState>((set, get) => ({
  ...makeInitialSave(),
  hydrated: false,
  action_log: [],
  pending_overflow: null,

  log: (text) => {
    const entry: ActionLogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      text,
    };
    set({ action_log: [entry, ...get().action_log].slice(0, 30) });
  },

  hydrate: () => {
    if (get().hydrated) return;
    const loaded = loadSave();
    if (loaded) {
      set({ ...loaded, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },

  startNewGame: () => {
    const fresh = makeInitialSave();
    set({ ...fresh, hydrated: true });
    saveNow(fresh);
  },

  persist: () => {
    const s = get();
    saveNow(extractSave(s));
  },

  setMoney: (money) => {
    set({ money });
    get().persist();
  },
  addMoney: (delta) => {
    set({ money: get().money + delta });
    get().persist();
  },

  addToInventory: (entry) => {
    const inv = [...get().inventory];
    const i = inv.findIndex(
      (e) => e.ingredient_id === entry.ingredient_id && e.quality === entry.quality,
    );
    if (i >= 0) inv[i] = { ...inv[i], count: inv[i].count + entry.count };
    else inv.push({ ...entry });
    set({ inventory: inv });
    get().persist();
  },

  removeFromInventory: (ingredient_id, quality, count) => {
    const inv = [...get().inventory];
    const i = inv.findIndex((e) => e.ingredient_id === ingredient_id && e.quality === quality);
    if (i < 0 || inv[i].count < count) return false;
    inv[i] = { ...inv[i], count: inv[i].count - count };
    if (inv[i].count <= 0) inv.splice(i, 1);
    set({ inventory: inv });
    get().persist();
    return true;
  },

  setTableSlot: (index, slot) => {
    if (index < 0 || index > 4) return;
    const slots = [...get().table_slots];
    slots[index] = slot;
    set({ table_slots: slots });
    get().persist();
  },

  clearTableSlot: (index) => {
    if (index < 0 || index > 4) return;
    const slots = [...get().table_slots];
    slots[index] = { ...EMPTY_SLOT };
    set({ table_slots: slots });
    get().persist();
  },

  buyEquipment: (id, price) => {
    const s = get();
    if (s.equipment_owned.includes(id)) return false;
    if (s.money < price) return false;
    set({
      money: s.money - price,
      equipment_owned: [...s.equipment_owned, id],
    });
    get().persist();
    return true;
  },

  setCurrentOrder: (recipe_id) => {
    set({ current_order_recipe_id: recipe_id });
    get().persist();
  },

  completeOrder: (recipe_id, stars, review, reward) => {
    const s = get();
    const reviews = [review, ...s.reviews].slice(0, 20);
    const rating_history = [...s.rating_history, stars].slice(-50);
    const completed = s.completed_recipes.includes(recipe_id)
      ? s.completed_recipes
      : [...s.completed_recipes, recipe_id];
    set({
      money: s.money + reward,
      reviews,
      rating_history,
      completed_recipes: completed,
      current_order_recipe_id: null,
    });
    get().persist();
  },

  setOnboardingFlag: (key, value) => {
    set({ onboarding: { ...get().onboarding, [key]: value } });
    get().persist();
  },

  resetGame: () => {
    resetSave();
    const fresh = makeInitialSave();
    set({ ...fresh, hydrated: true });
  },
}));

function extractSave(s: SaveData): SaveData {
  return {
    version: s.version,
    money: s.money,
    inventory: s.inventory,
    equipment_owned: s.equipment_owned,
    table_slots: s.table_slots,
    current_order_recipe_id: s.current_order_recipe_id,
    rating_history: s.rating_history,
    reviews: s.reviews,
    completed_recipes: s.completed_recipes,
    onboarding: s.onboarding,
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

// Селекторы
export const selectAvgRating = (s: GameState): number => {
  const recent = s.rating_history.slice(-10);
  if (recent.length === 0) return 0;
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  return Math.round(avg * 10) / 10;
};

// Re-exports для удобства
export type { IngredientCategory, IngredientQuality };
