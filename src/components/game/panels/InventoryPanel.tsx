import { useGame } from "@/game/store";
import { INGREDIENTS_BY_ID } from "@/game/data";
import { EmptyState } from "../EmptyState";

export function InventoryPanel() {
  const inventory = useGame((s) => s.inventory);

  if (inventory.length === 0) {
    return (
      <EmptyState
        icon="🎒"
        title="Инвентарь пуст"
        hint="Купите ингредиенты в магазине, чтобы начать готовить."
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {inventory.map((entry) => {
        const ing = INGREDIENTS_BY_ID.get(entry.ingredient_id);
        if (!ing) return null;
        return (
          <li
            key={`${entry.ingredient_id}_${entry.quality}`}
            className="rounded-xl border border-border bg-background/60 p-3"
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
          </li>
        );
      })}
    </ul>
  );
}
