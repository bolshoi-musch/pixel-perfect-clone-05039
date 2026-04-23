// Интеракции 3D-сцены: типы целей, события для HUD, утилиты hand-targets.

import type { TableSlot } from "./types";

export type InteractTargetKind =
  | "stove"
  | "bowl"
  | "bell"
  | "plate"
  | "cup"
  | "work_surface"
  | "table_slot";

export interface InteractTarget {
  kind: InteractTargetKind;
  /** Для table_slot — индекс 0..4 */
  index?: number;
  /** Мировые координаты для анимации руки (x,y,z) */
  worldPos: [number, number, number];
  label: string;
}

export type ActionLogEntry = {
  id: string;
  ts: number;
  text: string;
};

export const isSlotEmpty = (s: TableSlot) => s.ingredient_id === null;
