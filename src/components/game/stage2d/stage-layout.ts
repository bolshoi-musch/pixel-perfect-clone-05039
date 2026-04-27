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
  // visibleBottomOffsetRatio = прозрачный нижний padding PNG / ширина PNG.
  stove: {
    left: 30,
    top: 64,
    width: 130,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 100,
    // stove.png: ~68px прозрачного низа при ширине 410px
    visibleBottomOffsetRatio: 68 / 410,
  },
  toaster: {
    left: 50,
    top: 62,
    width: 90,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 65,
    // toaster.png: ~6px / 179px
    visibleBottomOffsetRatio: 6 / 179,
  },
  kettle: {
    left: 70,
    top: 64,
    width: 95,
    zIndex: 10,
    anchor: "bottom-center",
    shadowWidth: 70,
    // kettle.png: ~17px / 205px
    visibleBottomOffsetRatio: 17 / 205,
  },

  // ── work row ─────────────────────────────────────────────
  bowl: {
    left: 36,
    top: 73,
    width: 110,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 75,
    // bowl.png: ~5px / 176px
    visibleBottomOffsetRatio: 5 / 176,
  },
  plate: {
    left: 50,
    top: 73,
    width: 120,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 85,
    // plate.png: ~2px / 176px
    visibleBottomOffsetRatio: 2 / 176,
  },
  cup: {
    left: 64,
    top: 73,
    width: 70,
    zIndex: 20,
    anchor: "bottom-center",
    shadowWidth: 45,
    // cup.png: ~3px / 72px
    visibleBottomOffsetRatio: 3 / 72,
  },

  // ── service ──────────────────────────────────────────────
  bell: {
    left: 76,
    top: 74,
    width: 50,
    zIndex: 30,
    anchor: "bottom-center",
    shadowWidth: 32,
    visibleBottomOffsetRatio: 0,
  },

  // ── table slots (на передней кромке столешницы) ──────────
  tableSlot1: {
    left: 32,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot2: {
    left: 41,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot3: {
    left: 50,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot4: {
    left: 59,
    top: 79,
    width: 34,
    zIndex: 40,
    anchor: "bottom-center",
    shadowWidth: 0,
    visibleBottomOffsetRatio: 0,
  },
  tableSlot5: {
    left: 68,
    top: 79,
    width: 34,
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
