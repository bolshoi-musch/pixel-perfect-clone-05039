import { useGame } from "@/game/store";
import { useActivePick } from "@/game/active-pick";
import { INGREDIENTS_BY_ID } from "@/game/data";
import { useNavigate } from "@tanstack/react-router";

export function SettingsPanel() {
  const resetGame = useGame((s) => s.resetGame);
  const navigate = useNavigate();
  const tableSlots = useGame((s) => s.table_slots);
  const actionLog = useGame((s) => s.action_log);
  const pick = useActivePick((s) => s.pick);

  const lastAction = actionLog[0]?.text ?? "—";
  const pickIng = pick ? INGREDIENTS_BY_ID.get(pick.split("|")[0]) : null;

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-semibold text-foreground">Сохранение</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Игра сохраняется автоматически после каждого важного действия.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Удалить сейв и начать заново? Это действие нельзя отменить.")) {
              resetGame();
              navigate({ to: "/" });
            }
          }}
          className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20"
        >
          Сбросить прогресс
        </button>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-foreground">Навигация</h4>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-2 rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          Выйти в главное меню
        </button>
      </section>

      <section className="rounded-xl border border-dashed border-border/60 bg-background/40 p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Debug
        </h4>
        <dl className="mt-2 space-y-2 text-xs">
          <div>
            <dt className="text-muted-foreground">selectedIngredient</dt>
            <dd className="mt-0.5 font-mono text-foreground">
              {pickIng ? `${pickIng.name} (${pick})` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">tableSlots</dt>
            <dd className="mt-0.5 space-y-0.5 font-mono text-foreground">
              {tableSlots.map((s, i) => {
                const ing = s.ingredient_id ? INGREDIENTS_BY_ID.get(s.ingredient_id) : null;
                return (
                  <div key={i}>
                    [{i}] {ing ? `${ing.name} · ${s.quality} · ${s.category}` : "пусто"}
                  </div>
                );
              })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">lastAction</dt>
            <dd className="mt-0.5 font-mono text-foreground">{lastAction}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
