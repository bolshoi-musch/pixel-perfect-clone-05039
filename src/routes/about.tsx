import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О игре — Кухня" },
      {
        name: "description",
        content:
          "Кухня — first-person кулинарный симулятор. Tactile-мини-игры, честная оценка, прогрессия.",
      },
      { property: "og:title", content: "О игре — Кухня" },
      { property: "og:description", content: "Концепция, контролы и принципы Кухни." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Назад в меню
        </Link>

        <h1 className="text-5xl font-semibold text-foreground">О игре</h1>

        <section className="mt-10 space-y-4 text-foreground/90">
          <p>
            <span className="font-semibold">Кухня</span> — атмосферный симулятор готовки от
            первого лица. Гость звонит в звонок, ты получаешь заказ, готовишь блюдо по
            рецепту и слышишь честный отзыв.
          </p>
          <p>
            Важна не скорость кликов, а внимание к процессу: правильные шаги, аккуратная
            готовка, свежие ингредиенты.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground">Контролы</h2>
          <ul className="mt-4 space-y-2 text-foreground/90">
            <li>
              <span className="font-medium">Клик</span> — взять/положить/использовать предмет.
            </li>
            <li>
              <span className="font-medium">Долгое нажатие (0.6 с)</span> — съесть сырой
              ингредиент со стола.
            </li>
            <li>
              <span className="font-medium">Жесты мышью/тачем</span> — мини-игры (перемешать,
              поймать готовность).
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground">Оценка</h2>
          <p className="mt-3 text-foreground/90">
            Каждый заказ оценивается по 4 факторам: скорость, аккуратность, качество готовки и
            свежесть продуктов. Гость пишет 2–3 комментария и один совет.
          </p>
        </section>
      </div>
    </div>
  );
}
