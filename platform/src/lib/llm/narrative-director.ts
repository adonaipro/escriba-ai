/**
 * Narrative Director
 *
 * Plans the story. Never writes prose.
 *
 * Receives ProductUniverse + GeneratedScene + NarratorPersonality
 * and produces a NarrativeBriefing: everything the LLM Writer needs
 * to write a complete, dense, human-sounding Threads thread.
 *
 * Architecture:
 *   Product Intelligence → ProductUniverse
 *   Scene Engine         → GeneratedScene
 *   Narrator Engine      → NarratorPersonality
 *   Narrative Director   → NarrativeBriefing  ← this file
 *   LLM Writer           → PostContent[]
 */

import type { ProductUniverse } from "./product-intelligence-engine";
import type { GeneratedScene, NarratorPersonality } from "./scene-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NarratorProfile {
  name: string;
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
  conflictStyle: "avoids" | "confronts" | "deflects" | "internalizes";
  shareStyle: "tells_friends" | "keeps_private" | "reflects_alone";
  expressionStyle: "emotional" | "dry" | "reflective" | "direct";
}

export interface SceneBriefing {
  character: string;
  action: string;
  conflictObject: string;
  moment: string;
  location: string;
  dialogue: string;
  conflictFamily: string;
  moralSeed: string;
  reaction: string;
  consequence: string;
}

export interface NarrativeBeat {
  postIndex: number;
  event: string;
  newInformation: string;
  dialogueOpportunity?: string;
  sensoryDetail?: string;
  unresolvedQuestion?: string;
  readerHook?: string;
}

export interface ProductMoment {
  postIndex: number;
  trigger: string;
  relationToStory: string;
}

export interface NarrativeBriefing {
  productUniverse: ProductUniverse;
  narratorProfile: NarratorProfile;
  scene: SceneBriefing;

  gossipHook: string;   // Primeira frase obrigatória — começa com pessoa + o que fez
  premise: string;
  centralTruth: string;
  narrativeTension: string;
  readerHook: string;

  openingStrategy: string;
  beats: NarrativeBeat[];

  productStrategy: "clickbait" | "contextual" | "hybrid";
  productMoment: ProductMoment;

  openQuestions: string[];
  endingMode: string;
  postCount: number;
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const CENTRAL_TRUTHS: Record<string, string[]> = {
  "invasão_de_espaço": [
    "Quando alguém age dentro da sua casa como se fosse a dela, o conflito nunca é sobre o objeto — é sobre quem acha que tem autoridade sobre o que acontece ali dentro.",
    "Tem gente que entra no espaço dos outros como se cuidar e controlar fossem a mesma coisa.",
    "Uma casa não é um espaço compartilhado de verdade enquanto alguém que não mora nela ainda acha que pode decidir como ela funciona.",
    "O problema não foi o que ela fez. Foi o quanto ela achou normal fazer sem perguntar.",
  ],
  "decided_for_me": [
    "O problema não foi a decisão em si. Foi a certeza com que ela achou que podia tomar essa decisão sem perguntar.",
    "Quando alguém decide o que vai acontecer com a sua vida sem te consultar, não importa se a intenção era boa.",
    "Às vezes a pessoa não percebe que o que ela chama de ajuda é só mais uma decisão que ela tomou por você.",
    "A parte que mais pesa não é o que foi feito. É que ninguém achou necessário perguntar antes.",
  ],
  "desgaste_silencioso": [
    "Quem espera uma vez faz por carinho. Quem espera todos os dias começa a esquecer que também merece ser esperado.",
    "O desgaste de um relacionamento raramente acontece por causa de um grande erro. Ele aparece quando uma pessoa vai ajustando a própria rotina tantas vezes que deixa de perceber que sempre é ela quem cede.",
    "Às vezes a pessoa que ainda está lá deixou de aparecer muito antes de ir embora.",
    "A saudade mais difícil de nomear é a de alguém que ainda está do seu lado, mas que parou de estar presente.",
  ],
  "combinados_quebrados": [
    "O valor era pequeno. Mas o peso de ter sido ignorado foi outro.",
    "Às vezes o que machuca não é o que aconteceu. É perceber que o que era importante pra você não era importante pra outra pessoa.",
    "Um combinado quebrado sozinho é um erro. Repetido, começa a dizer uma coisa maior.",
    "Você não estava com raiva do que ela fez. Estava com raiva de quanto ela achou que podia fazer.",
  ],
  "surpresa_de_gratidão": [
    "A coisa mais bonita que alguém pode fazer por você é enxergar o que você precisava sem você precisar pedir.",
    "Tem um momento em que você percebe que estava tanto tempo cuidando de tudo que esqueceu de cuidar de uma coisa: você.",
    "Às vezes um pequeno gesto de alguém te coloca num caminho que você não teria encontrado sozinha.",
    "A generosidade que fica é a que não precisou de nenhum motivo para aparecer.",
  ],
};

const NARRATIVE_TENSIONS: Record<string, string[]> = {
  "invasão_de_espaço": [
    "A tensão entre confrontar alguém que você respeita e silenciar mais uma vez.",
    "A dificuldade de dizer 'não' para alguém que acha que está ajudando.",
    "O momento em que perceber que alguém ultrapassou um limite é mais difícil do que parece.",
  ],
  "decided_for_me": [
    "A tensão entre aceitar uma decisão tomada por você e reivindicar o que é seu decidir.",
    "Como reagir quando alguém que você ama acha que sabe o que é melhor pra você.",
    "A dificuldade de confrontar boa intenção que se torna controle.",
  ],
  "desgaste_silencioso": [
    "A tensão entre o que foi dito e o que pesava antes mesmo de qualquer conversa.",
    "Como reconhecer o ponto em que paciência virou perda de si mesma.",
    "O momento em que algo pequeno revela algo que nunca foi pequeno.",
  ],
  "combinados_quebrados": [
    "A diferença entre o que aconteceu e o quanto isso revelou sobre como você é vista.",
    "A tensão entre deixar passar e dizer que aquilo importava.",
    "Como reconhecer quando um descuido pequeno carrega um peso maior.",
  ],
  "surpresa_de_gratidão": [
    "A dificuldade de receber cuidado quando você está acostumada a ser quem cuida.",
    "Como um gesto inesperado revela o quanto você estava precisando sem perceber.",
    "A tensão entre a gratidão e a incapacidade de retribuir à altura.",
  ],
};

const OPEN_QUESTIONS: Record<string, string[]> = {
  "invasão_de_espaço": [
    "Vocês falariam na hora ou esperariam a pessoa ir embora?",
    "Como vocês lidam quando alguém que você gosta não enxerga o limite?",
    "Você prefere evitar esse tipo de conversa ou ter uma vez e fechar o assunto?",
    "Vocês também ficam com isso na cabeça dias depois?",
    "Você teria feito diferente?",
  ],
  "decided_for_me": [
    "Vocês também deixam passar quando sabem que a intenção era boa?",
    "Você fala na hora ou guarda e fica remoendo?",
    "Tem diferença entre decidir pelo outro com boa intenção e tomar uma decisão que era pra ser compartilhada?",
    "Vocês acham que ela percebeu o quanto aquilo pesou?",
  ],
  "desgaste_silencioso": [
    "Vocês acham que existem relacionamentos que chegam num ponto sem volta sem nenhum dos dois perceber?",
    "Como vocês sabem quando uma coisa pequena deixou de ser pequena?",
    "Você teria falado antes ou esperado como ela esperou?",
    "Ou vocês também ficam esperando o momento certo que nunca chega?",
  ],
  "combinados_quebrados": [
    "Vocês também ficam mais incomodadas com o descaso do que com o que aconteceu em si?",
    "Vocês conseguem resolver esse tipo de coisa conversando ou fica no ar?",
    "Você teria falado ou teria deixado pra lá?",
    "Acham que ela percebeu o quanto isso pesou?",
  ],
  "surpresa_de_gratidão": [
    "Vocês lembram de alguém que fez isso por vocês sem pedir nada?",
    "Vocês costumam fazer isso por outras pessoas sem ser pedido?",
    "Como vocês agradecem quando algo assim acontece?",
    "Ou vocês também ficam sem saber o que fazer com a gratidão?",
  ],
};

const OPENING_STRATEGIES = [
  "Entra direto no acontecimento — sem preâmbulo, sem cenário. Primeira frase: pessoa + o que fez. O leitor está dentro antes de entender onde.",
  "Nomeia a pessoa antes de revelar o que aconteceu. A curiosidade vem antes da explicação.",
  "A ação da pessoa domina o post 1. O leitor vê acontecendo, não ouve sobre depois.",
  "Começa deixando claro que não foi a primeira vez. O histórico dá peso imediato ao que vem.",
  "Post 1 mostra o acontecimento e para antes de revelar a reação da narradora. Leitor precisa virar.",
  "A última coisa que a pessoa disse abre a thread. O diálogo vem antes da explicação.",
  "A narradora nomeia a pessoa e o que ela fez. Depois mostra. Nunca explica antes de mostrar.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function conflictStyleLabel(style: NarratorProfile["conflictStyle"]): string {
  switch (style) {
    case "avoids":       return "evita confronto direto, guarda as coisas pra si";
    case "confronts":    return "fala na hora, mesmo que saia errado";
    case "deflects":     return "desvia, muda de assunto, às vezes ri sem graça";
    case "internalizes": return "não fala, processa internamente, fica com o peso";
  }
}

function buildPremise(scene: SceneBriefing): string {
  const by_family: Record<string, string> = {
    "invasão_de_espaço":    `${cap(scene.character)} ${scene.action} sem avisar.`,
    "decided_for_me":       `${cap(scene.character)} ${scene.action} sem me consultar.`,
    "desgaste_silencioso":  `${cap(scene.character)} ${scene.action}.`,
    "combinados_quebrados": `${cap(scene.character)} ${scene.action}.`,
    "surpresa_de_gratidão": `${cap(scene.character)} ${scene.action} — e aquilo ficou comigo.`,
  };
  return by_family[scene.conflictFamily] ?? `${cap(scene.character)} ${scene.action}.`;
}

function buildEndingMode(profile: NarratorProfile): string {
  switch (profile.conflictStyle) {
    case "avoids":
      return "Sem resolução. A narradora não confrontou. O peso ficou. A situação permanece.";
    case "confronts":
      return "Houve confronto direto. Não resolveu tudo, mas alguma coisa foi dita. O clima ficou estranho por um tempo.";
    case "internalizes":
      return "A narradora ficou com aquilo. Processou em silêncio. Não sabe se fez certo. O peso continua.";
    case "deflects":
      return "A narradora desviou ou mudou de assunto. Não resolveu. Está entre 'deixar pra lá' e 'não conseguir esquecer'.";
  }
}

function selectPostCount(seed: number, profile: NarratorProfile): number {
  if (profile.expressionStyle === "emotional" || profile.expressionStyle === "reflective") {
    return 5;
  }
  if (profile.expressionStyle === "dry" || profile.expressionStyle === "direct") {
    return 4;
  }
  return Math.abs(seed) % 2 === 0 ? 5 : 4;
}

function selectProductPost(
  strategy: "clickbait" | "contextual" | "hybrid",
  postCount: number,
  seed: number,
): number {
  if (strategy === "clickbait") {
    return postCount; // sempre último: depois do clímax, a descoberta inesperada
  }
  if (strategy === "contextual") {
    return postCount - 1; // sempre penúltimo: o produto é parte do universo; o último fecha emocionalmente
  }
  // hybrid: penúltimo ou último, seed-based
  return Math.abs(seed + 5) % 2 === 0 ? postCount - 1 : postCount;
}

function buildProductRelationToStory(
  strategy: "clickbait" | "contextual" | "hybrid",
  scene: SceneBriefing,
  universe: ProductUniverse,
  productPost: number,
  postCount: number,
  productName: string,
): string {
  const notLast = productPost < postCount
    ? ` O post seguinte fecha a história — o produto não é o encerramento.`
    : "";
  const notAnAd = `Não é anúncio — é parte do que a narradora estava vivendo naquela semana.`;

  if (strategy === "clickbait") {
    return `${productName} aparece como descoberta casual durante o período emocional. A narradora não estava procurando — chegou por acaso. O link é para o leitor, não é solução para a narradora. ${notAnAd}`;
  }

  const topic = universe.bridgeTopics?.[0] ?? productName;

  const bridgeByFamily: Record<string, string> = {
    "invasão_de_espaço": `${productName} entra como afirmação de território. Depois de ter o espaço invadido por ${scene.character}, a narradora escolhe algo para o espaço dela. A conexão é direta: meu espaço, minhas escolhas. O produto é uma decisão que é só dela. ${notAnAd}${notLast}`,
    "decided_for_me": `${productName} entra como exercício de autonomia. Depois de ${scene.character} tomar uma decisão por ela sem consultar, a narradora toma uma decisão própria. A conexão é: desta vez fui eu que escolhi. ${notAnAd}${notLast}`,
    "desgaste_silencioso": `${productName} entra como cuidado próprio. A narradora percebeu que sempre colocou o outro na frente. Encontrou algo que é para ela. A conexão é: começar a se cuidar depois de tanto ceder. ${notAnAd}${notLast}`,
    "combinados_quebrados": `${productName} entra como redirecionamento. Depois de ver que o que era importante para ela não era importante para ${scene.character}, a narradora investe em algo que serve a ela. A conexão é: o que importa para mim, importa. ${notAnAd}${notLast}`,
    "surpresa_de_gratidão": `${productName} entra como extensão do gesto recebido. Depois de ser cuidada por ${scene.character}, a narradora encontra algo que prolonga esse cuidado. A conexão é: continuar se cuidando. A indicação veio de ${scene.character} ou apareceu naturalmente nessa semana de gratidão. ${notAnAd}${notLast}`,
  };

  return bridgeByFamily[scene.conflictFamily]
    ?? `${productName} entra de forma natural, conectado a ${topic} — exatamente o que a narradora estava vivendo. ${notAnAd}${notLast}`;
}

function buildProductMoment(
  strategy: "clickbait" | "contextual" | "hybrid",
  scene: SceneBriefing,
  universe: ProductUniverse,
  productPost: number,
  postCount: number,
  productName: string,
  seed: number,
): ProductMoment {
  const h = Math.abs(seed + scene.action.length * 7 + scene.moment.length * 3);
  const relationToStory = buildProductRelationToStory(strategy, scene, universe, productPost, postCount, productName);

  if (strategy === "clickbait") {
    const triggers = [
      `${cap(scene.character)} mandou o link de ${productName} dias depois — sem contexto, sem explicação. Só o link.`,
      `${cap(scene.character)} apareceu com ${productName}. Sem dizer nada antes.`,
      `Uma pessoa próxima que soube da história mandou ${productName} no grupo. Sem comentar. A narradora clicou.`,
      `${productName} apareceu no feed três vezes naquela semana. Na terceira, a narradora clicou.`,
      `${cap(scene.character)} mencionou ${productName} como se não fosse nada. Mas a narradora ficou pensando.`,
    ];
    return { postIndex: productPost, trigger: triggers[h % triggers.length], relationToStory };
  }

  if (strategy === "contextual") {
    const topic = universe.bridgeTopics?.[0] ?? "isso";
    const triggersByFamily: Record<string, string[]> = {
      "invasão_de_espaço": [
        `Depois de tudo isso, estava reorganizando as coisas do próprio apartamento quando encontrou ${productName}. Fez sentido de onde veio.`,
        `Uma pessoa que ouviu a história mandou ${productName} — sabia que a narradora estava pensando no espaço dela.`,
        `Estava procurando algo para o espaço dela quando apareceu ${productName}. O timing era exato.`,
        `${cap(scene.character)} mandou ${productName} naquela semana — como se não estivesse relacionado. Mas estava.`,
      ],
      "decided_for_me": [
        `Depois disso, tomou uma decisão sozinha — e foi quando encontrou ${productName}.`,
        `Uma amiga que ouviu mandou ${productName} sem muita explicação. Mas fez sentido.`,
        `Estava navegando por conta própria, procurando ${topic}, quando apareceu ${productName}. Essa escolha foi dela.`,
        `${cap(scene.character)} mandou ${productName} naquela semana. Não comentou nada. Mas chegou.`,
      ],
      "desgaste_silencioso": [
        `Estava tentando criar uma rotina para si mesma quando encontrou ${productName}. Não procurava exatamente isso.`,
        `Uma amiga que sabia o que estava acontecendo mandou ${productName}. Sem muita explicação.`,
        `Apareceu no feed naquela semana. ${productName}. A narradora ficou olhando um tempo.`,
        `Encontrou ${productName} pesquisando sobre ${topic}. Ficou mais tempo do que deveria.`,
      ],
      "combinados_quebrados": [
        `Dias depois ainda estava com aquilo na cabeça quando encontrou ${productName}. Não tinha a ver com o que aconteceu — mas tinha.`,
        `Uma amiga mandou ${productName} no grupo. A narradora clicou sem saber por que sentiu que era para ela.`,
        `Encontrou ${productName} navegando sem rumo. Uma coisa para ela, escolhida por ela.`,
        `${cap(scene.character)} mandou ${productName} sem comentar o que havia acontecido. Mas a narradora conectou.`,
      ],
      "surpresa_de_gratidão": [
        `${cap(scene.character)} mandou ${productName} junto com uma mensagem curta. "Pensei em você."`,
        `Estava pesquisando sobre ${topic} depois do que aconteceu quando chegou ${productName}.`,
        `Um vídeo que apareceu no feed naquela semana mencionou ${productName}. Lembrando do gesto de ${scene.character}, clicou.`,
        `${cap(scene.character)} mandou ${productName} como extensão do que havia feito. A narradora entendeu.`,
      ],
    };
    const familyTriggers = triggersByFamily[scene.conflictFamily] ?? [
      `Uma pessoa próxima mandou ${productName} naquela semana. Fez sentido de onde veio.`,
      `Apareceu no feed depois de tudo isso. Era ${productName}. Ficou.`,
      `Estava pesquisando sobre ${topic} quando chegou ${productName}.`,
    ];
    return { postIndex: productPost, trigger: familyTriggers[h % familyTriggers.length], relationToStory };
  }

  // hybrid
  const triggers = [
    `${cap(scene.character)} mandou ${productName} dias depois — sem comentar o que havia acontecido. A narradora conectou.`,
    `Dias depois ainda estava com aquilo na cabeça. Encontrou ${productName} navegando. Ficou.`,
    `Uma amiga que ouviu a história mandou ${productName} no grupo, sem explicar por quê. A narradora entendeu.`,
    `Encontrou ${productName} enquanto procurava outra coisa. Mas naquele contexto, fez sentido parar.`,
  ];
  return { postIndex: productPost, trigger: triggers[h % triggers.length], relationToStory };
}

function buildGlobalReaderHook(scene: SceneBriefing, profile: NarratorProfile, seed: number): string {
  const byStyle: Record<NarratorProfile["conflictStyle"], string[]> = {
    avoids: [
      `A narradora ainda não revelou se algum dia falou o que estava sentindo.`,
      `${cap(scene.character)} ainda não sabe que o que fez ficou assim na cabeça dela.`,
      `Ainda falta saber se ela deixou passar de vez ou se tem mais coisa por vir.`,
    ],
    confronts: [
      `${cap(scene.character)} ainda não disse o que respondeu quando confrontada.`,
      `A narradora ainda não revelou o que aconteceu depois que ela falou o que tinha que falar.`,
      `O que ficou no ar depois do confronto ainda não foi mostrado.`,
    ],
    internalizes: [
      `A narradora ainda não revelou o que pensou enquanto ficava calada.`,
      `Ainda falta o peso do que ela nunca disse em voz alta.`,
      `${cap(scene.character)} ainda não soube o quanto aquilo ficou.`,
    ],
    deflects: [
      `Por que a narradora desviou ainda não foi explicado.`,
      `Ainda falta descobrir o que estava por trás do desvio.`,
      `A narradora ainda não contou o que sentiu quando mudou de assunto.`,
    ],
  };

  const byFamily: Record<string, string[]> = {
    "invasão_de_espaço": [
      `Ainda falta saber o que aconteceu com o ${scene.conflictObject} depois.`,
      `A narradora ainda não revelou se o tema foi discutido depois.`,
      `${cap(scene.character)} ainda não soube que isso ficou.`,
    ],
    "decided_for_me": [
      `A narradora ainda não contou se deixou passar ou se houve uma conversa de verdade.`,
      `A resposta de ${scene.character} ainda não apareceu.`,
      `Ainda não sabemos se a decisão foi aceita ou contestada.`,
    ],
    "desgaste_silencioso": [
      `Ainda falta saber se ela disse alguma coisa ou deixou ficar assim.`,
      `O que ficou não dito ainda não foi revelado.`,
      `A narradora ainda não mostrou como ficou o relacionamento depois desse dia.`,
    ],
    "combinados_quebrados": [
      `Ainda não sabemos se o combinado foi discutido ou ficou no ar.`,
      `A narradora ainda não revelou o que fez quando viu o que aconteceu com o ${scene.conflictObject}.`,
      `${cap(scene.character)} ainda não soube o quanto aquilo incomodou.`,
    ],
    "surpresa_de_gratidão": [
      `A narradora ainda não revelou como retribuiu.`,
      `Ainda falta saber o que mudou depois desse gesto.`,
      `A narradora ainda não contou se isso chegou a ser agradecido.`,
    ],
  };

  const styleOptions = byStyle[profile.conflictStyle] ?? [];
  const familyOptions = byFamily[scene.conflictFamily] ?? [];
  const all = [...styleOptions, ...familyOptions];
  return pick(all, seed + 20);
}

function buildGossipHook(scene: SceneBriefing, seed: number): string {
  const hooks: Record<string, string[]> = {
    "invasão_de_espaço": [
      `${cap(scene.character)} fez uma coisa ontem que eu ainda não consigo tirar da cabeça.`,
      `${cap(scene.character)} entrou aqui e agiu como se ${scene.conflictObject} fosse dela.`,
      `${cap(scene.character)} fez uma coisa sem avisar. Eu ainda estou tentando entender.`,
      `${cap(scene.character)} simplesmente entrou e fez o que queria. Como se eu não existisse.`,
    ],
    "decided_for_me": [
      `${cap(scene.character)} decidiu por mim. Sem perguntar.`,
      `${cap(scene.character)} fez uma coisa sem me consultar que eu não consigo parar de pensar.`,
      `${cap(scene.character)} simplesmente mudou ${scene.conflictObject} sem me avisar.`,
      `${cap(scene.character)} tomou uma decisão que não era dela pra tomar.`,
    ],
    "desgaste_silencioso": [
      `${cap(scene.character)} disse uma coisa ontem que não sai da minha cabeça.`,
      `${cap(scene.character)} fez algo pequeno que de repente revelou algo grande.`,
      `${cap(scene.character)} não fez nada de errado, tecnicamente. Mas alguma coisa mudou.`,
      `Eu e ${scene.character} tínhamos uma dinâmica. Até ontem.`,
    ],
    "combinados_quebrados": [
      `${cap(scene.character)} não apareceu como tinha combinado. Não avisou. Só não veio.`,
      `A gente tinha um acordo. ${cap(scene.character)} agiu como se não existisse.`,
      `${cap(scene.character)} prometeu uma coisa e não cumpriu. Parece pequeno. Não é.`,
      `${cap(scene.character)} faltou com um combinado ontem e eu ainda não sei o que fazer com isso.`,
    ],
    "surpresa_de_gratidão": [
      `${cap(scene.character)} fez uma coisa ontem que eu não esperava de jeito nenhum.`,
      `${cap(scene.character)} apareceu com algo que me deixou sem reação.`,
      `${cap(scene.character)} fez um gesto que eu não vou esquecer tão cedo.`,
      `${cap(scene.character)} me surpreendeu de uma forma que eu ainda estou tentando processar.`,
    ],
  };
  const family = hooks[scene.conflictFamily] ?? hooks["combinados_quebrados"] ?? [];
  return pick(family, seed + 30);
}

function buildBeats(
  scene: SceneBriefing,
  profile: NarratorProfile,
  productMoment: ProductMoment,
  postCount: number,
  seed: number,
  gossipHook: string,
): NarrativeBeat[] {
  const beats: NarrativeBeat[] = [];
  const productPost = productMoment.postIndex;
  const cStyle = conflictStyleLabel(profile.conflictStyle);

  const shareInfo =
    profile.shareStyle === "tells_friends"
      ? "A narradora conta para uma amiga (ou amigas). Reações divididas — uma minimiza, a outra valida. A narradora fica no meio."
      : profile.shareStyle === "keeps_private"
        ? "A narradora guarda para si. O peso fica interno. Não conta para ninguém."
        : "A narradora processa em silêncio. Não conta para ninguém. Fica pensando, mas não fala.";

  const dialogueHint = `${cap(scene.character)} diz algo do tipo: "${scene.dialogue.replace("— ", "")}". A narradora ${cStyle}. ${cap(scene.character)} reage. Continue o diálogo por múltiplos turnos até o clima fechar (ou não fechar).`;

  // Reader hooks por slot (gerados a partir dos dados da cena)
  const hookIncident = `A narradora ainda não disse como reagiu quando ${scene.character} ${scene.action}.`;
  const hookDialogue =
    profile.conflictStyle === "avoids"
      ? `${cap(scene.character)} ainda não sabe o que estava passando pela cabeça da narradora.`
      : profile.conflictStyle === "confronts"
        ? `${cap(scene.character)} ainda não respondeu à narradora.`
        : `A última troca entre as duas ainda não foi mostrada.`;
  const hookAftermath = `Ainda falta uma coisa que aconteceu naquela semana.`;
  const hookContext = `${cap(scene.character)} ainda não apareceu na cena.`;
  const hookProductToClosure = `A narradora ainda não revelou o que mudou depois disso.`;

  if (postCount === 4) {
    if (productPost === 4) {
      // clickbait ou hybrid-last: acontecimento → diálogo → aftermath → produto
      beats.push({
        postIndex: 1,
        event: `ABERTURA — primeira frase obrigatória: "${gossipHook}"\nDepois mostre ${scene.character} ${scene.action}. Ações concretas e diretas. Sem descrição de ambiente, sem rotina, sem cenário.`,
        newInformation: `O leitor sabe: quem (${scene.character}) e que algo aconteceu. Quer saber o quê.`,
        readerHook: hookIncident,
      });
      beats.push({
        postIndex: 2,
        event: `Diálogo com ${scene.character}. A narradora ${cStyle}.`,
        newInformation: `O que foi dito. Como ${scene.character} justificou. Como a narradora reagiu (ou não reagiu).`,
        dialogueOpportunity: dialogueHint,
        readerHook: hookDialogue,
      });
      beats.push({
        postIndex: 3,
        event: `Aftermath: ${scene.consequence}. O que ficou depois.`,
        newInformation: shareInfo,
        readerHook: hookAftermath,
      });
      beats.push({
        postIndex: 4,
        event: productMoment.trigger,
        newInformation: productMoment.relationToStory,
      });
    } else {
      // contextual ou hybrid-penultimate: acontecimento → diálogo → produto → fechamento
      beats.push({
        postIndex: 1,
        event: `ABERTURA — primeira frase obrigatória: "${gossipHook}"\nDepois mostre ${scene.character} ${scene.action}. Ações. Sem cenário.`,
        newInformation: `O leitor sabe: quem (${scene.character}) e que algo aconteceu.`,
        readerHook: hookIncident,
      });
      beats.push({
        postIndex: 2,
        event: `Diálogo com ${scene.character}. A narradora ${cStyle}.`,
        newInformation: `O que foi dito. Como ${scene.character} justificou. Como a narradora reagiu.`,
        dialogueOpportunity: dialogueHint,
        readerHook: `${cap(scene.character)} ainda não sabe o que a narradora encontrou depois.`,
      });
      beats.push({
        postIndex: 3,
        event: productMoment.trigger,
        newInformation: productMoment.relationToStory,
        readerHook: hookProductToClosure,
      });
      beats.push({
        postIndex: 4,
        event: `Fechamento: ${scene.consequence}`,
        newInformation: `${shareInfo} O produto já entrou. Este post fecha — o que ficou, o que mudou.`,
      });
    }
  } else {
    // 5 posts
    if (productPost === 5) {
      // clickbait ou hybrid-last: acontecimento → mais detalhes → diálogo → aftermath → produto
      beats.push({
        postIndex: 1,
        event: `ABERTURA — primeira frase obrigatória: "${gossipHook}"\nDepois mostre ${scene.character} ${scene.action}. Ações diretas. Sem descrição de ambiente. Sem cenário. Sem rotina.`,
        newInformation: `O leitor sabe: quem (${scene.character}) e que algo aconteceu. Os detalhes ainda não foram revelados.`,
        readerHook: hookIncident,
      });
      beats.push({
        postIndex: 2,
        event: `Mais detalhes do acontecimento. O que exatamente ${scene.character} fez com ${scene.conflictObject}. Se houver contexto necessário (${scene.location}, ${scene.moment}), entra aqui — dentro da ação, não como descrição separada.`,
        newInformation: `O leitor entende os detalhes. A situação fica mais clara. Como a narradora descobriu ou viveu.`,
        readerHook: hookDialogue,
      });
      beats.push({
        postIndex: 3,
        event: `O confronto ou o silêncio.`,
        newInformation: `O que foi dito (ou não dito). A resposta de ${scene.character}. O clima que ficou.`,
        dialogueOpportunity: dialogueHint,
        readerHook: hookAftermath,
      });
      beats.push({
        postIndex: 4,
        event: `Aftermath: ${scene.consequence}. O que ficou depois.`,
        newInformation: shareInfo,
        readerHook: `Ainda falta uma coisa que aconteceu naquela semana.`,
      });
      beats.push({
        postIndex: 5,
        event: productMoment.trigger,
        newInformation: productMoment.relationToStory,
      });
    } else {
      // contextual ou hybrid-penultimate: acontecimento → mais detalhes → diálogo → produto → fechamento
      beats.push({
        postIndex: 1,
        event: `ABERTURA — primeira frase obrigatória: "${gossipHook}"\nDepois mostre ${scene.character} ${scene.action}. Ações. Sem cenário, sem atmosfera, sem rotina antes.`,
        newInformation: `O leitor sabe: quem (${scene.character}) e que algo aconteceu.`,
        readerHook: hookIncident,
      });
      beats.push({
        postIndex: 2,
        event: `Mais detalhes do acontecimento. O que exatamente ${scene.character} fez com ${scene.conflictObject}. Contexto mínimo se necessário — incorporado à ação.`,
        newInformation: `Os detalhes do acontecimento. Como a narradora viveu isso.`,
        readerHook: hookDialogue,
      });
      beats.push({
        postIndex: 3,
        event: `O confronto ou o silêncio.`,
        newInformation: `O que foi dito (ou não dito). A resposta de ${scene.character}. O clima que ficou.`,
        dialogueOpportunity: dialogueHint,
        readerHook: `${cap(scene.character)} ainda não soube o que a narradora encontrou naquela semana.`,
      });
      beats.push({
        postIndex: 4,
        event: productMoment.trigger,
        newInformation: productMoment.relationToStory,
        readerHook: hookProductToClosure,
      });
      beats.push({
        postIndex: 5,
        event: `Fechamento: ${scene.consequence}`,
        newInformation: `${shareInfo} O produto já entrou no post anterior. Este post fecha — o que ficou, o que mudou.`,
      });
    }
  }

  return beats;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildNarrativeBriefing(
  universe: ProductUniverse,
  scene: GeneratedScene,
  personality: NarratorPersonality,
  strategy: "clickbait" | "contextual" | "hybrid",
  narratorData: {
    name: string;
    sex: string;
    ageRange: string;
    maritalStatus: string;
    hasChildren: boolean;
    livesAlone: boolean;
  },
  seed: number,
  productName: string,
): NarrativeBriefing {
  const profile: NarratorProfile = {
    ...narratorData,
    conflictStyle: personality.conflictStyle,
    shareStyle: personality.shareStyle,
    expressionStyle: personality.expressionStyle,
  };

  const sceneBriefing: SceneBriefing = {
    character:      scene.character,
    action:         scene.action,
    conflictObject: scene.conflictObject,
    moment:         scene.moment,
    location:       scene.location,
    dialogue:       scene.dialogue,
    conflictFamily: scene.conflictFamily,
    moralSeed:      scene.moralSeed,
    reaction:       scene.reaction,
    consequence:    scene.consequence,
  };

  const truths   = CENTRAL_TRUTHS[scene.conflictFamily]    ?? CENTRAL_TRUTHS["invasão_de_espaço"];
  const tensions = NARRATIVE_TENSIONS[scene.conflictFamily] ?? NARRATIVE_TENSIONS["invasão_de_espaço"];
  const questions = OPEN_QUESTIONS[scene.conflictFamily]    ?? OPEN_QUESTIONS["invasão_de_espaço"];

  const centralTruth     = pick(truths,   seed + 10);
  const narrativeTension = pick(tensions, seed + 11);
  const openingStrategy  = OPENING_STRATEGIES[Math.abs(seed + 7) % OPENING_STRATEGIES.length];
  const postCount        = selectPostCount(seed, profile);
  const productPost      = selectProductPost(strategy, postCount, seed);

  const gossipHook    = buildGossipHook(sceneBriefing, seed);
  const productMoment = buildProductMoment(strategy, sceneBriefing, universe, productPost, postCount, productName, seed);
  const beats         = buildBeats(sceneBriefing, profile, productMoment, postCount, seed, gossipHook);
  const readerHook    = buildGlobalReaderHook(sceneBriefing, profile, seed);

  // Pick 2 distinct open questions
  const q1 = pick(questions, seed + 12);
  const q2 = pick(questions, seed + 13);
  const openQuestions = q1 === q2 ? [q1] : [q1, q2];

  return {
    productUniverse: universe,
    narratorProfile: profile,
    scene: sceneBriefing,
    gossipHook,
    premise:          buildPremise(sceneBriefing),
    centralTruth,
    narrativeTension,
    readerHook,
    openingStrategy,
    beats,
    productStrategy: strategy,
    productMoment,
    openQuestions,
    endingMode: buildEndingMode(profile),
    postCount,
  };
}
