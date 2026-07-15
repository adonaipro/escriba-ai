// [SIMULATED] Story Engine — deterministic rules, no real AI API

export const NARRATIVE_ARCS = [
  "Transformação Pessoal",
  "Descoberta Inesperada",
  "Problema → Solução",
  "Antes e Depois",
  "Autoridade por Experiência",
  "Curiosidade",
  "Prova Social",
  "Urgência Sutil",
] as const;

export const EMOTIONAL_TRIGGERS = [
  "curiosidade",
  "medo_de_perder",
  "esperança",
  "pertencimento",
  "ambição",
  "conforto",
  "surpresa",
] as const;

export const VOICE_REGISTERS = [
  "casual",
  "consultivo",
  "íntimo",
  "especialista",
] as const;

export const CTA_STYLES = [
  "direto",
  "sugestivo",
  "questionamento",
  "urgência",
] as const;

export const LENGTH_BUCKETS = ["short", "medium", "long"] as const;

interface DecisionPackage {
  narrativeArc: number;
  emotionalTrigger: string;
  voiceRegister: string;
  ctaStyle: string;
  lengthBucket: string;
  productName: string;
  productUrl: string;
  niche: string;
}

const STORY_TEMPLATES: Record<number, (dp: DecisionPackage) => string> = {
  1: (dp) =>
    `Eu nunca imaginei que ${dp.productName} fosse mudar minha rotina assim. Comecei usando sem expectativa e hoje não consigo mais imaginar sem. Se você está buscando uma mudança real no seu dia a dia no nicho de ${dp.niche}, vale muito a pena dar uma chance. Link na bio! 👆`,

  2: (dp) =>
    `Descobri por acaso o ${dp.productName} e fiquei surpreso. Não esperava muito, mas o resultado me surpreendeu. Para quem está no universo de ${dp.niche}, essa pode ser uma das melhores descobertas do ano. Detalhes no link da bio.`,

  3: (dp) =>
    `Problema: passei meses procurando algo que realmente funcionasse em ${dp.niche}. Solução: encontrei o ${dp.productName}. A diferença foi imediata. Quem também estava com esse desafio vai entender. Link na bio com todos os detalhes.`,

  4: (dp) =>
    `Antes: frustrado, sem resultado, gastando à toa. Depois de experimentar o ${dp.productName}: situação completamente diferente. Para quem vive o mundo de ${dp.niche}, isso faz toda a diferença. Veja mais no link da bio.`,

  5: (dp) =>
    `Depois de muito tempo atuando em ${dp.niche}, posso dizer com segurança: o ${dp.productName} está entre os melhores que já testei. Minha experiência prática diz muito. Detalhes completos no link da bio.`,

  6: (dp) =>
    `Você sabe o que acontece quando você usa o ${dp.productName} por 30 dias? Os resultados são curiosos. Para quem está inserido em ${dp.niche}, a resposta pode te surpreender. Descubra no link da bio.`,

  7: (dp) =>
    `Muita gente do universo de ${dp.niche} já experimentou o ${dp.productName} e os feedbacks são consistentes. Não sou o único dizendo isso. Se você ainda não conhece, está perdendo algo real. Link na bio.`,

  8: (dp) =>
    `Por tempo limitado tenho um acesso especial ao ${dp.productName}. Para quem está sério com ${dp.niche}, essa é uma janela de oportunidade. Não sei até quando vai estar disponível assim. Link na bio agora.`,
};

export interface GeneratedStory {
  content: string;
  narrativeArc: number;
  emotionalTrigger: string;
  voiceRegister: string;
  ctaStyle: string;
  lengthBucket: string;
  qualityScore: number;
  modelVersion: string;
  temperature: number;
  rejectionReason: string | null;
}

export function generateStory(dp: DecisionPackage): GeneratedStory {
  const template = STORY_TEMPLATES[dp.narrativeArc] || STORY_TEMPLATES[1];
  const content = template(dp);

  const qualityScore = evaluateQuality(content, dp);
  const isRejected = checkDisqualifiers(content);

  return {
    content,
    narrativeArc: dp.narrativeArc,
    emotionalTrigger: dp.emotionalTrigger,
    voiceRegister: dp.voiceRegister,
    ctaStyle: dp.ctaStyle,
    lengthBucket: dp.lengthBucket,
    qualityScore,
    modelVersion: "mock:v1:story-engine-v1",
    temperature: 0.85,
    rejectionReason: isRejected,
  };
}

function evaluateQuality(content: string, dp: DecisionPackage): number {
  let score = 70;

  if (content.length > 200) score += 5;
  if (content.includes("👆") || content.includes("link na bio")) score += 5;
  if (content.toLowerCase().includes(dp.productName.toLowerCase())) score += 5;
  if (dp.ctaStyle === "direto") score += 3;
  if (dp.voiceRegister === "casual") score += 2;

  return Math.min(100, Math.max(0, score + Math.floor(Math.random() * 10) - 5));
}

function checkDisqualifiers(content: string): string | null {
  const lower = content.toLowerCase();
  if (lower.includes("garantido") && lower.includes("100%")) {
    return "urgência manipulativa";
  }
  if (lower.includes("segundo estudo") || lower.includes("cientificamente comprovado")) {
    return "dado fabricado";
  }
  return null;
}
