// Тексты подсказок для текущего шага в трёх режимах: detailed / short / off.
// Возвращает компактные/полные строки и ID требуемого пика, если есть.

export type HintMode = "detailed" | "short" | "off";

export interface HintEntry {
  /** Полный текст для Detailed. */
  detailed: string;
  /** Короткий заголовок для Short. */
  short: string;
  /** ID ингредиента, который нужно выбрать (для подсветки кнопки «Продукты»). */
  pick?: string;
}

export const STEP_HINTS: Record<string, HintEntry> = {
  omelet_crack: {
    detailed: "Выбери Яйцо в Продуктах и нажми на Миску",
    short: "Яйцо → Миска",
    pick: "egg",
  },
  omelet_mix: {
    detailed: "Нажми на Миску и хорошо взбей",
    short: "Взбей",
  },
  omelet_cook: {
    detailed: "Нажми на Плиту и поймай готовность",
    short: "Плита",
  },
  omelet_plate: {
    detailed: "Нажми на Тарелку, чтобы переложить омлет",
    short: "Тарелка",
  },
  omelet_serve: {
    detailed: "Нажми Звонок, чтобы подать омлет",
    short: "Звонок",
  },
  tea_boil: {
    detailed: "Нажми на Чайник и поймай момент кипения",
    short: "Чайник",
  },
  tea_brew: {
    detailed: "Выбери Заварку в Продуктах и нажми на Чашку",
    short: "Заварка → Чашка",
    pick: "tea_leaves",
  },
  tea_pour: {
    detailed: "Нажми на Чайник, чтобы налить кипяток в чашку",
    short: "Чайник → Чашка",
  },
  tea_serve: {
    detailed: "Нажми Звонок, чтобы подать чай",
    short: "Звонок",
  },
};

export function getHintText(stepId: string | null, mode: HintMode): string | null {
  if (!stepId) return null;
  if (mode === "off") return null;
  const entry = STEP_HINTS[stepId];
  if (!entry) return null;
  return mode === "short" ? entry.short : entry.detailed;
}

export function getHintPick(stepId: string | null): string | null {
  if (!stepId) return null;
  return STEP_HINTS[stepId]?.pick ?? null;
}
