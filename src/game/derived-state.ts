// Слой derived render state: из логической модели заказа вычисляет
// визуальное состояние ключевых объектов кухни.

import type { OrderProgress } from "./order-engine";

export type BowlVisualState = "empty" | "egg" | "eggs" | "mix";
export type PlateVisualState = "empty" | "omelet" | "toast";
export type CupVisualState = "empty" | "leaves" | "water" | "tea";
export type KettleVisualState = "idle" | "boiling" | "ready";
export type StoveVisualState = "idle" | "active";
export type PanVisualState = "empty" | "raw" | "cooked";

export interface KitchenVisualState {
  bowl: BowlVisualState;
  plate: PlateVisualState;
  cup: CupVisualState;
  kettle: KettleVisualState;
  stove: StoveVisualState;
  /** Сковорода на плите: сырая смесь / готовый омлет / пусто. */
  pan: PanVisualState;
}

const EMPTY: KitchenVisualState = {
  bowl: "empty",
  plate: "empty",
  cup: "empty",
  kettle: "idle",
  stove: "idle",
  pan: "empty",
};

/**
 * Чистая функция: prepared[] из OrderProgress → визуальные состояния.
 */
export function selectKitchenVisualState(
  progress: OrderProgress | null,
  activeStepId: string | null = null,
): KitchenVisualState {
  if (!progress) return EMPTY;
  const prepared = new Set(progress.prepared);

  // Bowl
  let bowl: BowlVisualState = "empty";
  if (prepared.has("beaten_eggs")) bowl = "mix";
  else if (prepared.has("eggs_in_bowl")) bowl = "eggs";
  else if (prepared.has("egg_in_bowl")) bowl = "egg"; // legacy

  // Plate — омлет только после явного шага plate.
  let plate: PlateVisualState = "empty";
  if (prepared.has("plated_omelet")) plate = "omelet";
  else if (prepared.has("toast_ready")) plate = "toast";

  // Cup — заварка только после tea_leaves_in_cup, чай — после tea_pour.
  let cup: CupVisualState = "empty";
  if (prepared.has("tea_brewed")) cup = "tea";
  else if (prepared.has("tea_leaves_in_cup") || prepared.has("tea_with_leaves")) cup = "leaves";

  // Kettle
  let kettle: KettleVisualState = "idle";
  if (prepared.has("hot_water")) kettle = "ready";
  else if (activeStepId === "tea_boil") kettle = "boiling";

  // Stove — активна во время варки/жарки.
  const stove: StoveVisualState =
    activeStepId === "omelet_cook" || activeStepId === "omelet_pour_pan" ? "active" : "idle";

  // Pan — что лежит на сковороде.
  let pan: PanVisualState = "empty";
  if (prepared.has("omelet_cooked")) pan = "cooked";
  else if (prepared.has("omelet_in_pan")) pan = "raw";

  return { bowl, plate, cup, kettle, stove, pan };
}

/**
 * Маппинг визуальных состояний на «контентные» id (для 3D overlay).
 */
export function visualToContentId(
  visual: KitchenVisualState,
): { bowl: string | null; plate: string | null; cup: string | null } {
  return {
    bowl:
      visual.bowl === "mix"
        ? "beaten_eggs"
        : visual.bowl === "eggs"
          ? "eggs_in_bowl"
          : visual.bowl === "egg"
            ? "egg_in_bowl"
            : null,
    plate:
      visual.plate === "omelet"
        ? "plated_omelet"
        : visual.plate === "toast"
          ? "toast_ready"
          : null,
    cup:
      visual.cup === "tea"
        ? "tea_brewed"
        : visual.cup === "leaves"
          ? "tea_leaves_in_cup"
          : visual.cup === "water"
            ? "hot_water"
            : null,
  };
}
