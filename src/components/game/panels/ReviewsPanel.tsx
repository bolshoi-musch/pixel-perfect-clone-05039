import { useGame } from "@/game/store";
import { RECIPES_BY_ID } from "@/game/data";
import { EmptyState } from "../EmptyState";

export function ReviewsPanel() {
  const reviews = useGame((s) => s.reviews);

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title="Отзывов пока нет"
        hint="Завершите первый заказ, чтобы получить отзыв гостя."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => {
        const recipe = RECIPES_BY_ID.get(r.recipe_id);
        return (
          <li key={r.id} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {recipe?.name ?? r.recipe_id}
              </span>
              <span className="text-sm text-primary">{"★".repeat(r.stars)}</span>
            </div>
            <p className="mt-2 text-sm text-foreground/90">{r.text}</p>
            {r.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {r.tip && (
              <p className="mt-2 text-xs italic text-muted-foreground">Совет: {r.tip}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
