// Build a ReviewEntry from a ScoringResult.

import { REVIEW_TEMPLATES } from "./data";
import type { ReviewEntry, ReviewTrigger } from "./types";
import type { ScoringResult } from "./scoring";

function pickTemplateText(triggers: ReviewTrigger[]): string {
  for (const t of triggers) {
    const matches = REVIEW_TEMPLATES.filter((tpl) => tpl.trigger === t);
    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)].text;
    }
  }
  return "Спасибо!";
}

function triggersFromFactors(r: ScoringResult): ReviewTrigger[] {
  const out: ReviewTrigger[] = [];
  if (r.factors.speed_band === "SLOW") out.push("speed:slow");
  if (r.factors.speed_band === "FAST") out.push("speed:fast");
  if (r.factors.accuracy_factor < 0.85) out.push("accuracy:low");
  if (r.factors.accuracy_factor >= 1.0) out.push("accuracy:high");
  if (r.factors.mini_quality_avg < 0.5) out.push("minigame:low");
  if (r.factors.mini_quality_avg >= 0.8) out.push("minigame:high");
  if (r.factors.premium_share >= 0.5) out.push("ingredient:premium");
  else if (r.factors.premium_share === 0) out.push("ingredient:basic");
  return out;
}

export function buildReview(recipe_id: string, scoring: ScoringResult): ReviewEntry {
  const triggers = triggersFromFactors(scoring);
  const text = pickTemplateText(triggers.length > 0 ? triggers : ["accuracy:high"]);
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recipe_id,
    stars: scoring.stars,
    tags: scoring.tags,
    tip: scoring.tip,
    text,
    created_at: Date.now(),
  };
}
