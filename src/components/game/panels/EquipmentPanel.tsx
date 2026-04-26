import { useGame } from "@/game/store";
import { EQUIPMENT } from "@/game/data";
import { Button } from "@/components/ui/button";

interface Props {
  onOpenShop?: () => void;
}

export function EquipmentPanel({ onOpenShop }: Props) {
  const owned = useGame((s) => s.equipment_owned);
  const stoveLevel = useGame((s) => s.stove_level);

  const ownedEq = EQUIPMENT.filter((e) => owned.includes(e.id));
  const notOwnedEq = EQUIPMENT.filter((e) => !owned.includes(e.id));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Это обзор кухни: что куплено и какой уровень плиты. Покупка — в Магазине.
      </p>

      <div className="rounded-xl border border-border bg-background/60 p-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Уровень плиты</span>
          <span className="text-sm text-foreground">{stoveLevel} / 3</span>
        </div>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3].map((lvl) => (
            <div
              key={lvl}
              className={`h-2 flex-1 rounded-full ${
                lvl <= stoveLevel ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">На кухне</h4>
        <ul className="grid grid-cols-2 gap-2">
          {ownedEq.map((eq) => (
            <li
              key={eq.id}
              className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-foreground"
            >
              ✓ {eq.name}
            </li>
          ))}
        </ul>
      </div>

      {notOwnedEq.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">Можно купить</h4>
          <ul className="grid grid-cols-2 gap-2">
            {notOwnedEq.map((eq) => (
              <li
                key={eq.id}
                className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground"
              >
                {eq.name} · {eq.price} ₽
              </li>
            ))}
          </ul>
        </div>
      )}

      {onOpenShop && (
        <Button variant="default" className="w-full" onClick={onOpenShop}>
          Открыть магазин
        </Button>
      )}
    </div>
  );
}
