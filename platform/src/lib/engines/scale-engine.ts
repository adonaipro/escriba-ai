// Scale Engine — stub mantido para compatibilidade; lógica de Story Family foi removida na v2 (Trend model)

export interface ScaleRecommendation {
  campaignId: string;
  campaignName: string;
  reason: string;
  cps: number;
}

export async function evaluateCampaignForScale(
  _campaignId: string
): Promise<ScaleRecommendation | null> {
  return null;
}

export async function generateTrendFamily(
  _campaignId: string,
  _baseTrendId: string
): Promise<string[]> {
  return [];
}
