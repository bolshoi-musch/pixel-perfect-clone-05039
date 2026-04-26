import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGame, selectAvgRating } from "@/game/store";
import { useActivePick } from "@/game/active-pick";
import { useOrderEngine, pickNextRecipe, expectedEquipmentForStep } from "@/game/order-engine";
import { RECIPES_BY_ID, INGREDIENTS_BY_ID, STEPS_BY_ID } from "@/game/data";
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
import { MixMinigame, WindowMinigame } from "@/components/game/minigames/Minigames";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [{ title: "Кухня — игра" }, { name: "description", content: "Игровая сессия Кухни." }],
  }),
  component: PlayPage,
});

type PanelKey = "shop" | "inventory" | "equipment" | "reviews" | "order" | "settings" | null;

function PlayPage() {
  const hydrate = useGame((s) => s.hydrate);
  const hydrated = useGame((s) => s.hydrated);
  const money = useGame((s) => s.money);
  const currentOrderId = useGame((s) => s.current_order_recipe_id);
  const reviewsCount = useGame((s) => s.reviews.length);
  const avgRating = useGame(selectAvgRating);
  const log = useGame((s) => s.log);
  const pickConsume = useActivePick((s) => s.consume);
  const pickValue = useActivePick((s) => s.pick);
  const setPick = useActivePick((s) => s.setPick);

  const startOrder = useOrderEngine((s) => s.startOrder);
  const tryStep = useOrderEngine((s) => s.tryStep);
  const finishMinigame = useOrderEngine((s) => s.finishMinigame);
  const cancelMinigame = useOrderEngine((s) => s.cancelMinigame);
  const ringBell = useOrderEngine((s) => s.ringBell);
  const activeMinigame = useOrderEngine((s) => s.active_minigame);
  const progress = useOrderEngine((s) => s.progress);

  const [panel, setPanel] = useState<PanelKey>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [seenReviewsCount, setSeenReviewsCount] = useState(reviewsCount);
  const [completionToast, setCompletionToast] = useState<{
    name: string;
    stars: number;
    reward: number;
  } | null>(null);
  const orderInitRef = useRef(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-start: when no current order, pick next from queue.
  useEffect(() => {
    if (!hydrated) return;
    if (currentOrderId) {
      // Sync engine progress if missing
      if (!progress || progress.recipe_id !== currentOrderId) {
        startOrder(currentOrderId);
      }
      orderInitRef.current = true;
      return;
    }
    if (!orderInitRef.current || completionToast) {
      // initial spawn or after a completion (delay handled in completion effect)
      const timeout = setTimeout(
        () => {
          const next = pickNextRecipe();
          if (next) {
            startOrder(next);
            orderInitRef.current = true;
            log(`Новый заказ: ${RECIPES_BY_ID.get(next)?.name}`);
          }
        },
        completionToast ? 1800 : 200,
      );
      return () => clearTimeout(timeout);
    }
  }, [hydrated, currentOrderId, progress, startOrder, completionToast, log]);

  // Open reviews panel resets unread badge
  useEffect(() => {
    if (panel === "reviews") setSeenReviewsCount(reviewsCount);
  }, [panel, reviewsCount]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Загрузка кухни…</p>
      </div>
    );
  }

  const order = currentOrderId ? RECIPES_BY_ID.get(currentOrderId) : null;
  const activePickIng = pickValue ? INGREDIENTS_BY_ID.get(pickValue.split("|")[0]) : null;

  const unreadReviews = Math.max(0, reviewsCount - seenReviewsCount);

  // Bell HUD button is enabled when current step is "serve" or order finished
  const bellEnabled = (() => {
    if (!progress) return false;
    if (progress.finished) return true;
    const recipe = RECIPES_BY_ID.get(progress.recipe_id);
    const stepId = recipe?.step_ids[progress.step_index];
    const step = stepId ? STEPS_BY_ID.get(stepId) : undefined;
    return step ? expectedEquipmentForStep(step) === "bell" : false;
  })();

  const handlePickIngredient = () => pickConsume();

  const handleBellRing = () => {
    if (!progress) {
      log("Звонок: нет активного заказа");
      return;
    }
    const r = ringBell();
    if (!r.ok) {
      if (r.reason === "not_finished") log("Сначала закончи готовку");
      return;
    }
    const recipe = RECIPES_BY_ID.get(r.recipe_id);
    setCompletionToast({
      name: recipe?.name ?? r.recipe_id,
      stars: r.stars,
      reward: r.reward,
    });
    setTimeout(() => setCompletionToast(null), 2500);
  };

  const handleObjectAction = (equipment_id: string) => {
    if (!progress) {
      log("Сначала прими заказ");
      return;
    }
    tryStep(equipment_id);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <KitchenScene
          onHoverLabel={setHoverLabel}
          onPickIngredient={handlePickIngredient}
          onObjectAction={handleObjectAction}
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
            <Stat label="Рейтинг" value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "— ★"} />
            <button
              type="button"
              onClick={() => setPanel("order")}
              className="flex flex-col text-left transition hover:opacity-80"
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Заказ
              </span>
              <span
                className={`text-sm font-semibold ${order ? "text-foreground" : "text-muted-foreground"}`}
              >
                {order
                  ? `${order.name} · ${progress?.step_index ?? 0}/${order.step_ids.length}`
                  : "Ожидание…"}
              </span>
            </button>
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

      {bellEnabled && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-4 text-center">
          <p className="mx-auto inline-block animate-pulse rounded-full bg-primary/90 px-5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-warm)]">
            🛎 Нажми звонок, чтобы подать заказ
          </p>
        </div>
      )}

      {/* Подсказка управления */}
      {!progress?.finished && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-0 px-4 text-center">
          <p className="mx-auto inline-block rounded-full bg-card/60 px-4 py-1 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
            Клик — взять/положить · Долгое нажатие — съесть (только сырое)
          </p>
        </div>
      )}

      {/* Completion toast */}
      {completionToast && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2">
          <div className="rounded-2xl border border-primary/40 bg-card/95 px-6 py-4 text-center shadow-[var(--shadow-warm)] backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Подано</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{completionToast.name}</p>
            <p className="mt-1 text-2xl text-primary">{"★".repeat(completionToast.stars)}</p>
            <p className="mt-1 text-sm text-foreground/80">+{completionToast.reward} ₽</p>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <nav className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/85 p-2 shadow-[var(--shadow-soft)] backdrop-blur">
          <ActionBtn icon="📋" label="Заказ" onClick={() => setPanel("order")} />
          <ActionBtn icon="🛒" label="Магазин" onClick={() => setPanel("shop")} />
          <ActionBtn icon="🥬" label="Продукты" onClick={() => setPanel("inventory")} />
          <ActionBtn icon="🔧" label="Техника" onClick={() => setPanel("equipment")} />
          <ActionBtn
            icon="⭐"
            label="Отзывы"
            onClick={() => setPanel("reviews")}
            badge={unreadReviews > 0 ? unreadReviews : undefined}
          />
          <BellBtn enabled={bellEnabled} pulse={bellEnabled} onClick={handleBellRing} />
        </div>
      </nav>

      {/* Panels */}
      <PanelDialog
        open={panel === "shop"}
        onClose={() => setPanel(null)}
        title="Магазин ингредиентов"
      >
        <ShopPanel />
      </PanelDialog>
      <PanelDialog open={panel === "inventory"} onClose={() => setPanel(null)} title="Продукты">
        <InventoryPanel />
      </PanelDialog>
      <PanelDialog open={panel === "equipment"} onClose={() => setPanel(null)} title="Техника">
        <EquipmentPanel />
      </PanelDialog>
      <PanelDialog open={panel === "reviews"} onClose={() => setPanel(null)} title="Отзывы гостей">
        <ReviewsPanel />
      </PanelDialog>
      <PanelDialog open={panel === "order"} onClose={() => setPanel(null)} title="Текущий заказ">
        <OrderPanel />
      </PanelDialog>
      <PanelDialog open={panel === "settings"} onClose={() => setPanel(null)} title="Настройки">
        <SettingsPanel />
      </PanelDialog>

      <OverflowDialog />

      {/* Minigames */}
      {activeMinigame?.kind === "mix" && (
        <MixMinigame onDone={(q, e) => finishMinigame(q, e)} onCancel={cancelMinigame} />
      )}
      {activeMinigame?.kind === "window" && (
        <WindowMinigame onDone={(q, e) => finishMinigame(q, e)} onCancel={cancelMinigame} />
      )}
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
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
  badge,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-w-[88px] flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-foreground transition hover:bg-accent active:scale-[0.97]"
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      {badge !== undefined && (
        <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function BellBtn({
  enabled,
  pulse,
  onClick,
}: {
  enabled: boolean;
  pulse: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      title={enabled ? "Подать заказ" : "Сначала закончи готовку"}
      className={`relative flex min-w-[88px] flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition active:scale-[0.97] ${
        enabled
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-warm)] hover:opacity-90"
          : "text-muted-foreground opacity-50"
      } ${pulse ? "animate-pulse" : ""}`}
    >
      <span className="text-lg leading-none">🛎</span>
      <span className="text-xs font-semibold">Звонок</span>
    </button>
  );
}
