// Order/recipe engine — pure-ish state machine over recipe steps.
// Tracks current step index, errors, minigame scores, prepared items, start time.

import { create } from "zustand";
import { RECIPES_BY_ID, STEPS_BY_ID, INGREDIENTS_BY_ID } from "./data";
import type { RecipeStep, MinigameKind, IngredientQuality } from "./types";
import { useGame } from "./store";
import { useActivePick } from "./active-pick";
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
  | {
      ok: false;
      reason:
        | "no_order"
        | "no_step"
        | "wrong_equipment"
        | "missing"
        | "already_done";
      missing?: string[];
      hint_equipment?: string;
    };

export type RingResult =
  | { ok: false; reason: "no_order" | "not_finished" }
  | { ok: true; stars: number; reward: number; recipe_id: string };

// ---- Ingredient aliasing ----
// Premium varieties satisfy basic ingredient requirements.
const INGREDIENT_ALIAS: Record<string, string> = {
  egg_premium: "egg",
  bread_premium: "bread",
};

/** Resolve any inventory id to its "canonical" id used in step.requires. */
function canonicalIngredient(id: string): string {
  return INGREDIENT_ALIAS[id] ?? id;
}

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

    // Validate equipment matches the step. SOFT hint instead of error spam.
    if (!equipmentMatchesStep(equipment_id, step)) {
      const target = expectedEquipmentForStep(step);
      const targetName = target ? equipmentLabel(target) : "нужный инструмент";
      useGame.getState().log(`Сейчас нажми на: ${targetName}`);
      return { ok: false, reason: "wrong_equipment", hint_equipment: target ?? undefined };
    }

    // Check requirements: ingredients/preparedness/equipment ownership.
    const game = useGame.getState();
    const onTableCanonical = new Set(
      game.table_slots
        .map((s) => (s.ingredient_id ? canonicalIngredient(s.ingredient_id) : null))
        .filter((x): x is string => !!x),
    );
    const inventoryCanonical = new Set(
      game.inventory.filter((e) => e.count > 0).map((e) => canonicalIngredient(e.ingredient_id)),
    );
    const preparedSet = new Set(p.prepared);
    const owned = new Set(game.equipment_owned);

    const missing: string[] = [];
    for (const req of step.requires) {
      if (req === equipment_id) continue;
      if (owned.has(req)) continue;
      if (preparedSet.has(req)) continue;
      if (onTableCanonical.has(req)) continue;
      if (inventoryCanonical.has(req)) continue; // direct-consume from inventory
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
    let p = get().progress;
    if (!p) return { ok: false, reason: "no_order" };

    // Auto-complete pending serve steps when bell is pressed
    const recipe = RECIPES_BY_ID.get(p.recipe_id)!;
    while (!p.finished && p.step_index < recipe.step_ids.length) {
      const step = STEPS_BY_ID.get(recipe.step_ids[p.step_index]);
      if (!step || step.type !== "serve") break;
      // Check requires: prepared items + plate/cup are owned by default
      const game = useGame.getState();
      const owned = new Set(game.equipment_owned);
      const preparedSet = new Set(p.prepared);
      const allOk = step.requires.every((r) => owned.has(r) || preparedSet.has(r) || r === "water");
      if (!allOk) break;
      completeStep(set, get, step, 0.9, 0);
      p = get().progress!;
    }

    if (!p.finished) return { ok: false, reason: "not_finished" };

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

    if (recipe.id === "omelet") game.setOnboardingFlag("done_first_omelet", true);
    if (recipe.id === "tea") game.setOnboardingFlag("done_first_tea", true);

    set({ progress: null, active_minigame: null });
    return { ok: true, stars: result.stars, reward: result.reward_money, recipe_id: recipe.id };
  },

  reset: () => set({ progress: null, active_minigame: null }),
}));

/**
 * Step is "owned" by a particular piece of equipment for click-to-trigger.
 * Maps minigame kind / step.type → set of valid equipment ids.
 */
const HEAT_EQUIPMENT = new Set(["stove", "oven", "toaster", "kettle", "rice_cooker"]);

function equipmentMatchesStep(equipment_id: string, step: RecipeStep): boolean {
  if (step.requires.includes(equipment_id)) return true;
  if (step.minigame === "mix" && equipment_id === "bowl") return true;
  if (step.minigame === "window" && HEAT_EQUIPMENT.has(equipment_id)) {
    // The exact heat appliance from step.requires must be used (e.g. kettle for tea_boil).
    const heatInStep = step.requires.find((r) => HEAT_EQUIPMENT.has(r));
    if (heatInStep) return heatInStep === equipment_id;
    // Fallback: stove if step has no specific heat appliance.
    return equipment_id === "stove";
  }
  if (
    (step.minigame === "chop_stub" || step.minigame === "roll_stub") &&
    equipment_id === "work_surface"
  )
    return true;
  // Serve step → bell handles it (so clicking plate/cup is harmless), but no match here.
  return false;
}

/** Best guess: which equipment is the "primary" target the player should click. */
export function expectedEquipmentForStep(step: RecipeStep): string | null {
  // Serve step is finalized by the bell.
  if (step.type === "serve") return "bell";
  // Heat steps → the heat appliance in requires (or stove fallback)
  if (step.minigame === "window") {
    const heat = step.requires.find((r) => HEAT_EQUIPMENT.has(r));
    return heat ?? "stove";
  }
  if (step.minigame === "mix") return "bowl";
  if (step.minigame === "chop_stub" || step.minigame === "roll_stub") return "work_surface";
  // combine: prefer first equipment in requires (bowl/cup/plate/pan...)
  const tools = ["bowl", "cup", "plate", "pan", "kettle", "rice_cooker", "blender", "pot", "oven"];
  const tool = step.requires.find((r) => tools.includes(r));
  return tool ?? null;
}

const EQUIPMENT_LABELS: Record<string, string> = {
  stove: "Плита",
  oven: "Духовка",
  toaster: "Тостер",
  kettle: "Чайник",
  rice_cooker: "Рисоварка",
  bowl: "Миска",
  cup: "Чашка",
  plate: "Тарелка",
  pan: "Сковорода",
  pot: "Кастрюля",
  blender: "Блендер",
  work_surface: "Рабочая зона",
  bell: "Звонок",
};

function equipmentLabel(id: string): string {
  return EQUIPMENT_LABELS[id] ?? id;
}

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

  // Consume raw ingredients: from table first, then from inventory (direct-consume).
  const game = useGame.getState();
  const owned = new Set(game.equipment_owned);
  const preparedSet = new Set(p.prepared);
  let consumed_basic = p.consumed_basic;
  let consumed_premium = p.consumed_premium;

  const newPrepared = [...p.prepared];

  for (const req of step.requires) {
    if (owned.has(req)) continue;
    if (preparedSet.has(req)) {
      const idx = newPrepared.indexOf(req);
      if (idx >= 0) newPrepared.splice(idx, 1);
      continue;
    }
    if (req === "water") continue;

    // 1) Try table slot (any ingredient whose canonical matches req)
    const slotIdx = game.table_slots.findIndex(
      (s) => s.ingredient_id && canonicalIngredient(s.ingredient_id) === req,
    );
    if (slotIdx >= 0) {
      const slot = game.table_slots[slotIdx];
      if (slot.quality === "premium") consumed_premium += 1;
      else consumed_basic += 1;
      game.clearTableSlot(slotIdx);
      continue;
    }

    // 2) Direct-consume from inventory: prefer the actively picked one if matches.
    const pick = useActivePick.getState().pick;
    let pickedFrom: { id: string; quality: IngredientQuality } | null = null;
    if (pick) {
      const [pId, pQ] = pick.split("|") as [string, IngredientQuality];
      if (canonicalIngredient(pId) === req) pickedFrom = { id: pId, quality: pQ };
    }
    if (!pickedFrom) {
      // Find any inventory entry whose canonical matches req (premium first to reward effort).
      const sortedInv = [...game.inventory].sort((a, b) =>
        a.quality === b.quality ? 0 : a.quality === "premium" ? -1 : 1,
      );
      const match = sortedInv.find(
        (e) => canonicalIngredient(e.ingredient_id) === req && e.count > 0,
      );
      if (match) pickedFrom = { id: match.ingredient_id, quality: match.quality };
    }
    if (pickedFrom) {
      game.removeFromInventory(pickedFrom.id, pickedFrom.quality, 1);
      if (pickedFrom.quality === "premium") consumed_premium += 1;
      else consumed_basic += 1;
      // Clear pick if it was the one consumed
      if (
        pick &&
        pick === `${pickedFrom.id}|${pickedFrom.quality}`
      ) {
        useActivePick.getState().setPick(null);
      }
    }
    // If nothing found here — tryStep already verified availability, so this shouldn't happen.
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

  const customLog = STEP_COMPLETION_LOG[step.id];
  game.log(
    customLog
      ? customLog
      : finished
        ? `Готово! Позвоните в звонок 🛎`
        : `Шаг ${p.step_index + 1} выполнен (${(score * 100).toFixed(0)}%)`,
  );
}

/** Per-step custom completion message (overrides generic "Шаг N выполнен"). */
const STEP_COMPLETION_LOG: Record<string, string> = {
  omelet_cook: "Омлет готов. Переложи его на тарелку.",
  omelet_plate: "Омлет на тарелке. Позвони в звонок.",
};

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
  const inventoryCanonical = new Set(
    game.inventory.map((e) => canonicalIngredient(e.ingredient_id)),
  );

  const playable = [...RECIPES_BY_ID.values()].filter((r) => {
    if (!r.required_equipment.every((e) => owned.has(e))) return false;
    const stepIngredients = r.step_ids
      .flatMap((sid) => STEPS_BY_ID.get(sid)?.requires ?? [])
      .filter((id) => INGREDIENTS_BY_ID.has(id));
    return stepIngredients.every((id) => {
      const ing = INGREDIENTS_BY_ID.get(id)!;
      if (ing.category !== "raw") return true;
      if (id === "water") return true;
      return inventoryCanonical.has(id);
    });
  });

  if (playable.length === 0) {
    return STARTER_QUEUE[Math.floor(Math.random() * STARTER_QUEUE.length)];
  }
  return playable[Math.floor(Math.random() * playable.length)].id;
}
