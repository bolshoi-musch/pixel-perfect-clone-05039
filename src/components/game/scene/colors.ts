// Палитра 3D-сцены. Цвета согласованы с art-direction (тёплое дерево/керамика).
// Используем hex т.к. three.js не понимает oklch напрямую.

export const SCENE_COLORS = {
  wallBack: "#e8d9c2",
  wallSide: "#d9c5a8",
  floor: "#8a6a4a",
  woodLight: "#b88a5a",
  woodDark: "#6b4a30",
  ceramic: "#f3ece0",
  copper: "#b8703a",
  steel: "#9a9a9a",
  steelDark: "#5a5a5a",
  bell: "#caa14a",
  bellBase: "#3a2a1a",
  highlight: "#ffb86b",
  slotEmpty: "#b88a5a",
  slotHover: "#e8a86a",
  skin: "#e8b896",
} as const;

// Категории ингредиентов → цвет шарика на слоте (заглушка-меш)
export const CATEGORY_COLOR: Record<string, string> = {
  raw: "#7fb069",
  prepared: "#e8a87c",
  cooked: "#c44536",
};

export const INGREDIENT_COLOR: Record<string, string> = {
  egg: "#f3e6c4",
  egg_premium: "#f0d68a",
  bread: "#d4a574",
  bread_premium: "#b8854a",
  tea_leaves: "#3d5a2a",
  water: "#7fb8d4",
  rice: "#f5f0e0",
  tomato: "#c44536",
  cucumber: "#5a8a3a",
  lettuce: "#7fb069",
  pasta: "#e8c878",
  cheese: "#f3d878",
  berries: "#7a3a5a",
  milk: "#f5f0e8",
  flour: "#f0e8d4",
  sugar: "#fafafa",
  butter: "#f5d878",
};
