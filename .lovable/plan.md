

# Кухня — обновлённый план MVP

## Правки к предыдущему плану

1. **Мини-игры в MVP:** только **MIX** и **WINDOW** с полноценным скорингом. **Roll** и **Chop** — заглушки (нажми и держи / нажми N раз) без tactile-скоринга, передают фиксированный нейтральный score. Пометка `// TODO post-MVP` в коде.
2. **Eat:** доступно только для ингредиентов с `category: "raw"`. Триггер — **long-press 600 мс** на предмете в слоте стола (UI: круговой прогресс вокруг курсора/пальца). Короткий клик = pickup/use. `prepared` и `cooked` съесть нельзя — тост «Это нельзя есть сырым».
3. **Scoring (MVP canon)** — отдельный модуль с детерминированной формулой (см. ниже).
4. **Reviews:** каждый отзыв = 2–3 тега-причины + 1 совет, плюс звёзды.

## Scoring (MVP canon) — `src/game/scoring.ts`

Входные данные на заказ:
- `total_errors` — счётчик ошибок (неправильный шаг, не тот ингредиент, переполнение стола и т.п.)
- `minigame_scores: number[]` — каждый score ∈ [0..1], считаем `mini_quality_avg = avg`
- `t_elapsed_sec`, `t_fast`, `t_ok` (из рецепта) → `speed_factor`: `FAST` (≤t_fast)=1.0, `OK` (≤t_ok)=0.85, `SLOW`=0.7
- `premium_share` ∈ [0..1] (доля premium-ингредиентов от использованных) → `ingredient_factor = 0.9 + 0.2 × premium_share` (0.9..1.1)
- `accuracy_factor = max(0.5, 1 − 0.1 × total_errors)`
- `minigame_factor = 0.7 + 0.3 × mini_quality_avg` (0.7..1.0)

Формула:
```
overall_score = clamp(
  speed_factor × ingredient_factor × accuracy_factor × minigame_factor,
  0, 1.2
)
stars = round(clamp(overall_score × 5, 1, 5))   // 1..5
reward_money = round(recipe.base_price × overall_score)
```

Возвращает: `{ stars, overall_score, reward_money, factors: {...}, tags: string[], tip: string }`.

**Tags/Tip генератор:** правила по факторам — `speed:slow` → тег «Долго», совет «Старайтесь укладываться в N сек»; `accuracy:low` → «Перепутали шаги»; `minigame:low` → «Плохо перемешано»; `ingredient:premium` → «Свежие продукты»; `ingredient:basic` → «Простые ингредиенты». Берём топ-3 тега + 1 совет по самому слабому фактору.

## Архитектура (без изменений)

TanStack Start · React 19 · react-three-fiber + drei · Zustand · framer-motion · Tailwind v4 · localStorage save (версия `v1`).

## Маршруты

- `/` — главное меню (Новая игра / Продолжить / О игре)
- `/play` — игровая сцена
- `/about` — о проекте

## Data-driven JSON в `src/game/data/`

- `ingredients.json` — `{ id, name, category: "raw"|"prepared"|"cooked", quality: "basic"|"premium", price, edible_raw }`
- `equipment.json` — `{ id, name, price, owned_by_default }` (bell, plate, cup, work_surface, stove, pan, bowl — true)
- `recipes.json` — `{ id, name, base_price, t_fast, t_ok, required_equipment[], step_ids[] }`
- `steps.json` — `{ id, type, requires, minigame: "mix"|"window"|"roll_stub"|"chop_stub"|"hold", output, hints }`
- `review_templates.json` — теги + советы

## План итераций

### Iteration 1 (текущая) — Каркас
- Маршруты `/`, `/play`, `/about` + 404/error boundaries в `__root.tsx` и `router.tsx`.
- Главное меню: «Новая игра» / «Продолжить» (disabled если нет сейва) / «О игре».
- Zustand store `src/game/store.ts`: `money`, `inventory`, `equipment_owned`, `current_order`, `table_slots[5]`, `rating_history`, `reviews`, `completed_recipes`, `onboarding_flags`.
- Save/load `src/game/save.ts`: версионированный JSON в localStorage (`kitchen.save.v1`), `loadSave()`, `saveNow()`, `resetSave()`, миграция-заглушка.
- JSON-данные: пустые/минимальные `ingredients.json`, `equipment.json`, `recipes.json`, `steps.json`, `review_templates.json` + TS-типы и Zod-валидация при загрузке.
- Scoring модуль `src/game/scoring.ts` с формулой выше + unit-friendly чистые функции.
- Экран `/play`: верхняя HUD-панель (деньги, рейтинг, заказ-плейсхолдер) + кнопки открытия панелей.
- Заглушки панелей (Sheet/Dialog): **Shop**, **Inventory**, **Equipment**, **Reviews**, **Order**, **Settings** — каждая с заголовком, описанием и пустым состоянием. Без 3D-сцены пока (плейсхолдер с надписью «3D scene — Iteration 2»).
- Art-direction токены (тёплая палитра дерева/керамики) в `src/styles.css` через `@theme`.

### Iteration 2 — 3D-сцена
Кухня, стол со слотами, hover/click, анимация руки, eat long-press 600ms (только raw).

### Iteration 3 — Recipe engine + 2 блюда (Чай, Тост) end-to-end
+ мини-игры MIX и WINDOW с реальным скорингом, заглушки Roll/Chop.

### Iteration 4 — Остальные 6 блюд через data
Рис, Омлет, Салат, Паста, Смузи, Печенье + соответствующая техника в магазине.

### Iteration 5 — Onboarding (Омлет, Чай) + генератор заказов с фильтром доступности.

### Iteration 6 — Интеграция scoring, экономика, рейтинг, генератор отзывов (2–3 тега + 1 совет).

### Iteration 7 — Автосейв, экран завершения сессии (после 8-го блюда), polish, опц. звуки.

