export interface NarratorIdentity {
  name: string;
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
}

function normalizedStatus(status: string): "single" | "dating" | "married" | "other" {
  const value = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["single", "solteiro", "solteira"].includes(value)) return "single";
  if (["dating", "namorando", "namorando(a)", "relacionamento"].includes(value)) return "dating";
  if (["married", "casado", "casada"].includes(value)) return "married";
  return "other";
}

function sexLabel(sex: string): string {
  const value = sex.toLowerCase();
  if (["female", "f", "feminino", "mulher"].includes(value)) return "mulher";
  if (["male", "m", "masculino", "homem"].includes(value)) return "homem";
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
  const forbidden: string[] = [];
  if (status === "single") forbidden.push("marido/esposa", "casamento atual", "namorado/namorada atual", "sogros/cunhados do relacionamento atual");
  else if (status === "dating") forbidden.push("marido/esposa", "casamento atual");
  if (!identity.hasChildren) forbidden.push("filhos próprios", "babá dos próprios filhos", "rotina de maternidade/paternidade");
  if (identity.livesAlone) forbidden.push("roommate/colega de quarto", "parceiro ou familiar morando permanentemente com a pessoa");

  return `IDENTIDADE FIXA DE ${identity.name.toUpperCase()} (fatos, não sugestões):
- sexo/gênero narrativo: ${sexLabel(identity.sex)}
- idade: ${identity.ageRange}
- estado civil: ${statusLabel(status, identity.maritalStatus)}
- filhos: ${identity.hasChildren ? "tem filhos" : "não tem filhos"}
- moradia: ${identity.livesAlone ? "mora sozinha(o)" : "não mora sozinha(o)"}
${forbidden.length ? `- PROIBIDO atribuir à pessoa narradora: ${forbidden.join("; ")}` : ""}

Esses fatos pertencem à pessoa narradora. Outros personagens podem ser casados, ter filhos ou morar com outras pessoas.
Não altere a biografia para acomodar a trama; crie a trama dentro desta biografia.`;
}

export function findNarratorIdentityViolations(text: string, identity: NarratorIdentity): string[] {
  const status = normalizedStatus(identity.maritalStatus);
  const checks: Array<{ active: boolean; label: string; pattern: RegExp }> = [
    { active: status === "single" || status === "dating", label: "casamento incompatível com o estado civil", pattern: /\b(meu marido|minha esposa|nosso casamento|nosso aniversário de casamento|sou casad[ao]|me casei)\b/i },
    { active: status === "single", label: "relacionamento atual incompatível com pessoa solteira", pattern: /\b(meu namorado|minha namorada|nós namoramos|estou namorando|minha sogra|meu sogro|minha cunhada|meu cunhado)\b/i },
    { active: !identity.hasChildren, label: "filhos incompatíveis com narrador sem filhos", pattern: /\b(meu filho|minha filha|meus filhos|minhas filhas|nosso filho|nossa filha|nossos filhos|minha babá|nossa babá|nosso babysitter|nossa babysitter)\b/i },
    { active: identity.livesAlone, label: "moradia compartilhada incompatível com narrador que mora sozinho", pattern: /\b(minha roommate|meu roommate|minha colega de quarto|meu colega de quarto|quem mora comigo|moramos juntos)\b/i },
  ];
  const violations = checks.filter((check) => check.active && check.pattern.test(text)).map((check) => check.label);
  const statedAge = text.match(/\b(?:tenho|aos meus)\s+(\d{2})\s+anos\b/i)?.[1];
  const range = identity.ageRange.match(/(\d{2})\D+(\d{2})/);
  if (statedAge && range) {
    const age = Number(statedAge);
    if (age < Number(range[1]) || age > Number(range[2])) violations.push("idade declarada fora da faixa do narrador");
  }
  return [...new Set(violations)];
}
