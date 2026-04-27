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
 *
 * Layout-pass: столешницу подняли (TOP=42), чтобы рабочая зона стала ближе
 * к игроку и крупнее. Низ оставили на 80% — слоты висят на передней кромке,
 * не перекрывая нижнее меню.
 */
export const COUNTERTOP_TOP_PCT = 42;
export const COUNTERTOP_BOTTOM_PCT = 80;

/**
 * Внутренняя ширина CSS-столешницы (% от сцены и max-width в px).
 * Сужена с 88%/980px до 76%/860px — стол перестаёт выглядеть как огромная
 * пустая доска, предметы группируются плотнее.
 */
export const COUNTERTOP_WIDTH_PCT = 76;
export const COUNTERTOP_MAX_WIDTH_PX = 860;

/**
 * Layout всех объектов сцены. Координаты — точка опоры (нижняя кромка спрайта).
 *
 * Композиция (cooking station, всё на одной столешнице, никто не висит):
 *   Задний ряд (top ≈ 62%):
 *     stove (left 34) ─ kettle (left 66)
 *   Рабочий ряд (top ≈ 73%, плотно у центра):
 *     bowl (41) ─ plate (52) ─ cup (63)
 *   Звонок:
 *     bell — справа на столе (left 72)
 *   Слоты на передней кромке (top 78), сгруппированы под рабочей зоной
 *   (40, 46, 52, 58, 64) — единый ряд под миской/тарелкой/чашкой.
 *
 * Размеры предметов выросли (stove 180, bowl 150, plate 165, cup 100, kettle 128,
 * bell 56) — предметы стали главными на сцене, а не маленькими иконками.
 */
export const STAGE_LAYOUT = {
  // ── back row (стоит на задней половине столешницы) ───────
  stove: {
    left: 34,
    top: 62,
    width: 180,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 150,
  },
  toaster: {
    left: 50,
    top: 60,
    width: 110,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 90,
  },
  kettle: {
    left: 66,
    top: 62,
    width: 128,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 100,
  },

  // ── work row (на столе, ближе к игроку) ──────────────────
  bowl: {
    left: 41,
    top: 73,
    width: 150,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 120,
  },
  plate: {
    left: 52,
    top: 73,
    width: 165,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 130,
  },
  cup: {
    left: 63,
    top: 73,
    width: 100,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 78,
  },

  // ── service ─────────────────────────────────────────────
  bell: {
    left: 72,
    top: 75,
    width: 56,
    zIndex: 30,
    anchor: "bottom-center",
    shadowWidth: 46,
  },

  // ── table slots (5 штук, на передней кромке столешницы) ─
  tableSlot1: {
    left: 40,
    top: 78,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot2: {
    left: 46,
    top: 78,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot3: {
    left: 52,
    top: 78,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot4: {
    left: 58,
    top: 78,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot5: {
    left: 64,
    top: 78,
    width: 32,
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
