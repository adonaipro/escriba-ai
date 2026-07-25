export interface NarratorIdentity {
  name: string;
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
}

export type NarratorSex = "male" | "female";

function normalizedStatus(status: string): "single" | "dating" | "married" | "other" {
  const value = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["single", "solteiro", "solteira"].includes(value)) return "single";
  if (["dating", "namorando", "namorando(a)", "relacionamento"].includes(value)) return "dating";
  if (["married", "casado", "casada"].includes(value)) return "married";
  return "other";
}

export function normalizeNarratorSex(sex: string): NarratorSex | null {
  const value = sex.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["female", "f", "feminino", "mulher"].includes(value)) return "female";
  if (["male", "m", "masculino", "homem"].includes(value)) return "male";
  return null;
}

function sexLabel(sex: string): string {
  const n = normalizeNarratorSex(sex);
  if (n === "female") return "mulher";
  if (n === "male") return "homem";
  return sex;
}

function statusLabel(status: ReturnType<typeof normalizedStatus>, original: string): string {
  if (status === "single") return "solteira(o)";
  if (status === "dating") return "namorando/em relacionamento, mas não casada(o)";
  if (status === "married") return "casada(o)";
  return original;
}

export function buildNarratorIdentityRules(identity: NarratorIdentity): string {
  const status = normalizedStatus(identity.maritalStatus);
  const sex = normalizeNarratorSex(identity.sex);
  const forbidden: string[] = [];
  if (status === "single") {
    forbidden.push("marido/esposa", "casamento atual", "namorado/namorada atual", "sogros/cunhados do relacionamento atual");
  } else if (status === "dating") {
    forbidden.push("marido/esposa", "casamento atual");
  }
  if (!identity.hasChildren) {
    forbidden.push("filhos próprios", "babá dos próprios filhos", "rotina de maternidade/paternidade");
  }
  if (identity.livesAlone) {
    forbidden.push("roommate/colega de quarto", "parceiro ou familiar morando permanentemente com a pessoa");
  }
  if (sex === "male") {
    forbidden.push(
      "referir a si mesmo no feminino (sozinha, cansada, traída, casada…)",
      "parceiro romântico como marido/namorado/ex-namorado (use esposa/namorada/ex-namorada)",
    );
  } else if (sex === "female") {
    forbidden.push(
      "referir a si mesma no masculino (sozinho, cansado, traído, casado…)",
      "parceira romântica como esposa/namorada/ex-namorada (use marido/namorado/ex-namorado)",
    );
  }

  return `IDENTIDADE FIXA DE ${identity.name.toUpperCase()} (fatos, não sugestões):
- sexo/gênero narrativo: ${sexLabel(identity.sex)} — a voz da 1ª pessoa DEVE ser consistentemente ${sex === "male" ? "MASCULINA" : sex === "female" ? "FEMININA" : "coerente"}
- idade: ${identity.ageRange}
- estado civil: ${statusLabel(status, identity.maritalStatus)}
- filhos: ${identity.hasChildren ? "tem filhos" : "não tem filhos"}
- moradia: ${identity.livesAlone ? "mora sozinha(o)" : "não mora sozinha(o)"}
${forbidden.length ? `- PROIBIDO atribuir à pessoa narradora: ${forbidden.join("; ")}` : ""}

Esses fatos pertencem à pessoa narradora. Outros personagens podem ser casados, ter filhos ou morar com outras pessoas.
Não altere a biografia para acomodar a trama; crie a trama dentro desta biografia.`;
}

/**
 * Detect first-person gender voice and romantic-partner mismatch for the narrator.
 * Does not flag third-person references about other people.
 */
export function findGenderVoiceViolations(text: string, identity: NarratorIdentity): string[] {
  const sex = normalizeNarratorSex(identity.sex);
  if (!sex) return ["sexo do narrador inválido ou indefinido"];

  const violations: string[] = [];

  // First-person self-description with gendered adjectives / states
  const femSelf = [
    /\b(eu\s+)?(estava|fiquei|andava|saí|cheguei|continuei|me\s+senti|me\s+sentia)\s+sozinha\b/i,
    /\b(eu\s+)?(estava|fiquei|me\s+senti|me\s+sentia)\s+(cansada|exausta|brava|nervosa|preocupada|aliviada|destru[ií]da|tra[ií]da|humilhada|gr[aá]vida|casada|solteira|namorando)\b/i,
    /\bsou\s+(casada|solteira|gr[aá]vida|mulher)\b/i,
    /\bcomo\s+mulher\b/i,
    /\beu,?\s+mulher\b/i,
    /\bminha\s+menstrua/i,
  ];

  const mascSelf = [
    /\b(eu\s+)?(estava|fiquei|andava|saí|cheguei|continuei|me\s+senti|me\s+sentia)\s+sozinho\b/i,
    /\b(eu\s+)?(estava|fiquei|me\s+senti|me\s+sentia)\s+(cansado|exausto|bravo|nervoso|preocupado|aliviado|destru[ií]do|tra[ií]do|humilhado|casado|solteiro)\b/i,
    /\bsou\s+(casado|solteiro|homem)\b/i,
    /\bcomo\s+homem\b/i,
    /\beu,?\s+homem\b/i,
  ];

  // Romantic partner of the narrator (1st person possessive)
  const partnerAsMale = [
    /\bmeu\s+marido\b/i,
    /\bmeu\s+namorado\b/i,
    /\bmeu\s+ex-?namorado\b/i,
    /\bmeu\s+ex\b/i,
  ];
  const partnerAsFemale = [
    /\bminha\s+esposa\b/i,
    /\bminha\s+namorada\b/i,
    /\bminha\s+ex-?namorada\b/i,
    /\bminha\s+ex\b/i,
  ];

  if (sex === "male") {
    for (const re of femSelf) {
      if (re.test(text)) {
        violations.push("voz feminina na 1ª pessoa incompatível com narrador homem");
        break;
      }
    }
    for (const re of partnerAsMale) {
      if (re.test(text)) {
        violations.push("parceiro romântico masculino (marido/namorado) incompatível com narrador homem");
        break;
      }
    }
  } else {
    for (const re of mascSelf) {
      if (re.test(text)) {
        violations.push("voz masculina na 1ª pessoa incompatível com narradora mulher");
        break;
      }
    }
    for (const re of partnerAsFemale) {
      if (re.test(text)) {
        violations.push("parceira romântica feminina (esposa/namorada) incompatível com narradora mulher");
        break;
      }
    }
  }

  return [...new Set(violations)];
}

export function findNarratorIdentityViolations(text: string, identity: NarratorIdentity): string[] {
  const status = normalizedStatus(identity.maritalStatus);
  const checks: Array<{ active: boolean; label: string; pattern: RegExp }> = [
    {
      active: status === "single" || status === "dating",
      label: "casamento incompatível com o estado civil",
      pattern: /\b(meu marido|minha esposa|nosso casamento|nosso aniversário de casamento|sou casad[ao]|me casei)\b/i,
    },
    {
      active: status === "single",
      label: "relacionamento atual incompatível com pessoa solteira",
      pattern: /\b(meu namorado|minha namorada|nós namoramos|estou namorando|minha sogra|meu sogro|minha cunhada|meu cunhado)\b/i,
    },
    {
      active: !identity.hasChildren,
      label: "filhos incompatíveis com narrador sem filhos",
      pattern: /\b(meu filho|minha filha|meus filhos|minhas filhas|nosso filho|nossa filha|nossos filhos|minha babá|nossa babá|nosso babysitter|nossa babysitter)\b/i,
    },
    {
      active: identity.livesAlone,
      label: "moradia compartilhada incompatível com narrador que mora sozinho",
      pattern: /\b(minha roommate|meu roommate|minha colega de quarto|meu colega de quarto|quem mora comigo|moramos juntos)\b/i,
    },
  ];
  const violations = checks
    .filter((check) => check.active && check.pattern.test(text))
    .map((check) => check.label);

  const statedAge = text.match(/\b(?:tenho|aos meus)\s+(\d{2})\s+anos\b/i)?.[1];
  const range = identity.ageRange.match(/(\d{2})\D+(\d{2})/);
  if (statedAge && range) {
    const age = Number(statedAge);
    if (age < Number(range[1]) || age > Number(range[2])) {
      violations.push("idade declarada fora da faixa do narrador");
    }
  }

  violations.push(...findGenderVoiceViolations(text, identity));
  return [...new Set(violations)];
}

export function assertNarratorIdentityMatchesText(
  posts: Array<{ content: string }>,
  identity: NarratorIdentity,
): void {
  const sex = normalizeNarratorSex(identity.sex);
  if (!sex) {
    throw new Error(
      `Identidade do narrador inválida: sexo "${identity.sex}" não reconhecido (use male/female).`,
    );
  }
  const text = posts.map((p) => p.content).join("\n");
  const violations = findNarratorIdentityViolations(text, identity);
  if (violations.length > 0) {
    throw new Error(
      `Identidade do narrador "${identity.name}" (${sexLabel(identity.sex)}) violada pelo texto gerado: ${violations.join("; ")}. Geração rejeitada — nada foi salvo nem agendado.`,
    );
  }
}

/**
 * Story Engine V2: only sex/pronoun/relationship coherence is enforced at save time.
 * Full biographical identity remains available via assertNarratorIdentityMatchesText.
 */
export function assertNarratorSexMatchesText(
  posts: Array<{ content: string }>,
  identity: Pick<NarratorIdentity, "name" | "sex">,
): void {
  const sex = normalizeNarratorSex(identity.sex);
  if (!sex) {
    throw new Error(
      `Identidade do narrador inválida: sexo "${identity.sex}" não reconhecido (use male/female).`,
    );
  }
  const text = posts.map((p) => p.content).join("\n");
  const full: NarratorIdentity = {
    name: identity.name,
    sex: identity.sex,
    ageRange: "26-35",
    maritalStatus: "other",
    hasChildren: true,
    livesAlone: false,
  };
  const violations = findGenderVoiceViolations(text, full);
  if (violations.length > 0) {
    throw new Error(
      `Sexo/pronomes do narrador "${identity.name}" (${sexLabel(identity.sex)}) violados pelo texto: ${violations.join("; ")}. Geração rejeitada — nada foi salvo nem agendado.`,
    );
  }
}
