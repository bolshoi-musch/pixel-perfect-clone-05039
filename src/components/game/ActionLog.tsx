// Лента действий из 3D-сцены. Показывается в углу /play.

import { useGame } from "@/game/store";

export function ActionLog() {
  const log = useGame((s) => s.action_log);
  if (log.length === 0) return null;
  return (
    <ul className="pointer-events-none flex flex-col gap-1">
      {log.slice(0, 4).map((e, i) => (
        <li
          key={e.id}
          className="rounded-md bg-card/85 px-3 py-1 text-xs text-foreground shadow-[var(--shadow-soft)] backdrop-blur"
          style={{ opacity: 1 - i * 0.22 }}
        >
          {e.text}
        </li>
      ))}
    </ul>
  );
}
