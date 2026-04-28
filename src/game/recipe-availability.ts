// Recipe availability: проверяем, можно ли вообще выдать рецепт игроку.
//
// Статусы:
//  - "ready":      всё уже есть (оборудование куплено, продукты в инвентаре);
//  - "affordable": чего-то не хватает, но денег хватает докупить недостающее;
//  - "locked":     не хватает и денег НЕ хватает — рецепт нельзя выдавать.
//
// Placed equipment (например pan_on_stove) НЕ блокирует рецепт: если предмет
// есть/можно купить — это actionable state, игрок просто откроет «Технику».

import {
  RECIPES_BY_ID,
  STEPS_BY_ID,
  EQUIPMENT_BY_ID,
  INGREDIENTS_BY_ID,
} from "./data";
import type { IngredientQuality } from "./types";

export type RecipeAvailabilityStatus = "ready" | "affordable" | "locked";

export interface MissingIngredient {
  id: string;
  quantity: number;
  quality?: IngredientQuality;
  unitPrice: number;
}

export interface RecipeAvailability {
  status: RecipeAvailabilityStatus;
  missingEquipment: string[];
  missingIngredients: MissingIngredient[];
  missingCost: number;
}

interface AvailabilityGameState {
  money: number;
  equipment_owned: string[];
  inventory: { ingredient_id: string; quality: IngredientQuality; count: number }[];
}

const INGREDIENT_ALIAS: Record<string, string> = {
  egg_premium: "egg",
  bread_premium: "bread",
};

function canonical(id: string): string {
  return INGREDIENT_ALIAS[id] ?? id;
}

/**
 * Считаем для каждого ингредиента (canonical id) суммарное требуемое
 * количество по всем шагам рецепта. Берём максимум из requiredIngredients
 * (если задано) или 1 единицу из step.requires (старая схема).
 */
function collectRequiredIngredients(recipeId: string): Map<string, number> {
  const recipe = RECIPES_BY_ID.get(recipeId);
  const out = new Map<string, number>();
  if (!recipe) return out;
  for (const sid of recipe.step_ids) {
    const step = STEPS_BY_ID.get(sid);
    if (!step) continue;
    const counted = new Set<string>();
    if (step.requiredIngredients && step.requiredIngredients.length > 0) {
      for (const ri of step.requiredIngredients) {
        const id = canonical(ri.id);
        out.set(id, (out.get(id) ?? 0) + ri.quantity);
        counted.add(id);
      }
    }
    for (const req of step.requires) {
      const ing = INGREDIENTS_BY_ID.get(req);
      if (!ing) continue; // equipment / prepared id
      if (ing.category !== "raw") continue;
      if (req === "water") continue;
      const id = canonical(req);
      if (counted.has(id)) continue;
      out.set(id, (out.get(id) ?? 0) + 1);
    }
  }
  return out;
}

export function getRecipeAvailability(
  recipeId: string,
  game: AvailabilityGameState,
): RecipeAvailability {
  const recipe = RECIPES_BY_ID.get(recipeId);
  if (!recipe) {
    return { status: "locked", missingEquipment: [], missingIngredients: [], missingCost: 0 };
  }

  const owned = new Set(game.equipment_owned);

  // --- Equipment ---
  const missingEquipment: string[] = [];
  let equipmentCost = 0;
  let equipmentLocked = false;
  for (const eid of recipe.required_equipment) {
    if (owned.has(eid)) continue;
    const eq = EQUIPMENT_BY_ID.get(eid);
    if (!eq) {
      // Неизвестный — считаем заблокированным.
      equipmentLocked = true;
      missingEquipment.push(eid);
      continue;
    }
    if (eq.owned_by_default) {
      // По данным считается всегда доступным; пропускаем.
      continue;
    }
    missingEquipment.push(eid);
    equipmentCost += eq.price;
  }

  // --- Ingredients ---
  const required = collectRequiredIngredients(recipeId);
  const inventoryCanonical = new Map<string, number>();
  for (const e of game.inventory) {
    if (e.count <= 0) continue;
    const id = canonical(e.ingredient_id);
    inventoryCanonical.set(id, (inventoryCanonical.get(id) ?? 0) + e.count);
  }

  const missingIngredients: MissingIngredient[] = [];
  let ingredientCost = 0;
  for (const [id, qty] of required) {
    const have = inventoryCanonical.get(id) ?? 0;
    if (have >= qty) continue;
    const ing = INGREDIENTS_BY_ID.get(id);
    if (!ing) continue;
    const need = qty - have;
    missingIngredients.push({
      id,
      quantity: need,
      quality: "basic",
      unitPrice: ing.price,
    });
    ingredientCost += ing.price * need;
  }

  const missingCost = equipmentCost + ingredientCost;

  if (equipmentLocked) {
    return { status: "locked", missingEquipment, missingIngredients, missingCost };
  }
  if (missingEquipment.length === 0 && missingIngredients.length === 0) {
    return { status: "ready", missingEquipment, missingIngredients, missingCost: 0 };
  }
  if (game.money >= missingCost) {
    return { status: "affordable", missingEquipment, missingIngredients, missingCost };
  }
  return { status: "locked", missingEquipment, missingIngredients, missingCost };
}
