// Тексты подсказок для текущего шага в трёх режимах: detailed / normal / minimal.
// Возвращает компактные/полные строки и ID требуемого пика, если есть.

export type HintMode = "detailed" | "normal" | "minimal";

/** Старые названия из v1, поддерживаем чтение из localStorage. */
export type LegacyHintMode = "short" | "off";
export type AnyHintMode = HintMode | LegacyHintMode;

export function normalizeHintMode(v: string | null | undefined): HintMode {
  if (v === "detailed" || v === "normal" || v === "minimal") return v;
  if (v === "short") return "normal"; // legacy
  if (v === "off") return "minimal"; // legacy
  return "detailed";
}

export interface HintEntry {
  /** Полный текст для Detailed. */
  detailed: string;
  /** Короткий заголовок для Normal. */
  short: string;
  /** ID ингредиента, который нужно выбрать (для подсветки кнопки «Продукты»). */
  pick?: string;
}

export const STEP_HINTS: Record<string, HintEntry> = {
  // ── Омлет (2 яйца + сковорода) ──
  omelet_eggs_in_bowl: {
    detailed: "Открой Продукты, возьми 2 Яйца и нажми на Миску",
    short: "2 Яйца → Миска",
    pick: "egg",
  },
  omelet_mix: {
    detailed: "Нажми на Миску и хорошо взбей яйца",
    short: "Взбей",
  },
  omelet_pour_pan: {
    detailed: "Нажми на Плиту, чтобы вылить смесь на сковороду",
    short: "Смесь → Сковорода",
  },
  omelet_cook: {
    detailed: "Нажми на Плиту и поймай готовность омлета",
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

  // ── Чай (4 шага) ──
  tea_leaves_in_cup: {
    detailed: "Открой Продукты, выбери Заварку и нажми на Чашку",
    short: "Заварка → Чашка",
    pick: "tea_leaves",
  },
  tea_boil: {
    detailed: "Нажми на Чайник и поймай момент кипения",
    short: "Чайник",
  },
  tea_pour: {
    detailed: "Нажми на Чайник, чтобы налить кипяток в чашку",
    short: "Чайник → Чашка",
  },
  tea_serve: {
    detailed: "Нажми Звонок, чтобы подать чай",
    short: "Звонок",
  },

  // ── Сырный тост с помидором ──
  ctt_bread_in_toaster: {
    detailed: "Открой Продукты, выбери Хлеб и нажми на Тостер",
    short: "Хлеб → Тостер",
    pick: "bread",
  },
  ctt_toast: {
    detailed: "Нажми на Тостер и поймай готовность",
    short: "Тостер",
  },
  ctt_toast_to_plate: {
    detailed: "Нажми на Тарелку, чтобы переложить готовый тост",
    short: "Тост → Тарелка",
  },
  ctt_place_knife_board: {
    detailed: "Открой Техника и поставь Нож и доску на рабочую зону",
    short: "Нож и доска → Рабочая зона",
  },
  ctt_chop_tomato: {
    detailed: "Открой Продукты, выбери Помидор и нажми на Рабочую зону",
    short: "Помидор → Рабочая зона",
    pick: "tomato",
  },
  ctt_tomato_to_toast: {
    detailed: "Нажми на Тарелку, чтобы положить нарезанный помидор на тост",
    short: "Помидор → Тост",
  },
  ctt_assemble: {
    detailed: "Открой Продукты, выбери Сыр и нажми на Тарелку",
    short: "Сыр → Тост",
    pick: "cheese",
  },
  ctt_serve: {
    detailed: "Нажми Звонок, чтобы подать тост",
    short: "Звонок",
  },
};

export function getHintText(stepId: string | null, mode: HintMode): string | null {
  if (!stepId) return null;
  if (mode === "minimal") return null;
  const entry = STEP_HINTS[stepId];
  if (!entry) return null;
  return mode === "normal" ? entry.short : entry.detailed;
}

export function getHintPick(stepId: string | null): string | null {
  if (!stepId) return null;
  return STEP_HINTS[stepId]?.pick ?? null;
}
