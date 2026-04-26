import { useGame } from "@/game/store";
import { useActivePick } from "@/game/active-pick";
import { INGREDIENTS_BY_ID } from "@/game/data";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";

interface Props {
  onOpenShop?: () => void;
}

export function InventoryPanel({ onOpenShop }: Props) {
  const inventory = useGame((s) => s.inventory);
  const pick = useActivePick((s) => s.pick);
  const setPick = useActivePick((s) => s.setPick);

  if (inventory.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon="🥬"
          title="Продуктов пока нет"
          hint="Купите ингредиенты в магазине, чтобы начать готовить."
        />
        {onOpenShop && (
          <Button variant="default" className="w-full" onClick={onOpenShop}>
            Открыть магазин
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Выбери продукт и нажми по нужному инструменту (миска, плита, чашка…) — ингредиент
        используется напрямую. Покупка продуктов — в Магазине.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {inventory.map((entry) => {
          const ing = INGREDIENTS_BY_ID.get(entry.ingredient_id);
          if (!ing) return null;
          const key = `${entry.ingredient_id}|${entry.quality}`;
          const active = pick === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => setPick(active ? null : key)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-primary bg-primary/10 shadow-[var(--shadow-soft)]"
                    : "border-border bg-background/60 hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{ing.name}</span>
                  <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    ×{entry.count}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.quality === "premium" ? "Премиум" : "Обычный"}
                </p>
                {active && (
                  <p className="mt-1 text-[11px] font-medium text-primary">
                    Выбран — кликните слот
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {onOpenShop && (
        <Button variant="outline" className="w-full" onClick={onOpenShop}>
          Открыть магазин
        </Button>
      )}
    </div>
  );
}
