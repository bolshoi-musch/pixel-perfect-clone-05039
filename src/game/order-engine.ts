// Order/recipe engine — pure-ish state machine over recipe steps.
// Tracks current step index, errors, minigame scores, prepared items, start time.

import { create } from "zustand";
import { RECIPES_BY_ID, STEPS_BY_ID, INGREDIENTS_BY_ID } from "./data";
import type { Recipe, RecipeStep, MinigameKind } from "./types";
import { useGame } from "./store";
import { computeScore } from "./scoring";
import { buildReview } from "./reviews";

export interface OrderProgress {
  recipe_id: string;
  step_index: number;
  total_errors: number;
  minigame_scores: number[]; // 0..1 per minigame
  /** ids of intermediate "prepared/cooked" items currently produced (e.g. hot_water, egg_mix) */
  prepared: string[];
  /** ingredient ids consumed from the table during this order (for premium_share) */
  consumed_basic: number;
  consumed_premium: number;
  started_at: number;
  finished: boolean;
}

interface OrderEngineState {
  progress: OrderProgress | null;
  /** UI: pending minigame to launch */
  active_minigame: { step_id: string; kind: MinigameKind } | null;

  startOrder: (recipe_id: string) => void;
  /** Try to advance the current step using a tapped equipment kind. */
  tryStep: (equipment_id: string) => StepAttempt;
  /** Called by minigame UI when it finishes. */
  finishMinigame: (score: number, errors: number) => void;
  cancelMinigame: () => void;
  /** Bell pressed → finalize order if completed. */
  ringBell: () => RingResult;
  reset: () => void;
}

export type StepAttempt =
  | { ok: true; opened_minigame: MinigameKind | null; step: RecipeStep }
  | { ok: false; reason: "no_order" | "no_step" | "wrong_equipment" | "missing" | "already_done"; missing?: string[] };

export type RingResult =
  | { ok: false; reason: "no_order" | "not_finished" }
  | { ok: true; stars: number; reward: number; recipe_id: string };

export const useOrderEngine = create<OrderEngineState>((set, get) => ({
  progress: null,
  active_minigame: null,

  startOrder: (recipe_id) => {
    set({
      progress: {
        recipe_id,
        step_index: 0,
        total_errors: 0,
        minigame_scores: [],
        prepared: [],
        consumed_basic: 0,
        consumed_premium: 0,
        started_at: Date.now(),
        finished: false,
      },
      active_minigame: null,
    });
    useGame.getState().setCurrentOrder(recipe_id);
  },

  tryStep: (equipment_id) => {
    const p = get().progress;
    if (!p) return { ok: false, reason: "no_order" };
    if (p.finished) return { ok: false, reason: "already_done" };

    const recipe = RECIPES_BY_ID.get(p.recipe_id);
    if (!recipe) return { ok: false, reason: "no_order" };
    const step_id = recipe.step_ids[p.step_index];
    const step = step_id ? STEPS_BY_ID.get(step_id) : undefined;
    if (!step) return { ok: false, reason: "no_step" };

    // Equipment must be in step.requires
    if (!step.requires.includes(equipment_id)) {
      // wrong-equipment ⇒ small error and log
      bumpError(set, get, "Не то оборудование для этого шага");
      return { ok: false, reason: "wrong_equipment" };
    }

    // Check requirements: ingredients/preparedness
    const game = useGame.getState();
    const onTable = new Set(
      game.table_slots.map((s) => s.ingredient_id).filter((x): x is string => !!x),
    );
    const preparedSet = new Set(p.prepared);
    const owned = new Set(game.equipment_owned);

    const missing: string[] = [];
    for (const req of step.requires) {
      if (req === equipment_id) continue;
      if (owned.has(req)) continue; // equipment requirement
      if (preparedSet.has(req)) continue; // intermediate ingredient
      if (onTable.has(req)) continue; // raw ingredient on table
      // try water specially: if water needed and equipment is kettle/pot/rice_cooker present, allow
      if (req === "water") continue; // implicit water for MVP
      missing.push(req);
    }
    if (missing.length > 0) {
      bumpError(
        set,
        get,
        `Не хватает: ${missing.map((id) => INGREDIENTS_BY_ID.get(id)?.name ?? id).join(", ")}`,
      );
      return { ok: false, reason: "missing", missing };
    }

    // Requirements met — open minigame OR auto-complete
    if (step.minigame === "mix" || step.minigame === "window") {
      set({ active_minigame: { step_id: step.id, kind: step.minigame } });
      return { ok: true, opened_minigame: step.minigame, step };
    }

    // Auto-complete (hold/stub/null) — neutral score 0.85
    completeStep(set, get, step, 0.85, 0);
    return { ok: true, opened_minigame: null, step };
  },

  finishMinigame: (score, errors) => {
    const am = get().active_minigame;
    const p = get().progress;
    if (!am || !p) return;
    const step = STEPS_BY_ID.get(am.step_id);
    if (!step) return;
    completeStep(set, get, step, score, errors);
    set({ active_minigame: null });
  },

  cancelMinigame: () => set({ active_minigame: null }),

  ringBell: () => {
    const p = get().progress;
    if (!p) return { ok: false, reason: "no_order" };
    if (!p.finished) return { ok: false, reason: "not_finished" };

    const recipe = RECIPES_BY_ID.get(p.recipe_id)!;
    const t_elapsed_sec = (Date.now() - p.started_at) / 1000;
    const totalConsumed = p.consumed_basic + p.consumed_premium;
    const premium_share = totalConsumed > 0 ? p.consumed_premium / totalConsumed : 0;

    const result = computeScore({
      total_errors: p.total_errors,
      minigame_scores: p.minigame_scores,
      t_elapsed_sec,
      t_fast: recipe.t_fast,
      t_ok: recipe.t_ok,
      premium_share,
      base_price: recipe.base_price,
    });

    const review = buildReview(recipe.id, result);
    const game = useGame.getState();
    game.completeOrder(recipe.id, result.stars, review, result.reward_money);
    game.log(`★${result.stars} • +${result.reward_money} ₽`);

    // Onboarding flags
    if (recipe.id === "omelet") game.setOnboardingFlag("done_first_omelet", true);
    if (recipe.id === "tea") game.setOnboardingFlag("done_first_tea", true);

    set({ progress: null, active_minigame: null });
    return { ok: true, stars: result.stars, reward: result.reward_money, recipe_id: recipe.id };
  },

  reset: () => set({ progress: null, active_minigame: null }),
}));

function bumpError(
  set: (s: Partial<OrderEngineState>) => void,
  get: () => OrderEngineState,
  msg: string,
) {
  const p = get().progress;
  if (!p) return;
  set({ progress: { ...p, total_errors: p.total_errors + 1 } });
  useGame.getState().log(`Ошибка: ${msg}`);
}

function completeStep(
  set: (s: Partial<OrderEngineState>) => void,
  get: () => OrderEngineState,
  step: RecipeStep,
  score: number,
  errors: number,
) {
  const p = get().progress;
  if (!p) return;

  // Consume raw ingredients from the table
  const game = useGame.getState();
  const owned = new Set(game.equipment_owned);
  const preparedSet = new Set(p.prepared);
  let consumed_basic = p.consumed_basic;
  let consumed_premium = p.consumed_premium;

  const consumedFromTable: string[] = [];
  const newPrepared = [...p.prepared];

  for (const req of step.requires) {
    if (owned.has(req)) continue;
    if (preparedSet.has(req)) {
      // remove the intermediate (consumed)
      const idx = newPrepared.indexOf(req);
      if (idx >= 0) newPrepared.splice(idx, 1);
      continue;
    }
    if (req === "water") continue;
    // raw ingredient — find it on the table
    const slotIdx = game.table_slots.findIndex((s) => s.ingredient_id === req);
    if (slotIdx >= 0) {
      const slot = game.table_slots[slotIdx];
      if (slot.quality === "premium") consumed_premium += 1;
      else consumed_basic += 1;
      consumedFromTable.push(req);
      game.clearTableSlot(slotIdx);
    }
  }

  if (step.output) newPrepared.push(step.output);

  const minigame_scores =
    step.minigame === "mix" || step.minigame === "window"
      ? [...p.minigame_scores, score]
      : p.minigame_scores;

  const recipe = RECIPES_BY_ID.get(p.recipe_id)!;
  const next_index = p.step_index + 1;
  const finished = next_index >= recipe.step_ids.length;

  set({
    progress: {
      ...p,
      step_index: next_index,
      minigame_scores,
      prepared: newPrepared,
      consumed_basic,
      consumed_premium,
      total_errors: p.total_errors + errors,
      finished,
    },
  });

  game.log(
    finished
      ? `Готово! Позвоните в звонок 🛎`
      : `Шаг ${p.step_index + 1} выполнен (${(score * 100).toFixed(0)}%)`,
  );
}

// ---------- Order generator ----------

const STARTER_QUEUE: string[] = ["omelet", "tea"];

/**
 * Pick the next recipe id given current state.
 * Onboarding: omelet → tea. After that: random from recipes whose required_equipment
 * is all owned and whose required raw ingredients are in inventory.
 */
export function pickNextRecipe(): string | null {
  const game = useGame.getState();
  const ob = game.onboarding;

  if (!ob.done_first_omelet) return "omelet";
  if (!ob.done_first_tea) return "tea";

  const owned = new Set(game.equipment_owned);
  const inventoryIds = new Set(game.inventory.map((e) => e.ingredient_id));

  const playable = [...RECIPES_BY_ID.values()].filter((r) => {
    if (!r.required_equipment.every((e) => owned.has(e))) return false;
    // Need at least one raw ingredient that recipe consumes available
    const stepIngredients = r.step_ids
      .flatMap((sid) => STEPS_BY_ID.get(sid)?.requires ?? [])
      .filter((id) => INGREDIENTS_BY_ID.has(id));
    return stepIngredients.every((id) => {
      const ing = INGREDIENTS_BY_ID.get(id)!;
      if (ing.category !== "raw") return true;
      if (id === "water") return true;
      return inventoryIds.has(id);
    });
  });

  if (playable.length === 0) {
    // fallback to starter queue
    return STARTER_QUEUE[Math.floor(Math.random() * STARTER_QUEUE.length)];
  }
  return playable[Math.floor(Math.random() * playable.length)].id;
}
