// Единый источник координат для 2.5D-сцены кухни.
//
// Все позиции — в ЛОКАЛЬНЫХ виртуальных координатах внутри кухонной сцены
// размером STAGE_W × STAGE_H. KitchenStage2D рендерит фиксированный по
// aspect-ratio контейнер `.kitchen-stage` и переводит (x, y, width) в проценты
// от него. Благодаря этому при ресайзе окна предметы масштабируются вместе
// со сценой и не «расползаются» по viewport.
//
// Anchor "bottom-center": точка (x, y) — это место, где НИЖНЯЯ ВИДИМАЯ точка
// предмета касается столешницы.

export type StageAnchor = "bottom-center";

export interface StageObjectLayout {
  /** X в виртуальных координатах сцены (0..STAGE_W). */
  x: number;
  /** Y в виртуальных координатах сцены (0..STAGE_H). */
  y: number;
  /** Ширина спрайта в виртуальных координатах сцены (px по горизонтали). */
  width: number;
  /** z-index слоя. */
  zIndex: number;
  /** Якорь спрайта. Сейчас всегда "bottom-center". */
  anchor: StageAnchor;
  /** Сколько прозрачного паддинга снизу у PNG относительно ширины. */
  visibleBottomOffsetRatio?: number;
}

/** Виртуальный размер сцены — все координаты ниже задаются в этих единицах. */
export const STAGE_W = 1000;
export const STAGE_H = 520;

/**
 * Вертикальные границы столешницы в виртуальных координатах сцены.
 * Используются для отрисовки самой столешницы.
 */
export const COUNTERTOP_TOP = 170;
export const COUNTERTOP_BOTTOM = 500;

/**
 * Layout всех объектов сцены. Координаты — точка опоры (нижняя кромка спрайта)
 * в виртуальном пространстве STAGE_W × STAGE_H.
 */
export const STAGE_LAYOUT = {
  // ── back row ─────────────────────────────────────────────
  stove: {
    x: 250,
    y: 320,
    width: 145,
    zIndex: 20,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0.166,
  },
  toaster: {
    x: 500,
    y: 320,
    width: 100,
    zIndex: 20,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0.034,
  },
  kettle: {
    x: 730,
    y: 320,
    width: 110,
    zIndex: 20,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0.083,
  },

  // ── work row ─────────────────────────────────────────────
  bowl: {
    x: 295,
    y: 415,
    width: 130,
    zIndex: 30,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0.028,
  },
  workArea: {
    x: 470,
    y: 430,
    width: 140,
    zIndex: 25,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0,
  },
  plate: {
    x: 600,
    y: 415,
    width: 140,
    zIndex: 30,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0.011,
  },
  cup: {
    x: 720,
    y: 415,
    width: 86,
    zIndex: 30,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0.042,
  },

  // ── service ──────────────────────────────────────────────
  bell: {
    x: 820,
    y: 425,
    width: 56,
    zIndex: 40,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0,
  },

  // ── table slots (front edge) ─────────────────────────────
  tableSlot1: {
    x: 320,
    y: 495,
    width: 36,
    zIndex: 45,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0,
  },
  tableSlot2: {
    x: 400,
    y: 495,
    width: 36,
    zIndex: 45,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0,
  },
  tableSlot3: {
    x: 480,
    y: 495,
    width: 36,
    zIndex: 45,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0,
  },
  tableSlot4: {
    x: 560,
    y: 495,
    width: 36,
    zIndex: 45,
    anchor: "bottom-center",
    visibleBottomOffsetRatio: 0,
  },
  tableSlot5: {
    x: 640,
    y: 495,
    width: 36,
    zIndex: 45,
    anchor: "bottom-center",
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
