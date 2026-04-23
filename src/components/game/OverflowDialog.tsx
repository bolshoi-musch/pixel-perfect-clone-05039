// Модал «выберите, что убрать», когда стол переполнен.

import { useGame } from "@/game/store";
import { INGREDIENTS_BY_ID } from "@/game/data";
import { PanelDialog } from "./PanelDialog";

export function OverflowDialog() {
  const pending = useGame((s) => s.pending_overflow);
  const slots = useGame((s) => s.table_slots);
  const resolve = useGame((s) => s.resolveOverflow);
  const cancel = useGame((s) => s.cancelOverflow);

  if (!pending) return null;
  const incoming = INGREDIENTS_BY_ID.get(pending.entry.ingredient_id);

  return (
    <PanelDialog open={true} onClose={cancel} title="Стол переполнен">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Чтобы поставить{" "}
          <span className="font-medium text-foreground">{incoming?.name ?? "предмет"}</span>,
          выберите слот, который хотите освободить. Предмет вернётся в инвентарь.
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {slots.map((slot, i) => {
            const ing = slot.ingredient_id ? INGREDIENTS_BY_ID.get(slot.ingredient_id) : null;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!ing}
                  onClick={() => resolve(i)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2 text-left transition hover:bg-accent disabled:opacity-50 disabled:hover:bg-background/60"
                >
                  <span className="text-sm">
                    Слот {i + 1}:{" "}
                    <span className="font-medium text-foreground">
                      {ing?.name ?? "пусто"}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {slot.quality === "premium" ? "Премиум" : slot.quality === "basic" ? "Обычн." : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </PanelDialog>
  );
}
