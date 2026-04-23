import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame, selectAvgRating } from "@/game/store";
import { useActivePick } from "@/game/active-pick";
import { RECIPES_BY_ID, INGREDIENTS_BY_ID } from "@/game/data";
import { PanelDialog } from "@/components/game/PanelDialog";
import { ShopPanel } from "@/components/game/panels/ShopPanel";
import { InventoryPanel } from "@/components/game/panels/InventoryPanel";
import { EquipmentPanel } from "@/components/game/panels/EquipmentPanel";
import { ReviewsPanel } from "@/components/game/panels/ReviewsPanel";
import { OrderPanel } from "@/components/game/panels/OrderPanel";
import { SettingsPanel } from "@/components/game/panels/SettingsPanel";
import { KitchenScene } from "@/components/game/scene/KitchenScene";
import { ActionLog } from "@/components/game/ActionLog";
import { OverflowDialog } from "@/components/game/OverflowDialog";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Кухня — игра" },
      { name: "description", content: "Игровая сессия Кухни." },
    ],
  }),
  component: PlayPage,
});

type PanelKey = "shop" | "inventory" | "equipment" | "reviews" | "order" | "settings" | null;

function PlayPage() {
  const hydrate = useGame((s) => s.hydrate);
  const hydrated = useGame((s) => s.hydrated);
  const money = useGame((s) => s.money);
  const currentOrderId = useGame((s) => s.current_order_recipe_id);
  const avgRating = useGame(selectAvgRating);
  const log = useGame((s) => s.log);
  const pickConsume = useActivePick((s) => s.consume);
  const pickValue = useActivePick((s) => s.pick);
  const setPick = useActivePick((s) => s.setPick);

  const [panel, setPanel] = useState<PanelKey>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Загрузка кухни…</p>
      </div>
    );
  }

  const order = currentOrderId ? RECIPES_BY_ID.get(currentOrderId) : null;

  const activePickIng = pickValue
    ? INGREDIENTS_BY_ID.get(pickValue.split("|")[0])
    : null;

  const handlePickIngredient = () => {
    const v = pickConsume();
    return v;
  };

  const handleBellRing = () => {
    log("Звонок: гость скоро придёт (Iteration 3)");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* 3D-сцена */}
      <div className="absolute inset-0">
        <KitchenScene
          onHoverLabel={setHoverLabel}
          onPickIngredient={handlePickIngredient}
          onBellRing={handleBellRing}
        />
      </div>

      {/* HUD */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4">
        <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/85 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              ← Меню
            </Link>
            <div className="hidden h-6 w-px bg-border md:block" />
            <Stat label="Деньги" value={`${money} ₽`} />
            <Stat
              label="Рейтинг"
              value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "— ★"}
            />
            <Stat
              label="Заказ"
              value={order ? order.name : "Нет заказа"}
              muted={!order}
            />
          </div>

          <button
            type="button"
            onClick={() => setPanel("settings")}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Настройки"
          >
            ⚙
          </button>
        </div>

        {/* Hover label / активный pick */}
        <div className="pointer-events-none mx-auto mt-2 flex max-w-6xl items-center justify-between gap-2">
          <div>
            {hoverLabel && (
              <span className="rounded-md bg-card/85 px-3 py-1 text-xs font-medium text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                {hoverLabel}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {activePickIng && (
              <button
                type="button"
                onClick={() => setPick(null)}
                className="pointer-events-auto rounded-md bg-primary/15 px-3 py-1 text-xs font-medium text-primary shadow-[var(--shadow-soft)] backdrop-blur transition hover:bg-primary/25"
                title="Снять выбор"
              >
                Готово к размещению: {activePickIng.name} ✕
              </button>
            )}
            <ActionLog />
          </div>
        </div>
      </header>

      {/* Подсказка управления */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 px-4 text-center">
        <p className="mx-auto inline-block rounded-full bg-card/60 px-4 py-1 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
          Клик — взять/положить · Долгое нажатие — съесть (только сырое)
        </p>
      </div>

      {/* Панель действий */}
      <nav className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/85 p-2 shadow-[var(--shadow-soft)] backdrop-blur">
          <ActionBtn icon="📋" label="Заказ" onClick={() => setPanel("order")} />
          <ActionBtn icon="🛒" label="Магазин" onClick={() => setPanel("shop")} />
          <ActionBtn icon="🎒" label="Инвентарь" onClick={() => setPanel("inventory")} />
          <ActionBtn icon="🔧" label="Техника" onClick={() => setPanel("equipment")} />
          <ActionBtn icon="⭐" label="Отзывы" onClick={() => setPanel("reviews")} />
        </div>
      </nav>

      {/* Панели */}
      <PanelDialog
        open={panel === "shop"}
        onClose={() => setPanel(null)}
        title="Магазин ингредиентов"
      >
        <ShopPanel />
      </PanelDialog>
      <PanelDialog
        open={panel === "inventory"}
        onClose={() => setPanel(null)}
        title="Инвентарь"
      >
        <InventoryPanel />
      </PanelDialog>
      <PanelDialog
        open={panel === "equipment"}
        onClose={() => setPanel(null)}
        title="Техника"
      >
        <EquipmentPanel />
      </PanelDialog>
      <PanelDialog
        open={panel === "reviews"}
        onClose={() => setPanel(null)}
        title="Отзывы гостей"
      >
        <ReviewsPanel />
      </PanelDialog>
      <PanelDialog open={panel === "order"} onClose={() => setPanel(null)} title="Текущий заказ">
        <OrderPanel />
      </PanelDialog>
      <PanelDialog
        open={panel === "settings"}
        onClose={() => setPanel(null)}
        title="Настройки"
      >
        <SettingsPanel />
      </PanelDialog>

      {/* Модал переполнения стола */}
      <OverflowDialog />
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[88px] flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-foreground transition hover:bg-accent active:scale-[0.97]"
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
