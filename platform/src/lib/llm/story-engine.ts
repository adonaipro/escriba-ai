// Story Engine — RAG Architecture
//
// Intelligence comes from examples, not rules.
// Product info + story examples → single LLM call → story.
//
// No stages. No scene builder. No conflict bank. No banned phrase lists.
// The model learns style from examples. We provide context, not control.

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import type { PipelineNarratorData, StoryDebugData, StoryScore } from "./pipeline-types";
import { CONFLICT_BANK } from "./human-conflict-engine";
import type { HumanConflict } from "./human-conflict-engine";

export type { StoryDebugData };

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryPost {
  position: number;
  content: string;
}

// Minimal conflict stub — used by narrative-engine.ts for display fields only
interface MinimalConflictSelection {
  character: string;
  openingMoment: string;
  // Legacy fields required by narrative-engine.ts signature
  conflictId: string;
  reasoning: string;
  productLocation: string;
  validCast: string[];
  incident: string;
  incidentReason: string;
  gossipHook: string;
  protagonist: string;
  environment: string;
  beforeContext: string;
  trigger: string;
  firstWords: string;
  reactionAndSequence: string;
  emotionalClimate: string;
  concreteDetails: string[];
  productNaturalContext: string;
  productMoment: string;
}

export interface StoryResult {
  posts: StoryPost[];
  conflictSelection: MinimalConflictSelection;
  conflict: HumanConflict;
  score: StoryScore;
  debug: StoryDebugData;
}

// ─── RAG Examples ─────────────────────────────────────────────────────────────
//
// 8 high-quality example threads demonstrating the target style.
// Model learns rhythm, naturalness, dialogue proportion, link placement.
// These teach by example — no rules needed.

// Real competitor stories — transcribed from public Threads posts.
// URLs replaced with [LINK] placeholder.
// These teach style, rhythm, and product placement by example.
const STORY_EXAMPLES = [
  // pedroalvaro.ss — 161k views
  `Post 1:
Minha namorada parou de me esperar para começar a comer. Achei que ela estivesse com pressa. Durante anos era sempre igual. A comida ficava pronta. Ela me chamava. Mesmo quando eu dizia: Já vou. Ela esperava. Às vezes dez minutos. Às vezes mais. Até que um dia cheguei à mesa e ela já estava terminando o prato. Estranhei. Perguntei: Você já começou? Ela respondeu: Sim. Falei: Mas você sempre me esperava. Ela ficou em silêncio por alguns segundos. Depois disse: Cansei de comer a comida fria.

Post 2:
Não entendi. Ela continuou: Toda vez você falava "já estou indo". Aí respondia uma mensagem. Terminava um vídeo. Ia fazer mais uma coisa. Quando chegava, eu já estava sem fome. Na hora respondi: Era só me chamar de novo. Ela sorriu. Depois falou: Esse era justamente o problema. Eu sempre precisava chamar de novo. Aquilo me desmontou. Porque eu nunca achei que aqueles poucos minutos fizessem diferença. Na minha cabeça, ela só estava esperando.

Post 3:
Na dela, ela estava adiando o próprio momento para se adaptar ao meu. Ela terminou dizendo uma frase que ficou comigo: Quem espera uma vez faz por carinho. Quem espera todos os dias começa a esquecer que também merece ser esperado. Passei o resto da noite pensando nisso. Porque talvez o desgaste de um relacionamento não aconteça por causa de um grande erro. Talvez ele apareça quando uma pessoa vai ajustando a própria rotina tantas vezes que deixa de perceber que sempre é ela quem está cedendo.

Post 4:
E eu fiquei pensando... Na sua opinião, esperar quem a gente ama é uma demonstração de carinho... ou, quando isso acontece todos os dias, acaba mostrando que só uma pessoa está se adaptando ao relacionamento?

Post 5:
Confesso que demorei para entender o que ela quis dizer. Depois encontrei isso: [LINK] Porque, no fim, o problema nunca foi o prato que esfriava. Era a pessoa que, todos os dias, deixava o próprio momento de lado esperando que eu chegasse.`,

  // aline_gomeslessa — 229k views
  `Post 1:
Meu sogro entrou na minha casa e desligou o ar-condicionado. Era um domingo muito quente. A gente estava almoçando. Meu filho brincava na sala. O ar estava ligado desde cedo. Em um momento meu sogro levantou, pegou o controle e desligou. Perguntei: Aconteceu alguma coisa? Ele respondeu: Conta de luz não nasce em árvore. Confesso que fiquei sem reação. Falei: Mas quem paga essa conta somos nós. Ele respondeu: Mesmo assim. É desperdício. Na hora meu marido deu uma risadinha. Disse:

Post 2:
Meu pai é assim mesmo. Respirei fundo. Levantei, peguei o controle e liguei o ar de novo. Meu sogro olhou para mim e falou: Daqui a pouco vocês reclamam que o dinheiro não sobra. Respondi: Se um dia a conta apertar, eu desligo. Mas enquanto eu puder pagar, essa decisão é nossa. O clima ficou estranho pelo resto do almoço. Quando contei isso para uma amiga, ela disse: Nossa... eu teria deixado desligado para evitar confusão. Outra respondeu: Se a conta é sua, ninguém tem que decidir por você.

Post 3:
Até hoje meu sogro acha que eu fui desnecessária. Eu continuo achando que conselho é uma coisa. Tomar uma decisão dentro da casa dos outros é outra completamente diferente. Eu realmente exagerei... ou você também ligaria o ar de novo?

Post 4:
Dias depois essa história ainda virou assunto aqui em casa. Quando encontrei isso [LINK] lembrei daquele almoço na mesma hora. No fim, percebi que a discussão nunca foi sobre ligar ou desligar o ar. Foi sobre uma coisa muito simples: quem mora na casa deve ter o direito de decidir como ela funciona.`,

  // taylaca — 433k views
  `Post 1:
Meu cunhado começou a chegar do trabalho e tomar banho no escuro. No escuro mesmo, sem acender a luz do banheiro. Minha irmã estranhou, perguntou várias vezes. Ele sempre respondia que era só cansaço. Até que um dia ela entrou no banheiro e encontrou ele sentado no chão, a água caindo, sem pressa nenhuma para sair dali. Foi quando ele falou a verdade.

Post 2:
Disse que aquele era o único lugar da casa onde ninguém esperava nada dele, nem conversa, nem solução, nem força, nem sorriso. Nada. Minha irmã me contou que ficou sem reação, pq durante o dia ele parecia normal, trabalhava, brincava, resolvia problemas, pagava contas, fazia piadas. Como se estivesse tudo bem. Mas as vezes a pessoa que parece mais forte é justamente a que está mais cansada, a que aprendeu a sofrer em silêncio para não preocupar ninguém.

Post 3:
E acho que esse é o tipo de dor que mais assusta, a dor que continua funcionando, que continua produzindo, que continua sorrindo. Pq ninguém pergunta como está quem nunca deixa de dar conta. E quem nunca deixa de dar conta acaba carregando o peso de todo mundo sozinho. Quantas pessoas vc acha que estão exaustas neste momento, mas ninguém percebe porque elas continuam funcionando?

Post 4:
minha irmã convenceu meu cunhado a procurar ajuda. o profissional explicou que ele estava vivendo um nível de sobrecarga muito maior do que ele imaginava. nesse período, ela também usou isso aqui [LINK] e disse que queria fazer tudo o que estivesse ao alcance dela para ajudar. foi a primeira vez, em muito tempo, que ele aceitou que precisava cuidar de si. vocês acham que hoje em dia muita gente só procura ajuda quando já chegou no próprio limite?`,

  // taylaca — 54,8k views
  `Post 1:
Minha amiga veio passar a tarde aqui em casa. A gente tomou café, conversou, deu risada e ela foi embora como sempre. Mais tarde, fui guardar umas coisas na cozinha e encontrei um envelope em cima da geladeira. Dentro tinha R$ 200 e um bilhete escrito: "Compra umas coisas pra casa. Sei que às vezes aperta e você não vai aceitar se eu oferecer." Na hora eu fiquei sem reação. Mandei mensagem perguntando por que ela tinha feito aquilo. Ela respondeu: "Foi de coração.

Post 2:
Não queria te constranger, só ajudar." Eu sei que a intenção foi boa. Mas o que ficou na minha cabeça foi outra coisa: Em que momento eu passei a imagem de que precisava que alguém escondesse dinheiro dentro da minha casa? Quando contei isso, as reações foram totalmente diferentes. Teve quem disse: "Eu acharia um gesto de carinho." E teve quem respondeu: "Eu também ficaria incomodado. A ajuda veio junto com uma suposição sobre a sua vida."

Post 3:
A verdade é que boas intenções nem sempre impedem alguém de se sentir invadido. E às vezes o problema não é o gesto é a mensagem que ele passa. Vocês devolveriam o dinheiro ou agradeceriam e aceitariam numa boa?

Post 4:
no dia seguinte ela voltou aqui em casa. disse que, se eu não aceitasse o dinheiro, pelo menos aceitasse isso aqui [LINK] falou que não queria me ajudar por pena, mas porque eu faria a mesma coisa por ela. Vocês aceitariam pela consideração ou devolveriam?`,

  // osgarimposdatay — 8,4k views
  `Post 1:
Contratei uma moça da minha vizinhança pra fazer uma limpeza pesada na minha casa enquanto eu trabalhava. Ela é mãe solo, cria dois filhos pequenos, e me perguntou se podia levar eles porque não tinha com quem deixar. Eu disse que sim, claro. Antes de sair, dei uma única instrução: "se começar a chover, só tira a roupa do varal e deixa em cima da cama." Vou ser honesta: passei o dia inteiro nervosa.

Post 2:
A gente vê tanta história na internet sobre gente que rouba, que quebra as coisas, que faz serviço mal feito. Mesmo querendo confiar, esses pensamentos não saíam da minha cabeça. Ela também perguntou se os filhos podiam almoçar aqui. Eu deixei. Ela disse que ia deixar a chave embaixo do capacho quando terminasse. Quando cheguei em casa, fiquei em choque. A casa tava impecável. O chão brilhando, cada cômodo perfeitamente limpo, e o cheiro... simplesmente maravilhoso.

Post 3:
Tudo limpo, organizado, parecia coisa de revista. E a roupa? Ela não deixou em cima da cama. Ela dobrou cada peça, separou tudo, e guardou nos armários. Como se isso não bastasse, tinha um café fresco me esperando na cozinha. Naquele momento, eu percebi: a gente passa tanto tempo ouvindo histórias de pessoas desonestas que esquece quantas pessoas boas, trabalhadoras e genuinamente honestas ainda existem. O melhor de tudo? Ela cobrou só R$ 250. Paguei na hora e dei uma gorjeta generosa.

Post 4:
Porque alguém que trata a casa dos outros com tanto cuidado merece ser reconhecido.

Post 5:
Gente, fiquei tão impressionada com o capricho dela que, além da gorjeta, resolvi comprar isso aqui pra agradecer [LINK] confesso que fiquei na dúvida... Vocês acham que é um mimo à altura do que ela fez ou eu tô exagerando e ela pode até ficar sem graça?`,

  // osgarimposdatay — 9,6k views
  `Post 1:
Essa semana eu precisei deixar minha filha na festa de aniversário de uma coleguinha e ir embora. Era daquelas festas em buffet onde os pais podiam deixar as crianças por algumas horas. Eu nunca tinha feito isso. Conhecia a mãe da aniversariante só de dar "bom dia" na porta da escola. Quando minha filha percebeu que eu ia embora, segurou minha mão e perguntou: "Você volta pra me buscar, né?" Aquilo acabou comigo. Abaixei, dei um beijo nela e falei que voltava rapidinho.

Post 2:
Antes de sair, só pedi uma coisa pra monitora. "Ela é um pouquinho tímida. Se ficar quietinha num canto, dá uma olhadinha nela." Ela sorriu e disse: "Pode deixar." Entrei no carro tentando agir como se fosse normal. Mas não era. Passei a tarde inteira lembrando de tudo que a gente vê. Criança que some por alguns minutos. Acidente em brinquedo. Monitor distraído. Toda vez que meu celular vibrava, eu gelava. Quando chegou a hora de buscá-la, fui quase correndo.

Post 3:
Assim que entrei no salão, vi minha filha sentada numa mesinha desenhando. A monitora olhou pra mim e falou: "Ela brincou bastante. Só ficou mais quietinha na hora da caça ao tesouro porque ficou com vergonha. Então eu fui fazer junto com ela." Minha filha veio correndo me mostrar o desenho. Era eu. Ela. E a monitora. Embaixo ela tinha escrito, do jeitinho dela: "Ela cuidou de mim." Eu senti um nó na garganta. Porque o combinado era só olhar as crianças.

Post 4:
Mas aquela moça enxergou justamente a única que precisava de um incentivo a mais. Na saída, procurei a coordenadora do buffet só pra elogiar aquela monitora pelo nome. Ela provavelmente nem lembra de mim. Mas eu nunca vou esquecer do jeito que ela fez minha filha se sentir segura num lugar completamente novo. Às vezes a gente passa tanto tempo ouvindo histórias ruins... Que esquece que ainda existe gente que escolhe cuidar dos filhos dos outros como gostaria que cuidassem dos próprios.

Post 5:
E teve uma coisa que eu só descobri quando cheguei em casa. Fui tirar o desenho da minha filha da mochila e encontrei isso aqui [LINK] Junto tinha um bilhetinho da monitora que dizia: "Ela foi muito corajosa hoje. No começo ficou tímida, mas depois sorriu, brincou e deixou nossa tarde muito mais feliz. Espero que ela tenha gostado tanto quanto a gente gostou dela." Confesso que chorei lendo aquilo.`,

  // osgarimposdatay — 12,8k views
  `Post 1:
Fui pagar a diarista esses dias... combinamos 150 reais. Quando ela foi embora, percebi que tinha mandado 200 no Pix. Na hora pensei: "ah, depois eu falo". Mas aí passou o dia... e ela não falou nada. Fiquei naquela dúvida... ela não viu ou fingiu que não viu? Comentei com uma amiga e ela soltou: "Ah, mas diarista ganha pouco... deixa isso pra lá." Só que não era sobre o dinheiro. Era sobre falar ou não falar.

Post 2:
No final, mandei mensagem pra ela. falei do valor... e perguntei se ela tinha percebido. ela respondeu na hora disse que tinha visto sim... mas achou que era pra "abater" com algo que ela tinha levado de casa. na hora eu já estranhei. porque eu não tinha pedido nada. aí ela me mostrou isso aqui [LINK] foi aí que eu travei. porque não fazia sentido com o que a gente tinha combinado. até então eu achei que tinha sido distração. ficou estranho. vocês acham que foi engano ou só justificativa?`,

  // amanda_vorges — 15,8k views
  `Post 1:
Estou conhecendo um homem faz quase um mês e estava gostando muito dele. Ontem saímos para jantar e a conversa estava ótima até ele comentar, como se fosse a coisa mais normal do mundo, que no fim de semana ia viajar com os amigos e provavelmente conhecer gente nova. Eu perguntei se ele estava aberto para conhecer outras mulheres e ele respondeu que sim, afinal a gente nem namorava. Na hora perdi completamente a vontade de continuar o encontro. Hoje decidi me afastar sem dar explicações.

Post 2:
Algumas amigas disseram que eu exagerei. Outras falaram que eu me valorizei. Você acha que, quando existe interesse de verdade, a pessoa naturalmente deixa de procurar outras opções ou isso só faz sentido depois que existe um relacionamento?

Post 3:
Eu já tinha decidido nunca mais responder ele. Só que ele apareceu com isso aqui [LINK] Confesso que, por alguns minutos, pensei em voltar atrás. Você daria uma segunda chance?`,
];

// ─── HTTP utilities ───────────────────────────────────────────────────────────

function resolveBaseUrl(config: LlmProviderConfig): string {
  if (config.baseUrl) return config.baseUrl.replace(/\/$/, "");
  switch (config.provider) {
    case "openai":     return "https://api.openai.com/v1";
    case "openrouter": return "https://openrouter.ai/api/v1";
    case "anthropic":  return "https://api.anthropic.com/v1";
    default:           return "https://api.groq.com/openai/v1";
  }
}

function resolveDefaultModel(config: LlmProviderConfig): string {
  switch (config.provider) {
    case "openai":    return "gpt-4o-mini";
    case "anthropic": return "claude-haiku-4-5-20251001";
    default:          return "llama-3.3-70b-versatile";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryAfterMs(body: string): number | null {
  const minsec = body.match(/try again in (\d+)m(\d+(?:\.\d+)?)s/i);
  if (minsec) return (parseInt(minsec[1]) * 60 + parseFloat(minsec[2])) * 1000 + 2000;
  const sec = body.match(/try again in (\d+(?:\.\d+)?)s/i);
  if (sec) return Math.ceil(parseFloat(sec[1])) * 1000 + 2000;
  return null;
}

function extractJson<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  const raw = fenceMatch ? fenceMatch[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Nenhum JSON encontrado na resposta.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  config: LlmProviderConfig,
  maxTokens: number,
  ctx: { callCount: number; totalTokens: number },
  label: string,
  retryNum = 0,
): Promise<string> {
  ctx.callCount++;
  const baseUrl = resolveBaseUrl(config);
  const model = config.model ?? resolveDefaultModel(config);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.95,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();

    if (
      res.status === 429 &&
      (errText.includes("insufficient_quota") ||
        errText.includes("exceeded your current quota") ||
        errText.includes("billing"))
    ) {
      throw new Error(
        "Créditos OpenAI esgotados. Acesse platform.openai.com/billing para adicionar créditos."
      );
    }

    if (res.status === 429 && errText.toLowerCase().includes("tokens per day")) {
      const m = errText.match(/try again in ([^"}\]]+)/i);
      const when = m ? m[1].trim() : "algumas horas";
      throw new Error(`Limite diário do Groq atingido. Tente em ${when}. (${label})`);
    }

    if (res.status === 429 && retryNum < 3) {
      const waitMs = parseRetryAfterMs(errText) ?? 22_000;
      if (waitMs > 180_000) {
        throw new Error(
          `Rate limit longo demais. Tente em ${Math.ceil(waitMs / 60000)} min. (${label})`
        );
      }
      await sleep(Math.min(waitMs, 120_000));
      return callLLM(systemPrompt, userPrompt, config, maxTokens, ctx, label, retryNum + 1);
    }

    throw new Error(`Story Engine API ${res.status}: ${errText.slice(0, 200)} (${label})`);
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };
  ctx.totalTokens += json.usage?.total_tokens ?? 0;
  return json.choices[0]?.message?.content ?? "";
}

// ─── Example selection ────────────────────────────────────────────────────────

function pickExamples(seed: number, count: number): string[] {
  const pool = [...STORY_EXAMPLES];
  // Deterministic shuffle via LCG
  let s = seed >>> 0;
  for (let i = pool.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223;
    const j = (s >>> 0) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreStory(posts: StoryPost[], productUrl: string): StoryScore {
  const allText = posts.map(p => p.content).join("\n\n");
  const issues: string[] = [];

  const AI_CLICHES = [
    "aprendi que", "entendi que", "percebi que", "tudo fez sentido",
    "nunca mais foi o mesmo", "aquilo me ensinou", "foi quando entendi",
    "e então percebi", "isso me fez refletir", "no final das contas",
  ];
  const found = AI_CLICHES.filter(c => allText.toLowerCase().includes(c));
  const humanness = Math.max(0, 25 - found.length * 5);
  if (found.length > 0) issues.push(`Clichês de IA: ${found.join(", ")}`);

  const hasDialogue =
    allText.includes("—") || /[""]/.test(allText) || allText.includes('"') || allText.includes("Eu:");
  const hasSubstance = posts.length >= 2 && allText.length > 200;
  const conflictClarity = (hasDialogue ? 13 : 6) + (hasSubstance ? 12 : 5);
  if (!hasDialogue) issues.push("Nenhum diálogo ou fala direta detectado");

  const safeUrl = productUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const urlCount = (allText.match(new RegExp(safeUrl, "g")) ?? []).length;
  const inFirstPost = (posts[0]?.content ?? "").includes(productUrl);
  let productNaturalness: number;
  if (urlCount === 0) {
    productNaturalness = 0;
    issues.push("URL do produto não aparece na história");
  } else if (inFirstPost) {
    productNaturalness = 10;
    issues.push("Produto aparece no primeiro post (muito cedo)");
  } else if (urlCount === 1) {
    productNaturalness = 25;
  } else {
    productNaturalness = 12;
    issues.push("URL do produto aparece mais de uma vez");
  }

  const lastContent = posts[posts.length - 1]?.content ?? "";
  const hasQuestion = lastContent.includes("?");
  const hasCall = ["vocês", "alguém mais", "é só eu", "você também", "me conta"].some(p =>
    lastContent.toLowerCase().includes(p)
  );
  const discussionPotential = (hasQuestion ? 15 : 8) + (hasCall ? 10 : 5);

  const total = humanness + conflictClarity + productNaturalness + discussionPotential;
  return { humanness, conflictClarity, productNaturalness, discussionPotential, total, issues };
}

// ─── Product link resolution ──────────────────────────────────────────────────

function resolveProductLink(posts: StoryPost[], productUrl: string, seed: number): StoryPost[] {
  if (!productUrl) return posts;
  if (posts.some(p => p.content.includes(productUrl))) return posts;

  // Replace [LINK] placeholder embedded in a story post
  if (posts.some(p => p.content.includes("[LINK]"))) {
    return posts.map(p => ({
      ...p,
      content: p.content.replace(/\[LINK\]/g, productUrl),
    }));
  }

  // Fallback: insert character-action template before the last post
  const fallbacks = [
    `Dias depois encontrei isso aqui:\n${productUrl}\nE lembrei na hora do que tinha acontecido.`,
    `Ela voltou com isso:\n${productUrl}\nSem dizer nada. Só deixou em cima da mesa.`,
    `Resolvi comprar isso aqui:\n${productUrl}\nPelo menos era uma decisão minha.`,
    `Quando vi isso:\n${productUrl}\nNão precisei nem pensar. Lembrei na hora.`,
    `Ela me mandou isso aqui:\n${productUrl}\nSem texto. Sem explicação.`,
  ];

  const content = fallbacks[seed % fallbacks.length];
  const maxPos = posts.reduce((m, p) => Math.max(m, p.position), 0);

  if (posts.length >= 2) {
    const lastPost = posts[posts.length - 1];
    const rest = posts.slice(0, -1);
    return [
      ...rest,
      { position: maxPos, content },
      { ...lastPost, position: maxPos + 1 },
    ];
  }

  return [...posts, { position: maxPos + 1, content }];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runStoryEngine(
  universe: ProductUniverse,
  productName: string,
  productUrl: string,
  narrator: PipelineNarratorData,
  seed: number,
  config: LlmProviderConfig,
  withLink = true,
): Promise<StoryResult> {
  const start = Date.now();
  const model = config.model ?? resolveDefaultModel(config);
  const ctx = { callCount: 0, totalTokens: 0 };

  // Pick 3 varied examples by seed
  const examples = pickExamples(seed, 3);

  // Narrator voice hint — minimal, not controlling
  const voiceHint = narrator.expressionStyle === "dry"
    ? "Conta de forma seca. Os fatos falam sozinhos."
    : narrator.expressionStyle === "direct"
    ? "Vai direto. Sem introdução longa."
    : "";

  const system = `Você é uma pessoa comum usando o Threads.
Você lembrou de uma situação que aconteceu com você.
Conta naturalmente. Não tenta escrever bonito. Não tenta emocionar.
Escreve como uma pessoa escreveria — não como um escritor.${voiceHint ? `\n${voiceHint}` : ""}`;

  // Build product context
  const productContext = [
    `PRODUTO: ${productName}`,
    universe.benefits.length > 0 ? `O que é: ${universe.benefits.slice(0, 2).join(", ")}` : "",
    universe.pains.length > 0 ? `Pra que serve: ${universe.pains.slice(0, 2).join(", ")}` : "",
  ].filter(Boolean).join("\n");

  // Narrator context
  const genderHint = narrator.sex === "female" ? "narradora mulher" : "narrador homem";
  const childrenHint = narrator.hasChildren ? "tem filhos" : "";
  const narratorContext = [genderHint, childrenHint].filter(Boolean).join(", ");

  const examplesBlock = examples
    .map((ex, i) => `=== EXEMPLO ${i + 1} ===\n${ex}`)
    .join("\n\n");

  const user = `Leia os exemplos abaixo e aprenda o estilo. Depois escreva uma história completamente diferente.

${examplesBlock}

---

Agora escreva UMA história nova sobre este produto:
${productContext}
NARRADORA: ${narratorContext}

A história deve ser sobre uma situação concreta que aconteceu, envolvendo outra pessoa (familiar, amigo, parceiro, colega).
O narrador nunca avalia nem elogia o produto. O produto simplesmente aparece — quem elogia, se alguém elogia, é outra pessoa.
O último post SEMPRE termina com uma pergunta pro leitor ("Vocês fariam o quê?", "Vocês aceitariam?", "Vocês teriam falado algo?").
Use [LINK] onde o produto aparece. Nunca escreva URLs, domínios ou endereços. Só a palavra [LINK].
Não copie os exemplos. Escreva uma situação completamente diferente.

Responda APENAS com JSON válido:
{"posts": [{"position": 1, "content": "..."}, {"position": 2, "content": "..."}]}`;

  const text = await callLLM(system, user, config, 1400, ctx, "geração");

  let rawPosts: StoryPost[];
  try {
    const parsed = extractJson<{ posts: StoryPost[] }>(text);
    rawPosts = (parsed.posts ?? []).filter(p => p.content?.trim());
    if (rawPosts.length === 0) throw new Error("Nenhum post gerado.");
    rawPosts = rawPosts.slice(0, 7);
  } catch {
    throw new Error(`Falha ao parsear posts: ${text.slice(0, 200)}`);
  }

  const posts = withLink ? resolveProductLink(rawPosts, productUrl, seed) : rawPosts;
  const score = scoreStory(posts, productUrl);

  // Minimal stub for narrative-engine.ts compatibility
  const firstPostContent = posts[0]?.content ?? "";
  const conflictStub = CONFLICT_BANK[seed % CONFLICT_BANK.length];

  const debug: StoryDebugData = {
    kind: "story",
    withLink,
    examplesUsed: examples.length,
    posts,
    score,
    callCount: ctx.callCount,
    totalTokens: ctx.totalTokens,
    durationMs: Date.now() - start,
    provider: config.provider,
    model,
  };

  return {
    posts,
    conflictSelection: {
      character: "",
      openingMoment: firstPostContent.split("\n")[0] ?? "",
      conflictId: conflictStub.id,
      reasoning: "",
      productLocation: "",
      validCast: [],
      incident: "",
      incidentReason: "",
      gossipHook: firstPostContent.split("\n")[0] ?? "",
      protagonist: "",
      environment: "",
      beforeContext: "",
      trigger: "",
      firstWords: "",
      reactionAndSequence: "",
      emotionalClimate: "",
      concreteDetails: [],
      productNaturalContext: "",
      productMoment: "",
    },
    conflict: conflictStub,
    score,
    debug,
  };
}
