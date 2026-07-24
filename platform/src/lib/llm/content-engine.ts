// Content Engine — Single-post content for non-story modes
//
// Handles: Desabafo, Polêmica, Pergunta
// No product, no link. Pure engagement content.
// Product universe used only for audience calibration (optional).

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import {
  THREADS_TEXT_MAX_CHARS,
  assertThreadsPostsWithinLimit,
  measureThreadsTextLength,
} from "@/lib/publishing/threads-limits";

export type SingleContentMode = "desabafo" | "polemica" | "pergunta";

interface Ctx { callCount: number; totalTokens: number }

function resolveBaseUrl(config: LlmProviderConfig): string {
  if (config.baseUrl) return config.baseUrl.replace(/\/$/, "");
  if (config.provider === "openai")     return "https://api.openai.com/v1";
  if (config.provider === "openrouter") return "https://openrouter.ai/api/v1";
  if (config.provider === "anthropic")  return "https://api.anthropic.com/v1";
  return "https://api.groq.com/openai/v1";
}

function resolveModel(config: LlmProviderConfig): string {
  if (config.model) return config.model;
  if (config.provider === "openai")    return "gpt-4o-mini";
  if (config.provider === "anthropic") return "claude-haiku-4-5-20251001";
  return "llama-3.3-70b-versatile";
}

async function call(
  system: string,
  user: string,
  config: LlmProviderConfig,
  ctx: Ctx,
  seed: number,
): Promise<string> {
  ctx.callCount++;
  const baseUrl = resolveBaseUrl(config);
  const model   = resolveModel(config);
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
        { role: "system", content: system },
        { role: "user",   content: user },
      ],
      temperature: 1.0,
      max_tokens: 300,
      ...(supportsSeed ? { seed } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Content Engine API ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };
  ctx.totalTokens += json.usage?.total_tokens ?? 0;
  return json.choices[0]?.message?.content ?? "";
}

function buildAudienceCtx(universe: ProductUniverse | null): string {
  const pains = universe?.pains ?? [];
  return pains.length > 0
    ? pains.slice(0, 2).filter(Boolean).join("; ").replace(/https?:\/\/[^\s,)]+/g, "").trim()
    : "relacionamentos, amizades e emoções do cotidiano";
}

function extractPost(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
  const clean  = fence ? fence[1] : raw;
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s !== -1 && e !== -1) {
    try {
      const parsed = JSON.parse(clean.slice(s, e + 1)) as { post?: string };
      if (parsed.post) return parsed.post.trim();
    } catch {
      // fall through to raw
    }
  }
  return raw.trim();
}

const PROMPTS: Record<SingleContentMode, { system: string; userTpl: () => string }> = {
  desabafo: {
    system: `Você escreve desabafos para Threads. São pensamentos pessoais e crus sobre traição, inveja, decepção, relacionamentos, briga. Fazem o leitor pensar "exatamente isso" ou se sentir validado na raiva.

Exemplos CERTOS:
- Minha melhor amiga ficou com meu ex dois meses depois que a gente terminou. Até hoje ela acha que não fez nada de errado.
- O pior da traição não é o ato. É descobrir que a pessoa te conhecia bem o suficiente pra saber que ia te destruir e fez mesmo assim.
- Tem gente que te trata super bem quando precisa de você e some completamente quando você precisa delas. Isso tem nome, só que as pessoas odeiam quando falam.
- Engraçado que quando a mulher cobra, ela é grossa. Quando o homem some, é que ele precisa de espaço. Que espaço é esse?
- Dou risada quando falam que sou dramática. Mas quando eu ficava calada, ninguém me levava a sério. Quando falo, sou exagerada. Então qual é o tom certo?
- Todo mundo fala que o tempo cura. Mas o tempo não cura nada, só acostuma.

Exemplos ERRADOS (genéricos, sem drama):
- As coisas são complicadas às vezes
- A vida tem altos e baixos
- Às vezes tudo parece difícil

Regras:
- Sobre pessoas reais fazendo coisas reais que machucam
- Tom de alguém desabafando mesmo, não filosofando
- 2 a 4 frases no máximo
- Sem hashtag, sem emoji, sem resolução no final`,
    userTpl: () => `Escreva 1 desabafo de verdade. Escolha um destes temas — VARIE, não repita sempre o mesmo:
- traição romântica (ficou com ex, traiu, voltou para o que te machucou)
- inveja disfarçada de amizade
- decepção com família
- guerra dos sexos (homem não assume, mulher cobra e é a errada)
- amiga que some quando não precisa mais
- pessoa que mente na cara dura
- ciúme, possessividade, controle em relacionamento
- ex que volta querendo segunda chance depois de te destruir

Responda APENAS com JSON: {"post": "..."}`,
  },

  polemica: {
    system: `Você escreve opiniões polêmicas para Threads. Uma polêmica forte faz metade das pessoas concordarem com raiva e metade discordarem com raiva ainda maior. Os comentários explodem.

Exemplos CERTOS:
- Homem que fica com a ex de amigo não é amigo. Ponto final. Não existe justificativa.
- Mulher que perdoa traição não perdoou. Só adiou o próximo episódio.
- Traição emocional é pior do que a física. E quem faz traição emocional acha que não fez nada.
- Se o homem não colocou limite desde o começo, ele nunca vai colocar.
- Amizade entre homem e mulher só funciona quando um dos dois ficou na amizade sem querer.
- Todo homem que fala que não é ciumento já foi ou vai ser obcecado por alguém.
- Mulher que diz que não tem ciúme é a mais ciumenta da sala, só aprendeu a esconder.
- Quem trai uma vez não trai de novo porque quis. Trai porque não foi pego na primeira.
- A maioria das amizades femininas é inveja disfarçada de amor. Vou embora antes de alguém me processar.
- Homem que faz questão de ter amiga mulher próxima, mantém a opção em aberto.

Regras:
- Uma ou duas frases, afirmação direta
- Sem explicar, sem justificar — a afirmação fica no ar sozinha
- Deve dividir a sala — metade brava concordando, metade brava discordando
- Sem hashtag, sem emoji`,
    userTpl: () => `Escreva 1 opinião polêmica. Escolha um ângulo — VARIE entre eles:
- guerra dos sexos (comportamento de homens vs comportamento de mulheres)
- traição e quem é culpado
- amizade falsa e inveja
- padrão duplo (o que é aceitável para um não é para o outro)
- relacionamento tóxico e quem se mantém nele
- ciúme, controle, possessividade
- família que decepciona
- dinheiro em relacionamento

Responda APENAS com JSON: {"post": "..."}`,
  },

  pergunta: {
    system: `Você escreve perguntas para Threads. Uma pergunta forte faz todo mundo querer responder e ver o que os outros responderam. Específica, pessoal, sobre situações reais de relacionamento, traição, briga, inveja.

Exemplos CERTOS:
- Mulheres, vocês continuariam a amizade com alguém que ficou com o ex de vocês?
- Vocês perdoariam uma traição se soubessem que nunca iam descobrir de verdade?
- Homens, vocês voltariam com uma ex sabendo que ela traiu o cara que ficou antes de você?
- Se você soubesse que o namorado de uma amiga tá te traindo com ela, falaria pra amiga?
- Qual é pior: descobrir a traição ou descobrir que seus amigos já sabiam antes de você?
- Vocês conseguiriam ser amigos do ex que te traiu depois de um tempo?
- Homens, quando vocês somem é porque precisam de espaço ou porque acharam outra opção?
- Mulheres, vocês já fingiram não ver uma traição porque tinham medo de perder a pessoa?
- Vocês já eliminaram alguém da vida e depois se arrependeram por ter demorado tanto?

Exemplos ERRADOS:
- Qual é a sua maior conveniência?
- Como você lida com as dificuldades do dia a dia?
- O que você faria diferente na vida?

Regras:
- Uma pergunta só — específica e pessoal
- Pode começar com "Mulheres..." ou "Homens..." para polarizar
- Deve gerar debate nos comentários
- Sem hashtag, sem emoji`,
    userTpl: () => `Escreva 1 pergunta provocativa sobre relacionamentos, traição, briga ou guerra dos sexos. Varie o tema:
- traição (descobrir, perdoar, contar pra alguém)
- amiga/amigo que decepcionou
- ex que voltou
- comportamento de homem vs comportamento de mulher
- ciúme e possessividade
- família que se mete no relacionamento

Responda APENAS com JSON: {"post": "..."}`,
  },
};

export interface ContentResult {
  post: string;
  callCount: number;
  totalTokens: number;
  durationMs: number;
  provider: string;
  model: string;
}

export async function generateContentPost(
  universe: ProductUniverse | null,
  contentMode: SingleContentMode,
  seed: number,
  config: LlmProviderConfig,
): Promise<ContentResult> {
  const t0  = Date.now();
  const ctx: Ctx = { callCount: 0, totalTokens: 0 };

  void buildAudienceCtx(universe); // universe kept for potential future use
  const { system, userTpl } = PROMPTS[contentMode];
  const baseUser = userTpl();
  const systemWithLimit = `${system}

Limite obrigatório: o post final deve ter no máximo ${THREADS_TEXT_MAX_CHARS} caracteres.`;
  let raw = await call(systemWithLimit, baseUser, config, ctx, seed);
  let post = extractPost(raw);

  if (measureThreadsTextLength(post) > THREADS_TEXT_MAX_CHARS) {
    const retryUser = `${baseUser}

A resposta anterior tinha ${measureThreadsTextLength(post)} caracteres (limite ${THREADS_TEXT_MAX_CHARS}).
Reescreva o MESMO post com no máximo ${THREADS_TEXT_MAX_CHARS} caracteres, sem perder a ideia central.`;
    try {
      raw = await call(systemWithLimit, retryUser, config, ctx, seed + 1);
      post = extractPost(raw);
    } catch {
      // fall through to assert
    }
  }

  assertThreadsPostsWithinLimit([{ position: 1, content: post }]);

  return {
    post,
    callCount:  ctx.callCount,
    totalTokens: ctx.totalTokens,
    durationMs: Date.now() - t0,
    provider:   config.provider,
    model:      config.model ?? resolveModel(config),
  };
}
