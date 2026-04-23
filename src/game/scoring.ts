// Scoring (MVP canon).
// Чистые функции, детерминированы. Никакого React/IO.

import type { ReviewTrigger } from "./types";

export type SpeedBand = "FAST" | "OK" | "SLOW";

export interface ScoringInput {
  total_errors: number;
  minigame_scores: number[]; // each 0..1
  t_elapsed_sec: number;
  t_fast: number;
  t_ok: number;
  premium_share: number; // 0..1
  base_price: number;
}

export interface ScoringFactors {
  speed_band: SpeedBand;
  speed_factor: number;
  ingredient_factor: number;
  accuracy_factor: number;
  minigame_factor: number;
  mini_quality_avg: number;
  premium_share: number;
}

export interface ScoringResult {
  stars: 1 | 2 | 3 | 4 | 5;
  overall_score: number;
  reward_money: number;
  factors: ScoringFactors;
  tags: string[]; // 2..3 тега-причины
  tip: string; // 1 совет
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function speedFactor(t_elapsed: number, t_fast: number, t_ok: number): {
  band: SpeedBand;
  factor: number;
} {
  if (t_elapsed <= t_fast) return { band: "FAST", factor: 1.0 };
  if (t_elapsed <= t_ok) return { band: "OK", factor: 0.85 };
  return { band: "SLOW", factor: 0.7 };
}

export function ingredientFactor(premium_share: number): number {
  const p = clamp(premium_share, 0, 1);
  return 0.9 + 0.2 * p;
}

export function accuracyFactor(total_errors: number): number {
  return Math.max(0.5, 1 - 0.1 * Math.max(0, total_errors));
}

export function minigameFactor(scores: number[]): { factor: number; avg: number } {
  if (scores.length === 0) return { factor: 0.85, avg: 0.5 };
  const avg = scores.reduce((s, x) => s + clamp(x, 0, 1), 0) / scores.length;
  return { factor: 0.7 + 0.3 * avg, avg };
}

interface TagCandidate {
  trigger: ReviewTrigger;
  weight: number; // higher = more relevant
  label: string;
}

function buildTagsAndTip(f: ScoringFactors, t_ok: number): { tags: string[]; tip: string } {
  const candidates: TagCandidate[] = [];

  // Speed
  if (f.speed_band === "SLOW") {
    candidates.push({ trigger: "speed:slow", weight: 0.9, label: "Долго" });
  } else if (f.speed_band === "FAST") {
    candidates.push({ trigger: "speed:fast", weight: 0.6, label: "Быстро" });
  }

  // Accuracy
  if (f.accuracy_factor < 0.85) {
    candidates.push({ trigger: "accuracy:low", weight: 1.0, label: "Перепутали шаги" });
  } else if (f.accuracy_factor >= 1.0) {
    candidates.push({ trigger: "accuracy:high", weight: 0.5, label: "Точно по рецепту" });
  }

  // Minigame
  if (f.mini_quality_avg < 0.5) {
    candidates.push({ trigger: "minigame:low", weight: 0.8, label: "Плохо перемешано" });
  } else if (f.mini_quality_avg >= 0.8) {
    candidates.push({ trigger: "minigame:high", weight: 0.55, label: "Идеальная текстура" });
  }

  // Ingredients
  if (f.premium_share >= 0.5) {
    candidates.push({ trigger: "ingredient:premium", weight: 0.5, label: "Свежие продукты" });
  } else if (f.premium_share === 0) {
    candidates.push({ trigger: "ingredient:basic", weight: 0.3, label: "Простые ингредиенты" });
  }

  // Гарантируем минимум 2 тега
  if (candidates.length < 2) {
    candidates.push({ trigger: "accuracy:high", weight: 0.2, label: "Хороший заказ" });
  }

  candidates.sort((a, b) => b.weight - a.weight);
  const top = candidates.slice(0, 3);
  const tags = top.map((c) => c.label);

  // Совет: по самому слабому фактору
  const weakest = pickWeakest(f, t_ok);
  return { tags, tip: weakest };
}

function pickWeakest(f: ScoringFactors, t_ok: number): string {
  const items: { key: string; value: number; tip: string }[] = [
    { key: "accuracy", value: f.accuracy_factor, tip: "Старайтесь не путать шаги рецепта." },
    {
      key: "speed",
      value: f.speed_factor,
      tip: `Старайтесь укладываться в ${Math.round(t_ok)} сек.`,
    },
    { key: "minigame", value: f.minigame_factor, tip: "Уделите больше внимания готовке." },
    {
      key: "ingredient",
      value: f.ingredient_factor,
      tip: "Попробуйте премиум-ингредиенты для лучших отзывов.",
    },
  ];
  items.sort((a, b) => a.value - b.value);
  return items[0].tip;
}

export function computeScore(input: ScoringInput): ScoringResult {
  const sp = speedFactor(input.t_elapsed_sec, input.t_fast, input.t_ok);
  const ig = ingredientFactor(input.premium_share);
  const ac = accuracyFactor(input.total_errors);
  const mg = minigameFactor(input.minigame_scores);

  const overall_score = clamp(sp.factor * ig * ac * mg.factor, 0, 1.2);
  const stars = clamp(Math.round(overall_score * 5), 1, 5) as 1 | 2 | 3 | 4 | 5;
  const reward_money = Math.round(input.base_price * overall_score);

  const factors: ScoringFactors = {
    speed_band: sp.band,
    speed_factor: sp.factor,
    ingredient_factor: ig,
    accuracy_factor: ac,
    minigame_factor: mg.factor,
    mini_quality_avg: mg.avg,
    premium_share: clamp(input.premium_share, 0, 1),
  };

  const { tags, tip } = buildTagsAndTip(factors, input.t_ok);

  return { stars, overall_score, reward_money, factors, tags, tip };
}
