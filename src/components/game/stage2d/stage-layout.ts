// Единый источник координат для 2.5D-сцены кухни.
// Все позиции — в процентах от размеров сцены, чтобы не зависеть от вьюпорта.
// Принцип: anchor "bottom-center" → точка (left, top) = это место,
// где НИЖНЯЯ ТОЧКА предмета касается поверхности стола.
//
// KitchenStage2D НЕ должен задавать left/top/bottom inline для предметов —
// он только читает значения отсюда и пробрасывает в <StageObject />.

export type StageAnchor = "bottom-center";

export interface StageObjectLayout {
  /** Левая координата якоря, в % ширины сцены. */
  left: number;
  /** Верхняя координата якоря (нижняя точка спрайта), в % высоты сцены. */
  top: number;
  /** Ширина спрайта в px (CSS). */
  width: number;
  /** z-index слоя. */
  zIndex: number;
  /** Якорь спрайта. Сейчас всегда "bottom-center". */
  anchor: StageAnchor;
  /** Ширина овальной тени под предметом. */
  shadowWidth: number;
}

/**
 * Поверхность стола — задняя и передняя кромки в % высоты сцены.
 * Все объекты рабочей сцены должны лежать в этом диапазоне по top.
 */
export const COUNTERTOP_TOP_PCT = 46; // верхний край столешницы (задняя линия)
export const COUNTERTOP_BOTTOM_PCT = 80; // передняя кромка столешницы (над нижним меню)

/**
 * Layout всех объектов сцены. Координаты — точка опоры (нижняя кромка спрайта).
 *
 * Композиция (cooking station, всё на одной столешнице, никто не висит):
 *   Задний ряд (опорная точка ≈ задняя треть столешницы, ~58%):
 *     stove (компактная плитка) ─ kettle ─ toaster
 *   Рабочий ряд (опорная точка ≈ передняя треть столешницы, ~72%):
 *     bowl ─ plate ─ cup
 *   Звонок:
 *     bell — справа на столе, рядом с чашкой
 *
 *   Слоты на самой передней кромке (~78%), не перекрывая нижнее меню (>= 80%).
 */
export const STAGE_LAYOUT = {
  // ── back row (стоит на задней половине столешницы) ───────
  stove: {
    left: 30,
    top: 64, // нижняя точка плиты — на задней линии столешницы
    width: 130, // компактная плитка, не напольная духовка
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 110,
  },
  toaster: {
    left: 50,
    top: 62,
    width: 90,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 70,
  },
  kettle: {
    left: 70,
    top: 64,
    width: 95,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 75,
  },

  // ── work row (на столе, ближе к игроку) ──────────────────
  bowl: {
    left: 36,
    top: 73,
    width: 110,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 90,
  },
  plate: {
    left: 50,
    top: 73,
    width: 120,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 95,
  },
  cup: {
    left: 64,
    top: 73,
    width: 70,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 55,
  },

  // ── service ─────────────────────────────────────────────
  bell: {
    left: 76,
    top: 74,
    width: 50,
    zIndex: 30,
    anchor: "bottom-center",
    shadowWidth: 40,
  },

  // ── table slots (5 штук, на передней кромке столешницы) ─
  tableSlot1: {
    left: 32,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot2: {
    left: 41,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot3: {
    left: 50,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot4: {
    left: 59,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot5: {
    left: 68,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
} as const satisfies Record<string, StageObjectLayout>;

export type StageObjectId = keyof typeof STAGE_LAYOUT;

export const TABLE_SLOT_IDS_2D: StageObjectId[] = [
  "tableSlot1",
  "tableSlot2",
  "tableSlot3",
  "tableSlot4",
  "tableSlot5",
];
