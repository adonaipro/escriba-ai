/**
 * Narrative Writer
 *
 * Receives a NarrativeBriefing and produces PostContent[] via a single LLM call.
 * Every provider gets the same system + user prompt.
 */

import type { NarrativeBriefing, NarrativeBeat } from "./narrative-director";
import type { LlmProviderConfig } from "./types";

export interface PostContent {
  position: number;
  content: string;
  hasMedia: boolean;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é uma mulher escrevendo no Threads sobre algo que aconteceu com ela. Você não sabe que é uma IA. Você é a própria pessoa.

A FILOSOFIA CENTRAL
Você está contando uma fofoca. Não uma história. Não uma crônica. Não um texto literário. Uma fofoca — como contaria para sua melhor amiga às 22h no WhatsApp.
O leitor precisa sentir: "Meu Deus... e depois?" — nunca "que texto bonito."

REGRA DE ABERTURA (A MAIS IMPORTANTE)
A primeira frase da thread deve nomear uma PESSOA e o que essa pessoa FEZ.
Nunca abra com: o sol, a janela, o silêncio, a luz, o cheiro, o apartamento, o relógio, o clima, o frescor, a tarde.
Essas aberturas matam a curiosidade antes de nascer.

CORRETO:
"Minha mãe entrou no meu quarto sem bater."
"Minha amiga não apareceu como tinha combinado."
"Meu chefe falou uma coisa que ficou."

ERRADO:
"Sábado. Acordo cedo, sem motivo."
"A luz entrava pela janela enquanto eu tomava um café."
"O silêncio do apartamento era agradável."

ESTRUTURA DE CADA POST
Cada post responde: O que aconteceu AGORA?
A resposta deve ser AÇÃO ou DIÁLOGO — nunca só reflexão ou atmosfera.

DIÁLOGOS SÃO PRIORIDADE
Mais diálogo = mais vida = mais leitura.
Diálogos curtos e reais — como conversa de verdade:
— Você não ia esperar?
— Achei que não precisava.
— A gente tinha combinado.
— Você sempre entende.

MOSTRE. NÃO EXPLIQUE.
RUIM: "Eu me senti invadida."
BOM:
Minha mãe entrou no meu quarto sem bater.
Abriu o armário.
Pegou uma blusa.
Saiu.
Como se eu nem estivesse ali.
O leitor entende sozinho. Não explique o que o leitor já sentiu.

LIMITE DE INTROSPECÇÃO
Evite excesso de frases como:
eu pensei / eu senti / eu percebi / eu comecei a entender / meu coração acelerou / algo estava faltando / processando aquilo em silêncio
Prefira acontecimentos. O que aconteceu? O que foi dito?

PRODUTO
O produto participa da história — não a interrompe.
Não: "Depois encontrei esse produto."
Sim: "Minha amiga chegou com aquilo." / "Meu pai me mandou esse link." / "Minha irmã tinha comprado."
O produto entra por alguém da história ou de forma que faça sentido com o que aconteceu.
Não descreva o produto. Não liste características. Não use linguagem de anúncio.

TAMANHO
O tamanho de cada post deve ser o que aquele momento exige.
Diálogos: mais curtos, mais diretos.
Acontecimentos importantes: podem ser maiores.
Nunca encha com reflexão para ter mais texto.

PROIBIDO ABSOLUTAMENTE — IDIOMA
Português brasileiro. Nenhuma palavra em inglês no texto corrido:
- "feeling", "lost", "really", "shrugged" e qualquer anglicismo

PROIBIDO ABSOLUTAMENTE — FRASES GENÉRICAS
Nenhuma dessas frases (nem variações próximas):
- "Comecei a perceber" / "Percebi que" / "Aprendi que"
- "Me fez refletir" / "Me fez perceber" / "Me dei conta"
- "No fundo" / "É sobre" / "Nunca é sobre"
- "O importante é" / "É preciso" / "Cada um tem seu tempo"
- "Às vezes a vida nos ensina"
- "Naquele momento"
- "Entendi que" / "Passei a entender"
- "Fiquei pensando"

CRITÉRIO ANTES DE FINALIZAR CADA POST
1. "O leitor ganhou uma informação nova?" — se não, reescreva.
2. "Alguma frase explica um sentimento que poderia ser mostrado como ação ou diálogo?" — se sim, converta.

CRITÉRIO ANTES DE FINALIZAR O POST 1
"Se alguém lesse apenas esta primeira frase, pararia para abrir a próxima?" — se não, reescreva.
A primeira frase PRECISA nomear uma pessoa e o que ela fez.

FORMATO DE SAÍDA
Retorne APENAS um objeto JSON puro, sem nenhum texto antes ou depois, sem blocos de código markdown:
{"posts":[{"position":1,"content":"texto"},{"position":2,"content":"texto"}]}

Aspas dentro do texto: escape com barra: \"assim\"
Quebras de linha: \\n
Sem caracteres de controle não escapados
O JSON deve começar com { e terminar com }`;

function formatBeat(beat: NarrativeBeat): string {
  const lines: string[] = [
    `POST ${beat.postIndex}:`,
    `  O QUE ACONTECE: ${beat.event}`,
    `  O QUE O LEITOR DESCOBRE: ${beat.newInformation}`,
  ];
  if (beat.sensoryDetail)       lines.push(`  DETALHE CONCRETO (parte da ação, não do ambiente): ${beat.sensoryDetail}`);
  if (beat.dialogueOpportunity) lines.push(`  DIÁLOGO PRIORITÁRIO: ${beat.dialogueOpportunity}`);
  if (beat.unresolvedQuestion)  lines.push(`  QUESTÃO ABERTA: ${beat.unresolvedQuestion}`);
  if (beat.readerHook) {
    lines.push(`  GANCHO PARA O PRÓXIMO POST: ${beat.readerHook}`);
    lines.push(`    → Não escreva esse gancho como pergunta explícita nem como comentário direto. Construa o post para que essa tensão fique aberta naturalmente no final. O leitor deve sentir o gancho, não lê-lo.`);
  }
  return lines.join("\n");
}

function buildUserPrompt(
  briefing: NarrativeBriefing,
  productUrl: string,
  productName: string,
): string {
  const { narratorProfile: p, scene, productUniverse } = briefing;

  const beatsText = briefing.beats.map(formatBeat).join("\n\n");

  return `BRIEFING NARRATIVO

━━━ ABERTURA OBRIGATÓRIA (GOSSIP HOOK) ━━━
Esta é a primeira frase do Post 1. Use-a LITERALMENTE — não mude nenhuma palavra:
"${briefing.gossipHook}"
Após essa frase: mostre imediatamente o que ${scene.character} fez. Ação direta. Sem cenário. Sem rotina. Sem ambiente.

━━━ A PESSOA E O QUE ACONTECEU ━━━
Quem: ${scene.character}
O que fez: ${scene.character} ${scene.action}
O que foi violado/envolvido: ${scene.conflictObject}
Família do conflito: ${scene.conflictFamily}
Onde/quando: ${scene.location}, ${scene.moment} — só entra no texto se for parte direta da ação

━━━ A NARRADORA ━━━
Nome: ${p.name}
Perfil: ${p.sex}, ${p.ageRange}, ${p.maritalStatus}${p.hasChildren ? ", tem filhos" : ""}${p.livesAlone ? ", mora sozinha" : ""}
Conflito: ${p.conflictStyle === "avoids" ? "evita confronto, guarda pra si" : p.conflictStyle === "confronts" ? "confronta na hora, mesmo que saia errado" : p.conflictStyle === "deflects" ? "desvia, muda de assunto, às vezes ri sem graça" : "não fala, processa internamente, fica com o peso"}
Compartilha: ${p.shareStyle === "tells_friends" ? "conta para amigas (reações divididas)" : p.shareStyle === "keeps_private" ? "guarda tudo para si" : "processa sozinha, não conta"}
Expressão: ${p.expressionStyle === "emotional" ? "emocional e direta" : p.expressionStyle === "dry" ? "seca, observacional" : p.expressionStyle === "reflective" ? "reflexiva, introspectiva" : "direta, objetiva"}

━━━ PRODUTO ━━━
Nome: ${productName}
URL: ${productUrl}
Categoria: ${productUniverse.categoryLabel ?? "produto de consumo"}

━━━ VERDADE CENTRAL ━━━
${briefing.centralTruth}
(Não escreva essa frase em nenhum post. Ela orienta os acontecimentos e diálogos — sem ser dita.)

━━━ MOTOR DE RETENÇÃO ━━━
${briefing.readerHook}
(A thread orbita o que ainda não foi revelado. O leitor sente essa ausência — você não a anuncia.)

━━━ TENSÃO ━━━
${briefing.narrativeTension}

━━━ PREMISSA ━━━
${briefing.premise}

━━━ ESTRATÉGIA DE ABERTURA ━━━
${briefing.openingStrategy}

━━━ PLANO POR POST ━━━
Escreva exatamente ${briefing.postCount} posts seguindo esses beats:

${beatsText}

━━━ COMO O PRODUTO ENTRA ━━━
Post ${briefing.productMoment.postIndex}: ${briefing.productMoment.trigger}
Conexão com a história: ${briefing.productMoment.relationToStory}
Link: ${productUrl}

COMO ESCREVER O POST ${briefing.productMoment.postIndex}:
- O produto aparece dentro da narrativa — alguém trouxe, mandou ou a narradora encontrou
- NÃO descreva o produto. NÃO liste características. NÃO use linguagem de anúncio.
- O link ${productUrl} aparece uma vez, naturalmente, dentro da narração
- Este post continua sendo ação ou diálogo — algo acontece, algo é revelado
${briefing.productMoment.postIndex < briefing.postCount ? `\nATENÇÃO: o produto entra no post ${briefing.productMoment.postIndex}, não no último. A thread continua com fechamento emocional depois.` : ""}
━━━ ENCERRAMENTO ━━━
${briefing.endingMode}

━━━ PERGUNTA AO LEITOR ━━━
${briefing.openQuestions.join(" / ")}
(inclua no último post, de forma natural — não force)

━━━ REGRAS FINAIS ━━━
- Post 1: use a frase de abertura fornecida literalmente como primeira frase
- Cada post responde: o que aconteceu AGORA? — em ação ou diálogo, nunca só reflexão
- Diálogos têm prioridade sobre descrições
- Máximo de 1 frase reflexiva por post — o resto: acontecimentos
- Sem cenário no post 1 (sem sol, luz, silêncio, janela, relógio, cheiro)
- O link ${productUrl} aparece no post ${briefing.productMoment.postIndex}
- Critério de qualidade: cada post termina com algo em aberto — tensão natural, não pergunta explícita

Retorne apenas o JSON conforme o formato definido no sistema.`;
}

// ─── Provider calls ───────────────────────────────────────────────────────────

async function callAnthropic(
  config: LlmProviderConfig,
  userPrompt: string,
): Promise<string> {
  const model = config.model ?? "claude-haiku-4-5-20251001";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 5000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

function parseRetryAfter(errorBody: string): number {
  const match = errorBody.match(/try again in (\d+(?:\.\d+)?)s/i);
  return match ? Math.ceil(parseFloat(match[1])) * 1000 + 2000 : 20000;
}

async function callOpenAI(
  config: LlmProviderConfig,
  userPrompt: string,
  retries = 3,
): Promise<string> {
  const baseUrl = config.baseUrl || "https://api.openai.com/v1";
  const model   = config.model  ?? "gpt-4o-mini";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      max_tokens: 5000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 429 && retries > 0) {
      const wait = parseRetryAfter(err);
      await new Promise((r) => setTimeout(r, wait));
      return callOpenAI(config, userPrompt, retries - 1);
    }
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

async function callOpenRouter(
  config: LlmProviderConfig,
  userPrompt: string,
): Promise<string> {
  const baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
  const model   = config.model  ?? "anthropic/claude-haiku-4-5";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": "https://grok.mtxcapital.com.br",
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      max_tokens: 5000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function parsePosts(raw: string, expectedCount: number): PostContent[] {
  const trimmed = raw.trim();

  // Extract JSON block (handles ```json ... ``` or bare JSON)
  // Strip code fences if present (Llama models often wrap even when told not to)
  let jsonStr = trimmed
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  // Find JSON object boundaries (handles leading/trailing text)
  const start = jsonStr.indexOf("{");
  const end   = jsonStr.lastIndexOf("}");
  if (start !== -1 && end > start) {
    jsonStr = jsonStr.slice(start, end + 1);
  }

  let parsed: { posts: Array<{ position: number; content: string }> };
  try {
    parsed = JSON.parse(jsonStr) as typeof parsed;
  } catch {
    // Fallback: extract each post via regex (handles unescaped quotes in dialogue)
    const postMatches = [...jsonStr.matchAll(/"position"\s*:\s*(\d+)[^}]*?"content"\s*:\s*"([\s\S]*?)(?<!\\)"\s*\}/g)];
    if (postMatches.length > 0) {
      parsed = {
        posts: postMatches.map((m) => ({
          position: parseInt(m[1], 10),
          content:  m[2].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
        })),
      };
    } else {
      throw new Error(`LLM returned non-JSON response: ${trimmed.slice(0, 300)}`);
    }
  }

  if (!Array.isArray(parsed.posts) || parsed.posts.length === 0) {
    throw new Error(`LLM returned empty posts array`);
  }

  const posts: PostContent[] = parsed.posts.map((p, i) => ({
    position: p.position ?? i + 1,
    content:  (p.content ?? "").trim(),
    hasMedia: false,
  }));

  if (posts.length !== expectedCount) {
    console.warn(`[NarrativeWriter] Expected ${expectedCount} posts, got ${posts.length}`);
  }

  return posts;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function writeNarrative(
  briefing: NarrativeBriefing,
  config: LlmProviderConfig,
  productUrl: string,
  productName: string,
): Promise<PostContent[]> {
  const userPrompt = buildUserPrompt(briefing, productUrl, productName);

  let raw: string;

  switch (config.provider) {
    case "anthropic":
      raw = await callAnthropic(config, userPrompt);
      break;
    case "openai":
      raw = await callOpenAI(config, userPrompt);
      break;
    case "openrouter":
      raw = await callOpenRouter(config, userPrompt);
      break;
    case "groq":
      raw = await callOpenAI(
        { ...config, baseUrl: config.baseUrl || "https://api.groq.com/openai/v1" },
        userPrompt,
      );
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }

  return parsePosts(raw, briefing.postCount);
}
