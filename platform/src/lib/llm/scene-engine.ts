/**
 * Scene Engine
 *
 * Generates a specific, cinematographic scene BEFORE the narrative is written.
 * Every scene has a concrete action, real dialogue, and a character reaction.
 *
 * The narrative writes itself from the scene. Not the other way around.
 *
 * "Minha sogra desligou o ar-condicionado" — never "fez algo que nunca tinha feito".
 */

import type { ProductUniverse } from "./product-intelligence-engine";

// Local type definitions (compatible with narrative-engine exports, avoids circular import)
type NarratorFilter = {
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
};
type ProductStrategy = "clickbait" | "contextual" | "hybrid";

// ─── Personality ─────────────────────────────────────────────────────────────

export interface NarratorPersonality {
  conflictStyle: "avoids" | "confronts" | "deflects" | "internalizes";
  shareStyle: "tells_friends" | "keeps_private" | "reflects_alone";
  expressionStyle: "emotional" | "dry" | "reflective" | "direct";
}

export function buildNarratorPersonality(
  narrator?: NarratorFilter,
  hypotheses?: Array<{ dimension: string; value: string }>
): NarratorPersonality {
  const personality: NarratorPersonality = {
    conflictStyle: "internalizes",
    shareStyle: "tells_friends",
    expressionStyle: "reflective",
  };

  if (!narrator) return personality;

  if (narrator.ageRange === "18-25") {
    personality.conflictStyle = "deflects";
    personality.expressionStyle = "emotional";
  } else if (narrator.ageRange === "36-45" || narrator.ageRange === "46+") {
    personality.conflictStyle = "avoids";
    personality.expressionStyle = "dry";
  }

  if (narrator.livesAlone) {
    personality.shareStyle = "reflects_alone";
  }

  if (hypotheses) {
    const tone = hypotheses.find((h) => h.dimension === "tone")?.value;
    const rhythm = hypotheses.find((h) => h.dimension === "rhythm")?.value;
    if (tone === "direto") personality.conflictStyle = "confronts";
    if (tone === "reflexivo") personality.conflictStyle = "internalizes";
    if (tone === "leve") personality.conflictStyle = "deflects";
    if (rhythm === "rápido") personality.expressionStyle = "direct";
    if (rhythm === "lento") personality.expressionStyle = "reflective";
  }

  return personality;
}

// ─── Scene output ─────────────────────────────────────────────────────────────

export interface GeneratedScene {
  location: string;
  moment: string;
  character: string;
  action: string;          // "desligou o ar-condicionado"
  conflictObject: string;  // "o ar-condicionado"
  dialogue: string;        // "— Ar demais faz mal."
  reaction: string;        // what the narrator did immediately
  consequence: string;     // what happened next / the lasting effect
  conflictFamily: string;  // taxonomy: "invasão_de_espaço", "decided_for_me", etc.
  productBridge: string;   // how the product connects (changes by strategy)
  moralSeed: string;       // the core tension to build the final question on
}

// ─── Situation library ────────────────────────────────────────────────────────

interface Situation {
  characters: string[];
  action: string;
  conflictObject: string;
  dialogues: string[];
  reactionAvoids: string;
  reactionConfronts: string;
  reactionInternalizes: string;
  consequence: string;
  conflictFamily: string;
  moralSeed: string;
  requiresMarriage?: boolean;
  requiresChildren?: boolean;
  requiresDating?: boolean;
  // If set, this situation is preferred for contextual strategy with these categories
  contextualFor?: string[];
}

const SITUATIONS: Situation[] = [
  // ─── INVASÃO DE ESPAÇO ────────────────────────────────────────────────────
  {
    characters: ["minha sogra", "minha mãe", "minha cunhada", "minha irmã"],
    action: "desligou o ar-condicionado",
    conflictObject: "o ar-condicionado",
    dialogues: [
      "— Ar demais faz mal.",
      "— Não precisa ficar gelado assim.",
      "— Com esse frio todo você vai adoecer.",
    ],
    reactionAvoids: "Não disse nada. Fui buscar um cobertor.",
    reactionConfronts: "Perguntei se podia religar. Ela disse que sim, mas ficou me olhando.",
    reactionInternalizes: "Fiquei quieta. Mas aquilo ficou na minha cabeça pelo resto da tarde.",
    consequence: "Passei horas com calor fingindo que estava bem.",
    conflictFamily: "invasão_de_espaço",
    moralSeed: "cuidado ou controle",
  },
  {
    characters: ["minha sogra", "minha mãe", "minha cunhada"],
    action: "entrou no meu quarto sem bater",
    conflictObject: "a porta",
    dialogues: [
      "— Estava com a porta fechada mas achei que você estava acordada.",
      "— Só vim ver o que você estava fazendo.",
      "— A porta não estava bem fechada.",
    ],
    reactionAvoids: "Fechei o que estava fazendo e disse que estava tudo bem.",
    reactionConfronts: "Falei que prefiro que batam antes. Ela ficou sem resposta.",
    reactionInternalizes: "Não falei nada. Mas me senti invadida num espaço que deveria ser meu.",
    consequence: "Passei a trancar o quarto quando precisava de espaço.",
    conflictFamily: "invasão_de_espaço",
    moralSeed: "espaço dentro de casa",
  },
  {
    characters: ["minha sogra", "minha mãe", "meu pai", "minha irmã"],
    action: "reorganizou minha cozinha sem avisar",
    conflictObject: "os armários",
    dialogues: [
      "— Só estava organizando, achei que ia ficar melhor assim.",
      "— Você não acha que é mais fácil encontrar desse jeito?",
      "— Fiz enquanto você estava fora. Não é um agrado?",
    ],
    reactionAvoids: "Agradeci e esperei ela ir embora para voltar tudo ao lugar.",
    reactionConfronts: "Expliquei que tenho meu jeito de organizar. Não gostou de ouvir.",
    reactionInternalizes: "Fiquei me perguntando se ela percebeu que a cozinha era minha.",
    consequence: "Passei a trancar a cozinha quando ela vinha.",
    conflictFamily: "invasão_de_espaço",
    moralSeed: "limite entre ajudar e invadir",
  },

  // ─── DECIDIRAM POR MIM ────────────────────────────────────────────────────
  {
    characters: ["meu marido", "meu namorado"],
    action: "cancelou nossa viagem",
    conflictObject: "a viagem",
    dialogues: [
      "— A gente pode ir em outro momento, surgiu um imprevisto.",
      "— Pensei que você ia preferir ficar mesmo.",
      "— Tomei a decisão por nós dois.",
    ],
    reactionAvoids: "Disse que tudo bem sem dizer que não estava.",
    reactionConfronts: "Perguntei por que não me consultou antes de cancelar.",
    reactionInternalizes: "Eu tinha esperado tanto por aquela viagem.",
    consequence: "A viagem nunca foi remarcada. Ficou só na conversa.",
    conflictFamily: "decided_for_me",
    moralSeed: "decidir pelos dois sem perguntar",
    requiresMarriage: true,
  },
  {
    characters: ["minha mãe", "minha sogra", "minha irmã", "minha amiga"],
    action: "respondeu uma mensagem minha",
    conflictObject: "o celular",
    dialogues: [
      "— Eu vi que era uma mensagem simples e já respondi.",
      "— Você estava ocupada, só quis ajudar.",
      "— Pensei que você ia preferir que eu resolvesse.",
    ],
    reactionAvoids: "Respirei fundo e não disse nada.",
    reactionConfronts: "Expliquei que aquela conversa era minha.",
    reactionInternalizes: "Não falei. Mas me senti transparente, como se não existisse.",
    consequence: "Passei a não deixar mais o celular sobre a mesa.",
    conflictFamily: "decided_for_me",
    moralSeed: "autonomia e limite",
  },
  {
    characters: ["meu marido", "minha mãe", "meu pai", "minha sogra"],
    action: "marcou um compromisso por mim",
    conflictObject: "a agenda",
    dialogues: [
      "— Já confirmei que vocês vão. Você não ia recusar mesmo.",
      "— Achei que você ia querer ir.",
      "— Marquei por você, é mais fácil assim.",
    ],
    reactionAvoids: "Não falei nada. Fui ao compromisso.",
    reactionConfronts: "Disse que preferia ter sido consultada antes.",
    reactionInternalizes: "Fui. Mas passei o tempo todo pensando que não tinha escolhido estar ali.",
    consequence: "Fui ao compromisso. Não falei nada.",
    conflictFamily: "decided_for_me",
    moralSeed: "decidir por alguém sem perguntar é ajuda ou controle",
  },

  // ─── DESGASTE SILENCIOSO ─────────────────────────────────────────────────
  {
    characters: ["meu marido", "minha namorada", "meu namorado", "minha esposa"],
    action: "disse que ia embora",
    conflictObject: "a conversa",
    dialogues: [
      "— Eu cansei de esperar você estar pronta para isso.",
      "— Toda vez você dizia que ia. E nunca vinha.",
      "— Não aguentei mais segurar esse peso sozinha.",
    ],
    reactionAvoids: "Fiquei em silêncio. Não sabia o que responder.",
    reactionConfronts: "Pedi para ela explicar melhor. Conversamos por horas.",
    reactionInternalizes: "Aquilo me desmontou. Porque eu sabia que era verdade.",
    consequence: "Não consegui ficar como antes.",
    conflictFamily: "desgaste_silencioso",
    moralSeed: "esperar alguém é carinho ou dependência",
    requiresMarriage: true,
  },
  {
    characters: ["minha mãe", "meu pai", "minha amiga", "minha irmã"],
    action: "parou de me contar as coisas",
    conflictObject: "o silêncio",
    dialogues: [
      "— Tentei te contar mas você estava sempre ocupada.",
      "— Parei de ligar porque você nunca atendia.",
      "— Achei que você não queria saber.",
    ],
    reactionAvoids: "Fiquei sem palavras.",
    reactionConfronts: "Disse que sempre quis saber. Que nunca percebi que ela parou.",
    reactionInternalizes: "Demorei para entender. Mas quando entendi, pesou demais.",
    consequence: "Me arrependo de não ter estado mais presente.",
    conflictFamily: "desgaste_silencioso",
    moralSeed: "presença e ausência nas relações",
  },

  // ─── COMBINADOS QUEBRADOS ────────────────────────────────────────────────
  {
    characters: ["meu marido", "minha namorada", "meu namorado", "minha amiga"],
    action: "usou o dinheiro que tínhamos guardado",
    conflictObject: "o Pix",
    dialogues: [
      "— Ia repor depois, pensei que você não ia notar.",
      "— Era uma emergência, decidir sozinha foi o jeito mais rápido.",
      "— A gente tem que ser flexível às vezes.",
    ],
    reactionAvoids: "Disse que tudo bem. Mas não estava.",
    reactionConfronts: "Fui direta: a gente tinha um combinado.",
    reactionInternalizes: "O valor era pouco. Mas a sensação era de muito mais.",
    consequence: "Ficou assim.",
    conflictFamily: "combinados_quebrados",
    moralSeed: "combinado quebrado é pequeno ou pesado conforme quem vê",
  },
  {
    characters: ["meu marido", "minha namorada", "minha cunhada", "minha amiga"],
    action: "fez diferente do que a gente tinha combinado",
    conflictObject: "o acordo",
    dialogues: [
      "— Achei que fazia mais sentido assim.",
      "— Nossa, você está levando muito a sério.",
      "— Eu sabia que você ia entender.",
    ],
    reactionAvoids: "Não disse nada. Ajustei do meu lado.",
    reactionConfronts: "Falei que a gente tinha um combinado. A resposta não veio.",
    reactionInternalizes: "O valor era pouco. Mas o que foi ignorado pesou muito.",
    consequence: "Parei de presumir que o que foi dito seria feito.",
    conflictFamily: "combinados_quebrados",
    moralSeed: "você leva a sério demais ou a outra pessoa levou de menos",
  },

  // ─── SURPRESA BOA ────────────────────────────────────────────────────────
  {
    characters: ["minha diarista", "minha amiga", "minha vizinha", "minha irmã"],
    action: "fez algo que ninguém pediu",
    conflictObject: "o gesto",
    dialogues: [
      "— Eu vi que você estava precisando e fiz porque quis.",
      "— Não esperei você pedir. Vi e fiz.",
      "— Não tem explicação. Só quis.",
    ],
    reactionAvoids: "Fiquei sem saber como agradecer direito.",
    reactionConfronts: "Perguntei por que tinha feito. A resposta me pegou de surpresa.",
    reactionInternalizes: "Aquilo ficou comigo por muito tempo. Sem eu saber exatamente por quê.",
    consequence: "Me peguei querendo fazer o mesmo por alguém.",
    conflictFamily: "surpresa_de_gratidão",
    moralSeed: "presente inesperado e o que ele diz sobre quem deu",
  },

  // ─── SITUAÇÕES CONTEXTUAIS (compatíveis com produtos específicos) ─────────
  {
    characters: ["minha amiga", "minha irmã", "minha mãe"],
    action: "disse que eu precisava parar de me cobrar tanto",
    conflictObject: "a cobrança",
    dialogues: [
      "— Você não descansa nunca. Precisa se cuidar mais.",
      "— Para de se cobrar assim. Você está fazendo o que pode.",
      "— Às vezes cuidar de você mesma também é uma escolha.",
    ],
    reactionAvoids: "Concordei com a cabeça mas continuei como sempre.",
    reactionConfronts: "Disse que me cobrar é o que me faz avançar.",
    reactionInternalizes: "Ela tinha razão. Eu sabia. Não falei.",
    consequence: "Não sei se ela estava certa. Mas alguma coisa mudou.",
    conflictFamily: "surpresa_de_gratidão",
    moralSeed: "autocuidado versus produtividade",
    contextualFor: ["beleza", "suplementos", "higiene"],
  },
  {
    characters: ["meu médico", "minha fisioterapeuta", "minha nutricionista"],
    action: "disse que eu precisava mudar alguma coisa",
    conflictObject: "o diagnóstico",
    dialogues: [
      "— Você precisa se mover mais. Isso não é opcional.",
      "— Seu corpo está pedindo ajuda. Agora é a hora.",
      "— Pequenas mudanças agora evitam grandes problemas depois.",
    ],
    reactionAvoids: "Ouvi e fingi que ia fazer diferente.",
    reactionConfronts: "Perguntei exatamente o que precisava mudar e por onde começar.",
    reactionInternalizes: "Saí de lá com aquilo pesando. Não era exatamente o que eu queria ouvir.",
    consequence: "Não mudei tudo de uma vez. Mas alguma coisa mudou.",
    conflictFamily: "decided_for_me",
    moralSeed: "quando alguém nos diz o que precisamos ouvir",
    contextualFor: ["calcados_esportivos", "suplementos", "higiene"],
  },
  {
    characters: ["minha amiga", "minha irmã", "meu marido", "meu namorado"],
    action: "me convidou pra caminhar junto",
    conflictObject: "a caminhada",
    dialogues: [
      "— Você precisa de ar. Vem comigo amanhã de manhã.",
      "— Só uns trinta minutos. Faço questão que você venha.",
      "— Sempre venho sozinha, mas hoje quero sua companhia.",
    ],
    reactionAvoids: "Disse que ia pensar.",
    reactionConfronts: "Falei que preferia ir só, do meu jeito.",
    reactionInternalizes: "Fui na primeira vez sem saber se ia gostar. Gostei.",
    consequence: "Aquela caminhada virou um hábito que não sei de onde saiu.",
    conflictFamily: "surpresa_de_gratidão",
    moralSeed: "como pequenos convites mudam a rotina",
    contextualFor: ["calcados_esportivos", "suplementos"],
  },
  {
    characters: ["minha amiga", "minha colega de trabalho", "minha irmã"],
    action: "me indicou algo que mudou minha rotina",
    conflictObject: "a indicação",
    dialogues: [
      "— Tenho usado isso faz uns meses. Você precisa experimentar.",
      "— Não sei como você ainda não conhecia.",
      "— Confie em mim nessa.",
    ],
    reactionAvoids: "Anotei e deixei esquecido por semanas.",
    reactionConfronts: "Perguntei tudo antes de comprar. Ela tinha paciência para cada pergunta.",
    reactionInternalizes: "Fiquei com aquilo na cabeça. Até que um dia decidi tentar.",
    consequence: "Fiz o que ela sugeriu. Não me arrependi.",
    conflictFamily: "surpresa_de_gratidão",
    moralSeed: "confiar na indicação de alguém próximo",
    contextualFor: ["beleza", "alimentos_bebidas", "higiene", "eletrodomesticos"],
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function isCharacterCompatible(character: string, narrator?: NarratorFilter): boolean {
  if (!narrator) return true;
  const marriedOnly = ["meu marido", "minha esposa", "minha sogra", "meu sogro", "minha cunhada", "meu cunhado"];
  const datingOnly = ["meu namorado", "minha namorada"];
  if (marriedOnly.includes(character) && narrator.maritalStatus !== "married") return false;
  if (datingOnly.includes(character) && !["dating", "married"].includes(narrator.maritalStatus)) return false;
  return true;
}

const LOCATIONS: Record<string, string[]> = {
  calcados_esportivos: ["parque", "academia", "calçada de manhã cedo", "trilha"],
  beleza: ["banheiro", "quarto", "sala com espelho"],
  eletrodomesticos: ["cozinha", "sala de jantar"],
  default: ["apartamento", "casa", "sala", "cozinha"],
};

const MOMENTS = [
  "quando cheguei em casa depois de um dia longo",
  "num domingo de manhã",
  "enquanto tentava descansar",
  "numa sexta à noite",
  "no meio de um momento meu",
  "quando achei que ia ser um dia normal",
  "tarde da noite, depois do trabalho",
  "numa tarde que parecia comum",
  "num sábado que começou tranquilo",
];

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateScene(
  universe: ProductUniverse,
  narrator: NarratorFilter | undefined,
  personality: NarratorPersonality,
  strategy: ProductStrategy,
  seed: number
): GeneratedScene {
  // Prefer contextual-tagged situations for contextual strategy
  let pool = SITUATIONS;
  if (strategy === "contextual") {
    const contextual = SITUATIONS.filter(
      (s) => s.contextualFor?.includes(universe.detectedCategory)
    );
    if (contextual.length >= 2) pool = contextual;
  }

  // Filter for narrator compatibility
  const compatible = pool.filter((s) =>
    s.characters.some((c) => isCharacterCompatible(c, narrator))
  );
  const situation = pick(compatible.length > 0 ? compatible : pool, seed);

  // Pick a character compatible with narrator
  const chars = situation.characters.filter((c) => isCharacterCompatible(c, narrator));
  const character = pick(chars.length > 0 ? chars : situation.characters, seed + 1);

  const dialogue = pick(situation.dialogues, seed + 2);

  const reaction =
    personality.conflictStyle === "confronts"
      ? situation.reactionConfronts
      : personality.conflictStyle === "internalizes"
        ? situation.reactionInternalizes
        : situation.reactionAvoids;

  // Location depends on strategy and product
  const locationPool =
    strategy === "contextual"
      ? universe.scenarios
      : LOCATIONS[universe.detectedCategory] ?? LOCATIONS.default;
  const location = pick(locationPool, seed + 3);

  // Product bridge changes by strategy
  let productBridge: string;
  if (strategy === "contextual") {
    productBridge = pick(universe.occasions, seed + 4);
  } else if (strategy === "hybrid") {
    productBridge = pick(universe.bridgeTopics, seed + 4);
  } else {
    productBridge = "descoberta casual enquanto navegava";
  }

  return {
    location,
    moment: pick(MOMENTS, seed + 5),
    character,
    action: situation.action,
    conflictObject: situation.conflictObject,
    dialogue,
    reaction,
    consequence: situation.consequence,
    conflictFamily: situation.conflictFamily,
    productBridge,
    moralSeed: situation.moralSeed,
  };
}
