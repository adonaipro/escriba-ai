const NAMES: Record<string, Record<string, string[]>> = {
  female: {
    "18-25": ["Bianca", "Larissa", "Fernanda", "Gabriela", "Isabela", "Yasmin", "Mariana", "Camila"],
    "26-35": ["Laura", "Júlia", "Amanda", "Carla", "Renata", "Priscila", "Vanessa", "Daniela"],
    "36-45": ["Sandra", "Patrícia", "Cristina", "Márcia", "Silvana", "Adriana", "Simone", "Cláudia"],
    "46+":   ["Rosa", "Helena", "Nilda", "Vera", "Lúcia", "Solange", "Neuza", "Eliane"],
  },
  male: {
    "18-25": ["Lucas", "Mateus", "Pedro", "Bruno", "Thiago", "Gabriel", "Caio", "Vinícius"],
    "26-35": ["Rafael", "Diego", "Marcelo", "André", "Rodrigo", "Felipe", "Gustavo", "Leonardo"],
    "36-45": ["Carlos", "Paulo", "Eduardo", "Roberto", "Fábio", "Sérgio", "Leandro", "Alexandre"],
    "46+":   ["Antônio", "José", "Francisco", "Mário", "Gilberto", "Nelson", "Valdir", "Maurício"],
  },
};

export function generateNarratorName(
  sex: string,
  ageRange: string,
  existingNames: string[] = []
): string {
  const pool = NAMES[sex]?.[ageRange] ?? NAMES["female"]["26-35"];
  const available = pool.filter((n) => !existingNames.includes(n));
  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export function describeNarrator(narrator: {
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
}): string {
  const sex = narrator.sex === "female" ? "Mulher" : "Homem";
  const status = {
    single: "solteira",
    dating: "namorando",
    married: "casada",
    divorced: "divorciada",
  }[narrator.maritalStatus] ?? narrator.maritalStatus;
  const statusMale = {
    single: "solteiro",
    dating: "namorando",
    married: "casado",
    divorced: "divorciado",
  }[narrator.maritalStatus] ?? narrator.maritalStatus;

  const parts = [
    sex,
    narrator.ageRange,
    narrator.sex === "female" ? status : statusMale,
  ];
  if (narrator.hasChildren) parts.push("com filhos");
  if (narrator.livesAlone) parts.push("mora sozinha");

  return parts.join(" · ");
}
