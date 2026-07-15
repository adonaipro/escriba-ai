/**
 * Simulated Product Provider — returns realistic mock data based on URL/name keywords.
 * Used when no real marketplace API is configured.
 * Designed for development and demo; replace with ShopeeProvider for production.
 */

import type { ProductProvider, ProductData, ResolvedLink, SyncResult } from "./product-provider";

// Keyword → category templates
const CATEGORY_TEMPLATES: Record<string, Partial<ProductData>> = {
  tenis: {
    category: "Calçados", subcategory: "Esportivos",
    price: 189.90, commissionPct: 8, commission: 15.19,
    rating: 4.7, soldCount: 1240,
    description: "Tênis esportivo com solado de amortecimento e cabedal respirável. Ideal para corrida e academia.",
  },
  sapatilha: {
    category: "Calçados", subcategory: "Esportivos",
    price: 149.90, commissionPct: 7, commission: 10.49,
    rating: 4.5, soldCount: 890,
    description: "Sapatilha leve para atividade física. Ótima para treinos e caminhadas.",
  },
  sapato: {
    category: "Calçados", subcategory: "Femininos",
    price: 129.90, commissionPct: 7, commission: 9.09,
    rating: 4.6, soldCount: 650,
    description: "Sapato elegante para uso no dia a dia e eventos especiais.",
  },
  perfume: {
    category: "Beleza", subcategory: "Fragrâncias",
    price: 89.90, commissionPct: 10, commission: 8.99,
    rating: 4.8, soldCount: 3200,
    description: "Perfume com notas florais e amadeiradas. Longa duração, ideal para uso diário e noturno.",
  },
  creme: {
    category: "Beleza", subcategory: "Skincare",
    price: 59.90, commissionPct: 10, commission: 5.99,
    rating: 4.6, soldCount: 2100,
    description: "Creme hidratante com ação prolongada. Para pele seca e mista.",
  },
  sérum: {
    category: "Beleza", subcategory: "Skincare",
    price: 79.90, commissionPct: 10, commission: 7.99,
    rating: 4.7, soldCount: 1800,
    description: "Sérum antienvelhecimento com vitamina C e ácido hialurônico.",
  },
  "air fryer": {
    category: "Eletrodomésticos", subcategory: "Fritadeiras",
    price: 349.90, commissionPct: 6, commission: 20.99,
    rating: 4.8, soldCount: 4500,
    description: "Air fryer digital com 4L de capacidade. Frituras saudáveis com até 80% menos óleo.",
  },
  cafeteira: {
    category: "Eletrodomésticos", subcategory: "Preparo de Bebidas",
    price: 199.90, commissionPct: 6, commission: 11.99,
    rating: 4.6, soldCount: 2800,
    description: "Cafeteira elétrica com filtro permanente. 30 xícaras, mantém quente por 2 horas.",
  },
  fone: {
    category: "Eletrônicos", subcategory: "Áudio",
    price: 149.90, commissionPct: 7, commission: 10.49,
    rating: 4.5, soldCount: 5600,
    description: "Fone de ouvido bluetooth com cancelamento de ruído ativo. Bateria de 30h.",
  },
  headphone: {
    category: "Eletrônicos", subcategory: "Áudio",
    price: 299.90, commissionPct: 7, commission: 20.99,
    rating: 4.7, soldCount: 3200,
    description: "Headphone over-ear com cancelamento de ruído premium. Hi-Res Audio certificado.",
  },
  smartwatch: {
    category: "Eletrônicos", subcategory: "Wearables",
    price: 249.90, commissionPct: 7, commission: 17.49,
    rating: 4.5, soldCount: 2100,
    description: "Smartwatch com monitoramento de saúde, GPS e notificações. Bateria 7 dias.",
  },
  whey: {
    category: "Suplementos", subcategory: "Proteínas",
    price: 129.90, commissionPct: 9, commission: 11.69,
    rating: 4.6, soldCount: 6800,
    description: "Whey protein concentrado com 24g de proteína por dose. Sabores variados.",
  },
  colágeno: {
    category: "Suplementos", subcategory: "Colágeno",
    price: 79.90, commissionPct: 9, commission: 7.19,
    rating: 4.7, soldCount: 4200,
    description: "Colágeno hidrolisado com vitamina C. 300g, sabor neutro.",
  },
  vestido: {
    category: "Roupas", subcategory: "Femininas",
    price: 89.90, commissionPct: 8, commission: 7.19,
    rating: 4.5, soldCount: 980,
    description: "Vestido floral midi para uso casual e eventos. Tecido leve e confortável.",
  },
  calça: {
    category: "Roupas", subcategory: "Femininas",
    price: 79.90, commissionPct: 8, commission: 6.39,
    rating: 4.5, soldCount: 1340,
    description: "Calça jeans skinny de alta elasticidade. Confortável para uso diário.",
  },
  camiseta: {
    category: "Roupas", subcategory: "Masculinas",
    price: 49.90, commissionPct: 8, commission: 3.99,
    rating: 4.4, soldCount: 2100,
    description: "Camiseta 100% algodão com corte moderno. Disponível em várias cores.",
  },
  brinquedo: {
    category: "Infantil", subcategory: "Brinquedos",
    price: 59.90, commissionPct: 7, commission: 4.19,
    rating: 4.7, soldCount: 760,
    description: "Brinquedo educativo para crianças de 3 a 8 anos. Estimula raciocínio lógico.",
  },
  café: {
    category: "Alimentos", subcategory: "Bebidas",
    price: 39.90, commissionPct: 8, commission: 3.19,
    rating: 4.8, soldCount: 5400,
    description: "Café especial 100% arábica, torrado artesanalmente. Moagem média.",
  },
};

function matchTemplate(text: string): Partial<ProductData> {
  const lower = text.toLowerCase();
  for (const [kw, tpl] of Object.entries(CATEGORY_TEMPLATES)) {
    if (lower.includes(kw)) return tpl;
  }
  return {
    category: "Geral", subcategory: "",
    price: 99.90, commissionPct: 7, commission: 6.99,
    rating: 4.5, soldCount: 500,
    description: "Produto importado do catálogo de afiliados.",
  };
}

function parseShopeeUrl(url: string): { shopId?: string; itemId?: string; nameFromUrl?: string } {
  // Pattern: https://shopee.com.br/product-slug-i.{shopId}.{itemId}
  const match = url.match(/[?&-]?i\.(\d+)\.(\d+)/);
  if (match) {
    return { shopId: match[1], itemId: match[2] };
  }
  // Extract product name from URL slug
  const pathMatch = url.match(/shopee\.com\.br\/([^?#]+)/);
  if (pathMatch) {
    const slug = pathMatch[1].replace(/-i\.\d+\.\d+$/, "").replace(/-/g, " ").trim();
    return { nameFromUrl: slug };
  }
  return {};
}

function slugToName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/\bi\b/g, "")
    .trim();
}

export class SimulatedProductProvider implements ProductProvider {
  readonly name = "simulated";

  async resolveLink(url: string): Promise<import("./product-provider").ResolvedLink> {
    const lower = url.toLowerCase();
    let marketplace = "unknown";
    if (lower.includes("shopee")) marketplace = "shopee";
    else if (lower.includes("amazon")) marketplace = "amazon";
    else if (lower.includes("mercadolivre") || lower.includes("mercadolibre")) marketplace = "mercadolivre";

    const parsed = parseShopeeUrl(url);
    return {
      marketplace,
      shopId: parsed.shopId,
      itemId: parsed.itemId,
      resolvedUrl: url,
      productNameFromUrl: parsed.nameFromUrl ? slugToName(parsed.nameFromUrl) : undefined,
    };
  }

  async fetchProduct(resolved: import("./product-provider").ResolvedLink): Promise<Partial<ProductData>> {
    const nameHint = resolved.productNameFromUrl ?? "";
    const tpl = matchTemplate(nameHint);
    return {
      ...tpl,
      externalId: resolved.itemId,
      shopId: resolved.shopId,
      shopName: "Loja Parceira",
      name: nameHint || "Produto importado",
      originalUrl: resolved.resolvedUrl,
      affiliateUrl: resolved.resolvedUrl,
      imageUrl: "",
    };
  }

  async listAffiliateProducts(_limit = 20): Promise<ProductData[]> {
    // Simulated: return a mix of product types
    const templates = [
      { name: "Tênis Nike Air Max", ...CATEGORY_TEMPLATES.tenis },
      { name: "Perfume Floral Intenso", ...CATEGORY_TEMPLATES.perfume },
      { name: "Air Fryer Digital 4L", ...CATEGORY_TEMPLATES["air fryer"] },
      { name: "Fone Bluetooth ANC", ...CATEGORY_TEMPLATES.fone },
      { name: "Whey Protein Chocolate", ...CATEGORY_TEMPLATES.whey },
    ];
    return templates.map((t, i) => ({
      name: t.name ?? "Produto",
      description: t.description ?? "",
      category: t.category ?? "Geral",
      subcategory: t.subcategory ?? "",
      imageUrl: "",
      price: t.price ?? 99.90,
      promotionalPrice: undefined,
      commission: t.commission ?? 7,
      commissionPct: t.commissionPct ?? 7,
      rating: t.rating,
      soldCount: t.soldCount ?? 0,
      shopName: "Loja Simulada",
      externalId: `sim-${i + 1}`,
      shopId: "999999",
      originalUrl: `https://shopee.com.br/produto-${i + 1}-i.999999.${i + 1}`,
      affiliateUrl: `https://shopee.com.br/produto-${i + 1}-i.999999.${i + 1}`,
    }));
  }

  async syncProduct(externalId: string, _shopId?: string): Promise<SyncResult> {
    return {
      updated: { price: 99.90 + Math.round(Math.random() * 20 - 10) },
      changedFields: ["price"],
    };
  }
}

export const defaultProductProvider: ProductProvider = new SimulatedProductProvider();
