import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { INGREDIENTS, EQUIPMENT } from "@/game/data";
import type { IngredientQuality } from "@/game/types";

export type ShopTab = "products" | "equipment" | "upgrades";

interface Props {
  defaultTab?: ShopTab;
}

const STOVE_UPGRADE_PRICES: Record<number, number> = {
  // current level → price to go to next
  1: 80,
  2: 160,
};

const PURCHASE_FEEDBACK_MS = 800;

/** Shared hook: track last purchased key for visual feedback. */
function useLastPurchased() {
  const [key, setKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  const flash = (k: string) => {
    setKey(k);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setKey(null), PURCHASE_FEEDBACK_MS);
  };
  return { lastKey: key, flash };
}

export function ShopPanel({ defaultTab = "products" }: Props) {
  const [tab, setTab] = useState<ShopTab>(defaultTab);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as ShopTab)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="products">Продукты</TabsTrigger>
        <TabsTrigger value="equipment">Техника</TabsTrigger>
        <TabsTrigger value="upgrades">Улучшения</TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="mt-4">
        <ProductsTab />
      </TabsContent>
      <TabsContent value="equipment" className="mt-4">
        <EquipmentTab />
      </TabsContent>
      <TabsContent value="upgrades" className="mt-4">
        <UpgradesTab />
      </TabsContent>
    </Tabs>
  );
}

function ProductsTab() {
  const money = useGame((s) => s.money);
  const inventory = useGame((s) => s.inventory);
  const buyIngredient = useGame((s) => s.buyIngredient);
  const log = useGame((s) => s.log);
  const { lastKey, flash } = useLastPurchased();

  // Group base ingredients with their premium variant (id + "_premium").
  const baseIngredients = INGREDIENTS.filter((i) => i.quality === "basic");
  const premiumById = new Map(
    INGREDIENTS.filter((i) => i.quality === "premium").map((i) => [i.id, i] as const),
  );

  const countOf = (id: string, quality: IngredientQuality) =>
    inventory.find((e) => e.ingredient_id === id && e.quality === quality)?.count ?? 0;

  const handleBuy = (id: string, quality: IngredientQuality, price: number, name: string) => {
    const ok = buyIngredient(id, quality, price);
    if (ok) {
      log(`Куплено: ${name} (+1) за ${price} ₽`);
      flash(`${id}|${quality}`);
    } else {
      log(`Не хватает денег для покупки: ${name}`);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Покупка добавляет +1 единицу в инвентарь. Премиум-варианты увеличивают рейтинг.
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {baseIngredients.map((ing) => {
          const premiumId = `${ing.id}_premium`;
          const premium = premiumById.get(premiumId);
          const basicKey = `${ing.id}|basic`;
          const premiumKey = premium ? `${premium.id}|premium` : null;
          const purchasedHere = lastKey === basicKey || (premiumKey && lastKey === premiumKey);
          return (
            <li
              key={ing.id}
              className={`rounded-xl border p-3 transition ${
                purchasedHere
                  ? "border-primary bg-primary/10 shadow-[0_0_0_2px_var(--primary)]"
                  : "border-border bg-background/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{ing.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  В наличии: {countOf(ing.id, "basic")}
                  {premium ? ` / ${countOf(premium.id, "premium")} ★` : ""}
                </span>
              </div>
              <div className="mt-2 space-y-2">
                <BuyRow
                  label="Обычный"
                  price={ing.price}
                  canAfford={money >= ing.price}
                  justBought={lastKey === basicKey}
                  onBuy={() => handleBuy(ing.id, "basic", ing.price, ing.name)}
                />
                {premium && (
                  <BuyRow
                    label="Премиум"
                    price={premium.price}
                    canAfford={money >= premium.price}
                    justBought={lastKey === premiumKey}
                    onBuy={() => handleBuy(premium.id, "premium", premium.price, premium.name)}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BuyRow({
  label,
  price,
  canAfford,
  justBought,
  onBuy,
}: {
  label: string;
  price: number;
  canAfford: boolean;
  justBought?: boolean;
  onBuy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {label} · <span className="text-foreground">{price} ₽</span>
      </span>
      <Button
        size="sm"
        variant={justBought ? "default" : canAfford ? "default" : "secondary"}
        disabled={!canAfford || justBought}
        onClick={onBuy}
        className={justBought ? "bg-primary text-primary-foreground" : ""}
      >
        {justBought ? "Куплено ✓" : canAfford ? "Купить" : "Не хватает денег"}
      </Button>
    </div>
  );
}

function EquipmentTab() {
  const owned = useGame((s) => s.equipment_owned);
  const money = useGame((s) => s.money);
  const buyEquipment = useGame((s) => s.buyEquipment);
  const log = useGame((s) => s.log);
  const { lastKey, flash } = useLastPurchased();

  const handleBuy = (id: string, name: string, price: number) => {
    const ok = buyEquipment(id, price);
    if (ok) {
      log(`Куплено: ${name} за ${price} ₽`);
      flash(id);
    } else {
      log(`Не хватает денег для покупки: ${name}`);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Купленная техника появляется на кухне (если для неё есть 3D-объект).
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EQUIPMENT.map((eq) => {
          const isOwned = owned.includes(eq.id);
          const canAfford = money >= eq.price;
          const justBought = lastKey === eq.id;
          return (
            <li
              key={eq.id}
              className={`rounded-xl border p-3 transition ${
                justBought
                  ? "border-primary bg-primary/10 shadow-[0_0_0_2px_var(--primary)]"
                  : isOwned
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
                    {canAfford ? "Купить" : "Не хватает денег"}
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

function UpgradesTab() {
  const stoveLevel = useGame((s) => s.stove_level);
  const money = useGame((s) => s.money);
  const upgradeStove = useGame((s) => s.upgradeStove);
  const log = useGame((s) => s.log);
  const { lastKey, flash } = useLastPurchased();

  const isMax = stoveLevel >= 3;
  const price = STOVE_UPGRADE_PRICES[stoveLevel] ?? 0;
  const canAfford = money >= price;
  const justUpgraded = lastKey === "stove_upgrade";

  const handleUpgrade = () => {
    const ok = upgradeStove(price);
    if (ok) {
      log(`Плита улучшена до уровня ${stoveLevel + 1}`);
      flash("stove_upgrade");
    } else {
      log(`Не хватает денег для улучшения плиты`);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Улучшения упрощают мини-игры. Плита: больше зелёная зона в WINDOW.
      </p>
      <div
        className={`rounded-xl border p-4 transition ${
          justUpgraded
            ? "border-primary bg-primary/10 shadow-[0_0_0_2px_var(--primary)]"
            : "border-border bg-background/60"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-medium text-foreground">Плита</div>
            <div className="text-xs text-muted-foreground">
              Уровень {stoveLevel} / 3
            </div>
          </div>
          {isMax ? (
            <span className="text-xs font-semibold text-primary">МАКС</span>
          ) : (
            <span className="text-xs text-muted-foreground">{price} ₽ → ур. {stoveLevel + 1}</span>
          )}
        </div>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3].map((lvl) => (
            <div
              key={lvl}
              className={`h-2 flex-1 rounded-full ${
                lvl <= stoveLevel ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        {!isMax && (
          <Button
            size="sm"
            variant={canAfford ? "default" : "secondary"}
            disabled={!canAfford}
            onClick={handleUpgrade}
            className="mt-3 w-full"
          >
            {justUpgraded
              ? "Улучшено ✓"
              : canAfford
                ? `Улучшить (${price} ₽)`
                : "Не хватает денег"}
          </Button>
        )}
      </div>
    </div>
  );
}
