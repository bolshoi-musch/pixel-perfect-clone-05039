import { useMemo, useState } from "react";
import { useGame } from "@/game/store";
import { useActivePick, type ActivePick } from "@/game/active-pick";
import { useOrderEngine } from "@/game/order-engine";
import { INGREDIENTS_BY_ID, RECIPES_BY_ID, STEPS_BY_ID } from "@/game/data";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";

interface Props {
  onOpenShop?: () => void;
  /** Вызывается после успешного «Взять N» — родитель закрывает панель. */
  onPickComplete?: () => void;
}

const ALIAS: Record<string, string> = { egg_premium: "egg", bread_premium: "bread" };
const canon = (id: string) => ALIAS[id] ?? id;

export function InventoryPanel({ onOpenShop, onPickComplete }: Props) {
  const inventory = useGame((s) => s.inventory);
  const setPick = useActivePick((s) => s.setPick);
  const progress = useOrderEngine((s) => s.progress);

  // Сколько единиц какого канонического ингредиента просит текущий шаг.
  const stepNeeds = useMemo(() => {
    if (!progress) return new Map<string, number>();
    const recipe = RECIPES_BY_ID.get(progress.recipe_id);
    const stepId = recipe?.step_ids[progress.step_index];
    const step = stepId ? STEPS_BY_ID.get(stepId) : null;
    const map = new Map<string, number>();
    if (step?.requiredIngredients) {
      for (const ri of step.requiredIngredients) {
        map.set(ri.id, ri.quantity);
      }
    }
    return map;
  }, [progress]);

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

  const handleTake = (pick: ActivePick) => {
    setPick(pick);
    onPickComplete?.();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Выбери количество и нажми «Взять». Затем нажми по нужному предмету на кухне.
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {inventory.map((entry) => {
          const ing = INGREDIENTS_BY_ID.get(entry.ingredient_id);
          if (!ing) return null;
          const needed = stepNeeds.get(canon(entry.ingredient_id)) ?? 1;
          return (
            <InventoryCard
              key={`${entry.ingredient_id}|${entry.quality}`}
              name={ing.name}
              ingredient_id={entry.ingredient_id}
              quality={entry.quality}
              available={entry.count}
              defaultQty={Math.min(needed, entry.count) || 1}
              needed={needed}
              onTake={handleTake}
            />
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

function InventoryCard({
  name,
  ingredient_id,
  quality,
  available,
  defaultQty,
  needed,
  onTake,
}: {
  name: string;
  ingredient_id: string;
  quality: "basic" | "premium";
  available: number;
  defaultQty: number;
  needed: number;
  onTake: (p: ActivePick) => void;
}) {
  const [qty, setQty] = useState(Math.max(1, Math.min(defaultQty, available)));
  const enough = available >= qty;
  const needsMore = needed > available;

  return (
    <li className="rounded-xl border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{name}</span>
        <span
          className={
            quality === "premium"
              ? "rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600"
              : "rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
          }
        >
          {quality === "premium" ? "★ Премиум" : "Обычный"}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Есть: {available}
        {needed > 1 && (
          <>
            {" · "}
            <span className={needsMore ? "font-semibold text-destructive" : "text-foreground"}>
              Нужно по рецепту: {needed}
            </span>
          </>
        )}
      </p>
      {needsMore && (
        <p className="mt-1 text-[11px] font-semibold text-destructive">
          Не хватает {name.toLowerCase()}: нужно {needed}, есть {available}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="h-8 w-8 rounded-md border border-border bg-background text-base font-semibold transition hover:bg-accent disabled:opacity-40"
          aria-label="Меньше"
        >
          −
        </button>
        <span className="w-8 text-center text-base font-semibold tabular-nums">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(available, q + 1))}
          disabled={qty >= available}
          className="h-8 w-8 rounded-md border border-border bg-background text-base font-semibold transition hover:bg-accent disabled:opacity-40"
          aria-label="Больше"
        >
          +
        </button>
        <Button
          size="sm"
          className="ml-auto"
          disabled={!enough || needsMore}
          onClick={() => onTake({ ingredient_id, quality, quantity: qty })}
        >
          Взять {qty}
        </Button>
      </div>
    </li>
  );
}
