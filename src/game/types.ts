// Game data types — single source of truth.

export type IngredientCategory = "raw" | "prepared" | "cooked";
export type IngredientQuality = "basic" | "premium";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quality: IngredientQuality;
  price: number;
  edible_raw: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  price: number;
  owned_by_default: boolean;
}

export type MinigameKind = "mix" | "window" | "roll_stub" | "chop_stub" | "hold";

export type StepActionType = "combine" | "heat" | "mix" | "cut" | "form" | "serve" | "pour";

export interface RecipeStep {
  id: string;
  /** Семантический тип действия (см. StepActionType). Свободная строка для обратной совместимости. */
  type: string;
  requires: string[]; // ingredient or equipment ids
  minigame: MinigameKind | null;
  output: string | null; // produced ingredient id (prepared/cooked)
  hints: string[];

  // ---- Декларативные поля (опционально, для нового рефакторинга). ----
  /** Короткое имя шага для UI. */
  label?: string;
  /** Основная подсказка одной строкой (UI fallback, если нет hint-content entry). */
  hint?: string;
  /** Каноничное действие. */
  actionType?: StepActionType;
  /** Целевой equipment_id, по которому игрок должен кликнуть. */
  target?: string;
  /** ID результирующего ингредиента (синоним output, для читаемости). */
  result?: string;
  /** Тип минигеймы (синоним minigame, без null — для читаемости). */
  minigameType?: MinigameKind;
  /** True для финального шага подачи (звонок). */
  serveStep?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  base_price: number;
  t_fast: number; // seconds — full speed bonus
  t_ok: number; // seconds — neutral speed
  required_equipment: string[];
  step_ids: string[];
}

export interface ReviewTemplate {
  id: string;
  trigger: ReviewTrigger;
  text: string;
}

export type ReviewTrigger =
  | "speed:slow"
  | "speed:fast"
  | "accuracy:low"
  | "accuracy:high"
  | "minigame:low"
  | "minigame:high"
  | "ingredient:premium"
  | "ingredient:basic";

// Runtime save state.

export interface InventoryEntry {
  ingredient_id: string;
  quality: IngredientQuality;
  count: number;
}

export interface TableSlot {
  ingredient_id: string | null;
  quality: IngredientQuality | null;
  category: IngredientCategory | null;
}

export interface ReviewEntry {
  id: string;
  recipe_id: string;
  stars: number;
  tags: string[];
  tip: string;
  text: string;
  created_at: number;
}

export interface OnboardingFlags {
  seen_intro: boolean;
  done_first_omelet: boolean;
  done_first_tea: boolean;
}
