import { useGame } from "@/game/store";
import { useActivePick } from "@/game/active-pick";
import { useOrderEngine, expectedEquipmentForStep } from "@/game/order-engine";
import { useHintMode } from "@/game/hint-mode";
import type { HintMode } from "@/game/hint-content";
import { INGREDIENTS_BY_ID, STEPS_BY_ID, RECIPES_BY_ID } from "@/game/data";
import { useNavigate } from "@tanstack/react-router";

export function SettingsPanel() {
  const resetGame = useGame((s) => s.resetGame);
  const navigate = useNavigate();
  const tableSlots = useGame((s) => s.table_slots);
  const inventory = useGame((s) => s.inventory);
  const actionLog = useGame((s) => s.action_log);
  const lastTarget = useGame((s) => s.last_clicked_target);
  const pick = useActivePick((s) => s.pick);
  const progress = useOrderEngine((s) => s.progress);
  const hintMode = useHintMode((s) => s.mode);
  const setHintMode = useHintMode((s) => s.setMode);

  const lastAction = actionLog[0]?.text ?? "—";
  const pickIng = pick ? INGREDIENTS_BY_ID.get(pick.ingredient_id) : null;

  const recipe = progress ? RECIPES_BY_ID.get(progress.recipe_id) : null;
  const stepId = recipe?.step_ids[progress?.step_index ?? -1];
  const step = stepId ? STEPS_BY_ID.get(stepId) : null;
  const expectedEq = step ? expectedEquipmentForStep(step) : null;

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-semibold text-foreground">Сохранение</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Игра сохраняется автоматически после каждого важного действия.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Удалить сейв и начать заново? Это действие нельзя отменить.")) {
              resetGame();
              navigate({ to: "/" });
            }
          }}
          className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20"
        >
          Сбросить прогресс
        </button>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-foreground">Навигация</h4>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-2 rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          Выйти в главное меню
        </button>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-foreground">Подсказки</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Detailed — полная карточка с инструкцией. Normal — короткие подсказки. Minimal —
          только наведение.
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["detailed", "normal", "minimal"] as HintMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setHintMode(m)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                hintMode === m
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background/60 text-muted-foreground hover:bg-accent"
              }`}
            >
              {m === "detailed" ? "Detailed" : m === "normal" ? "Normal" : "Minimal"}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-border/60 bg-background/40 p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Debug overlay
        </h4>
        <dl className="mt-2 space-y-2 text-xs">
          <DebugRow label="recipe">
            {recipe ? `${recipe.name} (${recipe.id})` : "—"}
          </DebugRow>
          <DebugRow label="activeStep">
            {step
              ? `${progress!.step_index + 1}/${recipe!.step_ids.length} · ${step.id} (${step.type}${
                  step.minigame ? `/${step.minigame}` : ""
                })`
              : "—"}
          </DebugRow>
          <DebugRow label="step.requires">
            {step ? step.requires.join(", ") || "—" : "—"}
          </DebugRow>
          <DebugRow label="expected equipment">{expectedEq ?? "—"}</DebugRow>
          <DebugRow label="step.hint">{step?.hints?.[0] ?? "—"}</DebugRow>
          <DebugRow label="selectedIngredient">
            {pickIng ? `${pickIng.name} · ${pick}` : "—"}
          </DebugRow>
          <DebugRow label="inventory">
            <div className="space-y-0.5">
              {inventory.length === 0 && <div>пусто</div>}
              {inventory.map((e) => {
                const ing = INGREDIENTS_BY_ID.get(e.ingredient_id);
                return (
                  <div key={`${e.ingredient_id}|${e.quality}`}>
                    {ing?.name ?? e.ingredient_id} · {e.quality} ×{e.count}
                  </div>
                );
              })}
            </div>
          </DebugRow>
          <DebugRow label="tableSlots">
            <div className="space-y-0.5">
              {tableSlots.map((s, i) => {
                const ing = s.ingredient_id ? INGREDIENTS_BY_ID.get(s.ingredient_id) : null;
                return (
                  <div key={i}>
                    [{i}] {ing ? `${ing.name} · ${s.quality} · ${s.category}` : "пусто"}
                  </div>
                );
              })}
            </div>
          </DebugRow>
          <DebugRow label="lastClickedTarget">{lastTarget ?? "—"}</DebugRow>
          <DebugRow label="lastAction">{lastAction}</DebugRow>
          <DebugRow label="errors / scores">
            {progress
              ? `errors=${progress.total_errors} · scores=[${progress.minigame_scores
                  .map((x) => x.toFixed(2))
                  .join(", ")}]`
              : "—"}
          </DebugRow>
        </dl>
      </section>
    </div>
  );
}

function DebugRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-foreground">{children}</dd>
    </div>
  );
}
