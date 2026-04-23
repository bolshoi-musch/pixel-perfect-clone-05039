import { useGame } from "@/game/store";
import { useNavigate } from "@tanstack/react-router";

export function SettingsPanel() {
  const resetGame = useGame((s) => s.resetGame);
  const navigate = useNavigate();

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
    </div>
  );
}
