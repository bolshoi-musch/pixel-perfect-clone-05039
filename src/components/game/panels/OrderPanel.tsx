import { useGame } from "@/game/store";
import { useOrderEngine } from "@/game/order-engine";
import { RECIPES_BY_ID, STEPS_BY_ID, INGREDIENTS_BY_ID, EQUIPMENT_BY_ID } from "@/game/data";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";

interface Props {
  onOpenShop?: (tab: "products" | "equipment") => void;
}

export function OrderPanel({ onOpenShop }: Props) {
  const currentId = useGame((s) => s.current_order_recipe_id);
  const inventory = useGame((s) => s.inventory);
  const equipmentOwned = useGame((s) => s.equipment_owned);
  const progress = useOrderEngine((s) => s.progress);

  if (!currentId) {
    return <EmptyState icon="📋" title="Нет активного заказа" hint="Скоро придёт следующий гость." />;
  }

  const recipe = RECIPES_BY_ID.get(currentId);
  if (!recipe) return <EmptyState icon="❓" title="Заказ не найден" />;

  const stepIndex = progress?.step_index ?? 0;
  const finished = progress?.finished ?? false;

  // Compute all raw ingredients required by recipe steps.
  const requiredRawIngredients = new Set<string>();
  for (const sid of recipe.step_ids) {
    const step = STEPS_BY_ID.get(sid);
    if (!step) continue;
    for (const r of step.requires) {
      const ing = INGREDIENTS_BY_ID.get(r);
      if (ing && ing.category === "raw" && r !== "water") requiredRawIngredients.add(r);
    }
  }
  const inventoryIds = new Set(inventory.filter((e) => e.count > 0).map((e) => e.ingredient_id));
  // Premium variant counts as basic.
  const ALIAS: Record<string, string> = { egg_premium: "egg", bread_premium: "bread" };
  const inventoryCanonical = new Set(
    [...inventoryIds].map((id) => ALIAS[id] ?? id),
  );
  const missingIngredients = [...requiredRawIngredients].filter((id) => !inventoryCanonical.has(id));

  const ownedSet = new Set(equipmentOwned);
  const missingEquipment = recipe.required_equipment.filter((e) => !ownedSet.has(e));

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

      {/* Требования */}
      <div className="rounded-xl border border-border bg-background/60 p-3">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Нужно для заказа</h4>
        <div className="flex flex-wrap gap-1.5">
          {recipe.required_equipment.map((eid) => {
            const has = ownedSet.has(eid);
            return (
              <Tag key={eid} ok={has}>
                🔧 {EQUIPMENT_BY_ID.get(eid)?.name ?? eid}
              </Tag>
            );
          })}
          {[...requiredRawIngredients].map((iid) => {
            const has = inventoryCanonical.has(iid);
            return (
              <Tag key={iid} ok={has}>
                🥬 {INGREDIENTS_BY_ID.get(iid)?.name ?? iid}
              </Tag>
            );
          })}
        </div>
      </div>

      {(missingIngredients.length > 0 || missingEquipment.length > 0) && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <h4 className="mb-2 text-sm font-semibold text-foreground">Не хватает</h4>
          {missingEquipment.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs text-muted-foreground">Техника:</p>
              <p className="text-sm text-foreground">
                {missingEquipment.map((id) => EQUIPMENT_BY_ID.get(id)?.name ?? id).join(", ")}
              </p>
              {onOpenShop && (
                <Button size="sm" className="mt-2" onClick={() => onOpenShop("equipment")}>
                  Купить в магазине
                </Button>
              )}
            </div>
          )}
          {missingIngredients.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Продукты:</p>
              <p className="text-sm text-foreground">
                {missingIngredients.map((id) => INGREDIENTS_BY_ID.get(id)?.name ?? id).join(", ")}
              </p>
              {onOpenShop && (
                <Button size="sm" className="mt-2" onClick={() => onOpenShop("products")}>
                  Купить в магазине
                </Button>
              )}
            </div>
          )}
        </div>
      )}

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
                  {step?.hints?.[1] && active && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.hints[1]}</p>
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

function Tag({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-xs ${
        ok
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-destructive/40 bg-destructive/5 text-muted-foreground line-through"
      }`}
    >
      {children}
    </span>
  );
}
