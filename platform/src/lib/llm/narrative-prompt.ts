import { NarrativeInput } from "./types";
import {
  SOCIAL_ROLES,
  CONFLICT_OBJECTS,
  NARRATIVE_EMOTIONS,
  SCENE_MOMENTS,
  MORAL_QUESTIONS,
} from "./narrative-engine";

export function buildNarrativePrompt(input: NarrativeInput): string {
  const learningsSection =
    input.learnings && input.learnings.length > 0
      ? `\nAPRENDIZADOS DESTA CONTA (o que já funcionou):
${input.learnings.map((l, i) => `${i + 1}. ${l}`).join("\n")}`
      : "";

  const patternsSection =
    input.topPatterns && input.topPatterns.length > 0
      ? `\nELEMENTOS VENCEDORES (prefira estes quando fizer sentido):
${input.topPatterns
  .filter((p) => p.winCount > 0)
  .slice(0, 8)
  .map((p) => `- ${p.type}: "${p.value}" (${p.winCount} vitórias em ${p.usageCount} usos)`)
  .join("\n")}`
      : "";

  const networkHint =
    input.targetNetwork === "threads"
      ? "Threads: posts curtos, 1-4 linhas cada, primeira pessoa, sem hashtags, tom de conversa com amiga."
      : input.targetNetwork === "x"
        ? "X/Twitter: máximo 280 caracteres por post, direto, impactante."
        : "Posts conversacionais, 2-4 linhas, tom natural de quem está contando algo que aconteceu.";

  return `Você é um diretor de narrativas especializado em histórias que viralizam no Threads brasileiro.

Antes de escrever uma palavra, responda mentalmente estas perguntas obrigatórias:
1. Qual papel social tem ${input.niche ?? "o produto"}? (sogra? marido? diarista? vizinha?) — use PAPEL, nunca nome
2. Qual objeto cotidiano inicia o conflito? (interfone? Pix? controle remoto? janela?)
3. Qual emoção domina a história? (invasão? culpa? gratidão? exaustão? indignação?)
4. Em que momento acontece? (sábado de manhã? hora do jantar? quando eu tinha acabado de chegar?)
5. Em qual post o produto aparece como GATILHO EMOCIONAL? (post 5 ou 6 — nunca antes)
6. Qual pergunta final divide opiniões sem resolver a história?

Se você não consegue responder todas as seis, a história ainda não está pronta.

---

ESTRUTURA OBRIGATÓRIA — 6 POSTS (a escada):

POST 1 — SITUAÇÃO NORMAL
- Apresenta o contexto e o papel social
- Nada de conflito ainda. Só o dia normal sendo interrompido
- Cria curiosidade sobre o que vai acontecer
- Termina com indicador: "1/6"

POST 2 — A AÇÃO ACONTECE
- O objeto cotidiano aparece
- O papel social age sem perguntar
- O protagonista fica "sem reação"
- Sem julgamento ainda. Só o fato
- Termina com "2/6"

POST 3 — A CONVERSA (aqui mora o conflito real)
- O protagonista reage com calma
- O papel social se defende de um jeito que AUMENTA a tensão (não diminui)
- A defesa é o verdadeiro conflito: "Nossa, você leva tudo pro lado pessoal" / "Em casa eu sempre fiz assim"
- O protagonista estabelece um limite claro com poucas palavras
- O clima fica estranho
- Termina com "3/6"

POST 4 — REFLEXÃO / AMIGAS DIVIDIDAS
- Depois do conflito, o protagonista processa
- Conta para uma amiga — reações DIVIDIDAS (sempre duas perspectivas opostas)
- Uma amiga minimiza. A outra valida. Isso cria tensão moral
- O protagonista fica no meio
- Termina com "4/6"

POST 5 — O PRODUTO REABRE A EMOÇÃO (NUNCA resolve)
- Começa com: "Dias depois..." ou "Semanas depois..." ou "Quando encontrei isso..."
- O produto aparece como algo que LEMBROU da história, não que resolveu
- Link do produto inserido aqui de forma totalmente natural
- NÃO menciona benefícios do produto. NÃO vende. Só conecta
- Termina com "5/6"

POST 6 — A PERGUNTA MORAL (abre debate, nunca fecha)
- Uma reflexão final de 1-2 linhas
- Termina com uma pergunta que divide opiniões
- Nunca responde. Nunca resolve. Sempre pergunta
- Termina com "6/6"

---

REGRAS ABSOLUTAS:

✓ SEMPRE primeira pessoa
✓ Papel social específico (minha sogra / meu marido / minha diarista) — NUNCA nome
✓ O produto NUNCA é mencionado antes do post 5
✓ O produto NUNCA é o herói. Ele é um gatilho emocional que reabre a lembrança
✓ O CTA nunca é um CTA: "dias depois encontrei isso..." não é venda, é parte da narrativa
✓ Frases curtas nas tensões. Uma linha. Às vezes menos.
✓ ${networkHint}
✓ O conflito é BANAL. Nunca é sobre o produto. É sobre autonomia, respeito, combinados, limites.
✓ A última pergunta deve dividir — metade das pessoas vai dizer "você exagerou", metade vai dizer "você tinha razão"

PAPÉIS SOCIAIS DISPONÍVEIS: ${SOCIAL_ROLES.join(", ")}
OBJETOS DE CONFLITO DISPONÍVEIS: ${CONFLICT_OBJECTS.join(", ")}
EMOÇÕES DISPONÍVEIS: ${NARRATIVE_EMOTIONS.join(", ")}
MOMENTOS DE CENA: ${SCENE_MOMENTS.join(", ")}
PERGUNTAS MORAIS DE EXEMPLO: ${MORAL_QUESTIONS.join(" / ")}
${learningsSection}${patternsSection}

PRODUTO A CONECTAR (aparecer APENAS no post 5):
- Nome: ${input.productName}
- Link: ${input.productUrl}
- Marketplace: ${input.marketplace}
- Rede: ${input.targetNetwork}
${input.niche ? `- Nicho: ${input.niche}` : ""}

Gere os 6 posts. Retorne APENAS JSON válido, sem markdown:
{
  "hook": "primeira frase do post 1 — cria curiosidade imediata",
  "narrativeSummary": "papel social · emoção · tipo de conflito (uso interno)",
  "format": "narrative_staircase",
  "family": "nome interno da família narrativa",
  "emotion": "emoção dominante escolhida",
  "character": "papel social escolhido (ex: minha sogra)",
  "role": "papel social escolhido (mesmo que character)",
  "setting": "local da cena",
  "object": "objeto cotidiano de conflito",
  "conflictObject": "objeto cotidiano de conflito (mesmo que object)",
  "sceneMoment": "momento da cena (ex: sábado de manhã)",
  "moralQuestion": "pergunta final que divide opiniões",
  "conflict": "o que o conflito revela em uma linha",
  "twist": "o que post 3 revela que muda a leitura",
  "productPosition": 5,
  "posts": [
    {"position": 1, "content": "texto completo do post 1", "hasMedia": false},
    {"position": 2, "content": "texto completo do post 2", "hasMedia": false},
    {"position": 3, "content": "texto completo do post 3", "hasMedia": false},
    {"position": 4, "content": "texto completo do post 4", "hasMedia": false},
    {"position": 5, "content": "texto com link ${input.productUrl} inserido naturalmente", "hasMedia": false},
    {"position": 6, "content": "reflexão final + pergunta moral", "hasMedia": false}
  ]
}`;
}

export function parseNarrativeJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Nenhum JSON encontrado na resposta do LLM");
  return JSON.parse(match[0]) as Record<string, unknown>;
}

export { SOCIAL_ROLES as FAMILIES, NARRATIVE_EMOTIONS as EMOTIONS, SOCIAL_ROLES as CHARACTERS };
