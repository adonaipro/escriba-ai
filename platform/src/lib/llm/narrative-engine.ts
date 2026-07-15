/**
 * Narrative Engine — Cinema Architecture
 *
 * Flow: Product → Universe → Scene → Narrative
 * The engine directs. The scene is written. The text is the consequence.
 *
 * Key changes from the previous template-based approach:
 * - No more template filling ("fez algo que nunca tinha feito")
 * - Scenes generate specific actions ("desligou o ar-condicionado")
 * - Dialogue is concrete, in quotes
 * - Narrator personality shapes voice and reactions
 * - 10+ opening structures produce genuinely different narrative energies
 * - Product insertion is coherent with strategy and product universe
 * - Old taxonomy labels (decided_for_me, etc.) are now classification output, not input
 */

import { analyzeProduct, buildUniverseFromStoredAnalysis, type ProductUniverse } from "./product-intelligence-engine";
import {
  generateScene,
  buildNarratorPersonality,
  type GeneratedScene,
  type NarratorPersonality,
} from "./scene-engine";
import { buildNarrativeBriefing } from "./narrative-director";
import { writeNarrative } from "./narrative-writer";
import type { LlmProviderConfig } from "./types";
import type { PipelineNarratorData } from "./pipeline-types";
import { runStoryEngine, type StoryDebugData } from "./story-engine";

export type { StoryDebugData };

// ─── Backward-compatible exports (used by narrative-prompt.ts and UI) ─────────

export const SOCIAL_ROLES = [
  "minha sogra",
  "meu sogro",
  "meu marido",
  "minha esposa",
  "minha mãe",
  "meu pai",
  "minha cunhada",
  "meu cunhado",
  "minha irmã",
  "meu irmão",
  "minha diarista",
  "minha vizinha",
  "minha amiga",
  "meu amigo",
  "minha namorada",
  "meu namorado",
  "minha colega de trabalho",
  "minha babá",
  "meu médico",
  "minha fisioterapeuta",
];

export const CONFLICT_OBJECTS = [
  "o interfone",
  "o ar-condicionado",
  "o controle remoto",
  "o portão",
  "o fogão",
  "a geladeira",
  "o varal",
  "o Pix",
  "o troco",
  "a conta",
  "a refeição",
  "o jantar",
  "o almoço",
  "a chave",
  "o carregador",
  "a comida no fogo",
  "o notebook",
  "a janela",
  "a agenda",
  "a decisão",
  "o acordo",
  "a viagem",
  "a caminhada",
  "a porta",
];

export const NARRATIVE_EMOTIONS = [
  "desrespeito",
  "invasão",
  "culpa",
  "gratidão",
  "carinho",
  "arrependimento",
  "vergonha",
  "cansaço",
  "solidão",
  "ciúmes",
  "abandono",
  "exaustão",
  "indignação",
  "orgulho",
  "constrangimento",
  "expectativa frustrada",
  "confiança quebrada",
  "alívio inesperado",
  "saudade",
  "surpresa",
];

export const SCENE_MOMENTS = [
  "uma tarde de sábado",
  "quando eu cheguei do trabalho",
  "um domingo de manhã",
  "durante o jantar",
  "enquanto eu tentava descansar",
  "antes que eu pudesse dizer alguma coisa",
  "numa sexta à noite",
  "no meio de um momento meu",
  "quando achei que ia ser um dia normal",
  "tarde da noite",
];

export const MORAL_QUESTIONS = [
  "Vocês falariam alguma coisa? Ou também ficariam em silêncio?",
  "Tem limite entre cuidado e invasão? Ou depende de quem faz?",
  "Quando alguém decide por você sem perguntar, é mais fácil falar na hora ou engolir?",
  "Esperar alguém é carinho ou, quando vira rotina, só uma pessoa está se adaptando?",
  "O tamanho do que foi perdido tem relação com o valor do combinado quebrado?",
  "Presente inesperado diz mais sobre quem deu ou sobre o que a gente precisava?",
  "Cuidar de mim faz parte de cuidar de quem eu amo? Ou ainda parece egoísmo?",
  "Você fala na hora ou espera o momento certo que nunca chega?",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NarratorFilter {
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
}

export type ProductStrategy = "clickbait" | "contextual" | "hybrid";

export interface BuiltNarrative {
  role: string;
  emotion: string;
  conflictObject: string;
  sceneMoment: string;
  moralQuestion: string;
  family: string;
  setting: string;
  twist: string;
  hook: string;
  narrativeSummary: string;
  productPosition: number;
  productStrategy: ProductStrategy;
  tone: string;
  rhythm: string;
  conflictType: string;
  structureType: string;
  openingStyle: string;
  questionType: string;
  posts: Array<{ position: number; content: string; hasMedia: boolean }>;
}

// ─── Narrator role compatibility (kept for API callers) ───────────────────────

const FEMALE_NARRATOR_ROLES = [
  "minha sogra", "meu sogro", "meu marido", "minha mãe", "meu pai",
  "minha cunhada", "meu cunhado", "minha irmã", "meu irmão",
  "minha diarista", "minha vizinha", "minha amiga", "meu amigo",
  "meu namorado", "minha colega de trabalho", "minha babá",
];

const MALE_NARRATOR_ROLES = [
  "minha sogra", "meu sogro", "minha esposa", "minha mãe", "meu pai",
  "minha cunhada", "meu cunhado", "minha irmã", "meu irmão",
  "minha vizinha", "minha amiga", "meu amigo",
  "minha namorada", "minha colega de trabalho",
];

const MARRIED_ROLES = ["minha sogra", "meu sogro", "meu marido", "minha esposa", "minha cunhada", "meu cunhado"];
const DATING_ROLES  = ["minha namorada", "meu namorado"];
const CHILD_ROLES   = ["minha babá"];

export function getCompatibleRoles(narrator?: NarratorFilter): string[] {
  if (!narrator) return SOCIAL_ROLES;
  let roles: string[] = narrator.sex === "male" ? MALE_NARRATOR_ROLES : FEMALE_NARRATOR_ROLES;
  if (narrator.maritalStatus === "single") {
    roles = roles.filter((r) => !MARRIED_ROLES.includes(r) && !DATING_ROLES.includes(r));
  } else if (narrator.maritalStatus === "dating") {
    roles = roles.filter((r) => !MARRIED_ROLES.includes(r));
  }
  if (!narrator.hasChildren) {
    roles = roles.filter((r) => !CHILD_ROLES.includes(r));
  }
  return roles.length >= 4 ? roles : SOCIAL_ROLES;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pn(n: number, total: number): string {
  return `${n}/${total}`;
}

// ─── Conflict family → emotion + conflictType mapping ─────────────────────────

const FAMILY_EMOTION: Record<string, string> = {
  invasão_de_espaço:   "invasão",
  decided_for_me:      "indignação",
  desgaste_silencioso: "cansaço",
  combinados_quebrados: "confiança quebrada",
  surpresa_de_gratidão: "gratidão",
  limite_não_visto:    "constrangimento",
};

const FAMILY_CONFLICT_TYPE: Record<string, string> = {
  invasão_de_espaço:   "familiar",
  decided_for_me:      "cotidiano",
  desgaste_silencioso: "relacionamento",
  combinados_quebrados: "financeiro",
  surpresa_de_gratidão: "cotidiano",
  limite_não_visto:    "familiar",
};

// ─── Two-Layer Architecture ───────────────────────────────────────────────────
//
// Layer 1 — THINKING: Product Intelligence, Scene Engine, Narrator, Knowledge.
//   These modules answer questions (who? what happened? what emotion? what conflict?)
//   and produce a BRIEFING. Not a single word of the story.
//
// Layer 2 — WRITING: The engine picks a story SHAPE.
//   The shape writes ALL posts at once with full creative freedom.
//   No fixed "Post 1 → Post 2 → Product → Question" template.
//   Product strategy only influences HOW the product appears — never the structure.
//
// Human Test: "If I found this on Threads without knowing it was AI, would I
// believe it was a real person?" If NO → the engine failed.

export interface LayerOneBriefing {
  scene: GeneratedScene;
  universe: ProductUniverse;
  narrator?: NarratorFilter;
  personality: NarratorPersonality;
  strategy: ProductStrategy;
  productName: string;
  productUrl: string;
  seed: number;
}

/** @deprecated Use LayerOneBriefing */
export type NarrativeBriefing = LayerOneBriefing;

type PostContent = { position: number; content: string; hasMedia: boolean };

function posts(contents: string[]): PostContent[] {
  return contents.map((content, i) => ({ position: i + 1, content, hasMedia: false }));
}

// ─── Natural product entries — found, not sought ─────────────────────────────
// Never "Procurando outra coisa, esbarrei nisto"
// Always a real trigger: friend sent it, algorithm, saw at a store

function naturalProductEntry(
  strategy: ProductStrategy,
  u: ProductUniverse,
  url: string,
  name: string,
  s: GeneratedScene,
): string {
  const h = (s.action.length * 13 + s.location.length * 7) % 5;

  if (strategy === "clickbait") {
    const opts = [
      `Vi uma mulher com isso ${pick(["no mercado", "no elevador", "na fila"], s.location.length)}. Perguntei o que era. Ela me mandou o link: ${url}`,
      `Apareceu no for you três vezes no mesmo dia.\n\nNa terceira eu cliquei: ${url}`,
      `Minha prima mandou no grupo às 23h sem contexto nenhum.\n\nSó o link: ${url}`,
      `Tava na sacola de uma amiga quando eu fui lá. Pedi o link: ${url}`,
      `Meu marido me mandou sem falar nada.\n\nSó: ${url}`,
    ];
    return opts[h];
  }

  if (strategy === "contextual") {
    const opts = [
      `Uma amiga mandou quando eu contei o que tinha acontecido: ${url}`,
      `Vi num vídeo sobre exatamente isso que aconteceu: ${url}`,
      `Alguém no grupo falou de ${name} naquela mesma semana: ${url}`,
      `Fui procurar outra coisa. Achei: ${url}`,
      `Apareceu no algoritmo. Faz sentido: ${url}`,
    ];
    return opts[h];
  }

  const bridge = u.bridgeTopics?.[0] ?? "isso";
  const opts = [
    `Fui pesquisar sobre ${bridge}. Cheguei aqui: ${url}`,
    `Alguém mencionou ${bridge} numa conversa. Fui atrás: ${url}`,
    `Comecei a procurar coisas sobre ${bridge}. Entre elas: ${url}`,
    `Uma amiga falou sobre ${bridge} semanas antes. Pesquisei depois: ${url}`,
    `Uma pessoa no grupo falou de ${bridge}. Eu já sabia o que ia procurar: ${url}`,
  ];
  return opts[h];
}

// ─── Brief questions — simple, direct ────────────────────────────────────────

function briefQuestion(s: GeneratedScene): string {
  return pick([
    `vocês também ficam assim?`,
    `você fala ou guarda?`,
    `é só eu?`,
    `alguém entende isso?`,
    `o que você teria feito?`,
    `você consegue falar na hora?`,
    `vocês também deixam pra lá?`,
  ], s.moralSeed.length);
}

// ─── Non-moral endings — specific, finite ────────────────────────────────────

function nonMoralEnding(s: GeneratedScene, p: NarratorPersonality): string {
  return pick([
    `Até hoje ela acha que estava certa.`,
    `Não falei mais no assunto.`,
    `Ela nunca percebeu.`,
    `A gente continuou do mesmo jeito.`,
    `Fingi que tava tudo bem.`,
    `Ficou assim.`,
    `Nem toquei mais no assunto.`,
    `Eu continuo indo lá.`,
    `A gente não tocou mais nisso.`,
  ], s.moralSeed.length + p.conflictStyle.length);
}

// ─── Shape 1: DIRETO — in the middle of it, 4 posts ──────────────────────────

function shape_direto(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 4;
  return posts([
    pick([
      `Ouvi primeiro.\n\nDepois vi.\n\n${Char} ${s.action}.\n\n${pn(1, total)}`,
      `Eu tava no meio de uma coisa.\n\n${Char} ${s.action}.\n\nSem avisar.\n\n${pn(1, total)}`,
      `Era ${s.moment}.\n\n${Char} ${s.action}.\n\nNão foi perguntando. Foi fazendo.\n\n${pn(1, total)}`,
      `O que me chamou a atenção foi ${s.conflictObject}.\n\n${Char} ${s.action}.\n\n${pn(1, total)}`,
    ], s.action.length),

    s.dialogue
      ? `${s.dialogue}\n\nDisse isso de passagem e foi.\n\n${s.reaction}\n\n${pn(2, total)}`
      : `Não falou nada.\n\nSó fez.\n\n${s.reaction}\n\n${pn(2, total)}`,

    p.conflictStyle === "avoids"
      ? `${capitalize(s.consequence)}\n\nNão falei nada.\n\nNem depois.\n\n${pn(3, total)}`
      : p.conflictStyle === "deflects"
        ? `${capitalize(s.consequence)}\n\nFiz uma cara.\n\nEla não viu.\n\n${pn(3, total)}`
        : p.conflictStyle === "confronts"
          ? `${capitalize(s.consequence)}\n\nFalei alguma coisa. Não era o que eu queria falar.\n\nMas falei.\n\n${pn(3, total)}`
          : `${capitalize(s.consequence)}\n\nFui pro quarto mais cedo.\n\n${pn(3, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(4, total)}`,
  ]);
}

// ─── Shape 2: TEMPO — typing now, days after ─────────────────────────────────

function shape_tempo(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 5;
  const daysAgo = pick(["três dias", "uns dias", "uma semana", "alguns dias"], s.moment.length);
  return posts([
    `Faz ${daysAgo}.\n\nAinda tô pensando.\n\nComecei do zero pra ver se faz sentido escrito.\n\n${pn(1, total)}`,

    `Era ${s.moment}.\n\n${Char} ${s.action}.\n\n${s.dialogue ? s.dialogue + "\n\n" : ""}Sem pedir.\n\n${pn(2, total)}`,

    `${s.reaction}\n\n${capitalize(s.consequence)}\n\n${pn(3, total)}`,

    p.conflictStyle === "avoids"
      ? `Não falei na hora.\n\nNem depois.\n\nFicou assim.\n\n${pn(4, total)}`
      : p.conflictStyle === "confronts"
        ? `Falei alguma coisa depois.\n\nEla disse que não era bem isso.\n\nEu acho que era exatamente isso.\n\n${pn(4, total)}`
        : p.conflictStyle === "deflects"
          ? `Mandei um áudio pra uma amiga.\n\nEla disse que eu estava certa.\n\nNão sei se isso ajuda.\n\n${pn(4, total)}`
          : `Fui dormir antes da hora.\n\nDe manhã ainda tava pensando.\n\n${pn(4, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(5, total)}`,
  ]);
}

// ─── Shape 3: SILÊNCIO — what wasn't said ────────────────────────────────────

function shape_silencio(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 5;
  return posts([
    `Eu não falei nada.\n\nPodia ter falado.\n\nNão falei.\n\n${pn(1, total)}`,

    `${Char} ${s.action} ${s.moment}.\n\n${s.dialogue ? s.dialogue + "\n\n" : ""}${capitalize(s.conflictObject)} ali, do jeito que ela deixou.\n\n${pn(2, total)}`,

    p.conflictStyle === "avoids"
      ? `Eu sorri.\n\nFalei "tá bom".\n\nFui embora.\n\n${pn(3, total)}`
      : p.conflictStyle === "confronts"
        ? `Falei.\n\nNão veio do jeito certo.\n\nSaiu errado mas saiu.\n\n${pn(3, total)}`
        : p.conflictStyle === "deflects"
          ? `Mudei de assunto.\n\nEla nem percebeu que eu tinha mudado.\n\n${pn(3, total)}`
          : `Saí do cômodo.\n\nFui pra cozinha.\n\nFiquei olhando pro nada por uns minutos.\n\n${pn(3, total)}`,

    `${capitalize(s.consequence)}\n\n${nonMoralEnding(s, p)}\n\n${pn(4, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(5, total)}`,
  ]);
}

// ─── Shape 4: PADRÃO — specific incident + the count ─────────────────────────

function shape_padrao(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 5;
  const occurrence = pick(["a segunda", "a terceira", "a quarta", "uma das"], s.consequence.length);
  return posts([
    `${Char} ${s.action}.\n\n${s.dialogue ? s.dialogue + "\n\n" : ""}Era ${s.moment}.\n\n${pn(1, total)}`,

    `${s.reaction}\n\n${pn(2, total)}`,

    `${capitalize(s.consequence)}\n\nEssa foi ${occurrence} vez em poucos meses.\n\n${pn(3, total)}`,

    p.conflictStyle === "avoids"
      ? `Não falei de novo.\n\nEla não perguntou.\n\nA gente continuou.\n\n${pn(4, total)}`
      : p.conflictStyle === "confronts"
        ? `Dessa vez eu falei.\n\nEla disse que não tinha percebido.\n\nEu disse que já fazia tempo.\n\n${pn(4, total)}`
        : p.conflictStyle === "deflects"
          ? `Ri.\n\nÉ o que eu faço.\n\nNão sei se é o certo.\n\n${pn(4, total)}`
          : `Fui pro banheiro.\n\nFiquei lá mais tempo do que precisava.\n\n${pn(4, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(5, total)}`,
  ]);
}

// ─── Shape 5: REFRAME — not what it looks like ───────────────────────────────

function shape_reframe(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 4;
  return posts([
    `${Char} ${s.action}.\n\nParece pequeno.\n\nEu sei.\n\n${pn(1, total)}`,

    s.dialogue
      ? `${s.dialogue}\n\nEla disse assim.\n\nEu fiquei olhando pra ${s.conflictObject}.\n\n${pn(2, total)}`
      : `Não explicou.\n\nSó fez.\n\n${s.reaction}\n\n${pn(2, total)}`,

    p.conflictStyle === "avoids"
      ? `${capitalize(s.consequence)}\n\nNão falei nada.\n\nMas não é sobre ${s.conflictObject}.\n\nNunca é.\n\n${pn(3, total)}`
      : p.conflictStyle === "confronts"
        ? `${capitalize(s.consequence)}\n\nFalei pra ela que a questão não era ${s.conflictObject}.\n\nEla não quis entender.\n\n${pn(3, total)}`
        : `${capitalize(s.consequence)}\n\nFiquei quieta.\n\nMas não é sobre ${s.conflictObject}.\n\nA gente sabe.\n\n${pn(3, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(4, total)}`,
  ]);
}

// ─── Shape 6: OBJETO — the object anchors the scene ──────────────────────────

function shape_objeto(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const obj = s.conflictObject;
  const total = 4;
  return posts([
    `${capitalize(obj)} ainda tá aqui.\n\nDo jeito que ela deixou.\n\n${pn(1, total)}`,

    `${Char} ${s.action} ${s.moment}.\n\n${s.dialogue ? s.dialogue + "\n\nDisse assim." : "Sem falar nada."}\n\n${pn(2, total)}`,

    `${s.reaction}\n\n${capitalize(s.consequence)}\n\n${pn(3, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${nonMoralEnding(s, p)}\n\n${pn(4, total)}`,
  ]);
}

// ─── Shape 7: CONVERSA — someone asked me something ──────────────────────────

function shape_conversa(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 5;
  const friend_q = pick([
    `— Você tá bem?`,
    `— O que foi? Você tá quieta.`,
    `— Aconteceu alguma coisa?`,
    `— Você tá com cara de que tem alguma coisa.`,
  ], s.moralSeed.length);
  return posts([
    `Minha amiga me mandou mensagem hoje.\n\n${friend_q}\n\nEu disse que estava ótima.\n\n${pn(1, total)}`,

    `Mas o que tava acontecendo era isso:\n\n${Char} ${s.action}.\n\n${s.dialogue ? s.dialogue : ""}\n\n${pn(2, total)}`,

    `${s.reaction}\n\n${capitalize(s.consequence)}\n\n${pn(3, total)}`,

    p.shareStyle === "tells_friends"
      ? `Contei pra minha amiga depois.\n\nEla ficou mais irritada do que eu.\n\nÀs vezes isso ajuda.\n\n${pn(4, total)}`
      : p.shareStyle === "keeps_private"
        ? `Não contei pra ela o que tinha acontecido.\n\nNão sei por quê.\n\nSó disse que estava ótima.\n\n${pn(4, total)}`
        : `Não falei os detalhes.\n\nSó disse que tinha sido uma semana difícil.\n\n${pn(4, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(5, total)}`,
  ]);
}

// ─── Shape 8: CORPO — body first ─────────────────────────────────────────────

function shape_corpo(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 4;
  const body_signal = pick([
    `Meu estômago fechou.`,
    `Meu queixo apertou.`,
    `Eu prendi o ar.`,
    `Levantei os ombros sem querer.`,
    `Aquela sensação no pescoço.`,
  ], s.character.length);
  return posts([
    `${body_signal}\n\nAntes de processar, o corpo já tinha registrado.\n\n${pn(1, total)}`,

    `${Char} ${s.action}.\n\n${s.dialogue ? s.dialogue + "\n\n" : ""}${s.reaction}\n\n${pn(2, total)}`,

    `${capitalize(s.consequence)}\n\n${
      p.conflictStyle === "avoids"
        ? `Fui lavar a louça que não estava suja.\n\nFiz alguma coisa com as mãos pra não ficar parada.`
        : p.conflictStyle === "confronts"
          ? `Falei na hora.\n\nNão sei se foi a melhor decisão.\n\nMas falar aliviou.`
          : p.conflictStyle === "deflects"
            ? `Ri.\n\nSei lá de onde saiu aquela risada.\n\nNão era de graça.`
            : `Fui pro quarto.\n\nDeitei sem sono.\n\nFiquei olhando pro teto.`
    }\n\n${pn(3, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(4, total)}`,
  ]);
}

// ─── Shape 9: CAMADAS — three layers, all shown ──────────────────────────────

function shape_camadas(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 5;
  return posts([
    `Isso parece uma coisa pequena.\n\nEu sei.\n\nMas não é.\n\n${pn(1, total)}`,

    `${Char} ${s.action}.\n\n${s.dialogue ? s.dialogue + "\n\n" : ""}Era ${s.moment}.\n\nSem pedir.\n\n${pn(2, total)}`,

    `${s.reaction}\n\nIsso já aconteceu antes.\n\nEm outro contexto. Com outra coisa.\n\nMas a mesma coisa.\n\n${pn(3, total)}`,

    `${capitalize(s.consequence)}\n\n${
      p.conflictStyle === "avoids"
        ? `Não fiz nada.\n\nNão sei se faria diferente agora.`
        : p.conflictStyle === "confronts"
          ? `Dessa vez eu disse alguma coisa.\n\nNão resolveu nada.\n\nMas eu disse.`
          : `Fingi que não tinha acontecido.\n\nDe novo.`
    }\n\n${pn(4, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(5, total)}`,
  ]);
}

// ─── Shape 10: CONFISSÃO — uncomfortable honest ──────────────────────────────

function shape_confissao(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 5;
  return posts([
    `Vou falar uma coisa honesta:\n\nEu já sabia que ia acontecer.\n\nDeixei.\n\n${pn(1, total)}`,

    `${Char} ${s.action} ${s.moment}.\n\n${s.dialogue ? s.dialogue + "\n\nDisse assim." : "Sem explicação."}\n\n${pn(2, total)}`,

    `${s.reaction}\n\n${capitalize(s.consequence)}\n\n${pn(3, total)}`,

    p.expressionStyle === "emotional"
      ? `Não sei se foi fraqueza ou costume.\n\nOu os dois.\n\nOu nenhum.\n\n${pn(4, total)}`
      : p.expressionStyle === "dry"
        ? `Deixo.\n\nSempre deixo.\n\nNão sei mais se isso é meu jeito ou é hábito.\n\n${pn(4, total)}`
        : `Não é a primeira vez.\n\nProvavelmente não vai ser a última.\n\nÉ o que é.\n\n${pn(4, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(5, total)}`,
  ]);
}

// ─── Shape 11: DEPOIS — starting from the aftermath ─────────────────────────

function shape_depois(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 4;
  return posts([
    `${capitalize(s.consequence)}\n\n${
      p.conflictStyle === "avoids"
        ? `Não porque eu quis.\n\nFoi o que sobrou.`
        : p.conflictStyle === "confronts"
          ? `Depois de dizer o que eu precisava dizer.`
          : `É o que eu faço quando não sei o que fazer.`
    }\n\n${pn(1, total)}`,

    `O que causou isso:\n\n${Char} ${s.action}.\n\n${s.dialogue ? s.dialogue + "\n\n" : ""}${s.reaction}\n\n${pn(2, total)}`,

    `${nonMoralEnding(s, p)}\n\n${pn(3, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(4, total)}`,
  ]);
}

// ─── Shape 12: UNIVERSAL — specific observation, specific incident ────────────

function shape_universal(s: GeneratedScene, p: NarratorPersonality, str: ProductStrategy, u: ProductUniverse, url: string, name: string): PostContent[] {
  const char = s.character;
  const Char = capitalize(char);
  const total = 4;
  const universal = pick([
    `Tem gente que mexe nas coisas dos outros como se fosse normal.`,
    `Tem gente que decide pelo outro sem nem pensar em perguntar.`,
    `Tem gente que ajuda do jeito que quer ajudar, não do jeito que você precisa.`,
    `Tem gente que usa o cuidado como desculpa pra fazer do jeito dela.`,
  ], s.productBridge.length);
  return posts([
    `${universal}\n\nEu conhecia uma dessas.\n\n${pn(1, total)}`,

    `${Char} ${s.action} ${s.moment}.\n\n${s.dialogue ? s.dialogue + "\n\nDisse assim, como se fosse favor." : "Sem perguntar."}\n\n${s.reaction}\n\n${pn(2, total)}`,

    `${capitalize(s.consequence)}\n\n${nonMoralEnding(s, p)}\n\n${pn(3, total)}`,

    `${naturalProductEntry(str, u, url, name, s)}\n\n${briefQuestion(s)}\n\n${pn(4, total)}`,
  ]);
}


// ─── Shape registry ───────────────────────────────────────────────────────────

type ShapeFn = (
  s: GeneratedScene,
  p: NarratorPersonality,
  str: ProductStrategy,
  u: ProductUniverse,
  url: string,
  name: string,
) => PostContent[];

const SHAPES: ShapeFn[] = [
  shape_direto,
  shape_tempo,
  shape_silencio,
  shape_padrao,
  shape_reframe,
  shape_objeto,
  shape_conversa,
  shape_corpo,
  shape_camadas,
  shape_confissao,
  shape_depois,
  shape_universal,
];

const SHAPE_NAMES = [
  "direto",
  "deslocado",
  "silêncio",
  "padrão",
  "reframe",
  "objeto",
  "conversa",
  "corpo",
  "camadas",
  "confissão",
  "depois",
  "universal",
];

// ─── Classify scene into experiment dimensions ────────────────────────────────

function classifyScene(scene: GeneratedScene, shapeName: string, personality: NarratorPersonality) {
  const rhythmMap: Record<NarratorPersonality["expressionStyle"], string> = {
    direct:     "rápido",
    dry:        "rápido",
    emotional:  "lento",
    reflective: "médio",
  };

  const toneMap: Record<NarratorPersonality["expressionStyle"], string> = {
    direct:     "objetivo",
    dry:        "objetivo",
    emotional:  "emocional",
    reflective: "reflexivo",
  };

  return {
    tone:          toneMap[personality.expressionStyle],
    rhythm:        rhythmMap[personality.expressionStyle],
    structureType: "cinema",
    openingStyle:  shapeName,
    conflictType:  FAMILY_CONFLICT_TYPE[scene.conflictFamily] ?? "cotidiano",
    questionType:  "moral",
  };
}

// ─── Main export: buildNarrativeStaircase ────────────────────────────────────

export interface StoredProductAnalysis {
  detectedCategory: string;
  categoryLabel: string;
  confidence: string;
  scenarios: string[];
  pains: string[];
  benefits: string[];
  usageOccasions: string[];
  bridgeTopics: string[];
  restrictions: string[];
}

export function buildNarrativeStaircase(
  productName: string,
  productUrl: string,
  seed: number,
  preferredEmotion?: string,
  preferredRole?: string,
  preferredConflictObject?: string,
  narrator?: NarratorFilter,
  productStrategy?: ProductStrategy,
  activeHypotheses?: Array<{ dimension: string; value: string }>,
  storedAnalysis?: StoredProductAnalysis,
): BuiltNarrative {

  // ── Step 1: Understand the product ────────────────────────────────────────
  const universe: ProductUniverse = storedAnalysis
    ? buildUniverseFromStoredAnalysis(storedAnalysis)
    : analyzeProduct(productName, productUrl);

  // ── Step 2: Choose strategy ────────────────────────────────────────────────
  const strategy: ProductStrategy =
    productStrategy ??
    pick<ProductStrategy>(["clickbait", "contextual", "hybrid"], seed + 6);

  // ── Step 3: Build narrator personality ────────────────────────────────────
  const winnerHypotheses = activeHypotheses?.filter(
    (h) => !h.dimension.startsWith("_")
  );
  const personality = buildNarratorPersonality(narrator, winnerHypotheses);

  // ── Step 4: Generate the scene ────────────────────────────────────────────
  const scene: GeneratedScene = generateScene(
    universe,
    narrator,
    personality,
    strategy,
    seed
  );

  // ── Step 5: Select story shape ────────────────────────────────────────────
  const shapeIdx  = Math.abs(seed + 7) % SHAPES.length;
  const shapeFn   = SHAPES[shapeIdx];
  const shapeName = SHAPE_NAMES[shapeIdx];

  // ── Step 6: Write the story freely ────────────────────────────────────────
  // The shape writes ALL posts at once with no prescribed structure.
  // The director sets the scene; the writer decides everything else.
  const posts = shapeFn(scene, personality, strategy, universe, productUrl, productName);

  // ── Step 7: Classify into experiment dimensions ───────────────────────────
  const dimensions = classifyScene(scene, shapeName, personality);

  // ── Build BuiltNarrative ──────────────────────────────────────────────────
  const emotion = preferredEmotion ?? FAMILY_EMOTION[scene.conflictFamily] ?? "invasão";
  const hook = posts[0].content.split("\n")[0];
  const narrativeSummary = `${scene.character} · ${emotion} · ${scene.conflictObject}`;
  const lastPost = posts[posts.length - 1];
  const productPos = posts.findIndex((p) => p.content.includes(productUrl)) + 1;

  return {
    role:             preferredRole ?? scene.character,
    emotion,
    conflictObject:   preferredConflictObject ?? scene.conflictObject,
    sceneMoment:      scene.moment,
    moralQuestion:    lastPost.content.split("\n\n").at(-2) ?? lastPost.content,
    family:           scene.conflictFamily,
    setting:          scene.location,
    twist:            scene.consequence,
    hook,
    narrativeSummary,
    productPosition:  productPos > 0 ? productPos : posts.length,
    productStrategy:  strategy,
    tone:             dimensions.tone,
    rhythm:           dimensions.rhythm,
    conflictType:     dimensions.conflictType,
    structureType:    dimensions.structureType,
    openingStyle:     dimensions.openingStyle,
    questionType:     dimensions.questionType,
    posts,
  };
}

// ─── Legacy helper kept for simulated.ts compatibility ───────────────────────

export function buildProductPost(
  strategy: ProductStrategy,
  productUrl: string,
  productName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  _d: any
): string {
  const lines: Record<ProductStrategy, string[]> = {
    clickbait: [
      `Dias depois, navegando sem rumo, encontrei isso: ${productUrl}`,
      `Não sei bem explicar a conexão.`,
      `Mas não consegui fechar.`,
    ],
    contextual: [
      `Foi nesse período que me deparei com: ${productUrl}`,
      productName ? `${productName} apareceu no momento certo.` : `Apareceu no momento certo.`,
    ],
    hybrid: [
      `Semanas depois me lembrei de uma coisa que disseram.`,
      `E então encontrei: ${productUrl}`,
      `Não tem relação direta. Mas fez sentido naquele momento.`,
    ],
  };
  return (lines[strategy] ?? lines.hybrid).join("\n");
}

// ─── LLM-powered narrative (Story Engine) ────────────────────────────────────
//
// Nova arquitetura: produto → conflito humano → escritor livre
//
// Stage 1: SelectConflict — produto → emoções → conflito certo → situação concreta
// Stage 2: WriteFreely    — situação + conflito → escritor escreve sem regras
//
// 2 chamadas por história. A inteligência está na ESCOLHA, não na escrita.

export async function buildNarrativeLLM(
  productName: string,
  productUrl: string,
  seed: number,
  narrator?: NarratorFilter,
  productStrategy?: ProductStrategy,
  storedAnalysis?: StoredProductAnalysis,
  llmConfig?: LlmProviderConfig | null,
  narratorData?: {
    name: string;
    sex: string;
    ageRange: string;
    maritalStatus: string;
    hasChildren: boolean;
    livesAlone: boolean;
  },
): Promise<BuiltNarrative & { pipelineDebug?: StoryDebugData }> {
  if (!llmConfig) {
    return {
      ...buildNarrativeStaircase(productName, productUrl, seed, undefined, undefined, undefined, narrator, productStrategy, undefined, storedAnalysis),
      isSimulated: true,
    } as BuiltNarrative & { isSimulated: boolean };
  }

  const universe: ProductUniverse = storedAnalysis
    ? buildUniverseFromStoredAnalysis(storedAnalysis)
    : analyzeProduct(productName, productUrl);

  const strategy: ProductStrategy =
    productStrategy ??
    (["clickbait", "contextual", "hybrid"] as ProductStrategy[])[Math.abs(seed + 6) % 3];

  const personality = buildNarratorPersonality(narrator);

  const baseProfile = narratorData ?? {
    name:          "Ela",
    sex:           narrator?.sex ?? "female",
    ageRange:      narrator?.ageRange ?? "30-39",
    maritalStatus: narrator?.maritalStatus ?? "married",
    hasChildren:   narrator?.hasChildren ?? false,
    livesAlone:    narrator?.livesAlone ?? false,
  };

  const narratorFull: PipelineNarratorData = {
    ...baseProfile,
    conflictStyle:   personality.conflictStyle,
    shareStyle:      personality.shareStyle,
    expressionStyle: personality.expressionStyle,
  };

  const storyResult = await runStoryEngine(
    universe,
    productName,
    productUrl,
    narratorFull,
    seed,
    llmConfig,
  );

  const llmPosts = storyResult.posts.map(p => ({
    position: p.position,
    content:  p.content,
    hasMedia: false,
  }));

  const conflict     = storyResult.conflict;
  const emotion      = conflict.narrator_feels.split(",")[0].trim();
  const hook         = llmPosts[0]?.content.split("\n")[0] ?? "";
  const productPos   = llmPosts.findIndex(p => p.content.includes(productUrl)) + 1;

  const rhythmMap: Record<string, string> = { direct: "rápido", dry: "rápido", emotional: "lento", reflective: "médio" };
  const toneMap:   Record<string, string> = { direct: "objetivo", dry: "objetivo", emotional: "emocional", reflective: "reflexivo" };

  return {
    role:            storyResult.conflictSelection.character,
    emotion,
    conflictObject:  conflict.typical_character,
    sceneMoment:     "durante a situação",
    moralQuestion:   storyResult.conflictSelection.openingMoment,
    family:          conflict.category,
    setting:         "não especificado",
    twist:           conflict.essence,
    hook,
    narrativeSummary: `${storyResult.conflictSelection.character} · ${emotion} · ${conflict.name}`,
    productPosition:  productPos > 0 ? productPos : llmPosts.length,
    productStrategy:  strategy,
    tone:             toneMap[personality.expressionStyle]  ?? "objetivo",
    rhythm:           rhythmMap[personality.expressionStyle] ?? "médio",
    conflictType:     conflict.category,
    structureType:    "story-engine",
    openingStyle:     "conflito-humano",
    questionType:     "moral",
    posts:            llmPosts,
    pipelineDebug:    storyResult.debug,
  };
}
