// Story Engine — RAG Architecture
//
// Intelligence comes from examples, not rules.
// Product info + story examples → single LLM call → story.
//
// No stages. No scene builder. No conflict bank. No banned phrase lists.
// The model learns style from examples. We provide context, not control.

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import type { PipelineNarratorData, StoryDebugData, StoryScore, VoiceToneExperiment, VoiceExperimentData, VoiceToneValue } from "./pipeline-types";
import { CONFLICT_BANK } from "./human-conflict-engine";
import type { HumanConflict } from "./human-conflict-engine";
import { buildNarratorIdentityRules, findNarratorIdentityViolations } from "@/lib/narrators/identity-guard";
import {
  THREADS_TEXT_MAX_CHARS,
  assertThreadsPostsWithinLimit,
  findOversizedThreadsPosts,
} from "@/lib/publishing/threads-limits";
import { isInsufficientQuotaError } from "./api-error";

// ─── Voice Experiment V0 ──────────────────────────────────────────────────────
// Feature flag — set false to revert instantly to pre-experiment behavior
const VOICE_EXPERIMENT_ENABLED = true;

const TONE_HINTS: Record<string, string> = {
  leve:      "Voz nesta geração: leve.",
  direta:    "Voz nesta geração: direta.",
  emocional: "Voz nesta geração: mais emocional.",
};

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
// 9 high-quality example threads demonstrating the target style.
// Model learns rhythm, naturalness, dialogue proportion, link placement.
// These teach by example — no rules needed.
// Diversity: romantic betrayal, mother-in-law sabotage, sexual harassment by family,
// neighbor reputation attack, family exposure, friend career sabotage,
// digital exposure by ex, inheritance fraud by sister, friend disbelief after harassment.

// Real competitor stories — transcribed from public Threads posts.
// URLs replaced with [LINK] placeholder.
// These teach style, rhythm, and product placement by example.
const STORY_EXAMPLES = [
  `Post 1:
Descobri que minha melhor amiga ficou com meu namorado quando vi uma foto deles juntos no Instagram. Era uma foto num bar que eu conheço, os dois sorrindo, ela com a mão no ombro dele. Deletei o app na hora. Respirei. Abri de novo. A foto ainda estava lá. Fiquei olhando por uns dois minutos sem conseguir entender o que estava vendo. Depois peguei as chaves e fui até o apartamento dela sem avisar.

Post 2:
Ela abriu a porta e soube na hora que eu tinha visto. A expressão dela disse tudo antes de qualquer palavra. Perguntei direto: "O que foi aquilo?" Ela cruzou os braços e disse: "A gente vai sentar e conversar?" Eu disse: "Não. Eu só vim buscar minhas coisas que ficaram aqui." Entrei, peguei a sacola do armário, e quando saí ela ficou no corredor falando que precisava explicar. Desci as escadas sem olhar pra trás.

Post 3:
Meu namorado me ligou catorze vezes enquanto eu dirigia de volta pra casa. Contei cada ligação. Deixei ir pro voicemail. Na décima quinta atendi e fiquei em silêncio. Ele disse que ia explicar, que não era o que parecia. Perguntei: "O que parecia?" Ele começou a falar e eu desliguei. Cheguei em casa, sentei na cama e fiquei olhando pro teto. Não saiu nem uma lágrima. Só aquela coisa que aperta no peito e não vai embora.

Post 4:
Fui pra casa da minha mãe e fiquei lá por três dias sem atender ninguém do meu círculo. No terceiro dia ela perguntou se eu queria falar. Eu disse: "Ainda não." Ela foi fazer chá e ficou do meu lado em silêncio enquanto eu olhava pela janela. Às vezes é isso que a gente mais precisa.

Post 5:
No quarto dia minha prima veio me ver. Ficamos conversando até tarde. Antes de ir ela deixou isso aqui [LINK] em cima da mesa: "Comprei pensando em você. Abre quando estiver sozinha." Abri depois que ela foi. Você confrontaria os dois juntos ou separado?`,

  `Post 1:
Minha sogra ligou pro meu chefe e disse que eu era instável emocionalmente e que ele deveria me monitorar. Fiquei sabendo dois anos depois, quando minha cunhada me mostrou o print de uma conversa onde ela admitia pra uma amiga o que tinha feito, rindo de como eu nunca tinha descoberto. Dois anos eu levei feedbacks estranhos do meu gestor e me culpei achando que o problema era o meu trabalho. Enquanto isso ela aparecia na minha casa todo domingo tomando café como se nada tivesse acontecido.

Post 2:
Fui direto até a casa dela. Meu marido foi junto sem saber exatamente o que ia acontecer. Cheguei, sentei na cadeira da frente, coloquei o celular na mesa com o print aberto e perguntei: "Você quer me explicar isso?" Ela olhou pro celular. Ficou vermelha. Meu marido se aproximou pra ler. Ela abriu a boca. Ele ergueu a mão: "Não agora."

Post 3:
No carro de volta meu marido ficou vinte minutos sem falar nada. Olhava pra frente. Depois disse: "Eu não sabia." Eu disse: "Eu sei." Chegamos em casa, ele foi pro quarto e ficou lá. Eu fiquei sentada na cozinha no escuro por não sei quanto tempo. Aquela noite foi a mais estranha que a gente já teve juntos.

Post 4:
Meu marido não falou com ela por três meses. A promoção que eu perdi, o tempo que não volta, o gestor que ainda me olha diferente. Não tem pedido de desculpa que conserta isso. Mas pelo menos eu sei o que aconteceu. Por dois anos eu não sabia, e era pior.

Post 5:
Uma semana depois minha irmã veio me visitar e ficou me ajudando a organizar a cozinha — ela sempre faz isso quando algo vai mal. Antes de ir me mostrou isso aqui [LINK]: "Vi e pensei em você. Comprei pra te animar." Vocês perdoariam ou cortariam de vez?`,

  `Post 1:
Meu cunhado tentou me beijar na cozinha durante o aniversário do meu marido. Eu tinha ido buscar uma bebida e ele apareceu do nada, encostou no balcão do meu lado e falou bem baixo: "Você é a mais bonita da família, você sabe?" Congelei. Antes que eu conseguisse responder ele se inclinou. Recuei. Ele disse: "Sempre gostei de você." Saí da cozinha com o copo na mão e voltei pra sala sorrindo pro meu marido como se tivesse tudo bem.

Post 2:
Fiquei aquela festa inteira com aquilo na cabeça. Toda vez que ele entrava num cômodo eu saía. Quando a família foi tirar foto eu fui pro lado oposto. Meu marido perguntou duas vezes se eu estava bem. Falei que estava com dor de cabeça. Na hora de ir embora meu cunhado me deu tchau como se nada tivesse acontecido, abraço e tudo.

Post 3:
Em casa, esperei meu marido sentar e contei tudo. Ele ouviu sem interromper até o fim. Depois ficou quieto por uns dois minutos. Então disse: "Você deve ter entendido errado. Ele não faria isso." Olhei pra ele. "Entendido errado como?" Ele se levantou e foi pro quarto. Fiquei no sofá sozinha até meia-noite.

Post 4:
De madrugada meu marido voltou. Disse que tinha pensado, que me acreditava, e que ia conversar com o irmão. Na manhã seguinte ele fez isso. Não sei o que foi dito. Meu cunhado me mandou mensagem pedindo desculpa "se eu tinha me sentido desconfortável". Não respondi. Até hoje ele não apareceu mais nas reuniões de família.

Post 5:
Minha amiga ligou pra saber como eu estava. No final disse que ia passar em casa. Chegou com isso aqui [LINK]: "Vi e lembrei de você. Sem motivo nenhum." Tem gente que aparece na hora certa. Eu fui ingênua em contar pro meu marido ou fiz certo?`,

  `Post 1:
Minha vizinha espalhou pelo prédio inteiro que eu estava tendo um caso com o marido dela. Fiquei sabendo porque minha outra vizinha do quinto desceu até mim com cara de pena e contou tudo: minha vizinha tinha falado pro grupo dos moradores, pra portaria, e pra pelo menos três famílias do bloco. Sem prova. Sem nada. Só inventou e foi distribuindo.

Post 2:
Subi direto até o apartamento dela e bati na porta. Ela abriu e ficou me olhando. Perguntei: "Você foi falar isso sobre mim pro prédio?" Ela negou na hora. Eu disse: "A moradora do 502 me contou palavra por palavra." Ela cruzou os braços: "Cada um entende do jeito que quer." Fechei a cara: "Isso não vai ficar assim."

Post 3:
Fui até o síndico na mesma tarde e abri reclamação formal com data e descrição. Depois entrei no grupo dos moradores e mandei um áudio de dois minutos contando o que tinha acontecido. Ela respondeu no grupo me chamando de dramática. Em menos de uma hora, cinco pessoas me mandaram mensagem em particular dizendo que ela já tinha feito aquilo com outras moradoras antes de mim.

Post 4:
Não consegui dormir direito por dias. Ficava pensando em como continuar morando no mesmo bloco que uma pessoa assim. No elevador ela fingia que eu não existia. Eu também. A diferença é que eu sei exatamente o que ela fez, e ela sabe que eu sei.

Post 5:
A vizinha do 502 desceu com café na minha porta dois dias depois. Antes de ir tirou isso aqui [LINK] da bolsa: "Vi numa loja essa semana e trouxe pra você. Você merecia um gesto bom." Às vezes a pessoa certa aparece na hora exata. Você teria ficado quieta ou feito igual a mim?`,

  `Post 1:
Minha irmã contou pro meu pai que eu tinha terminado meu casamento por causa de outro homem. Não era verdade. Terminei porque o casamento tinha acabado há tempos. Mas mesmo se fosse verdade, não era decisão dela ligar pro meu pai e contar qualquer coisa. Meu pai me ligou em dez minutos com uma voz que eu não ouvia desde que eu era adolescente.

Post 2:
Ele perguntou diretamente: "É verdade que você está se envolvendo com outro homem?" Fechei os olhos. Respirei. Disse que não era verdade e que ia explicar pessoalmente. Desliguei e liguei pra minha irmã na mesma hora. Perguntei: "Por que você fez isso?" Ela disse: "Tô preocupada com você." Eu disse: "Preocupada você me liga. Não vai falar pro meu pai inventando história." Ela ficou em silêncio. Depois disse, com uma voz calma que me irritou mais do que qualquer grito: "Eu não inventei tudo."

Post 3:
Fui até a casa dos meus pais naquele fim de semana pra explicar tudo pessoalmente. Meu pai me ouviu até o fim. Quando eu terminei, ele ficou em silêncio por um tempo e depois disse: "Eu devia ter perguntado pra você primeiro." Minha irmã não apareceu naquele fim de semana. Ainda bem. Eu não sabia o que ia acontecer se eu a visse.

Post 4:
Fiquei duas semanas sem falar com ela. Ela mandou mensagem algumas vezes. Não respondi. Numa delas dizia "eu fiz por amor". Deixei na hora azul e botei o celular virado pra baixo.

Post 5:
Minha mãe veio me ver no apartamento numa tarde. Não falou nada sobre a situação. Só entrou, olhou em volta e colocou isso aqui [LINK] em cima da bancada: "Vi e achei que ia combinar com você." Mãe sabe exatamente a hora de não falar nada. Você perdoava num mês ou precisava de mais tempo?`,

  `Post 1:
Minha amiga me indicou pra uma vaga que ela mesma queria mas não tinha conseguido. Ficou me ajudando por semanas — currículo, simulação de entrevista, dica de como responder cada pergunta difícil. Quando me chamaram ela disse que estava feliz por mim. Fiquei sabendo depois, por uma conhecida que trabalhava no RH, que minha amiga tinha ligado pra empresa antes da minha entrevista pra dizer que eu tinha "problemas de comprometimento com prazo".

Post 2:
A conhecida me mandou mensagem perguntando se eu sabia que aquilo tinha acontecido. Fiquei olhando pro celular por uns cinco minutos sem conseguir responder. Pensei em tudo que minha amiga tinha me ajudado a preparar. Cada simulação de entrevista. Cada feedback que ela dava com aquela voz de quem quer o melhor pra você. Liguei pra ela e disse que queria tomar café.

Post 3:
Cheguei primeiro, pedi o café, esperei ela se acomodar no lugar dela. Quando ela estava com o copo na mão eu coloquei o celular na mesa com a mensagem da conhecida aberta e falei: "Você quer me explicar isso?" Ela ficou branca. Parou com o copo no ar. Depois disse: "Isso foi mal entendido, deixa eu explicar." Eu disse: "Não precisa. Eu só vim pra você saber que eu sei." Deixei o dinheiro do café na mesa e fui embora sem esperar a conta.

Post 4:
Ela me ligou o dia inteiro. Mandou mensagem, mandou áudio, ligou de novo. Em algum momento eu percebi que não tinha mais nada pra ouvir. Bloqueei e fiquei com aquela sensação estranha de quando você perde alguém que você pensava que conhecia.

Post 5:
Minha colega do trabalho passou em casa na sexta com pizza. Ficamos conversando até tarde. Antes de ir colocou isso aqui [LINK] em cima da mesa: "Vi essa semana e comprei pra você. Não precisava de motivo." Às vezes é isso que salva a semana. Você teria dado uma chance de explicação ou teria ido embora do café igual eu?`,

  `Post 1:
Meu ex publicou prints das minhas mensagens privadas num grupo com cinquenta pessoas. Eram mensagens de dois anos atrás, quando a gente ainda estava junto — conversas que eu tinha em confiança, coisas da minha vida que eu tinha dividido só com ele. Fiquei sabendo de manhã quando minha prima me encaminhou uma das capturas com a mensagem: "Você já viu isso?"

Post 2:
Liguei pra ele. Atendeu na segunda chamada, com uma voz tranquila que me deixou ainda mais irritada do que qualquer outra coisa. Perguntei: "Por que você fez isso?" Ele disse, sem desviar: "Porque você me deixou mal." Eu disse: "E você acha que isso resolve alguma coisa?" Ele ficou em silêncio. Desliguei. Fui até o banheiro, lavei o rosto, olhei pro espelho e voltei pro celular.

Post 3:
Passei o dia todo respondendo mensagens. Algumas pessoas mandaram com pena. Outras com curiosidade sobre os detalhes. Uma perguntou se era verdade o que estava escrito. Respondi que não era assunto dela e bloqueei. À noite estava exausta, com raiva, e com aquela sensação horrível de ter sido exposta sem ter feito nada.

Post 4:
No dia seguinte procurei um advogado. Ele explicou que divulgar mensagens privadas sem consentimento configura crime dependendo do conteúdo, e que eu tinha como agir. Mandei uma notificação extrajudicial. Duas horas depois meu ex apagou tudo, sumiu, e não mandou nenhuma mensagem. Só desapareceu como se tivesse sumido do mapa.

Post 5:
Minha prima me buscou à noite. A gente saiu pra caminhar sem destino. Numa loja pequena ela pegou isso aqui [LINK] e colocou na minha mão: "Compra. Você merece uma coisa boa hoje." Comprei. Você bloqueava direto ou enfrentava primeiro?`,

  `Post 1:
Minha irmã mais velha vendeu o apartamento que nosso pai tinha deixado pra nós duas. Eu não sabia. Ela usou uma procuração que eu tinha assinado anos atrás pra uma coisa completamente diferente — pra cuidar do IPTU enquanto eu morava fora. Fiquei sabendo por um vizinho que mandou mensagem perguntando se eu tinha me mudado. Fiquei olhando pra mensagem sem entender o que estava lendo.

Post 2:
Liguei pra ela. Ela atendeu normal, com aquela voz de sempre. Perguntei: "Você vendeu o apartamento?" Ela ficou em silêncio por dois segundos. Depois disse: "A gente precisava resolver essa situação." Eu disse: "Que situação? Era o apartamento do nosso pai." Ela disse: "Você nunca estava aqui pra cuidar de nada, então eu tomei uma decisão." Desliguei e liguei pro advogado que estava na minha agenda há anos sem nunca ter precisado usar.

Post 3:
O advogado pediu a procuração. Quando ela chegou na minha caixa de email, eu vi exatamente o que estava escrito — autorização pra gestão de documentos do imóvel, nada mais. Ela tinha usado isso pra assinar uma escritura de venda. Eram 280 mil reais que tinham sumido numa conta que eu não conhecia. Meu estômago virou.

Post 4:
Fui até a casa dela pessoalmente. Ela abriu a porta como se nada tivesse acontecido. Eu coloquei os documentos na mesa e disse: "Você quer me explicar o que está aqui?" Ela olhou e disse: "Você vai processar a sua própria irmã?" Eu disse, com uma calma que não sabia que tinha: "Já fiz." Ela ficou branca. Fechou a boca. Eu peguei meu casaco e fui embora.

Post 5:
Minha prima foi me ver no mesmo dia. Não sabia o que dizer, então não disse nada. Só sentou do meu lado. Antes de ir colocou isso aqui [LINK] na mesa da cozinha: "Comprei semana passada sem saber por quê. Hoje eu sei." Às vezes as pessoas aparecem exatamente na hora. Você teria processado ou tentado resolver por fora?`,

  `Post 1:
Contei pra minha melhor amiga que o marido dela tinha tentado me beijar no casamento do nosso amigo. Falei ainda naquela noite, com ele ainda no mesmo salão. Achei que ela ia acreditar em mim. Tínhamos doze anos de amizade. Ela me olhou, pegou o copo de vinho que estava na minha mão e disse: "Você tem certeza de que não está exagerando?" Aquelas palavras ficaram na minha cabeça por meses.

Post 2:
Nos dias seguintes ela foi ficando distante. Primeiro parou de responder rápido. Depois passou a deixar em visto. Numa quinta-feira me mandou uma mensagem longa dizendo que ela havia "conversado com o Paulo" e que ele tinha dado uma "versão completamente diferente". Que ela preferia acreditar no marido dela. Que eu estava "provavelmente confusa" por causa da bebida. Que ela me desejava bem.

Post 3:
No mês seguinte fiquei sabendo, por uma amiga em comum, que ela tinha contado pra todo mundo que eu tinha tentado "me aproximar" do marido dela. Virou um escândalo silencioso — o tipo de coisa onde ninguém te acusa na sua frente mas todo mundo te trata diferente. Recebi menos convites. Alguém me desfez no grupo de aniversário.

Post 4:
Decidi não me defender. Não ia ficar correndo atrás de pessoas explicando o que aconteceu. Quem me conhecia de verdade ou acreditava ou não acreditava — e nenhum dos dois precisava da minha versão pra decidir. Passei meses achando que tinha feito errado em falar. Demorei pra parar de achar isso.

Post 5:
Minha mãe apareceu numa sexta sem avisar. Só entrou, foi pra cozinha, aqueceu o que tinha na geladeira e me trouxe isso aqui [LINK]: "Vi essa semana e fiquei pensando em você." Ela nunca me pediu versão de nada. Nunca perguntou o que aconteceu. Só apareceu. Você teria ficado calada ou teria se defendido?`,
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
  apiSeed?: number,
): Promise<string> {
  ctx.callCount++;
  const baseUrl = resolveBaseUrl(config);
  const model = config.model ?? resolveDefaultModel(config);
  const supportsSeed = config.provider !== "anthropic";

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
      ...(apiSeed !== undefined && supportsSeed ? { seed: apiSeed } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();

    if ((res.status === 429 || res.status === 400) && isInsufficientQuotaError(errText)) {
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
      return callLLM(systemPrompt, userPrompt, config, maxTokens, ctx, label, retryNum + 1, apiSeed);
    }

    if (res.status === 429) {
      throw new Error(`Limite momentâneo de requisições/tokens da ${config.provider === "openai" ? "OpenAI" : config.provider}. Aguarde um minuto e tente novamente. (${label})`);
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

function pickExamples(seed: number, count: number): { examples: string[]; indices: number[] } {
  const indexed = STORY_EXAMPLES.map((ex, i) => ({ ex, i }));
  let s = seed >>> 0;
  for (let i = indexed.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223;
    const j = (s >>> 0) % (i + 1);
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  const chosen = indexed.slice(0, count);
  return { examples: chosen.map(c => c.ex), indices: chosen.map(c => c.i) };
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

// ─── Incident validation ─────────────────────────────────────────────────────
// Did the Writer use the incident as the central event?
// Extracts person + content words from the incident and checks presence in output.

function validateIncidentFollowed(posts: StoryPost[], incident: string): boolean {
  const storyText = posts.map(p => p.content).join(" ").toLowerCase();
  const incidentLower = incident.toLowerCase();

  const RELATIONS = [
    "minha mãe", "meu pai", "minha irmã", "meu irmão", "minha amiga",
    "meu amigo", "minha colega", "meu colega", "minha vizinha", "meu vizinho",
    "minha prima", "meu primo", "minha sogra", "meu sogro", "meu ex", "minha ex",
    "meu namorado", "minha namorada", "meu marido", "minha filha", "meu filho",
    "minha cunhada", "meu cunhado",
  ];

  const STOPWORDS = new Set([
    "estava", "tinha", "para", "pelo", "pela", "sobre", "como", "quando",
    "muito", "mais", "também", "depois", "antes", "ainda", "desde", "então",
  ]);

  const relationWords = RELATIONS
    .filter(r => incidentLower.includes(r))
    .flatMap(r => r.split(" ").filter(w => w.length > 2));
  const personPresent = relationWords.some(w => storyText.includes(w));

  const contentWords = incidentLower
    .split(/\s+/)
    .filter(w => w.length > 4 && !STOPWORDS.has(w));
  const contentPresent = contentWords.some(w => storyText.includes(w));

  return personPresent && contentPresent;
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
  voiceExperiment?: VoiceToneExperiment,
  incidentSeed?: string,
  customTheme?: string,
): Promise<StoryResult> {
  const start = Date.now();
  const model = config.model ?? resolveDefaultModel(config);
  const ctx = { callCount: 0, totalTokens: 0 };

  // Pick 3 varied examples by seed — also track which indices were chosen
  const { examples, indices: ragExampleIndices } = pickExamples(seed, 2);

  // Voice Experiment V0 — resolve hint text (or null for control/disabled)
  const toneValue: VoiceToneValue = voiceExperiment?.value ?? "control";
  const experimentActive = VOICE_EXPERIMENT_ENABLED && !!voiceExperiment && toneValue !== "control";
  const hintText = experimentActive ? (TONE_HINTS[toneValue] ?? null) : null;
  const seedSentToApi = config.provider !== "anthropic";

  const themeBlock = customTheme
    ? `Estas histórias seguem o tema especificado: ${customTheme}.
Escreva histórias que envolvam esse tema, mantendo a estrutura dramática com tensão real, confronto ou descoberta, e emoção genuína.`
    : `Estas histórias são sobre fofoca: traição, mentira, humilhação, sabotagem, exposição, abandono, inveja, segredos destruidores.
Alguém próximo fez algo grave. A narradora descobre, confronta ou é confrontada — o drama acontece dentro da história, não é só relatado.
Nunca escreva sobre: jantares, receitas, visitas sem conflito, compras, situações cotidianas sem traição grave.`;

  const system = `Escreva como alguém mandando uma sequência de mensagens para um amigo contando o que aconteceu.

${themeBlock}

Regras de escrita:
- construa tensão em cada post — o leitor deve querer saber o que vem depois
- mostre sentimentos através de reações físicas e ações — não apenas diga o que a pessoa sentiu
- inclua o momento de confronto, humilhação ou choque com detalhes reais
- use diálogo palavra por palavra — o que cada pessoa disse de verdade
- descreva o que cada personagem fez após cada fala importante
- nunca escreva: "percebi", "entendi", "a sensação", "era mais do que", "naquele momento"
- linguagem coloquial: "parecia cimento" — não "da forma mais inusitada possível"
- escreva 5 a 6 posts com desenvolvimento denso — não resuma, desenvolva cada cena
- CADA post deve ter no máximo ${THREADS_TEXT_MAX_CHARS} caracteres (limite do Threads), contando letras, espaços, pontuação e qualquer URL/link`;


  // Strip any URLs — prevents product URL from leaking into the story
  const stripUrls = (s: string) => s.replace(/https?:\/\/[^\s,)]+/g, "").trim();

  // Give the model the CONTEXT of the product, not the name.
  // Naming it upfront causes the model to drop it early and kill curiosity.
  const situationContext = universe.pains.length > 0
    ? universe.pains.slice(0, 2).map(stripUrls).filter(Boolean).join("; ")
    : stripUrls(productName);

  // Narrator context — explicit gender rules so the model never confuses relationship pronouns
  const genderHint = narrator.sex === "female" ? "narradora mulher" : "narrador homem";
  const genderRule = narrator.sex === "female"
    ? "Parceiros românticos da narradora são HOMENS: namorado, marido, ex-namorado. Nunca use namorada, esposa, ex-namorada para se referir ao parceiro dela. Use feminino para a narradora (traída, sozinha, cansada)."
    : "Parceiras românticas do narrador são MULHERES: namorada, esposa, ex-namorada. Nunca use namorado, marido, ex-namorado para se referir à parceira dele. Use masculino para o narrador (traído, sozinho, cansado).";
  const narratorContext = genderHint;
  const identityRules = buildNarratorIdentityRules(narrator);
  // Voice hint appended after narrator line (descritivo, nunca instrução)
  const narratorLine = hintText
    ? `Narrador: ${narratorContext}\n${identityRules}\n${genderRule}\n${hintText}`
    : `Narrador: ${narratorContext}\n${identityRules}\n${genderRule}`;

  const examplesBlock = examples
    .map((ex, i) => `=== EXEMPLO ${i + 1} ===\n${ex}`)
    .join("\n\n");

  const situacaoLine = incidentSeed
    ? `Acontecimento central desta história: ${incidentSeed}

Este acontecimento realmente aconteceu dentro da narrativa.
Não substitua por outro conflito.
Conte como ele foi descoberto, o que as pessoas fizeram e o que aconteceu depois.
Você é livre para decidir quando revelar tudo e como organizar os posts.`
    : customTheme
    ? `Crie uma história envolvendo: ${customTheme}. Desenvolva personagens, tensão e drama dentro desse tema.`
    : `Situação: alguém próximo fez algo grave contra a narradora — traiu, mentiu, humilhou, expôs, sabotou, abandonou, fingiu.`;

  const productBlock = withLink
    ? `Contexto em que o produto aparece: ${situationContext}

Posts 1 até o penúltimo: só acontecimentos e falas. Sem mencionar o produto.
Último post: crie uma cena de vida real onde o produto faz sentido aparecer depois do que aconteceu. Use o contexto (${situationContext}) para decidir QUAL cena seria essa. Nessa cena, outro personagem manda ou traz "isso aqui [LINK]" — nunca o narrador recomendando.
CERTO: "Minha mãe veio me ajudar a reorganizar o apartamento depois que ele saiu. Trouxe isso aqui [LINK]"
CERTO: "Dias depois minha prima me mandou isso aqui [LINK] dizendo que tinha comprado pra mim quando me viu assim"
ERRADO: "meu irmão me mandou isso aqui para me ajudar a superar" (vago, sem cena de vida real)
Pergunta final: específica da situação. CERTO: "Eu fui sincera demais?" ERRADO: "Você também já passou por isso?"
[LINK] = exatamente esses 6 caracteres. Não escreva URL. Não invente domínio. Nunca diga o que é o produto, nunca nomeie ou descreva o que está no link.`
    : `Todos os posts: só acontecimentos, falas e reações. Sem mencionar produto ou link.
Último post: encerre a história e termine com uma pergunta provocativa, específica da situação que aconteceu.
CERTO: "Eu errei em confrontar ela na frente de todo mundo?" ERRADO: "Você também já passou por algo assim?"`;

  const user = `Leia os exemplos APENAS para aprender o ritmo e o estilo. A história que você vai escrever deve ser completamente diferente — outros personagens, outro tipo de traição, outro cenário. Não repita o padrão dos exemplos.

${examplesBlock}

---

${situacaoLine}
${narratorLine}

${productBlock}
Não copie os exemplos.

Responda APENAS com JSON válido:
{"posts": [{"position": 1, "content": "..."}, {"position": 2, "content": "..."}]}`;

  const text = await callLLM(system, user, config, 1800, ctx, "geração", 0, seed);

  let rawPosts: StoryPost[];
  try {
    const parsed = extractJson<{ posts: StoryPost[] }>(text);
    rawPosts = (parsed.posts ?? []).filter(p => p.content?.trim());
    if (rawPosts.length === 0) throw new Error("Nenhum post gerado.");
    rawPosts = rawPosts.slice(0, 6);
  } catch {
    throw new Error(`Falha ao parsear posts: ${text.slice(0, 200)}`);
  }

  // ── Incident validation and retry ─────────────────────────────────────────
  let incidentFollowed = !incidentSeed;
  let retryTriggered = false;

  if (incidentSeed) {
    incidentFollowed = validateIncidentFollowed(rawPosts, incidentSeed);
    if (!incidentFollowed) {
      retryTriggered = true;
      const retryUser = user + "\n\nA resposta anterior ignorou o acontecimento central. Refaça usando obrigatoriamente o incidente informado, sem mudar o estilo.";
      try {
        const retryText = await callLLM(system, retryUser, config, 1400, ctx, "retry-incident", 0, seed);
        const retryParsed = extractJson<{ posts: StoryPost[] }>(retryText);
        const retryPosts = (retryParsed.posts ?? []).filter(p => p.content?.trim()).slice(0, 6);
        if (retryPosts.length > 0) {
          rawPosts = retryPosts;
          incidentFollowed = validateIncidentFollowed(rawPosts, incidentSeed);
        }
      } catch {
        // Retry failed — use original rawPosts as fallback
      }
    }
  }

  // Identity is immutable. This focused retry keeps the same narrative shape
  // and changes only facts that contradict the narrator profile.
  const identityViolations = findNarratorIdentityViolations(
    rawPosts.map((post) => post.content).join("\n"),
    narrator,
  );
  if (identityViolations.length > 0) {
    const retryUser = `${user}\n\nA resposta anterior contradisse a identidade fixa da pessoa narradora: ${identityViolations.join("; ")}.
Refaça a mesma proposta narrativa, com o mesmo ritmo, estrutura e intensidade, alterando somente os fatos incompatíveis. Respeite integralmente a identidade fixa.`;
    const retryText = await callLLM(system, retryUser, config, 1800, ctx, "retry-identidade", 0, seed);
    const retryParsed = extractJson<{ posts: StoryPost[] }>(retryText);
    const retryPosts = (retryParsed.posts ?? []).filter((post) => post.content?.trim()).slice(0, 6);
    const retryViolations = findNarratorIdentityViolations(
      retryPosts.map((post) => post.content).join("\n"),
      narrator,
    );
    if (retryPosts.length === 0 || retryViolations.length > 0) {
      throw new Error(`A narrativa contradiz a identidade do narrador: ${(retryViolations.length ? retryViolations : identityViolations).join("; ")}`);
    }
    rawPosts = retryPosts;
    if (incidentSeed) incidentFollowed = validateIncidentFollowed(rawPosts, incidentSeed);
  }

  let posts = withLink ? resolveProductLink(rawPosts, productUrl, seed) : rawPosts;

  // Threads hard limit — one rewrite attempt, then hard-fail (never silent truncate)
  let oversized = findOversizedThreadsPosts(posts);
  if (oversized.length > 0) {
    const detail = oversized
      .map((p) => `post ${p.position}: ${p.length} caracteres`)
      .join("; ");
    const lengthRetryUser = `${user}

A resposta anterior excedeu o limite de ${THREADS_TEXT_MAX_CHARS} caracteres por post do Threads (${detail}).
Reescreva a MESMA história com o mesmo ritmo e estilo, mas CADA post com no máximo ${THREADS_TEXT_MAX_CHARS} caracteres (incluindo URL/link se houver).
Conte caracteres com rigor. Não junte posts; mantenha 5 a 6 posts curtos o suficiente.`;
    try {
      const retryText = await callLLM(system, lengthRetryUser, config, 1800, ctx, "retry-length", 0, seed);
      const retryParsed = extractJson<{ posts: StoryPost[] }>(retryText);
      const retryPosts = (retryParsed.posts ?? []).filter((p) => p.content?.trim()).slice(0, 6);
      if (retryPosts.length > 0) {
        rawPosts = retryPosts;
        posts = withLink ? resolveProductLink(rawPosts, productUrl, seed) : rawPosts;
        if (incidentSeed) incidentFollowed = validateIncidentFollowed(rawPosts, incidentSeed);
      }
    } catch {
      // fall through to hard assert below
    }
    oversized = findOversizedThreadsPosts(posts);
    if (oversized.length > 0) {
      assertThreadsPostsWithinLimit(posts);
    }
  }

  const score = scoreStory(posts, productUrl);

  // Minimal stub for narrative-engine.ts compatibility
  const firstPostContent = posts[0]?.content ?? "";
  const conflictStub = CONFLICT_BANK[seed % CONFLICT_BANK.length];

  const voiceExperimentDebug: VoiceExperimentData | undefined = voiceExperiment
    ? {
        mode: "exploration",
        dimension: "tone",
        value: toneValue,
        selected: true,
        applied: hintText !== null,
        hintText,
        ragExampleIndices,
        seed,
        seedSentToApi,
        promptVersion: "voice-v0",
      }
    : undefined;

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
    voiceExperiment: voiceExperimentDebug,
    ...(incidentSeed !== undefined ? { incidentFollowed, retryTriggered } : {}),
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
