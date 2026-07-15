/**
 * Product Import — orchestrates link resolution, data fetch, and intelligence analysis.
 *
 * Flow:
 * 1. Resolve URL → marketplace + IDs
 * 2. Try real HTTP fetch for title/meta (best effort, non-blocking)
 * 3. Fall back to provider data
 * 4. Run Product Intelligence Engine → ProductUniverse
 * 5. Save Product + ProductAnalysis to DB
 */

import { prisma } from "@/lib/db";
import { defaultProductProvider } from "@/lib/providers/simulated-product-provider";
import { analyzeProduct } from "@/lib/llm/product-intelligence-engine";
import type { ProductUniverse } from "@/lib/llm/product-intelligence-engine";

export interface ImportResult {
  productId: string;
  name: string;
  category: string;
  confidence: string;
  missingFields: string[];
  isNew: boolean;
}

/** Attempt to extract product name from an HTML page title (best-effort, non-blocking) */
async function tryFetchPageTitle(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!match) return null;
    let title = match[1].trim();
    // Strip common suffixes (e.g., " | Shopee Brasil", " - Shopee")
    title = title.replace(/\s*[|\-–]\s*(Shopee|Amazon|Mercado Livre)[^$]*/i, "").trim();
    return title.length > 3 ? title : null;
  } catch {
    return null;
  }
}

function buildAnalysisFromUniverse(
  universe: ProductUniverse,
  productName: string,
  price: number,
  commissionPct: number,
): {
  confirmedFacts: string[];
  aiInferences: string[];
  targetAudience: string[];
  usageOccasions: string[];
  pains: string[];
  benefits: string[];
  scenarios: string[];
  characters: string[];
  conflicts: string[];
  compatibleObjects: string[];
  bridgeTopics: string[];
  restrictions: string[];
  detectedCategory: string;
  categoryLabel: string;
  confidence: string;
} {
  const confirmedFacts: string[] = [];
  const aiInferences: string[] = [];

  // Facts we know from product data
  confirmedFacts.push(`Produto: ${productName}`);
  if (price > 0) confirmedFacts.push(`Preço: R$ ${price.toFixed(2)}`);
  if (commissionPct > 0) confirmedFacts.push(`Comissão: ${commissionPct}%`);
  confirmedFacts.push(`Marketplace: Shopee`);

  // Everything from the universe is AI-inferred (keyword-based detection)
  if (universe.confidence !== "high") {
    aiInferences.push(`Categoria detectada: ${universe.categoryLabel} (inferência por palavras-chave)`);
  }
  universe.pains.forEach((p) => aiInferences.push(`Dor provável: ${p}`));
  universe.benefits.forEach((b) => aiInferences.push(`Benefício esperado: ${b}`));

  // Characters: generic based on category
  const characters: string[] = [];
  if (universe.detectedCategory.includes("calcados") || universe.detectedCategory === "suplementos") {
    characters.push("amiga que retomou exercícios", "colega de trabalho que cuida da saúde", "médico ou fisioterapeuta");
  } else if (universe.detectedCategory === "beleza") {
    characters.push("amiga que indicou", "mãe com rotina de cuidado", "influencer da skincare");
  } else if (universe.detectedCategory === "eletrodomesticos") {
    characters.push("sogra que cozinha", "mãe que quer praticidade", "parceiro que quer comer bem");
  } else if (universe.detectedCategory === "infantil") {
    characters.push("bebê recém-chegado", "sobrinho", "filha que pediu");
  } else {
    characters.push("alguém próximo que indicou", "colega que mostrou o produto");
  }

  // Compatible objects: physical items that appear in contextual narratives
  const compatibleObjects: string[] = [];
  if (universe.detectedCategory.includes("calcados")) {
    compatibleObjects.push("o tênis velho", "os sapatos que apertam", "a sapatilha gasta");
  } else if (universe.detectedCategory === "beleza") {
    compatibleObjects.push("o creme da gaveta", "o sérum pela metade", "o espelho");
  } else if (universe.detectedCategory === "eletrodomesticos") {
    compatibleObjects.push("a frigideira de sempre", "o fogão", "a cozinha");
  } else {
    compatibleObjects.push("o produto anterior", "o objeto relacionado");
  }

  // Conflicts: situations that naturally lead to product discovery
  const conflicts: string[] = universe.occasions.map(
    (o) => `Contexto de compra: ${o}`,
  );

  return {
    confirmedFacts,
    aiInferences,
    targetAudience: ["adultos 25-45 anos", ...universe.occasions.slice(0, 2)],
    usageOccasions: universe.occasions,
    pains: universe.pains,
    benefits: universe.benefits,
    scenarios: universe.scenarios,
    characters,
    conflicts,
    compatibleObjects,
    bridgeTopics: universe.bridgeTopics,
    restrictions: universe.restrictions,
    detectedCategory: universe.detectedCategory,
    categoryLabel: universe.categoryLabel,
    confidence: universe.confidence,
  };
}

export async function importProductByLink(
  profileId: string,
  rawUrl: string,
): Promise<ImportResult> {
  const provider = defaultProductProvider;
  const missingFields: string[] = [];

  // Step 1: resolve URL
  const resolved = await provider.resolveLink(rawUrl);

  // Step 2: try real page title (non-blocking)
  const pageTitle = await tryFetchPageTitle(rawUrl);

  // Step 3: fetch from provider
  const providerData = await provider.fetchProduct(resolved);

  // Merge: page title takes priority for name
  const finalName =
    pageTitle ??
    providerData.name ??
    resolved.productNameFromUrl ??
    "Produto importado";

  if (!pageTitle && !providerData.name) missingFields.push("nome");
  if (!providerData.imageUrl) missingFields.push("imagem");
  if (!providerData.price || providerData.price === 0) missingFields.push("preço");
  if (!providerData.commissionPct || providerData.commissionPct === 0) missingFields.push("comissão");
  if (!providerData.description) missingFields.push("descrição");

  // Step 4: run Product Intelligence
  const universe = analyzeProduct(finalName, rawUrl);

  // Step 5: check for existing product (same URL)
  const existing = await prisma.product.findFirst({
    where: { profileId, originalUrl: rawUrl },
  });

  if (existing) {
    // Update analysis
    const analysis = buildAnalysisFromUniverse(
      universe,
      finalName,
      providerData.price ?? existing.price,
      providerData.commissionPct ?? existing.commissionPct,
    );
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: finalName,
        description: providerData.description ?? existing.description,
        imageUrl: providerData.imageUrl ?? existing.imageUrl,
        price: providerData.price ?? existing.price,
        promotionalPrice: providerData.promotionalPrice ?? existing.promotionalPrice,
        commission: providerData.commission ?? existing.commission,
        commissionPct: providerData.commissionPct ?? existing.commissionPct,
        rating: providerData.rating ?? existing.rating,
        soldCount: providerData.soldCount ?? existing.soldCount,
        lastSyncedAt: new Date(),
        analysisStatus: "ready",
      },
    });
    await prisma.productAnalysis.upsert({
      where: { productId: existing.id },
      create: {
        productId: existing.id,
        ...jsonifyAnalysis(analysis),
        analysisVersion: 1,
      },
      update: {
        ...jsonifyAnalysis(analysis),
        analysisVersion: { increment: 1 },
      },
    });
    return {
      productId: existing.id,
      name: finalName,
      category: universe.categoryLabel,
      confidence: universe.confidence,
      missingFields,
      isNew: false,
    };
  }

  // Step 6: create new product + analysis
  const analysis = buildAnalysisFromUniverse(
    universe,
    finalName,
    providerData.price ?? 0,
    providerData.commissionPct ?? 0,
  );

  const product = await prisma.product.create({
    data: {
      profileId,
      marketplace: resolved.marketplace === "unknown" ? "outro" : resolved.marketplace,
      externalId: resolved.itemId,
      shopId: resolved.shopId,
      name: finalName,
      description: providerData.description ?? "",
      category: providerData.category ?? universe.categoryLabel,
      subcategory: providerData.subcategory ?? "",
      imageUrl: providerData.imageUrl ?? "",
      price: providerData.price ?? 0,
      promotionalPrice: providerData.promotionalPrice,
      commission: providerData.commission ?? 0,
      commissionPct: providerData.commissionPct ?? 0,
      rating: providerData.rating,
      soldCount: providerData.soldCount ?? 0,
      shopName: providerData.shopName ?? "",
      originalUrl: rawUrl,
      affiliateUrl: providerData.affiliateUrl ?? rawUrl,
      dataSource: "link_scrape",
      lastSyncedAt: new Date(),
      analysisStatus: "ready",
      analysis: {
        create: {
          ...jsonifyAnalysis(analysis),
          analysisVersion: 1,
        },
      },
    },
  });

  return {
    productId: product.id,
    name: finalName,
    category: universe.categoryLabel,
    confidence: universe.confidence,
    missingFields,
    isNew: true,
  };
}

/** Re-run Product Intelligence on an existing product */
export async function reanalyzeProduct(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  await prisma.product.update({
    where: { id: productId },
    data: { analysisStatus: "analyzing" },
  });

  const universe = analyzeProduct(product.name, product.originalUrl);
  const analysis = buildAnalysisFromUniverse(
    universe,
    product.name,
    product.price,
    product.commissionPct,
  );

  await prisma.productAnalysis.upsert({
    where: { productId },
    create: { productId, ...jsonifyAnalysis(analysis), analysisVersion: 1 },
    update: { ...jsonifyAnalysis(analysis), analysisVersion: { increment: 1 } },
  });

  await prisma.product.update({
    where: { id: productId },
    data: { analysisStatus: "ready" },
  });
}

function jsonifyAnalysis(a: ReturnType<typeof buildAnalysisFromUniverse>) {
  return {
    confirmedFacts:    JSON.stringify(a.confirmedFacts),
    aiInferences:      JSON.stringify(a.aiInferences),
    targetAudience:    JSON.stringify(a.targetAudience),
    usageOccasions:    JSON.stringify(a.usageOccasions),
    pains:             JSON.stringify(a.pains),
    benefits:          JSON.stringify(a.benefits),
    scenarios:         JSON.stringify(a.scenarios),
    characters:        JSON.stringify(a.characters),
    conflicts:         JSON.stringify(a.conflicts),
    compatibleObjects: JSON.stringify(a.compatibleObjects),
    bridgeTopics:      JSON.stringify(a.bridgeTopics),
    restrictions:      JSON.stringify(a.restrictions),
    detectedCategory:  a.detectedCategory,
    categoryLabel:     a.categoryLabel,
    confidence:        a.confidence,
  };
}
