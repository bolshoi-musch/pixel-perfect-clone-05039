// Mapping ingredient/prepared id → simple visual descriptor (цвет, тип формы).
// Цель MVP — узнаваемость, не реализм.

export type VisualShape = "egg" | "leaves" | "liquid" | "omelet" | "sphere";

export interface ItemVisual {
  label: string;
  color: string; // hex
  shape: VisualShape;
}

export const ITEM_VISUALS: Record<string, ItemVisual> = {
  // Сырые ингредиенты на слотах
  egg: { label: "Яйцо", color: "#f5e9d0", shape: "egg" },
  egg_premium: { label: "Яйцо (премиум)", color: "#f0d68a", shape: "egg" },
  tea_leaves: { label: "Заварка", color: "#3d5a2a", shape: "leaves" },
  bread: { label: "Хлеб", color: "#d4a574", shape: "sphere" },
  bread_premium: { label: "Хлеб (премиум)", color: "#b8854a", shape: "sphere" },

  // Промежуточные / готовые
  egg_in_bowl: { label: "Яйцо в миске", color: "#f5d878", shape: "liquid" },
  egg_mix: { label: "Взбитое яйцо", color: "#f0c850", shape: "liquid" },
  omelet_cooked: { label: "Омлет", color: "#e8b04a", shape: "omelet" },
  plated_omelet: { label: "Омлет на тарелке", color: "#e8b04a", shape: "omelet" },
  hot_water: { label: "Кипяток", color: "#cfe6f0", shape: "liquid" },
  tea_brewed: { label: "Чай", color: "#7a3a1a", shape: "liquid" },
};

export function getItemVisual(id: string | null | undefined): ItemVisual | null {
  if (!id) return null;
  return ITEM_VISUALS[id] ?? null;
}
