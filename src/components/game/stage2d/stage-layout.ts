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
export const COUNTERTOP_TOP_PCT = 44; // верхний край столешницы
export const COUNTERTOP_BOTTOM_PCT = 79; // передняя кромка столешницы (над нижним меню)

/**
 * Layout всех объектов сцены. Координаты — точка опоры (нижняя кромка спрайта).
 * Задний ряд: stove, kettle. Рабочий ряд: bowl, plate, cup. На столе: bell.
 */
export const STAGE_LAYOUT = {
  // ── back row ─────────────────────────────────────────────
  stove: {
    left: 24,
    top: 60, // нижняя точка плиты — на задней линии столешницы
    width: 170,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 130,
  },
  kettle: {
    left: 72,
    top: 60,
    width: 120,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 90,
  },
  toaster: {
    left: 48,
    top: 60,
    width: 100,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 80,
  },

  // ── work row (на столе, ближе к игроку) ──────────────────
  bowl: {
    left: 37,
    top: 73,
    width: 120,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 90,
  },
  plate: {
    left: 52,
    top: 73,
    width: 130,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 100,
  },
  cup: {
    left: 66,
    top: 73,
    width: 95,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 70,
  },

  // ── service ─────────────────────────────────────────────
  bell: {
    left: 82,
    top: 76,
    width: 55,
    zIndex: 30,
    anchor: "bottom-center",
    shadowWidth: 45,
  },

  // ── table slots (5 штук, на передней кромке столешницы) ─
  tableSlot1: {
    left: 34,
    top: 78,
    width: 36,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot2: {
    left: 42,
    top: 78,
    width: 36,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot3: {
    left: 50,
    top: 78,
    width: 36,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot4: {
    left: 58,
    top: 78,
    width: 36,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
  },
  tableSlot5: {
    left: 66,
    top: 78,
    width: 36,
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
