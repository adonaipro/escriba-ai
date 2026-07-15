/**
 * Product Intelligence Engine
 *
 * Analyzes a product name/URL to extract its narrative universe.
 * This universe is mandatory input for contextual and hybrid strategies.
 *
 * Architecture: Product → Universe → Scene → Narrative (never the reverse).
 * Nothing generates a contextual narrative without knowing what the product is.
 */

export interface ProductUniverse {
  detectedCategory: string;
  categoryLabel: string;
  scenarios: string[];      // natural environments where the product exists
  pains: string[];          // problems the product addresses
  benefits: string[];       // what it delivers
  occasions: string[];      // when people buy or use it
  bridgeTopics: string[];   // off-topic starting points that naturally lead here (hybrid)
  restrictions: string[];   // things a narrative must NOT claim
  confidence: "high" | "medium" | "low";
}

interface CategoryDefinition {
  label: string;
  keywords: string[];
  universe: Omit<ProductUniverse, "detectedCategory" | "categoryLabel" | "confidence">;
}

const CATEGORIES: Record<string, CategoryDefinition> = {
  calcados_esportivos: {
    label: "calçados esportivos",
    keywords: [
      "tênis", "sapatilha", "running", "trail", "corrida", "esportivo",
      "chinelo esportivo", "chuteira", "atletismo",
    ],
    universe: {
      scenarios: ["academia", "parque", "corrida de rua", "caminhada", "trilha", "fisioterapia", "musculação"],
      pains: ["dor nos pés", "bolhas", "cansaço nas pernas", "impacto no joelho", "desconforto", "dor nas costas"],
      benefits: ["conforto", "leveza", "amortecimento", "aderência", "durabilidade", "estabilidade"],
      occasions: [
        "volta aos exercícios", "primeira corrida", "viagem longa",
        "trabalho em pé o dia todo", "presente de aniversário",
        "meta de saúde", "recuperação pós-cirurgia",
      ],
      bridgeTopics: [
        "sair para caminhar depois de uma discussão",
        "retomar exercícios depois de um período difícil",
        "precisar de tempo só para mim",
        "recomendação de médico para caminhar mais",
        "acompanhar alguém que começou a se exercitar",
      ],
      restrictions: [
        "não prometer perda de peso específica",
        "não afirmar cura de lesões",
        "não garantir performance atlética",
      ],
    },
  },

  calcados_gerais: {
    label: "calçados",
    keywords: ["sapato", "scarpin", "bota", "sandália", "rasteirinha", "mule", "mocassim", "oxford", "salto"],
    universe: {
      scenarios: ["trabalho", "evento social", "passeio", "casamento", "restaurante", "viagem"],
      pains: ["desconforto em pé por horas", "bolhas", "dificuldade de combinar"],
      benefits: ["elegância", "conforto", "versatilidade", "estilo"],
      occasions: ["evento especial", "promoção no trabalho", "viagem", "presente", "nova fase"],
      bridgeTopics: [
        "evento inesperado que exigiu um look especial",
        "sentir que precisava de algo que fosse só meu",
        "convite de última hora para algo importante",
        "mudança de emprego que exigiu nova postura",
      ],
      restrictions: [],
    },
  },

  beleza: {
    label: "beleza e cuidados pessoais",
    keywords: [
      "perfume", "creme", "sérum", "batom", "base", "skincare",
      "hidratante", "shampoo", "condicionador", "máscara capilar",
      "óleo", "maquiagem", "protetor solar", "vitamina c", "ácido", "retinol",
    ],
    universe: {
      scenarios: ["rotina matinal", "banho noturno", "antes de evento", "trabalho", "encontro", "tarde livre"],
      pains: ["pele ressecada", "manchas", "envelhecimento precoce", "cabelo danificado", "falta de brilho"],
      benefits: ["pele hidratada", "luminosidade", "autoconfiança", "bem-estar", "praticidade"],
      occasions: [
        "presente", "autocuidado após período difícil",
        "recomendação de alguém próximo", "noite livre pela primeira vez em semanas",
      ],
      bridgeTopics: [
        "momento de cuidar de mim depois de muito tempo cuidando dos outros",
        "presente que chegou inesperadamente e mudou a perspectiva",
        "noite sozinha que virou ritual",
        "amiga que me indicou com tanta certeza que resolvi tentar",
      ],
      restrictions: [
        "não prometer resultados dermatológicos clínicos",
        "não afirmar cura de condições de pele",
      ],
    },
  },

  eletrodomesticos: {
    label: "eletrodomésticos",
    keywords: [
      "air fryer", "fritadeira", "cafeteira", "liquidificador",
      "batedeira", "panela elétrica", "panela", "espremedor", "torradeira",
      "sanduicheira", "multiprocessador", "lavadora de louça", "arroz elétrica",
    ],
    universe: {
      scenarios: ["cozinha", "café da manhã", "jantar em família", "almoço de domingo", "receber amigos"],
      pains: ["falta de tempo para cozinhar", "comida pouco saudável", "desperdício", "cozinha complicada"],
      benefits: ["praticidade", "alimentação mais saudável", "economia de tempo", "cozinhar sem estresse"],
      occasions: [
        "mudança de hábitos alimentares", "presente de casamento",
        "nova casa", "querer preparar algo especial", "começar uma dieta",
      ],
      bridgeTopics: [
        "querer ter mais presença nas refeições em família",
        "susto de saúde que motivou mudança alimentar",
        "decidir cozinhar mais em vez de pedir",
        "ver alguém próximo adoecer e repensar a própria alimentação",
      ],
      restrictions: [
        "não prometer emagrecimento",
        "não fazer alegações de saúde específicas",
      ],
    },
  },

  eletronicos: {
    label: "eletrônicos e acessórios",
    keywords: [
      "fone", "headphone", "smartwatch", "relógio inteligente",
      "carregador", "cabo", "powerbank", "caixa de som", "speaker",
      "tablet", "kindle", "mouse", "teclado",
    ],
    universe: {
      scenarios: ["home office", "academia", "transporte público", "viagem", "estudo", "trabalho remoto"],
      pains: ["distração", "bateria acabando", "barulho externo", "falta de foco", "desorganização"],
      benefits: ["foco", "praticidade", "mobilidade", "qualidade de som", "produtividade"],
      occasions: [
        "início de home office", "viagem a trabalho",
        "presente", "mudança de rotina", "começo de semestre",
      ],
      bridgeTopics: [
        "precisar de silêncio depois de semanas caóticas",
        "nova rotina de trabalho que exigiu mais foco",
        "viagem que mostrou que precisava ser mais organizada",
        "cansaço de interrupcões que motivou mudança",
      ],
      restrictions: ["não prometer aumento de produtividade específico"],
    },
  },

  suplementos: {
    label: "suplementos e saúde",
    keywords: [
      "whey", "proteína", "creatina", "pré-treino", "colágeno",
      "vitamina", "ômega", "probiótico", "suplemento", "termogênico",
    ],
    universe: {
      scenarios: ["academia", "pós-treino", "rotina matinal", "nutricionista", "consultório médico"],
      pains: ["cansaço", "recuperação lenta", "falta de energia", "resultado estagnado", "dificuldade de ganhar massa"],
      benefits: ["mais energia", "recuperação mais rápida", "foco", "resultado no treino"],
      occasions: [
        "meta de performance", "recomendação nutricional",
        "retomada de treinos", "mudança de fase na vida",
      ],
      bridgeTopics: [
        "retomar treinos depois de meses parada",
        "recomendação de personal ou nutricionista",
        "susto de saúde que motivou cuidar mais do corpo",
        "ver resultado de alguém próximo e querer o mesmo",
      ],
      restrictions: [
        "não prometer resultados específicos sem exercício",
        "não afirmar cura de doenças",
        "não fazer alegações médicas",
      ],
    },
  },

  vestuario: {
    label: "roupas e vestuário",
    keywords: ["camiseta", "vestido", "blusa", "calça", "shorts", "legging", "jaqueta", "casaco", "moletom", "top", "conjunto", "roupa"],
    universe: {
      scenarios: ["trabalho", "academia", "saída com amigos", "viagem", "evento", "dia em casa"],
      pains: ["falta de opções que combinam", "desconforto", "calor ou frio na hora errada"],
      benefits: ["estilo", "conforto", "versatilidade", "autoconfiança"],
      occasions: ["evento especial", "promoção no trabalho", "viagem", "presente", "nova fase pessoal"],
      bridgeTopics: [
        "decidir se cuidar mais depois de período difícil",
        "novo emprego que exigiu outra postura",
        "viagem inesperada que trouxe descoberta",
        "evento de última hora que precisava estar bem",
      ],
      restrictions: [],
    },
  },

  casa_decoracao: {
    label: "casa e decoração",
    keywords: ["vela", "difusor", "quadro", "tapete", "almofada", "organizador", "luminária", "colcha", "jogo de cama", "decoração"],
    universe: {
      scenarios: ["sala", "quarto", "home office", "receber visitas", "momento de descanso em casa"],
      pains: ["ambiente sem aconchego", "desorganização em casa", "estresse ao chegar em casa"],
      benefits: ["aconchego", "organização", "bem-estar no lar", "ambiente que inspira"],
      occasions: [
        "mudança de casa", "reforma", "presente de casamento",
        "querer se sentir melhor em casa depois de período difícil",
      ],
      bridgeTopics: [
        "querer que a casa fosse um refúgio de verdade",
        "visita inesperada que mostrou o que faltava",
        "mudança de cidade que trouxe necessidade de um lar novo",
        "decisão de transformar o ambiente depois de uma fase",
      ],
      restrictions: [],
    },
  },

  infantil: {
    label: "produtos infantis",
    keywords: ["brinquedo", "fralda", "mamadeira", "chupeta", "berço", "carrinho de bebê", "roupinha", "educativo", "bebê"],
    universe: {
      scenarios: ["quarto do bebê", "passeio com o filho", "visita ao pediatra", "brincadeira em casa"],
      pains: ["preocupação com segurança do bebê", "noites sem dormir", "dúvidas sobre criação"],
      benefits: ["segurança", "desenvolvimento saudável", "praticidade para os pais"],
      occasions: [
        "chá de bebê", "primeiro filho", "presente para sobrinho",
        "visita para ver bebê recém-nascido",
      ],
      bridgeTopics: [
        "ter se tornado mãe ou pai recentemente",
        "sobrinho que chegou e mudou tudo",
        "ver uma amiga descobrir a maternidade e querer ajudar",
      ],
      restrictions: ["não fazer alegações de saúde ou desenvolvimento sem evidência"],
    },
  },

  alimentos_bebidas: {
    label: "alimentos e bebidas",
    keywords: ["café", "chá", "chocolate", "azeite", "tempero", "vitamina", "suco", "energético", "achocolatado", "cacau"],
    universe: {
      scenarios: ["café da manhã", "pausa no trabalho", "jantar especial", "tarde em casa", "reunião com amigos"],
      pains: ["falta de energia", "rotina sem prazer", "alimentação monótona"],
      benefits: ["sabor", "energia", "prazer", "ritual de cuidado", "momento pessoal"],
      occasions: ["presente gourmet", "descoberta casual", "rotina de bem-estar", "nova fase alimentar"],
      bridgeTopics: [
        "pausa necessária no meio de uma semana pesada",
        "café da tarde que virou um ritual de paz",
        "presente de alguém que lembrou de mim",
        "descoberta em viagem que trouxe para a rotina",
      ],
      restrictions: ["não prometer resultados de saúde"],
    },
  },

  livros_educacao: {
    label: "livros e educação",
    keywords: ["livro", "curso", "planner", "caderno", "agenda", "treinamento", "mentoria", "ebook"],
    universe: {
      scenarios: ["estudo em casa", "leitura antes de dormir", "café com amiga", "viagem de avião"],
      pains: ["sensação de estagnação", "procrastinação", "falta de clareza sobre o que fazer"],
      benefits: ["conhecimento", "organização", "inspiração", "clareza", "nova perspectiva"],
      occasions: ["início de ano", "nova fase profissional", "presente", "decisão de mudar"],
      bridgeTopics: [
        "conversa que deixou a sensação de que precisava crescer",
        "sentir que estava parada enquanto todos avançavam",
        "presente de alguém que apostava em mim",
        "período de crise que virou ponto de virada",
      ],
      restrictions: [],
    },
  },

  higiene: {
    label: "higiene e bem-estar",
    keywords: ["sabonete", "desodorante", "escova de dente", "pasta dental", "absorvente", "lenço", "loção"],
    universe: {
      scenarios: ["banho", "rotina de higiene", "academia", "trabalho", "viagem"],
      pains: ["sensibilidade", "praticidade no dia a dia", "busca por alternativa natural"],
      benefits: ["frescor", "praticidade", "conforto", "segurança"],
      occasions: [
        "substituição de produto habitual", "recomendação de especialista",
        "viagem que trouxe descoberta", "busca por alternativa mais natural",
      ],
      bridgeTopics: [
        "mudança de hábitos depois de recomendação médica",
        "cansaço com produtos que não funcionavam",
        "viagem que apresentou algo novo",
      ],
      restrictions: ["não fazer alegações dermatológicas sem respaldo"],
    },
  },
};

const GENERIC_UNIVERSE: Omit<ProductUniverse, "detectedCategory" | "categoryLabel" | "confidence"> = {
  scenarios: ["casa", "rotina", "dia a dia", "trabalho"],
  pains: ["inconveniência", "falta de praticidade", "necessidade não atendida"],
  benefits: ["praticidade", "qualidade", "custo-benefício", "satisfação"],
  occasions: ["presente", "uso pessoal", "necessidade", "descoberta casual"],
  bridgeTopics: [
    "descoberta durante uma pausa na rotina",
    "recomendação de alguém de confiança",
    "período de mudança que trouxe abertura para coisas novas",
  ],
  restrictions: [],
};

/**
 * Build a ProductUniverse from a stored DB analysis (parsed JSON arrays).
 * Preferred over keyword detection when a product has been analyzed.
 */
export function buildUniverseFromStoredAnalysis(stored: {
  detectedCategory: string;
  categoryLabel: string;
  confidence: string;
  scenarios: string[];
  pains: string[];
  benefits: string[];
  usageOccasions: string[];
  bridgeTopics: string[];
  restrictions: string[];
}): ProductUniverse {
  return {
    detectedCategory: stored.detectedCategory || "generic",
    categoryLabel:    stored.categoryLabel || "produto",
    confidence:       (stored.confidence as "high" | "medium" | "low") || "low",
    scenarios:        stored.scenarios,
    pains:            stored.pains,
    benefits:         stored.benefits,
    occasions:        stored.usageOccasions,
    bridgeTopics:     stored.bridgeTopics,
    restrictions:     stored.restrictions,
  };
}

export function analyzeProduct(productName: string, productUrl: string): ProductUniverse {
  const text = (productName + " " + productUrl).toLowerCase();

  let bestKey = "generic";
  let bestScore = 0;
  let bestDef: CategoryDefinition | null = null;

  for (const [key, def] of Object.entries(CATEGORIES)) {
    const score = def.keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
      bestDef = def;
    }
  }

  if (!bestDef || bestScore === 0) {
    return {
      detectedCategory: "generic",
      categoryLabel: "produto",
      confidence: "low",
      ...GENERIC_UNIVERSE,
    };
  }

  return {
    detectedCategory: bestKey,
    categoryLabel: bestDef.label,
    confidence: bestScore >= 2 ? "high" : "medium",
    ...bestDef.universe,
  };
}
