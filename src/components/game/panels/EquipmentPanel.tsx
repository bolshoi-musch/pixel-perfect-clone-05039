import { useGame } from "@/game/store";
import { EQUIPMENT } from "@/game/data";
import { Button } from "@/components/ui/button";

export function EquipmentPanel() {
  const owned = useGame((s) => s.equipment_owned);
  const money = useGame((s) => s.money);
  const buyEquipment = useGame((s) => s.buyEquipment);
  const log = useGame((s) => s.log);

  const handleBuy = (id: string, name: string, price: number) => {
    const ok = buyEquipment(id, price);
    if (ok) log(`Куплено: ${name} за ${price} ₽`);
    else log(`Не хватает денег для покупки: ${name}`);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Доступная и предстоящая к покупке техника. Купленные приборы появляются на кухне (если для них есть 3D-объект).
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EQUIPMENT.map((eq) => {
          const isOwned = owned.includes(eq.id);
          const canAfford = money >= eq.price;
          return (
            <li
              key={eq.id}
              className={`rounded-xl border p-3 transition ${
                isOwned
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-background/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{eq.name}</span>
                {isOwned ? (
                  <span className="text-xs font-semibold text-primary">✓ На кухне</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{eq.price} ₽</span>
                )}
              </div>
              {!isOwned && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant={canAfford ? "default" : "secondary"}
                    disabled={!canAfford}
                    onClick={() => handleBuy(eq.id, eq.name, eq.price)}
                    className="w-full"
                  >
                    {canAfford ? "Купить" : "Недостаточно денег"}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
