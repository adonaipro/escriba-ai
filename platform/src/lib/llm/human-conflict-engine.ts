// Human Conflict Engine
//
// A inteligência do Escriba vive aqui — na ESCOLHA da história certa,
// não em regras de escrita.
//
// Este banco cresce com o tempo à medida que o Learning Engine alimenta dados
// de engajamento de volta. Hoje: 29 conflitos curados. Futuro: pesos dinâmicos
// por retenção, comentários, compartilhamentos, CTR e conversão.

export type ConflictCategory =
  | "família"
  | "relacionamento"
  | "amizade"
  | "trabalho"
  | "identidade"
  | "dinheiro"
  | "saúde_mental"
  | "maternidade";

export interface HumanConflict {
  id: string;
  category: ConflictCategory;
  name: string;
  essence: string;
  narrator_feels: string;
  reader_thinks: string;
  typical_character: string;
  productTags: string[];
}

export const CONFLICT_BANK: HumanConflict[] = [
  // ── FAMÍLIA ─────────────────────────────────────────────────────────────────
  {
    id: "sogra_sem_limite",
    category: "família",
    name: "Sogra que não respeita limite",
    essence: "A sogra age como se a casa, a vida, as decisões da nora fossem dela também.",
    narrator_feels: "invasão, impotência, raiva contida",
    reader_thinks: "Kkkk sofri isso / minha sogra é igualzinha / o marido não faz nada?",
    typical_character: "minha sogra",
    productTags: ["lar", "autocuidado", "identidade", "território", "bem_estar", "privacidade"],
  },
  {
    id: "mae_que_critica_tudo",
    category: "família",
    name: "Mãe que não aprova nada",
    essence: "Qualquer escolha da filha adulta vira motivo de crítica ou sugestão não pedida.",
    narrator_feels: "frustração, exaustão, culpa, desejo de aprovação que nunca vem",
    reader_thinks: "Minha mãe é exatamente assim / dói demais isso",
    typical_character: "minha mãe",
    productTags: ["autocuidado", "identidade", "independência", "investir_em_si", "beleza", "saúde"],
  },
  {
    id: "pai_decide_pelo_filho_adulto",
    category: "família",
    name: "Pai que ainda decide pela filha adulta",
    essence: "O pai toma decisões ou dá opiniões como se ela ainda tivesse 16 anos.",
    narrator_feels: "infantilização, raiva, amor confuso",
    reader_thinks: "Pai é assim mesmo? / alguém mais tem isso? / você falou alguma coisa?",
    typical_character: "meu pai",
    productTags: ["independência", "identidade", "autocuidado", "decisão_própria"],
  },
  {
    id: "familia_critica_gasto",
    category: "família",
    name: "Família que critica como você gasta seu dinheiro",
    essence: "Alguém da família questiona uma compra feita com o seu próprio dinheiro.",
    narrator_feels: "indignação, culpa, vontade de justificar o que não precisava ser justificado",
    reader_thinks: "Eles fazem isso também? / é o dinheiro DELA / por que precisamos explicar?",
    typical_character: "minha mãe / minha sogra / meu marido",
    productTags: ["investir_em_si", "autocuidado", "independência", "dinheiro"],
  },
  {
    id: "cunhada_que_compara",
    category: "família",
    name: "Cunhada que compara constantemente",
    essence: "A cunhada transforma qualquer assunto numa comparação — geralmente ela sai ganhando.",
    narrator_feels: "irritação, insegurança que ela não quer sentir",
    reader_thinks: "Kkkkk cunhada é tudo igual / como você não respondeu nada?",
    typical_character: "minha cunhada",
    productTags: ["identidade", "autocuidado", "beleza", "lar", "bem_estar"],
  },
  {
    id: "filho_preferido_evidente",
    category: "família",
    name: "Filho preferido evidente",
    essence: "Os pais tratam um filho diferente do outro — e todo mundo finge que não está vendo.",
    narrator_feels: "mágoa velha, tristeza, normalização de algo que não é normal",
    reader_thinks: "Sofri isso a vida inteira / achei que era só eu",
    typical_character: "minha mãe / meu pai",
    productTags: ["autocuidado", "saúde_mental", "identidade", "bem_estar"],
  },

  // ── RELACIONAMENTO ───────────────────────────────────────────────────────────
  {
    id: "marido_nao_percebe",
    category: "relacionamento",
    name: "Marido que não percebe o esforço invisível",
    essence: "Ela faz tudo, ele não vê nada. E quando ela menciona, ele diz que 'ajuda'.",
    narrator_feels: "exaustão, invisibilidade, solidão dentro do casamento",
    reader_thinks: "TODO marido é assim / o meu é igualzinho / você falou algo para ele?",
    typical_character: "meu marido",
    productTags: ["autocuidado", "bem_estar", "lar", "descanso", "saúde_mental", "produtividade"],
  },
  {
    id: "marido_decide_sem_consultar",
    category: "relacionamento",
    name: "Marido que decide sem consultar",
    essence: "Ele tomou uma decisão que afeta os dois — sem perguntar, como se ela não existisse.",
    narrator_feels: "invasão, desrespeito, raiva, sensação de não ser ouvida",
    reader_thinks: "O meu também faz isso / isso é falta de respeito / você deixou passar?",
    typical_character: "meu marido",
    productTags: ["identidade", "independência", "lar", "dinheiro", "decisão_própria"],
  },
  {
    id: "parceiro_que_minimiza",
    category: "relacionamento",
    name: "Parceiro que minimiza o que ela sente",
    essence: "'Tá exagerando', 'isso não é nada', 'você é muito sensível' — mas o que ela sente é real.",
    narrator_feels: "invalidação, confusão, raiva, dúvida de si mesma",
    reader_thinks: "Isso tem nome. Isso é gaslighting. / Larguei alguém assim",
    typical_character: "meu marido / meu namorado",
    productTags: ["saúde_mental", "autocuidado", "identidade", "bem_estar"],
  },
  {
    id: "expectativa_nao_dita",
    category: "relacionamento",
    name: "Expectativa que não foi dita — e que feriu mesmo assim",
    essence: "Ela esperava algo. Ele não fez. Ninguém falou. E a mágoa ficou.",
    narrator_feels: "decepção, solidão, vergonha de ter esperado",
    reader_thinks: "Passei exatamente isso / como a gente aprende a pedir?",
    typical_character: "meu marido / meu namorado",
    productTags: ["relacionamento", "autocuidado", "bem_estar", "saúde_mental"],
  },
  {
    id: "ex_que_voltou_como_nada",
    category: "relacionamento",
    name: "O ex que voltou como se nada tivesse acontecido",
    essence: "Ele some, some, some — e quando reaparece age como se o tempo não tivesse passado.",
    narrator_feels: "raiva, nostalgia, confusão, resistência",
    reader_thinks: "Não deixa entrar não / kkkk conheço esse tipo / o que você fez?",
    typical_character: "meu ex",
    productTags: ["identidade", "autocuidado", "independência", "bem_estar"],
  },

  // ── AMIZADE ─────────────────────────────────────────────────────────────────
  {
    id: "amiga_some_na_dificuldade",
    category: "amizade",
    name: "Amiga que some quando você mais precisa",
    essence: "Na alegria estava lá. Na dificuldade, a última a aparecer — ou não apareceu.",
    narrator_feels: "decepção, solidão, clareza dolorosa sobre quem é quem",
    reader_thinks: "Isso é doído demais / passei exatamente isso esse ano",
    typical_character: "minha amiga",
    productTags: ["autocuidado", "saúde_mental", "bem_estar", "identidade"],
  },
  {
    id: "amiga_que_compete",
    category: "amizade",
    name: "Amizade que virou competição sem avisar",
    essence: "Ela não comemora suas conquistas. Ela conta as dela logo depois.",
    narrator_feels: "estranheza, saudade da amizade que era",
    reader_thinks: "Tenho uma amiga assim / isso é exaustivo / você terminou a amizade?",
    typical_character: "minha amiga",
    productTags: ["identidade", "autocuidado", "investir_em_si", "bem_estar"],
  },
  {
    id: "grupo_que_exclui_sutilmente",
    category: "amizade",
    name: "A exclusão sutil do grupo",
    essence: "Ninguém fez nada 'de propósito'. Mas ela ficou de fora. E percebeu.",
    narrator_feels: "rejeição, dúvida, tristeza, questionamento de si mesma",
    reader_thinks: "Eu passei por isso / o pior é quando é sutil",
    typical_character: "minhas amigas / o grupo",
    productTags: ["identidade", "autocuidado", "bem_estar", "saúde_mental"],
  },

  // ── TRABALHO ────────────────────────────────────────────────────────────────
  {
    id: "esforco_invisivel_trabalho",
    category: "trabalho",
    name: "Esforço que ninguém reconhece no trabalho",
    essence: "Ela entrega mais do que qualquer um. O reconhecimento vai para outro.",
    narrator_feels: "frustração, desmotivação, injustiça",
    reader_thinks: "Isso acontece com TODO mundo / você conversou com o chefe?",
    typical_character: "meu chefe / meu colega",
    productTags: ["produtividade", "autocuidado", "bem_estar", "identidade", "trabalho"],
  },
  {
    id: "colega_que_rouba_credito",
    category: "trabalho",
    name: "Colega que apresentou sua ideia como se fosse dele",
    essence: "Ela falou a ideia. Ele repetiu na reunião. O crédito foi para ele.",
    narrator_feels: "raiva, humilhação, impotência",
    reader_thinks: "Isso é assédio moral / já vivi isso / você fez alguma coisa?",
    typical_character: "meu colega / meu chefe",
    productTags: ["identidade", "trabalho", "independência", "autocuidado"],
  },
  {
    id: "reuniao_que_ignora_mulher",
    category: "trabalho",
    name: "Falou na reunião — ninguém ouviu. Homem repetiu — todos aplaudiram.",
    essence: "A clássica. Todo mundo já viveu. Ninguém ainda sabe o que fazer.",
    narrator_feels: "invisibilidade, raiva, cansaço de ter que provar mais",
    reader_thinks: "ISSO / acontece todo dia / eu odeio isso",
    typical_character: "meu colega / a reunião toda",
    productTags: ["trabalho", "identidade", "independência", "produtividade"],
  },

  // ── IDENTIDADE ──────────────────────────────────────────────────────────────
  {
    id: "culpa_por_gastar_consigo",
    category: "identidade",
    name: "Culpa de gastar dinheiro com ela mesma",
    essence: "Ela comprou algo para si. Ficou feliz. Depois sentiu culpa — e nem sabe bem por quê.",
    narrator_feels: "prazer misturado com culpa, vontade de justificar",
    reader_thinks: "Eu me identifico demais / por que a gente faz isso? / você não precisa justificar nada",
    typical_character: "ela mesma (conflito interno)",
    productTags: ["autocuidado", "investir_em_si", "identidade", "bem_estar", "beleza", "lar"],
  },
  {
    id: "limite_que_ninguem_respeita",
    category: "identidade",
    name: "Disse não — a pessoa insistiu como se ela não tivesse falado nada",
    essence: "Ela estabeleceu um limite. A outra pessoa agiu como se não existisse.",
    narrator_feels: "invasão, raiva, questionamento sobre ter que repetir o limite",
    reader_thinks: "Isso me irrita demais / como você lidou?",
    typical_character: "minha mãe / minha sogra / minha amiga",
    productTags: ["identidade", "autocuidado", "independência", "bem_estar", "saúde_mental"],
  },
  {
    id: "mudanca_que_incomoda_outros",
    category: "identidade",
    name: "Mudou — e as pessoas ao redor não aprovam",
    essence: "Ela mudou de trabalho, de estilo, de prioridades. Os outros ficaram incomodados com a mudança.",
    narrator_feels: "certeza sobre a escolha, desconforto com a reação dos outros",
    reader_thinks: "Por que a mudança dos outros nos incomoda? / passei isso / você foi em frente?",
    typical_character: "minha família / meu parceiro / minhas amigas",
    productTags: ["identidade", "autocuidado", "independência", "investir_em_si", "bem_estar"],
  },

  // ── DINHEIRO ────────────────────────────────────────────────────────────────
  {
    id: "ela_ganha_mais_tensao",
    category: "dinheiro",
    name: "Ela ganha mais — e isso criou uma tensão que ninguém fala",
    essence: "A renda dela é maior. Ninguém fala. Mas está lá — na dinâmica, nas decisões, nos silêncios.",
    narrator_feels: "confusão, culpa sem motivo",
    reader_thinks: "Isso ainda existe / já passei / como vocês resolveram?",
    typical_character: "meu marido / meu namorado",
    productTags: ["independência", "dinheiro", "identidade", "investir_em_si"],
  },
  {
    id: "pressao_financeira_invisivel",
    category: "dinheiro",
    name: "A gestão financeira que ela carrega sozinha",
    essence: "Ela é quem paga as contas, gerencia o dinheiro, controla tudo — e ninguém reconhece.",
    narrator_feels: "exaustão, solidão, peso de carregar algo que deveria ser dividido",
    reader_thinks: "Gestão financeira invisível / quem mais passa isso?",
    typical_character: "ela mesma / a família toda",
    productTags: ["produtividade", "bem_estar", "autocuidado", "saúde_mental", "dinheiro"],
  },

  // ── SAÚDE MENTAL ────────────────────────────────────────────────────────────
  {
    id: "burnout_invisivel",
    category: "saúde_mental",
    name: "Está no limite — mas continua sendo 'a forte'",
    essence: "Por fora parece estar bem. Por dentro, está funcionando no modo emergência há meses.",
    narrator_feels: "exaustão profunda, medo de decepcionar, saudade de si mesma",
    reader_thinks: "Isso sou eu / quando você percebeu? / preciso desse texto",
    typical_character: "ela mesma",
    productTags: ["autocuidado", "saúde_mental", "bem_estar", "descanso", "investir_em_si"],
  },
  {
    id: "ansiedade_que_ninguem_ve",
    category: "saúde_mental",
    name: "A ansiedade que ninguém vê porque ela esconde bem",
    essence: "Ela sorri, responde, entrega. Mas por dentro está em colapso silencioso.",
    narrator_feels: "dissonância entre dentro e fora, cansaço de fingir",
    reader_thinks: "Isso sou eu / obrigada por falar / como você lida?",
    typical_character: "ela mesma",
    productTags: ["saúde_mental", "bem_estar", "autocuidado", "descanso"],
  },

  // ── MATERNIDADE ─────────────────────────────────────────────────────────────
  {
    id: "culpa_de_mae",
    category: "maternidade",
    name: "Culpa de mãe que qualquer decisão gera",
    essence: "Trabalha demais — culpa. Trabalha menos — culpa. É perfeita? Culpa disso também.",
    narrator_feels: "culpa constante, exaustão, desejo de sair do ciclo",
    reader_thinks: "POR QUE A GENTE SENTE ISSO / alguém me diz que vai ficar bem",
    typical_character: "ela mesma / o filho",
    productTags: ["autocuidado", "bem_estar", "saúde_mental", "descanso", "maternidade"],
  },
  {
    id: "mae_que_nao_cuida_de_si",
    category: "maternidade",
    name: "Cuida de todo mundo — menos dela mesma",
    essence: "O filho tem tudo. O marido tem tudo. A casa tem tudo. Ela: sobras de tempo e energia.",
    narrator_feels: "invisibilidade, exaustão, aceitação que está começando a questionar",
    reader_thinks: "Isso é minha mãe / isso sou eu / isso não é normal",
    typical_character: "ela mesma",
    productTags: ["autocuidado", "investir_em_si", "bem_estar", "descanso", "maternidade"],
  },
  {
    id: "julgamento_das_maes",
    category: "maternidade",
    name: "Julgada por outras mães",
    essence: "A maternidade virou competição. Ela está cansada de justificar suas escolhas.",
    narrator_feels: "irritação, insegurança, exaustão de precisar justificar",
    reader_thinks: "Detesto esse ambiente / já fui julgada / como você lida?",
    typical_character: "as outras mães / o grupo de mães",
    productTags: ["identidade", "autocuidado", "bem_estar", "maternidade"],
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatConflictBankForLLM(): string {
  const byCategory = CONFLICT_BANK.reduce<Record<string, HumanConflict[]>>((acc, c) => {
    acc[c.category] = acc[c.category] ?? [];
    acc[c.category].push(c);
    return acc;
  }, {});

  return Object.entries(byCategory)
    .map(([cat, conflicts]) => {
      const items = conflicts
        .map(c =>
          `  [${c.id}]\n  ${c.name}\n  Essência: ${c.essence}\n  Discussão: ${c.reader_thinks}`
        )
        .join("\n\n");
      return `${cat.toUpperCase()}\n\n${items}`;
    })
    .join("\n\n---\n\n");
}

export function getConflictById(id: string): HumanConflict | undefined {
  return CONFLICT_BANK.find(c => c.id === id);
}

export function getConflictsByCategory(category: ConflictCategory): HumanConflict[] {
  return CONFLICT_BANK.filter(c => c.category === category);
}
