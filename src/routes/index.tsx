import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hasSave } from "@/game/save";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Кухня — главное меню" },
      {
        name: "description",
        content:
          "Кухня — атмосферный симулятор готовки от первого лица. Принимай заказы, готовь блюда, зарабатывай отзывы.",
      },
      { property: "og:title", content: "Кухня — симулятор готовки" },
      { property: "og:description", content: "Готовь, обслуживай гостей, прокачивай кухню." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [hasExistingSave, setHasExistingSave] = useState(false);
  const startNewGame = useGame((s) => s.startNewGame);
  const resetGame = useGame((s) => s.resetGame);

  useEffect(() => {
    setHasExistingSave(hasSave());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Фон: тёплый градиент */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--copper) 25%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--background), color-mix(in oklab, var(--wood) 20%, var(--background)))",
        }}
      />

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Симулятор готовки
        </p>
        <h1 className="text-7xl font-semibold leading-none text-foreground md:text-8xl">
          Кухня
        </h1>
        <p className="mt-6 max-w-md text-base text-muted-foreground">
          Принимай заказы, готовь блюда от руки и зарабатывай честные отзывы.
        </p>

        <div className="mt-12 flex w-full max-w-xs flex-col gap-3">
          <Link
            to="/play"
            onClick={() => {
              if (!hasExistingSave) startNewGame();
            }}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary text-base font-medium text-primary-foreground shadow-[var(--shadow-warm)] transition hover:brightness-110"
          >
            {hasExistingSave ? "Новая игра" : "Начать"}
          </Link>

          {hasExistingSave && (
            <Link
              to="/play"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card text-base font-medium text-foreground transition hover:bg-accent"
            >
              Продолжить
            </Link>
          )}

          <Link
            to="/about"
            className="inline-flex h-11 items-center justify-center rounded-xl text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            О игре
          </Link>

          {hasExistingSave && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Удалить сейв и начать заново?")) {
                  resetGame();
                  setHasExistingSave(false);
                }
              }}
              className="mt-4 text-xs text-muted-foreground/70 transition hover:text-destructive"
            >
              Сбросить сохранение
            </button>
          )}
        </div>

        <footer className="absolute bottom-6 left-0 right-0 text-xs text-muted-foreground/60">
          Тестовый режим: Омлет и Чай
        </footer>
      </main>
    </div>
  );
}
