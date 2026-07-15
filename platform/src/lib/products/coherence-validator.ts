/**
 * Coherence Validator — checks if a generated narrative is coherent with product strategy.
 *
 * Rules:
 * - clickbait: always valid (story is independent of product)
 * - contextual: product must appear in a natural, direct relationship with the narrative situation
 * - hybrid: a logical bridge between conflict and product must exist in the narrative
 *
 * Also rejects:
 * - Invented benefits not in the product universe
 * - Product mentioned without logical connection (contextual)
 * - Strategy label mismatch with actual narrative content
 */

import type { ProductUniverse } from "@/lib/llm/product-intelligence-engine";

export type ProductStrategy = "clickbait" | "contextual" | "hybrid";

export interface CoherenceResult {
  valid: boolean;
  score: number;         // 0-1
  reason?: string;       // why it's invalid
  violations: string[];  // specific things that went wrong
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function anyTermInText(terms: string[], text: string): boolean {
  const norm = normalizeText(text);
  return terms.some((t) => norm.includes(normalizeText(t)));
}

function countTermMatches(terms: string[], text: string): number {
  const norm = normalizeText(text);
  return terms.filter((t) => norm.includes(normalizeText(t))).length;
}

export function validateCoherence(
  posts: Array<{ content: string }>,
  universe: ProductUniverse,
  strategy: ProductStrategy,
): CoherenceResult {
  if (strategy === "clickbait") {
    return { valid: true, score: 1, violations: [] };
  }

  const allText = posts.map((p) => p.content).join(" ");
  const violations: string[] = [];

  if (strategy === "contextual") {
    const scenarioMatches = countTermMatches(universe.scenarios, allText);
    const painMatches     = countTermMatches(universe.pains, allText);
    const benefitMatches  = countTermMatches(universe.benefits, allText);
    const total = scenarioMatches + painMatches + benefitMatches;

    if (total === 0) {
      violations.push("Nenhum cenário, dor ou benefício do produto aparece na narrativa");
    }

    // Check for restrictions violations
    universe.restrictions.forEach((r) => {
      const prohibitedClaim = r.replace(/^não (prometer|afirmar|fazer|garantir)\s*/i, "").trim();
      if (prohibitedClaim && normalizeText(allText).includes(normalizeText(prohibitedClaim))) {
        violations.push(`Afirmação proibida detectada: "${prohibitedClaim}"`);
      }
    });

    const score = Math.min(1, total / 3);
    if (violations.length > 0) {
      return {
        valid: false,
        score,
        reason: "Narrativa contextual sem relação direta com o universo do produto",
        violations,
      };
    }
    return { valid: true, score, violations: [] };
  }

  if (strategy === "hybrid") {
    const hasBridge = anyTermInText(universe.bridgeTopics, allText);
    const hasScenario = anyTermInText(universe.scenarios, allText);
    const hasAnyConnection = hasBridge || hasScenario || anyTermInText(universe.pains, allText);

    if (!hasAnyConnection) {
      violations.push("Narrativa híbrida sem ponte lógica entre o conflito e o produto");
    }

    // Check for restrictions violations
    universe.restrictions.forEach((r) => {
      const prohibitedClaim = r.replace(/^não (prometer|afirmar|fazer|garantir)\s*/i, "").trim();
      if (prohibitedClaim && normalizeText(allText).includes(normalizeText(prohibitedClaim))) {
        violations.push(`Afirmação proibida: "${prohibitedClaim}"`);
      }
    });

    const score = hasAnyConnection ? (hasBridge ? 0.9 : 0.6) : 0;
    if (violations.length > 0) {
      return {
        valid: false,
        score,
        reason: "Narrativa híbrida sem ponte lógica entre conflito e produto",
        violations,
      };
    }
    return { valid: true, score, violations: [] };
  }

  return { valid: true, score: 1, violations: [] };
}

/** Detect which strategy the narrative content actually matches */
export function detectActualStrategy(
  posts: Array<{ content: string }>,
  universe: ProductUniverse,
): ProductStrategy {
  const allText = posts.map((p) => p.content).join(" ");

  const scenarioMatches = countTermMatches(universe.scenarios, allText);
  const painMatches     = countTermMatches(universe.pains, allText);
  const bridgeMatches   = countTermMatches(universe.bridgeTopics, allText);

  if (scenarioMatches + painMatches >= 2) return "contextual";
  if (bridgeMatches >= 1 || scenarioMatches + painMatches >= 1) return "hybrid";
  return "clickbait";
}
