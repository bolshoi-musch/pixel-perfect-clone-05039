import { EmptyState } from "../EmptyState";

export function ShopPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Здесь появятся ингредиенты для покупки. Реализация — в Iteration 4.
      </p>
      <EmptyState
        icon="🛒"
        title="Магазин пока пуст"
        hint="В следующих итерациях добавим витрину ингредиентов и систему покупок."
      />
    </div>
  );
}
