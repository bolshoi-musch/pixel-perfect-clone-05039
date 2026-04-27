// Слой derived render state: из логической модели заказа вычисляет
// визуальное состояние ключевых объектов кухни.
// Используется и текущей 3D-сценой, и будущей 2.5D-сценой как единый источник.

import type { OrderProgress } from "./order-engine";

export type BowlVisualState = "empty" | "egg" | "mix";
export type PlateVisualState = "empty" | "omelet" | "toast";
export type CupVisualState = "empty" | "leaves" | "water" | "tea";
export type KettleVisualState = "idle" | "boiling" | "ready";
export type StoveVisualState = "idle" | "active";

export interface KitchenVisualState {
  bowl: BowlVisualState;
  plate: PlateVisualState;
  cup: CupVisualState;
  kettle: KettleVisualState;
  stove: StoveVisualState;
}

const EMPTY: KitchenVisualState = {
  bowl: "empty",
  plate: "empty",
  cup: "empty",
  kettle: "idle",
  stove: "idle",
};

/**
 * Чистая функция: prepared[] из OrderProgress → визуальные состояния.
 * Любое промежуточное «приготовленное» считается источником визуала.
 */
export function selectKitchenVisualState(
  progress: OrderProgress | null,
  /** ID активного шага — нужен только чтобы показать «активную» плиту/чайник во время минигеймы. */
  activeStepId: string | null = null,
): KitchenVisualState {
  if (!progress) return EMPTY;
  const prepared = new Set(progress.prepared);

  // Bowl
  let bowl: BowlVisualState = "empty";
  if (prepared.has("egg_mix")) bowl = "mix";
  else if (prepared.has("egg_in_bowl")) bowl = "egg";

  // Plate — омлет только после явного шага plate (plated_omelet),
  // не после omelet_cooked (это ещё на сковороде).
  let plate: PlateVisualState = "empty";
  if (prepared.has("plated_omelet")) plate = "omelet";
  else if (prepared.has("toast_ready")) plate = "toast";

  // Cup — hot_water это кипяток в чайнике, не в чашке.
  // Чашка показывает заварку только после tea_brew, чай — после tea_pour.
  let cup: CupVisualState = "empty";
  if (prepared.has("tea_brewed")) cup = "tea";
  else if (prepared.has("tea_with_leaves")) cup = "leaves";

  // Kettle
  let kettle: KettleVisualState = "idle";
  if (prepared.has("hot_water")) kettle = "ready";
  else if (activeStepId === "tea_boil") kettle = "boiling";

  // Stove
  const stove: StoveVisualState = activeStepId === "omelet_cook" ? "active" : "idle";

  return { bowl, plate, cup, kettle, stove };
}

/**
 * Маппинг визуальных состояний на «контентные» id, понятные текущему рендеру
 * (KitchenScene использует prepared-id для overlay внутри миски/чашки/тарелки).
 * Возвращает null, если объект пуст.
 */
export function visualToContentId(
  visual: KitchenVisualState,
): { bowl: string | null; plate: string | null; cup: string | null } {
  return {
    bowl: visual.bowl === "mix" ? "egg_mix" : visual.bowl === "egg" ? "egg_in_bowl" : null,
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
          ? "tea_with_leaves"
          : visual.cup === "water"
            ? "hot_water"
            : null,
  };
}
