import { useGame } from "@/game/store";
import { EQUIPMENT } from "@/game/data";
import { Button } from "@/components/ui/button";

interface Props {
  onOpenShop?: () => void;
  /** Закрыть панель — вызывается после «Поставить на плиту». */
  onClose?: () => void;
}

export function EquipmentPanel({ onOpenShop, onClose }: Props) {
  const owned = useGame((s) => s.equipment_owned);
  const stoveLevel = useGame((s) => s.stove_level);
  const panOnStove = useGame((s) => s.placed_equipment.pan_on_stove);
  const setPanOnStove = useGame((s) => s.setPanOnStove);
  const log = useGame((s) => s.log);

  const ownedEq = EQUIPMENT.filter((e) => owned.includes(e.id));
  // Только реально продаваемые предметы (price > 0). Базовая посуда
  // (owned_by_default true, price 0) не должна выглядеть как «докупить за 0 ₽».
  const notOwnedEq = EQUIPMENT.filter((e) => !owned.includes(e.id) && e.price > 0);

  const handlePlacePan = () => {
    setPanOnStove(true);
    log("Сковорода поставлена на плиту");
    onClose?.();
  };

  const handleRemovePan = () => {
    setPanOnStove(false);
    log("Сковорода убрана с плиты");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Это обзор кухни: что куплено, какой уровень плиты и что стоит на местах.
      </p>

      {/* Pan placement card */}
      {owned.includes("pan") && (
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-medium text-foreground">Сковорода</div>
              <div className="text-xs text-muted-foreground">
                {panOnStove ? "Стоит на плите" : "Не на плите — омлет жарить нельзя"}
              </div>
            </div>
            {panOnStove ? (
              <Button size="sm" variant="outline" onClick={handleRemovePan}>
                Убрать
              </Button>
            ) : (
              <Button size="sm" onClick={handlePlacePan}>
                Поставить на плиту
              </Button>
            )}
          </div>
        </div>
      )}

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
