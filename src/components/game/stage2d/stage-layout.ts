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
  /**
   * Сколько прозрачного пространства снизу у PNG относительно его исходной ширины.
   * Нужно, чтобы anchor bottom-center ставился по видимой нижней точке предмета,
   * а не по нижней границе всего PNG-файла.
   *
   * Формула:
   *   visibleBottomOffsetPx = visibleBottomOffsetRatio * layout.width
   *
   * KitchenStage2D сдвигает контейнер вниз на эту величину, так что
   * (left, top) совпадает с ВИДИМОЙ нижней точкой предмета (где он касается
   * стола), а тень кладётся туда же. Без этого PNG с прозрачным нижним
   * паддингом выглядят «летающими».
   */
  visibleBottomOffsetRatio?: number;
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
export const COUNTERTOP_BOTTOM_PCT = 81;

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
  // ── back row ─────────────────────────────────────────────
  stove: {
    left: 32,
    top: 63,
    width: 140,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0.166,
  },
  toaster: {
    left: 50,
    top: 63,
    width: 90,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0.034,
  },
  kettle: {
    left: 68,
    top: 63,
    width: 105,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0.083,
  },

  // ── work row ─────────────────────────────────────────────
  bowl: {
    left: 35,
    top: 75,
    width: 125,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0.028,
  },
  /**
   * workArea — центральная рабочая зона ближе к игроку. Не интерактивный
   * предмет, а место, куда «кладётся» выбранный продукт перед применением.
   */
  workArea: {
    left: 50,
    top: 76,
    width: 140,
    zIndex: 18,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  plate: {
    left: 60,
    top: 75,
    width: 135,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0.011,
  },
  cup: {
    left: 70,
    top: 75,
    width: 82,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0.042,
  },

  // ── service ──────────────────────────────────────────────
  bell: {
    left: 73,
    top: 76,
    width: 52,
    zIndex: 30,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },

  // ── table slots ──────────────────────────────────────────
  tableSlot1: {
    left: 38,
    top: 80,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot2: {
    left: 44,
    top: 80,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot3: {
    left: 50,
    top: 80,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot4: {
    left: 56,
    top: 80,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot5: {
    left: 62,
    top: 80,
    width: 32,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
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
