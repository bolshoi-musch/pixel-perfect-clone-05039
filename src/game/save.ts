// Версионированный сейв в localStorage.
// Ключ: kitchen.save.v1. При смене формата — поднять версию и добавить миграцию.

import type {
  InventoryEntry,
  TableSlot,
  ReviewEntry,
  OnboardingFlags,
  PlacedEquipment,
} from "./types";

export const SAVE_KEY = "kitchen.save.v1";
export const SAVE_VERSION = 4;

export interface SaveData {
  version: number;
  money: number;
  inventory: InventoryEntry[];
  equipment_owned: string[]; // ids
  /** Уровень плиты 1..3 — расширяет green zone в WINDOW мини-игре. */
  stove_level: number;
  table_slots: TableSlot[]; // length 5
  /** Какие предметы стоят на «месте» (placement). Сейчас — сковорода на плите. */
  placed_equipment: PlacedEquipment;
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
    stove_level: 1,
    table_slots: Array.from({ length: 5 }, () => ({ ...EMPTY_SLOT })),
    placed_equipment: { pan_on_stove: false, knife_board_on_work_area: false },
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
  // v1 → v2: добавили stove_level.
  if (obj.version === 1) {
    return migrate({ ...(obj as SaveData), stove_level: 1, version: 2 });
  }
  // v2 → v3: добавили placed_equipment.
  if (obj.version === 2) {
    return migrate({
      ...(obj as SaveData),
      placed_equipment: { pan_on_stove: false, knife_board_on_work_area: false },
      version: 3,
    });
  }
  // v3 → v4: добавили knife_board_on_work_area.
  if (obj.version === 3) {
    const prev = (obj as SaveData).placed_equipment as Partial<{ pan_on_stove: boolean; knife_board_on_work_area: boolean }> | undefined;
    return {
      ...(obj as SaveData),
      placed_equipment: {
        pan_on_stove: prev?.pan_on_stove ?? false,
        knife_board_on_work_area: false,
      },
      version: SAVE_VERSION,
    };
  }
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
