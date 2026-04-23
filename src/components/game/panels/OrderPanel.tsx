import { useGame } from "@/game/store";
import { useOrderEngine } from "@/game/order-engine";
import { RECIPES_BY_ID, STEPS_BY_ID } from "@/game/data";
import { EmptyState } from "../EmptyState";

export function OrderPanel() {
  const currentId = useGame((s) => s.current_order_recipe_id);
  const progress = useOrderEngine((s) => s.progress);

  if (!currentId) {
    return (
      <EmptyState
        icon="📋"
        title="Нет активного заказа"
        hint="Скоро придёт следующий гость."
      />
    );
  }

  const recipe = RECIPES_BY_ID.get(currentId);
  if (!recipe) {
    return <EmptyState icon="❓" title="Заказ не найден" />;
  }

  const stepIndex = progress?.step_index ?? 0;
  const finished = progress?.finished ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-semibold text-foreground">{recipe.name}</h3>
        <span className="text-sm text-muted-foreground">{recipe.base_price} ₽</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Быстро" value={`≤${recipe.t_fast}с`} />
        <Stat label="Норма" value={`≤${recipe.t_ok}с`} />
        <Stat label="Шагов" value={`${stepIndex}/${recipe.step_ids.length}`} />
      </div>

      {finished && (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm font-medium text-primary">
          🛎 Готово! Позвоните в звонок, чтобы подать.
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Шаги рецепта</h4>
        <ol className="space-y-2">
          {recipe.step_ids.map((sid, i) => {
            const step = STEPS_BY_ID.get(sid);
            const done = i < stepIndex;
            const active = i === stepIndex && !finished;
            return (
              <li
                key={sid}
                className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                  done
                    ? "border-primary/40 bg-primary/5"
                    : active
                      ? "border-primary bg-primary/10 shadow-[var(--shadow-soft)]"
                      : "border-border bg-background/60"
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {step?.hints?.[0] ?? step?.type}
                  </p>
                  {step?.minigame && active && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {step.minigame === "mix" && "→ Кликни по миске"}
                      {step.minigame === "window" && "→ Кликни по плите"}
                      {step.minigame === "hold" && "→ Кликни по нужной технике"}
                      {(step.minigame === "roll_stub" || step.minigame === "chop_stub") &&
                        "→ Кликни по технике"}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
