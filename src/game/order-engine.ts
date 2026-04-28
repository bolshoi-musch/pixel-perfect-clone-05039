// Order/recipe engine — pure-ish state machine over recipe steps.
// Tracks current step index, errors, minigame scores, prepared items, start time.

import { create } from "zustand";
import { RECIPES_BY_ID, STEPS_BY_ID, INGREDIENTS_BY_ID } from "./data";
import type { RecipeStep, MinigameKind, IngredientQuality } from "./types";
import { useGame } from "./store";
import { useActivePick } from "./active-pick";
import { computeScore } from "./scoring";
import { buildReview } from "./reviews";
import { getRecipeAvailability } from "./recipe-availability";

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

/**
 * Equipment that игрок «всегда имеет», даже без покупки. Сюда входит сковорода:
 * для MVP она считается частью плиты и не покупается отдельно.
 */
const IMPLICIT_EQUIPMENT = new Set(["pan"]);

import type { PlacedEquipment } from "./types";

function isPlacementSatisfied(flag: string, placed: PlacedEquipment): boolean {
  if (flag === "pan_on_stove") return placed.pan_on_stove;
  if (flag === "knife_board_on_work_area") return placed.knife_board_on_work_area;
  return false;
}

const PLACEMENT_ERROR: Record<string, string> = {
  pan_on_stove: "Нужна сковорода на плите",
  knife_board_on_work_area: "Нужны нож и доска на рабочей зоне",
};

const PLACEMENT_HINT: Record<string, string> = {
  pan_on_stove: "Открой Техника → поставь сковороду на плиту",
  knife_board_on_work_area: "Открой Техника → поставь Нож и доску на рабочую зону",
};

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

    // 0) Placed equipment check (сковорода на плите, нож+доска на рабочей зоне)
    const placedReq = step.requiresEquipmentPlaced ?? [];
    for (const flag of placedReq) {
      if (!isPlacementSatisfied(flag, game.placed_equipment)) {
        bumpError(set, get, PLACEMENT_ERROR[flag] ?? `Не размещено: ${flag}`);
        useGame.getState().log(PLACEMENT_HINT[flag] ?? "Открой Техника");
        return { ok: false, reason: "missing", missing: [flag] };
      }
    }

    const onTableCanonical = new Set(
      game.table_slots
        .map((s) => (s.ingredient_id ? canonicalIngredient(s.ingredient_id) : null))
        .filter((x): x is string => !!x),
    );
    const inventoryCanonicalCount = new Map<string, number>();
    for (const e of game.inventory) {
      if (e.count <= 0) continue;
      const k = canonicalIngredient(e.ingredient_id);
      inventoryCanonicalCount.set(k, (inventoryCanonicalCount.get(k) ?? 0) + e.count);
    }
    const preparedSet = new Set(p.prepared);
    const owned = new Set([...game.equipment_owned, ...IMPLICIT_EQUIPMENT]);

    // 1) requiredIngredients (quantities) take precedence over plain `requires`
    //    for ingredient checks. They may overlap with `requires`, but quantities
    //    are validated against activePick + inventory totals.
    const reqIng = step.requiredIngredients ?? [];
    const pick = useActivePick.getState().pick;
    for (const ri of reqIng) {
      const haveInv = inventoryCanonicalCount.get(ri.id) ?? 0;
      const haveTable = [...onTableCanonical].filter((c) => c === ri.id).length;
      const have = haveInv + haveTable;
      if (have < ri.quantity) {
        bumpError(
          set,
          get,
          `Не хватает ${INGREDIENTS_BY_ID.get(ri.id)?.name ?? ri.id}: нужно ${ri.quantity}, есть ${have}`,
        );
        return { ok: false, reason: "missing", missing: [ri.id] };
      }
      // If the player has a pick of this ingredient, demand quantity matches.
      if (pick && canonicalIngredient(pick.ingredient_id) === ri.id && pick.quantity < ri.quantity) {
        useGame
          .getState()
          .log(`Возьми ${ri.quantity} шт. ${INGREDIENTS_BY_ID.get(ri.id)?.name ?? ri.id} в Продуктах`);
        return { ok: false, reason: "missing", missing: [ri.id] };
      }
    }

    const reqIngIds = new Set(reqIng.map((r) => r.id));

    const missing: string[] = [];
    for (const req of step.requires) {
      if (req === equipment_id) continue;
      if (owned.has(req)) continue;
      if (preparedSet.has(req)) continue;
      if (onTableCanonical.has(req)) continue;
      if ((inventoryCanonicalCount.get(req) ?? 0) > 0) continue;
      if (req === "water") continue;
      if (reqIngIds.has(req)) continue; // covered above
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
    if (step.minigame === "mix" || step.minigame === "window" || step.minigame === "hold") {
      set({ active_minigame: { step_id: step.id, kind: step.minigame } });
      return { ok: true, opened_minigame: step.minigame, step };
    }

    // Auto-complete (chop_stub/roll_stub/null) — neutral score 0.85
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
  // 1) Authored target wins — самый надёжный сигнал из steps.json.
  if (step.target) return equipment_id === step.target;
  // 2) Per-step explicit override (legacy).
  const override = STEP_TARGET_OVERRIDE[step.id];
  if (override) return equipment_id === override;
  if (step.requires.includes(equipment_id)) return true;
  if (step.minigame === "mix" && equipment_id === "bowl") return true;
  if (step.minigame === "window" && HEAT_EQUIPMENT.has(equipment_id)) {
    const heatInStep = step.requires.find((r) => HEAT_EQUIPMENT.has(r));
    if (heatInStep) return heatInStep === equipment_id;
    return equipment_id === "stove";
  }
  if (
    (step.minigame === "chop_stub" || step.minigame === "roll_stub") &&
    equipment_id === "work_surface"
  )
    return true;
  return false;
}

/** Best guess: which equipment is the "primary" target the player should click. */
export function expectedEquipmentForStep(step: RecipeStep): string | null {
  // Per-step explicit override (kettle pour, etc.)
  const override = STEP_TARGET_OVERRIDE[step.id];
  if (override) return override;
  // Serve step is finalized by the bell.
  if (step.type === "serve") return "bell";
  // Authored target from steps.json — most reliable source of truth.
  if (step.target) return step.target;
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

/** Steps that need a non-default click target. */
const STEP_TARGET_OVERRIDE: Record<string, string> = {
  tea_pour: "kettle", // pouring boiling water FROM the kettle into the cup
};

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
  const owned = new Set([...game.equipment_owned, ...IMPLICIT_EQUIPMENT]);
  const preparedSet = new Set(p.prepared);
  let consumed_basic = p.consumed_basic;
  let consumed_premium = p.consumed_premium;

  const newPrepared = [...p.prepared];

  /**
   * Списать N единиц ингредиента (canonical id) из стола/инвентаря.
   * Стол первым, дальше инвентарь. Учитывает activePick для приоритета
   * качества/конкретного entry.
   */
  const consumeIngredient = (canonicalId: string, count: number) => {
    let need = count;
    while (need > 0) {
      const slotIdx = game.table_slots.findIndex(
        (s) => s.ingredient_id && canonicalIngredient(s.ingredient_id) === canonicalId,
      );
      if (slotIdx >= 0) {
        const slot = game.table_slots[slotIdx];
        if (slot.quality === "premium") consumed_premium += 1;
        else consumed_basic += 1;
        game.clearTableSlot(slotIdx);
        need -= 1;
        continue;
      }
      // Inventory: prefer activePick id+quality, иначе premium-first.
      const pick = useActivePick.getState().pick;
      let pickedFrom: { id: string; quality: IngredientQuality } | null = null;
      if (pick && canonicalIngredient(pick.ingredient_id) === canonicalId) {
        const inv = game.inventory.find(
          (e) => e.ingredient_id === pick.ingredient_id && e.quality === pick.quality && e.count > 0,
        );
        if (inv) pickedFrom = { id: inv.ingredient_id, quality: inv.quality };
      }
      if (!pickedFrom) {
        const sortedInv = [...game.inventory].sort((a, b) =>
          a.quality === b.quality ? 0 : a.quality === "premium" ? -1 : 1,
        );
        const match = sortedInv.find(
          (e) => canonicalIngredient(e.ingredient_id) === canonicalId && e.count > 0,
        );
        if (match) pickedFrom = { id: match.ingredient_id, quality: match.quality };
      }
      if (!pickedFrom) break; // ничего не нашли — выходим
      game.removeFromInventory(pickedFrom.id, pickedFrom.quality, 1);
      if (pickedFrom.quality === "premium") consumed_premium += 1;
      else consumed_basic += 1;
      // Уменьшаем активный пик, если он совпал.
      const pickNow = useActivePick.getState().pick;
      if (
        pickNow &&
        pickNow.ingredient_id === pickedFrom.id &&
        pickNow.quality === pickedFrom.quality
      ) {
        useActivePick.getState().consumeQuantity(1);
      }
      need -= 1;
    }
  };

  // 1) requiredIngredients (с количествами) — высший приоритет.
  const reqIng = step.requiredIngredients ?? [];
  const consumedByQty = new Set<string>();
  for (const ri of reqIng) {
    consumeIngredient(ri.id, ri.quantity);
    consumedByQty.add(ri.id);
  }

  // 2) Старая схема: один-на-один по step.requires (если не покрыто quantity).
  for (const req of step.requires) {
    if (owned.has(req)) continue;
    if (preparedSet.has(req)) {
      const idx = newPrepared.indexOf(req);
      if (idx >= 0) newPrepared.splice(idx, 1);
      continue;
    }
    if (req === "water") continue;
    if (consumedByQty.has(req)) continue;
    consumeIngredient(req, 1);
  }

  if (step.output) newPrepared.push(step.output);

  const minigame_scores =
    step.minigame === "mix" || step.minigame === "window" || step.minigame === "hold"
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
  omelet_eggs_in_bowl: "2 яйца в миске. Теперь взбей их.",
  omelet_mix: "Яйца взбиты. Вылей смесь на сковороду.",
  omelet_pour_pan: "Смесь на сковороде. Поймай готовность.",
  omelet_cook: "Омлет готов. Переложи его на тарелку.",
  omelet_plate: "Омлет на тарелке. Позвони в звонок.",
  tea_leaves_in_cup: "Заварка в чашке. Вскипяти воду.",
  tea_boil: "Вода закипела. Налей кипяток в чашку.",
  tea_pour: "Чай готов к подаче. Позвони в звонок.",
  ctt_bread_in_toaster: "Хлеб в тостере. Поймай готовность.",
  ctt_toast: "Тост готов. Теперь нарежь помидор.",
  ctt_chop_tomato: "Помидор нарезан. Положи его на тост.",
  ctt_tomato_to_toast: "Помидор на тосте. Добавь сыр.",
  ctt_assemble: "Тост собран. Позвони в звонок.",
};


// ---------- Order generator ----------

/**
 * Test pool — only these recipes are issued in MVP/test mode.
 * cheese_tomato_toast включается, только если у игрока куплен toaster.
 */
export const TEST_RECIPE_POOL: readonly string[] = ["omelet", "tea", "cheese_tomato_toast"];

/**
 * Pick the next recipe id (test mode):
 * - Strictly alternates within available pool based on the most recent review.
 * - Recipes whose required_equipment is not all owned are filtered out.
 */
export function pickNextRecipe(): string | null {
  const game = useGame.getState();
  // Рецепт может выпасть, если он либо ready (всё уже есть), либо affordable
  // (денег хватит докупить недостающее). locked-рецепты в ротацию не попадают.
  const available = TEST_RECIPE_POOL.filter((id) => {
    const r = RECIPES_BY_ID.get(id);
    if (!r) return false;
    const av = getRecipeAvailability(id, game);
    return av.status === "ready" || av.status === "affordable";
  });
  if (available.length === 0) return null;
  const reviews = game.reviews;
  // store.completeOrder prepends the new review, so reviews[0] is the most recent.
  const lastReview = reviews.length > 0 ? reviews[0] : null;
  const lastId = lastReview?.recipe_id ?? null;

  let next: string | null;
  if (!lastId || !available.includes(lastId)) {
    next = available[0] ?? null;
  } else {
    const idx = available.indexOf(lastId);
    next = available[(idx + 1) % available.length] ?? null;
  }
  console.debug(`pickNextRecipe: last=${lastId ?? "none"}, next=${next ?? "none"}`);
  return next;
}

