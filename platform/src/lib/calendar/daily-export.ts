/**
 * Daily calendar TXT export helpers.
 * Pure local analysis — no LLM calls.
 */

export type ExportStory = {
  id: string;
  username: string;
  campaign: string;
  campaignId: string;
  narrator: string;
  /** true when no narrator was linked at generation time */
  narratorMissing: boolean;
  model: string;
  contentType: "storytelling" | "pergunta" | "opinião" | "outro";
  contentTypeLabel: string;
  theme: string;
  premise: string;
  status: string;
  when: Date;
  hook: string;
  conflict: string;
  opening: string;
  character: string;
  posts: Array<{ position: number; content: string }>;
  fullText: string;
};

export type ExportMeta = {
  date: string;
  scopeLabel: string;
  generatedAt: Date;
};

// ─── Label / classification helpers ──────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  scheduled: "agendado",
  pending: "pendente",
  publishing: "publicando",
  published: "publicado",
  paused: "pausado",
  failed: "falhou",
  draft: "rascunho",
};

const CONTENT_MODE_TYPE: Record<string, ExportStory["contentType"]> = {
  "story-produto": "storytelling",
  "story-organico": "storytelling",
  desabafo: "opinião",
  polemica: "opinião",
  pergunta: "pergunta",
};

const FORMAT_TYPE: Record<string, ExportStory["contentType"]> = {
  storytelling: "storytelling",
  curiosity: "storytelling",
  discovery: "storytelling",
  case_study: "storytelling",
  review: "opinião",
  opinion: "opinião",
  question: "pergunta",
  pergunta: "pergunta",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function narratorLabel(name: string | null | undefined): {
  label: string;
  missing: boolean;
} {
  if (name?.trim()) return { label: name.trim(), missing: false };
  return {
    label: "não registrado — conteúdo gerado antes da obrigatoriedade",
    missing: true,
  };
}

export function classifyContentType(input: {
  contentMode?: string | null;
  format?: string | null;
  questionType?: string | null;
  hook?: string | null;
  firstPost?: string | null;
}): { type: ExportStory["contentType"]; label: string } {
  const mode = (input.contentMode ?? "").toLowerCase().trim();
  if (mode && CONTENT_MODE_TYPE[mode]) {
    const t = CONTENT_MODE_TYPE[mode];
    return { type: t, label: typeLabel(t) };
  }

  const format = (input.format ?? "").toLowerCase().trim();
  if (format && FORMAT_TYPE[format]) {
    const t = FORMAT_TYPE[format];
    return { type: t, label: typeLabel(t) };
  }

  if (input.questionType?.trim()) {
    return { type: "pergunta", label: typeLabel("pergunta") };
  }

  const sample = `${input.hook ?? ""} ${input.firstPost ?? ""}`.trim();
  const questionMarks = (sample.match(/\?/g) ?? []).length;
  if (questionMarks >= 2 || (questionMarks >= 1 && sample.length < 280)) {
    return { type: "pergunta", label: typeLabel("pergunta") };
  }

  // Opinion-ish openers common in desabafo/polêmica
  if (
    /^(eu acho|na minha opinião|sinceramente|vamos ser honestos|polêmica|discordo|concordo)/i.test(
      sample,
    )
  ) {
    return { type: "opinião", label: typeLabel("opinião") };
  }

  if (sample.length > 0) {
    return { type: "storytelling", label: typeLabel("storytelling") };
  }
  return { type: "outro", label: "outro" };
}

function typeLabel(t: ExportStory["contentType"]): string {
  if (t === "storytelling") return "storytelling";
  if (t === "pergunta") return "pergunta";
  if (t === "opinião") return "opinião";
  return "outro";
}

export function detectTheme(input: {
  conflictType?: string | null;
  family?: string | null;
  emotion?: string | null;
  contentMode?: string | null;
  narrativeSummary?: string | null;
  hook?: string | null;
}): string {
  const parts: string[] = [];
  if (input.conflictType?.trim()) parts.push(input.conflictType.trim());
  if (input.family?.trim()) parts.push(input.family.trim());
  if (input.emotion?.trim()) parts.push(input.emotion.trim());
  if (parts.length) return parts.join(" · ");

  const mode = (input.contentMode ?? "").toLowerCase();
  if (mode === "pergunta") return "pergunta / reflexão";
  if (mode === "polemica") return "polêmica";
  if (mode === "desabafo") return "desabafo";
  if (mode === "story-produto") return "story com produto";
  if (mode === "story-organico") return "story orgânico";

  // Lightweight keyword theme from premise/hook
  const text = `${input.narrativeSummary ?? ""} ${input.hook ?? ""}`.toLowerCase();
  const themes: Array<[RegExp, string]> = [
    [/\b(traiç|amant|ciúme|ciume|relacionamento|marido|esposa|namorad)/, "relacionamento"],
    [/\b(dinheiro|dívida|divida|salário|salario|conta|financeiro)/, "financeiro"],
    [/\b(filho|filha|mãe|mae|pai|família|familia|irmão|irmao)/, "familiar"],
    [/\b(trabalho|chefe|emprego|colega|demit)/, "trabalho"],
    [/\b(saúde|saude|doença|doenca|hospital|médico|medico)/, "saúde"],
  ];
  for (const [re, label] of themes) {
    if (re.test(text)) return label;
  }
  return input.narrativeSummary?.trim().slice(0, 80) || "(tema não detectado)";
}

export function modelLabel(aiModel?: string | null, provider?: string | null): string {
  const model = (aiModel ?? "").trim();
  const prov = (provider ?? "").trim();
  if (model && prov && !model.toLowerCase().includes(prov.toLowerCase())) {
    return `${model} (${prov})`;
  }
  if (model) return model;
  if (prov) return prov;
  return "(modelo não registrado)";
}

// ─── Similarity (local, no LLM) ──────────────────────────────────────────────

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

const STOPWORDS = new Set(
  [
    "a", "o", "e", "de", "da", "do", "das", "dos", "em", "um", "uma", "uns", "umas",
    "para", "por", "com", "sem", "que", "se", "na", "no", "nas", "nos", "ao", "aos",
    "as", "os", "eu", "me", "meu", "minha", "ele", "ela", "eles", "elas", "foi",
    "ser", "ter", "há", "ha", "já", "ja", "não", "nao", "mais", "muito", "como",
    "mas", "ou", "quando", "depois", "antes", "ainda", "só", "so", "também", "tambem",
    "isso", "isto", "aquele", "aquela", "seu", "sua", "seus", "suas", "lhe", "nos",
    "vos", "sobre", "entre", "até", "ate", "pra", "pro", "tá", "ta", "tô", "to",
  ].map(stripDiacritics),
);

export function tokenize(text: string): Set<string> {
  const clean = stripDiacritics(text.toLowerCase())
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ");
  const tokens = clean.split(/\s+/).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(tokens);
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Dice coefficient — more sensitive on short narrative posts than pure Jaccard. */
export function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return (2 * inter) / (a.size + b.size);
}

export function textSimilarity(a: Set<string>, b: Set<string>): number {
  return Math.max(jaccard(a, b), dice(a, b));
}

export type SimilarGroup = {
  ids: string[];
  indices: number[]; // 1-based story numbers
  score: number; // max pairwise in group
  sampleHooks: string[];
};

const SIMILARITY_THRESHOLD = 0.36;

export function findSimilarGroups(stories: ExportStory[]): SimilarGroup[] {
  const n = stories.length;
  if (n < 2) return [];

  const tokens = stories.map((s) => tokenize(`${s.hook}\n${s.premise}\n${s.fullText}`));
  const hookTokens = stories.map((s) => tokenize(s.hook || s.posts[0]?.content || ""));
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    if (parent[x] !== x) parent[x] = find(parent[x]!);
    return parent[x]!;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const pairScore = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const full = textSimilarity(tokens[i]!, tokens[j]!);
      const hooks = textSimilarity(hookTokens[i]!, hookTokens[j]!);
      const score = Math.max(full, hooks * 0.95);
      if (score >= SIMILARITY_THRESHOLD) {
        union(i, j);
        pairScore.set(`${i}-${j}`, score);
      }
    }
  }

  const buckets = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!buckets.has(root)) buckets.set(root, []);
    buckets.get(root)!.push(i);
  }

  const groups: SimilarGroup[] = [];
  for (const members of buckets.values()) {
    if (members.length < 2) continue;
    let maxScore = 0;
    for (let a = 0; a < members.length; a++) {
      for (let b = a + 1; b < members.length; b++) {
        const key = `${members[a]}-${members[b]}`;
        const s =
          pairScore.get(key) ??
          textSimilarity(tokens[members[a]!]!, tokens[members[b]!]!);
        if (s > maxScore) maxScore = s;
      }
    }
    groups.push({
      ids: members.map((i) => stories[i]!.id),
      indices: members.map((i) => i + 1),
      score: maxScore,
      sampleHooks: members.slice(0, 3).map((i) => {
        const h = stories[i]!.hook || stories[i]!.premise || stories[i]!.fullText;
        return h.replace(/\s+/g, " ").trim().slice(0, 90);
      }),
    });
  }

  groups.sort((a, b) => b.score - a.score || b.indices.length - a.indices.length);
  return groups;
}

// ─── Frequency helpers ───────────────────────────────────────────────────────

function topCounts(values: string[], limit = 8): Array<{ value: string; count: number }> {
  const map = new Map<string, number>();
  for (const raw of values) {
    const v = raw.trim();
    if (!v || v.startsWith("(")) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, limit);
}

function normalizeHookKey(hook: string): string {
  return stripDiacritics(hook.toLowerCase())
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function fmtWhen(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function bulletList(
  items: Array<{ value: string; count: number }>,
  empty = "  (nenhum dado registrado)",
): string[] {
  if (!items.length) return [empty];
  return items.map((i) => `  - ${i.value}: ${i.count}×`);
}

export function renderDailyExport(meta: ExportMeta, stories: ExportStory[]): string {
  const lines: string[] = [
    `Escriba — Exportação diária`,
    `Data: ${meta.date}`,
    `Escopo: ${meta.scopeLabel}`,
    `Conteúdos: ${stories.length}`,
    `Gerado em: ${fmtWhen(meta.generatedAt)}`,
    "",
  ];

  if (stories.length === 0) {
    lines.push("(Nenhuma publicação neste dia para o escopo selecionado.)");
    lines.push("");
    lines.push(...renderSummary(stories));
    return lines.join("\n");
  }

  for (let i = 0; i < stories.length; i++) {
    const s = stories[i]!;
    lines.push("════════════════════════════════════════════════════════════");
    lines.push(`#${i + 1}`);
    lines.push(`Conta:     ${s.username}`);
    lines.push(`Campanha:  ${s.campaign}`);
    lines.push(`Narrador:  ${s.narrator}`);
    lines.push(`Modelo:    ${s.model}`);
    lines.push(`Tipo:      ${s.contentTypeLabel}`);
    lines.push(`Tema:      ${s.theme}`);
    lines.push(`Premissa:  ${s.premise || "(sem premissa registrada)"}`);
    lines.push(`Status:    ${statusLabel(s.status)}`);
    lines.push(`Data/hora: ${fmtWhen(s.when)}`);
    if (s.character) lines.push(`Personagem: ${s.character}`);
    if (s.conflict) lines.push(`Conflito:  ${s.conflict}`);
    if (s.opening) lines.push(`Abertura:  ${s.opening}`);
    lines.push("");
    if (s.posts.length === 0) {
      lines.push("(sem posts)");
    } else {
      lines.push("Posts:");
      for (const post of s.posts) {
        lines.push(`--- Post ${post.position} ---`);
        lines.push(post.content);
        lines.push("");
      }
    }
    lines.push("");
  }

  lines.push(...renderSummary(stories));
  return lines.join("\n");
}

export function renderSummary(stories: ExportStory[]): string[] {
  const lines: string[] = [
    "════════════════════════════════════════════════════════════",
    "RESUMO GERENCIAL",
    "════════════════════════════════════════════════════════════",
    "",
  ];

  const total = stories.length;
  lines.push(`Total de conteúdos: ${total}`);
  lines.push("");

  // By account
  lines.push("Por conta:");
  lines.push(
    ...bulletList(
      topCounts(stories.map((s) => s.username), 20),
      "  (nenhuma conta)",
    ),
  );
  lines.push("");

  // By campaign
  lines.push("Por campanha:");
  lines.push(
    ...bulletList(
      topCounts(stories.map((s) => s.campaign), 20),
      "  (nenhuma campanha)",
    ),
  );
  lines.push("");

  // By type
  lines.push("Por tipo de conteúdo:");
  lines.push(
    ...bulletList(
      topCounts(stories.map((s) => s.contentTypeLabel), 10),
      "  (sem classificação)",
    ),
  );
  lines.push("");

  // Themes
  lines.push("Temas mais usados:");
  lines.push(...bulletList(topCounts(stories.map((s) => s.theme), 10)));
  lines.push("");

  // Characters (prefer 2+ repeats; fall back to all registered names)
  const characters = stories.map((s) => s.character).filter(Boolean);
  const characterCounts = topCounts(characters, 10);
  const repeatedCharacters = characterCounts.filter((c) => c.count >= 2);
  lines.push("Personagens mais repetidos:");
  lines.push(
    ...bulletList(
      repeatedCharacters.length ? repeatedCharacters : characterCounts,
      "  (nenhum personagem registrado nos metadados)",
    ),
  );
  lines.push("");

  // Openings / hooks
  const hookKeys = stories.map((s) => {
    const raw = (s.hook || s.posts[0]?.content || "").replace(/\s+/g, " ").trim();
    return raw ? normalizeHookKey(raw) : "";
  });
  // Map normalized key back to a display sample
  const hookDisplay = new Map<string, string>();
  stories.forEach((s, i) => {
    const key = hookKeys[i]!;
    if (!key) return;
    if (!hookDisplay.has(key)) {
      const raw = (s.hook || s.posts[0]?.content || "").replace(/\s+/g, " ").trim().slice(0, 100);
      hookDisplay.set(key, raw);
    }
  });
  const hookCounts = topCounts(hookKeys.filter(Boolean), 15)
    .filter((c) => c.count >= 2)
    .map((c) => ({ value: hookDisplay.get(c.value) ?? c.value, count: c.count }));
  lines.push("Aberturas/ganchos mais repetidos (2+):");
  lines.push(
    ...bulletList(
      hookCounts,
      "  (nenhuma abertura repetida detectada)",
    ),
  );
  lines.push("");

  // Conflicts
  lines.push("Conflitos mais repetidos:");
  lines.push(
    ...bulletList(
      topCounts(
        stories.map((s) => s.conflict).filter(Boolean),
        10,
      ),
      "  (nenhum conflito tipificado registrado)",
    ),
  );
  lines.push("");

  // Failure rate
  const failed = stories.filter((s) =>
    ["failed", "falhou"].includes(s.status.toLowerCase()),
  ).length;
  const failureRate = total > 0 ? (failed / total) * 100 : 0;
  lines.push(`Taxa de falhas: ${failureRate.toFixed(1)}% (${failed} de ${total})`);
  lines.push("");

  // Similarity
  const groups = findSimilarGroups(stories);
  const inGroups = new Set(groups.flatMap((g) => g.ids));
  const similarPct = total > 0 ? (inGroups.size / total) * 100 : 0;
  lines.push(
    `Percentual estimado de histórias semelhantes: ${similarPct.toFixed(1)}% (${inGroups.size} de ${total} em grupos com similaridade ≥ ${Math.round(SIMILARITY_THRESHOLD * 100)}%)`,
  );
  lines.push("");
  lines.push("Grupos de conteúdos potencialmente repetitivos:");
  if (!groups.length) {
    lines.push("  (nenhum grupo repetitivo detectado neste dia)");
  } else {
    groups.slice(0, 12).forEach((g, idx) => {
      lines.push(
        `  Grupo ${idx + 1}: conteúdos #${g.indices.join(", #")} · similaridade máx. ${(g.score * 100).toFixed(0)}%`,
      );
      for (const sample of g.sampleHooks) {
        lines.push(`    · ${sample}${sample.length >= 90 ? "…" : ""}`);
      }
    });
  }
  lines.push("");
  lines.push(
    "Nota: similaridade calculada localmente (tokens do texto), sem nova chamada à LLM.",
  );
  lines.push("");

  return lines;
}
