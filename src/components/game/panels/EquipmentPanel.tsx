import { useGame } from "@/game/store";
import { EQUIPMENT } from "@/game/data";

export function EquipmentPanel() {
  const owned = useGame((s) => s.equipment_owned);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Доступная и предстоящая к покупке техника. Покупка появится в Iteration 4.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {EQUIPMENT.map((eq) => {
          const isOwned = owned.includes(eq.id);
          return (
            <li
              key={eq.id}
              className={`rounded-xl border p-3 transition ${
                isOwned
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-background/60 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{eq.name}</span>
                {isOwned ? (
                  <span className="text-xs font-semibold text-primary">✓</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{eq.price} ₽</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isOwned ? "Уже на кухне" : "В магазине"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
