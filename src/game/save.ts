// Версионированный сейв в localStorage.
// Ключ: kitchen.save.v1. При смене формата — поднять версию и добавить миграцию.

import type {
  InventoryEntry,
  TableSlot,
  ReviewEntry,
  OnboardingFlags,
} from "./types";

export const SAVE_KEY = "kitchen.save.v1";
export const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  money: number;
  inventory: InventoryEntry[];
  equipment_owned: string[]; // ids
  table_slots: TableSlot[]; // length 5
  current_order_recipe_id: string | null;
  rating_history: number[]; // последние оценки (звёзды)
  reviews: ReviewEntry[]; // последние 20
  completed_recipes: string[]; // ids завершённых блюд
  onboarding: OnboardingFlags;
  created_at: number;
  updated_at: number;
}

const EMPTY_SLOT: TableSlot = { ingredient_id: null, quality: null, category: null };

export function makeInitialSave(): SaveData {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    money: 100,
    // Стартовый набор для онбординга: омлет (яйца) и чай (заварка + чайник).
    inventory: [
      { ingredient_id: "egg", quality: "basic", count: 4 },
      { ingredient_id: "egg_premium", quality: "premium", count: 1 },
      { ingredient_id: "tea_leaves", quality: "basic", count: 3 },
    ],
    equipment_owned: [
      "bell",
      "plate",
      "cup",
      "work_surface",
      "stove",
      "pan",
      "bowl",
      "kettle",
    ],
    table_slots: Array.from({ length: 5 }, () => ({ ...EMPTY_SLOT })),
    current_order_recipe_id: null,
    rating_history: [],
    reviews: [],
    completed_recipes: [],
    onboarding: {
      seen_intro: false,
      done_first_omelet: false,
      done_first_tea: false,
    },
    created_at: now,
    updated_at: now,
  };
}

function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<SaveData> & { version?: number };
  if (obj.version === SAVE_VERSION) {
    return obj as SaveData;
  }
  // TODO: миграции с предыдущих версий, когда появятся.
  return null;
}

export function hasSave(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(SAVE_KEY));
}

export function loadSave(): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function saveNow(data: SaveData): void {
  if (typeof window === "undefined") return;
  const out: SaveData = { ...data, version: SAVE_VERSION, updated_at: Date.now() };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(out));
  } catch {
    // out of quota / private mode — игнорируем
  }
}

export function resetSave(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVE_KEY);
}
