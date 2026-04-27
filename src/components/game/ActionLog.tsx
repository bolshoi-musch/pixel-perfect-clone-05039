// Лента действий. Показывает последние уникальные сообщения,
// чтобы одно и то же ("Выберите ингредиент…") не висело стопкой.

import { useGame } from "@/game/store";

export function ActionLog() {
  const log = useGame((s) => s.action_log);
  if (log.length === 0) return null;

  // Дедупликация подряд идущих одинаковых сообщений и общая дедупликация по тексту.
  const seen = new Set<string>();
  const unique: typeof log = [];
  for (const e of log) {
    if (seen.has(e.text)) continue;
    seen.add(e.text);
    unique.push(e);
    if (unique.length >= 2) break;
  }

  return (
    <ul className="pointer-events-none flex max-w-[260px] flex-col gap-1">
      {unique.map((e, i) => (
        <li
          key={e.id}
          className="rounded-md bg-card/85 px-3 py-1 text-xs text-foreground shadow-[var(--shadow-soft)] backdrop-blur"
          style={{ opacity: 1 - i * 0.3 }}
        >
          {e.text}
        </li>
      ))}
    </ul>
  );
}
