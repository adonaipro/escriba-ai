import "server-only";
import { createHash } from "node:crypto";

const ENDPOINT = "https://open-api.affiliate.shopee.com.br/graphql";

type GraphQLError = { message?: string; extensions?: { code?: number; message?: string } };

export async function shopeeRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const appId = process.env.SHOPEE_AFFILIATE_APP_ID;
  const secret = process.env.SHOPEE_AFFILIATE_SECRET;
  if (!appId || !secret) throw new Error("Credenciais da Shopee não configuradas");

  const payload = JSON.stringify(variables ? { query, variables } : { query });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha256")
    .update(`${appId}${timestamp}${payload}${secret}`)
    .digest("hex");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `SHA256 Credential=${appId},Timestamp=${timestamp},Signature=${signature}`,
    },
    body: payload,
    cache: "no-store",
  });
  const result = await response.json() as { data?: T; errors?: GraphQLError[] };
  if (!response.ok || result.errors?.length || !result.data) {
    const detail = result.errors?.map((e) => e.extensions?.message || e.message).filter(Boolean).join("; ");
    throw new Error(detail || `Shopee API respondeu HTTP ${response.status}`);
  }
  return result.data;
}

export function hasShopeeCredentials(): boolean {
  return Boolean(process.env.SHOPEE_AFFILIATE_APP_ID && process.env.SHOPEE_AFFILIATE_SECRET);
}
