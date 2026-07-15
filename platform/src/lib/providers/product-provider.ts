/**
 * Product Provider — interface for marketplace data sources.
 *
 * Implementations: SimulatedProductProvider (default), ShopeeProvider (future).
 * The lab and campaign creation always go through this interface.
 */

export interface ProductData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  imageUrl: string;
  price: number;
  promotionalPrice?: number;
  commission: number;
  commissionPct: number;
  rating?: number;
  soldCount: number;
  shopName: string;
  externalId?: string;
  shopId?: string;
  originalUrl: string;
  affiliateUrl: string;
}

export interface ResolvedLink {
  marketplace: string;  // "shopee" | "amazon" | "mercadolivre" | "unknown"
  shopId?: string;
  itemId?: string;
  resolvedUrl: string;
  productNameFromUrl?: string; // extracted from URL slug if available
}

export interface SyncResult {
  updated: Partial<ProductData>;
  changedFields: string[];
}

export interface ProductProvider {
  readonly name: string;

  /** Resolve a raw link (possibly short URL) to marketplace + IDs */
  resolveLink(url: string): Promise<ResolvedLink>;

  /** Fetch product data given a resolved link */
  fetchProduct(resolved: ResolvedLink): Promise<Partial<ProductData>>;

  /** List affiliate products (if provider supports account integration) */
  listAffiliateProducts(limit?: number): Promise<ProductData[]>;

  /** Sync a single product to get latest price / commission / stock */
  syncProduct(externalId: string, shopId?: string): Promise<SyncResult>;
}
