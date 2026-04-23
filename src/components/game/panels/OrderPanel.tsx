import { useGame } from "@/game/store";
import { RECIPES_BY_ID, STEPS_BY_ID } from "@/game/data";
import { EmptyState } from "../EmptyState";

export function OrderPanel() {
  const currentId = useGame((s) => s.current_order_recipe_id);

  if (!currentId) {
    return (
      <EmptyState
        icon="📋"
        title="Нет активного заказа"
        hint="Позвоните в звонок на кухне, чтобы принять следующего гостя. Появится в Iteration 2."
      />
    );
  }

  const recipe = RECIPES_BY_ID.get(currentId);
  if (!recipe) {
    return <EmptyState icon="❓" title="Заказ не найден" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-semibold text-foreground">{recipe.name}</h3>
        <span className="text-sm text-muted-foreground">{recipe.base_price} ₽</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Быстро" value={`≤${recipe.t_fast}с`} />
        <Stat label="Норма" value={`≤${recipe.t_ok}с`} />
        <Stat label="Шагов" value={String(recipe.step_ids.length)} />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Шаги рецепта</h4>
        <ol className="space-y-2">
          {recipe.step_ids.map((sid, i) => {
            const step = STEPS_BY_ID.get(sid);
            return (
              <li
                key={sid}
                className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{step?.hints?.[0] ?? step?.type}</p>
                  {step?.minigame && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Мини-игра: {step.minigame}
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
