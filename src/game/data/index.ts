import { z } from "zod";
import ingredientsRaw from "./ingredients.json";
import equipmentRaw from "./equipment.json";
import recipesRaw from "./recipes.json";
import stepsRaw from "./steps.json";
import reviewTemplatesRaw from "./review_templates.json";
import type { Ingredient, Equipment, Recipe, RecipeStep, ReviewTemplate } from "../types";

const IngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["raw", "prepared", "cooked"]),
  quality: z.enum(["basic", "premium"]),
  price: z.number().nonnegative(),
  edible_raw: z.boolean(),
});

const EquipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  owned_by_default: z.boolean(),
});

const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  base_price: z.number().nonnegative(),
  t_fast: z.number().positive(),
  t_ok: z.number().positive(),
  required_equipment: z.array(z.string()),
  step_ids: z.array(z.string()),
});

const StepSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    requires: z.array(z.string()),
    minigame: z.enum(["mix", "window", "roll_stub", "chop_stub", "hold"]).nullable(),
    output: z.string().nullable(),
    hints: z.array(z.string()),
    // Optional declarative fields (preserved so order-engine can use them).
    label: z.string().optional(),
    hint: z.string().optional(),
    actionType: z
      .enum(["combine", "heat", "mix", "cut", "form", "serve", "pour"])
      .optional(),
    target: z.string().optional(),
    result: z.string().optional(),
    minigameType: z
      .enum(["mix", "window", "roll_stub", "chop_stub", "hold"])
      .optional(),
    serveStep: z.boolean().optional(),
    requiredIngredients: z
      .array(z.object({ id: z.string(), quantity: z.number().int().positive() }))
      .optional(),
    requiresEquipmentPlaced: z.array(z.string()).optional(),
  })
  .passthrough();

const ReviewTemplateSchema = z.object({
  id: z.string(),
  trigger: z.enum([
    "speed:slow",
    "speed:fast",
    "accuracy:low",
    "accuracy:high",
    "minigame:low",
    "minigame:high",
    "ingredient:premium",
    "ingredient:basic",
  ]),
  text: z.string(),
});

export const INGREDIENTS: Ingredient[] = z.array(IngredientSchema).parse(ingredientsRaw);
export const EQUIPMENT: Equipment[] = z.array(EquipmentSchema).parse(equipmentRaw);
export const RECIPES: Recipe[] = z.array(RecipeSchema).parse(recipesRaw);
export const STEPS: RecipeStep[] = z.array(StepSchema).parse(stepsRaw);
export const REVIEW_TEMPLATES: ReviewTemplate[] = z
  .array(ReviewTemplateSchema)
  .parse(reviewTemplatesRaw);

export const INGREDIENTS_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));
export const EQUIPMENT_BY_ID = new Map(EQUIPMENT.map((e) => [e.id, e]));
export const RECIPES_BY_ID = new Map(RECIPES.map((r) => [r.id, r]));
export const STEPS_BY_ID = new Map(STEPS.map((s) => [s.id, s]));
