// Knowledge Engine — stub mantido para compatibilidade; lógica IS foi removida na v2 (Trend model)

export async function updateKnowledge(_params: {
  profileId: string;
  campaignId?: string;
  format: string;
  clicks: number;
  impressions: number;
  qualityScore: number;
}): Promise<void> {
  // No-op: aprendizados agora são gerenciados diretamente pelo modelo Learning
}
