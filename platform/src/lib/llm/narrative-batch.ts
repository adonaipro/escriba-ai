/**
 * 10 hand-crafted narratives for validation sprint.
 * Each is unique across: role, object, emotion, moment, moral question, theme, post count.
 *
 * Post count distribution:
 *   4 posts → N1 (gratidão), N2 (relacionamento), N3 (dinheiro)
 *   5 posts → N4 (família), N5 (trabalho), N6 (vergonha)
 *   6 posts → N7 (positivo), N8 (invasão), N9 (arrependimento), N10 (decisão difícil)
 */

export interface BatchNarrative {
  id: string;
  theme: string;
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
  posts: Array<{ position: number; content: string; hasMedia: boolean }>;
}

export function buildBatchNarratives(productUrl: string): BatchNarrative[] {
  const url = productUrl;
  return [
    // ─────────────────────────────────────────────────────────────────
    // N1 — GRATIDÃO (4 posts) · minha diarista · a chave
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-01",
      theme: "gratidão",
      role: "minha diarista",
      emotion: "gratidão",
      conflictObject: "a chave",
      sceneMoment: "quando eu cheguei do trabalho",
      moralQuestion: "Vocês dariam um presente ou ficaria só no obrigada verbal?",
      family: "surpresa_de_gratidão",
      setting: "casa",
      twist: "ela fez muito mais do que o combinado",
      hook: "Deixei minha diarista sozinha em casa pela primeira vez.",
      narrativeSummary: "minha diarista · gratidão · gesto além do esperado",
      posts: [
        {
          position: 1,
          content: `Deixei minha diarista sozinha em casa pela primeira vez.

Ela é mãe de dois filhos pequenos e pediu para trazê-los porque não tinha com quem deixar.

Disse que sim e saí nervosa para o trabalho.

Passei o dia inteiro com aquela ansiedade silenciosa. 1/4`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Quando abri a porta, parei na entrada.

A casa estava diferente. Não só limpa. Reorganizada.

Cada coisa no lugar que ela achou mais certo. O cheiro de café vinha da cozinha.

A chave estava embaixo do capacho dobrada dentro de um bilhete. 2/4`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `O bilhete dizia: "Voltei tudo do varal porque vi nuvem chegando. Deixei café. Obrigada pela confiança."

Fiquei parada no corredor por uns dois minutos.

Contei para uma amiga. Ela disse: "Que sorte."

Não era sorte. Era caráter. E isso é completamente diferente. 3/4`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Fui direto procurar um presente para ela. Encontrei isso aqui: ${url}

Porque tem pessoas que tratam a casa dos outros com mais cuidado do que muita gente trata a própria.

Vocês dariam um presente ou ficaria só no obrigada verbal? 4/4`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N2 — RELACIONAMENTO (4 posts) · meu namorado · o jantar
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-02",
      theme: "relacionamento",
      role: "meu namorado",
      emotion: "expectativa frustrada",
      conflictObject: "o jantar",
      sceneMoment: "numa sexta à noite",
      moralQuestion: "Vocês teriam falado na hora ou esperado esfriar?",
      family: "desgaste_silencioso",
      setting: "casa / mesa de jantar",
      twist: "ele não percebeu que isso era diferente de outras vezes",
      hook: "Meu namorado jantou sem mim.",
      narrativeSummary: "meu namorado · expectativa frustrada · jantar que esfriou",
      posts: [
        {
          position: 1,
          content: `Meu namorado jantou sem mim.

A comida ficou pronta às 19h. Mandei mensagem: "Já tô chegando." Trânsito. Mais trinta minutos.

Quando abri a porta ele estava terminando o prato.

Fiquei olhando da entrada sem conseguir dizer nada. 1/4`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Ele viu minha cara e disse: "Estava com fome."

Sentei. Não falei nada por uns minutos. Depois perguntei: "Você não podia esperar?"

Ele respondeu: "Esperei trinta minutos. A comida esfriou."

Respirei. Disse: "Eu fico te esperando todo dia." Silêncio. 2/4`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Ele disse que não tinha percebido que era diferente.

Que esperava quando podia, mas hoje não conseguiu.

Fiquei pensando a noite toda nisso.

Uma amiga disse: "Que frescura, comida esfria." Outra disse: "Não é a comida. É o gesto." Eu sabia qual das duas tinha razão. 3/4`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Dias depois vi isso aqui: ${url}

E fiquei pensando que às vezes a gente investe tanto em relacionamento que esquece de investir em si mesma.

Vocês teriam falado na hora ou esperado esfriar? 4/4`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N3 — DINHEIRO (4 posts) · minha amiga · o Pix
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-03",
      theme: "dinheiro",
      role: "minha amiga",
      emotion: "constrangimento",
      conflictObject: "o Pix",
      sceneMoment: "numa quinta à noite",
      moralQuestion: "Vocês teriam pedido o dinheiro de volta ou deixado pra lá?",
      family: "combinados_quebrados",
      setting: "troca de mensagens",
      twist: "ela usou o valor como se fosse um acordo diferente do que existia",
      hook: "Mandei um Pix errado para uma amiga.",
      narrativeSummary: "minha amiga · constrangimento · Pix que virou confusão",
      posts: [
        {
          position: 1,
          content: `Mandei um Pix errado para uma amiga. R$ 200 ao invés de R$ 20.

Na hora pensei: "Depois resolvo."

Ela não falou nada o dia todo.

Fiquei com aquela sensação estranha: ela viu ou fingiu que não viu? 1/4`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `No dia seguinte mandei mensagem perguntando sobre o valor.

Ela respondeu rápido: "Ah, vi sim. Achei que era para abater naquilo que você me deve do aniversário."

Travei.

Eu não devia nada. Ou devia? Comecei a calcular na cabeça. 2/4`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Ela então mandou o link de uma coisa que tinha comprado "no meu nome" para compensar.

Não fazia sentido com o que a gente tinha combinado. Até hoje não sei se foi mal-entendido ou desculpa.

Contei para outra amiga. Ela disse: "Gente assim some do mapa."

Mas era minha amiga de dez anos. Não dava para somar no mapa. 3/4`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Semanas depois vi isso aqui: ${url}

O preço era quase o mesmo valor do Pix. Ri sozinha.

Às vezes a vida tem um senso de humor estranho.

Vocês teriam pedido o dinheiro de volta ou deixado pra lá? 4/4`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N4 — FAMÍLIA (5 posts) · minha sogra · o interfone
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-04",
      theme: "família",
      role: "minha sogra",
      emotion: "invasão",
      conflictObject: "o interfone",
      sceneMoment: "um sábado de manhã",
      moralQuestion: "Vocês falariam alguma coisa ou deixariam passar?",
      family: "invasão_de_espaço",
      setting: "apartamento / sala",
      twist: "a defesa dela foi o que realmente incomodou, não o ato",
      hook: "Era um sábado de manhã. Eu estava dando banho no meu filho.",
      narrativeSummary: "minha sogra · invasão · interfone atendido sem permissão",
      posts: [
        {
          position: 1,
          content: `Era um sábado de manhã. Eu estava dando banho no meu filho quando o interfone tocou.

Antes que eu pudesse sair do banheiro, ouvi alguém atendendo.

Fiquei quieta. Quando cheguei na sala, minha sogra já estava falando com a portaria.

"Pode subir", ela disse. 1/5`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Era o entregador. Com um pacote meu.

Recebi, agradeci, fechei a porta.

Depois virei para ela e falei: "Da próxima vez, me espera atender."

Ela fez cara estranha. "Nossa, eu só apertei um botão." 2/5`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Respirei fundo.

Expliquei que não era sobre o botão. Era sobre saber quem estava entrando no prédio e o que estava chegando até a minha porta.

Ela respondeu: "Na minha casa eu sempre fiz isso."

Falei: "Eu sei. Mas essa casa é nossa." O clima ficou estranho pelo resto da manhã. 3/5`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Contei para uma amiga. Ela disse: "Gente, que frescura."

Outra respondeu: "Não. Limites são limites. Na sua casa, suas regras."

Fiquei pensando: é frescura mesmo ou é uma questão de respeito que parece pequena mas não é? 4/5`,
          hasMedia: false,
        },
        {
          position: 5,
          content: `Dias depois encontrei isso aqui: ${url}

Lembrei daquele sábado na mesma hora.

Porque no fundo a discussão nunca foi sobre o interfone. Foi sobre quem tem o direito de decidir o que acontece dentro do seu próprio espaço.

Vocês falariam alguma coisa ou deixariam passar? 5/5`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N5 — TRABALHO (5 posts) · minha colega de trabalho · o notebook
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-05",
      theme: "trabalho",
      role: "minha colega de trabalho",
      emotion: "indignação",
      conflictObject: "o notebook",
      sceneMoment: "numa segunda de manhã",
      moralQuestion: "Vocês teriam deixado usar ou falado na hora?",
      family: "limite_não_visto",
      setting: "escritório",
      twist: "a defesa foi chamar de ciúme o que era uma questão de limite",
      hook: "Cheguei numa segunda de manhã e meu notebook estava na mesa da minha colega.",
      narrativeSummary: "minha colega · indignação · notebook usado sem permissão",
      posts: [
        {
          position: 1,
          content: `Cheguei numa segunda de manhã e meu notebook estava na mesa da minha colega.

Ela estava usando.

Fiquei olhando por uns segundos tentando entender a cena.

Não perguntou. Não avisou. Só pegou. 1/5`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Perguntei o que tinha acontecido com o dela.

"Travou. Peguei o seu emprestado porque você ainda não tinha chegado."

Respirei. Não era sobre o notebook. Era sobre não ter perguntado antes.

Sobre entrar na área de outra pessoa como se fosse natural. 2/5`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Quando falei isso ela ficou na defensiva.

"Nossa, você é muito ciumenta das suas coisas. É só um computador."

Falei: "É meu computador. Com minha senha, meus arquivos, meu trabalho."

Ela largou em cima da mesa e saiu. Ficou três dias sem falar comigo. 3/5`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Contei para uma amiga que trabalha comigo. "Você exagerou."

Outra disse: "De jeito nenhum. Notebook de trabalho é pessoal."

Fiquei no meio das duas visões.

Será que fui rígida demais? Ou ceder teria sido ceder demais? 4/5`,
          hasMedia: false,
        },
        {
          position: 5,
          content: `Semanas depois vi isso aqui: ${url}

E pensei: tem momentos em que investir em você mesma é a única resposta que não precisa de validação de ninguém.

Vocês teriam deixado usar ou falado na hora? 5/5`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N6 — VERGONHA (5 posts) · minha vizinha · a janela
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-06",
      theme: "vergonha",
      role: "minha vizinha",
      emotion: "vergonha",
      conflictObject: "a janela",
      sceneMoment: "num domingo à tarde",
      moralQuestion: "Vocês conseguem esquecer esses momentos ou ficam carregando?",
      family: "peso_invisivel",
      setting: "apartamento / corredor",
      twist: "ela veio com preocupação, não com julgamento — e isso foi pior",
      hook: "Num domingo à tarde minha vizinha me chamou no corredor.",
      narrativeSummary: "minha vizinha · vergonha · discussão ouvida pela janela aberta",
      posts: [
        {
          position: 1,
          content: `Num domingo à tarde minha vizinha me chamou no corredor.

Ela tinha ouvido a minha discussão com meu marido pela janela aberta.

Toda ela.

Fiquei sem conseguir falar por alguns segundos. 1/5`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Ela não veio com maldade.

Veio com preocupação. Disse que ouviu minha voz e queria saber se eu estava bem.

Mas de saber que ela tinha escutado tudo, cada palavra, cada tom... me deu uma sensação que não consegui nomear na hora. 2/5`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Depois de ela ir embora fui fechar todas as janelas e sentar no chão do banheiro.

Fiquei repassando tudo que tinha dito. As palavras que usei. O tom que usei. O que ela deve ter concluído sobre mim.

Aquilo foi morar na minha cabeça por dias. 3/5`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Não contei para ninguém por uma semana.

Quando finalmente contei para uma amiga ela disse: "Qualquer um já passou por isso."

Mas não era sobre qualquer um.

Era sobre eu. E sobre o que ela ouviu que eu não quero que ninguém saiba sobre mim. 4/5`,
          hasMedia: false,
        },
        {
          position: 5,
          content: `Dias depois encontrei isso aqui: ${url}

Não sei explicar direito por quê lembrei daquele domingo.

Talvez porque às vezes a gente precisa de um gesto para si mesma depois de um momento que só ela sabe o peso.

Vocês conseguem esquecer esses momentos ou ficam carregando? 5/5`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N7 — POSITIVO (6 posts) · minha babá · a porta
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-07",
      theme: "positivo",
      role: "minha babá",
      emotion: "surpresa boa",
      conflictObject: "a porta",
      sceneMoment: "quando eu cheguei do trabalho depois de três dias viajando",
      moralQuestion: "Vocês já presenciaram algo assim que mudou como veem as pessoas?",
      family: "surpresa_de_gratidão",
      setting: "casa / entrada",
      twist: "o cuidado dela com os filhos ensinou algo sobre o meu próprio cuidado",
      hook: "Voltei de viagem de trabalho depois de três dias.",
      narrativeSummary: "minha babá · surpresa boa · cuidado que vai além do contratado",
      posts: [
        {
          position: 1,
          content: `Voltei de viagem de trabalho depois de três dias.

Trabalhei além do normal, mal comi direito, e carregava aquela culpa silenciosa de quem deixou a rotina dos filhos na mão de outra pessoa.

Cheguei na sexta à noite, exausta.

Abri a porta. 1/6`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Meus filhos vieram correndo.

Com desenhos. Cada um fez um para mim.

A babá tinha deixado tinta e folhas e ocupado a tarde com isso enquanto esperavam.

Fiquei olhando para os papéis dobrados nas mãozinhas deles. 2/6`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Perguntei como tinha sido. Ela contou tudo.

O mais novo tinha chorado no segundo dia mas ela inventou uma brincadeira que tirou a choradeira em dez minutos.

O mais velho tinha ficado com saudade mas escreveu numa folha tudo que ia me contar quando eu chegasse.

Ela tinha guardado o papel para eu ler. 3/6`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Fui agradecer e ela disse: "É o que eu gosto de fazer."

Não era protocolo. Era genuíno. Completamente diferente.

Fiquei pensando em como a gente passa tanto tempo ouvindo histórias de falta de comprometimento que quando alguém é de verdade, a gente quase não sabe como reagir. 4/6`,
          hasMedia: false,
        },
        {
          position: 5,
          content: `Fui procurar um presente para ela. Encontrei isso aqui: ${url}

Não era só um presente. Era uma forma de dizer: eu vi o que você fez. E fez diferença.

Às vezes o cuidado que alguém coloca no que faz nos ensina algo sobre o que estamos colocando no que fazemos. 5/6`,
          hasMedia: false,
        },
        {
          position: 6,
          content: `Até hoje ela não sabe o quanto aquele fim de semana mudou a minha relação com o meu próprio trabalho.

Às vezes é uma pessoa simples, fazendo uma coisa simples, com uma intenção genuína que muda alguma coisa dentro da gente.

Vocês já presenciaram algo assim que mudou como veem as pessoas? 6/6`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N8 — INVASÃO DE LIMITES (6 posts) · minha cunhada · a mala
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-08",
      theme: "invasão de limites",
      role: "minha cunhada",
      emotion: "invasão",
      conflictObject: "a mala",
      sceneMoment: "quando eu estava arrumando para viajar",
      moralQuestion: "Vocês acham que eu errei ou acertei em falar?",
      family: "limite_não_visto",
      setting: "quarto / viagem",
      twist: "a blusa que ela colocou na mala ficou ótima — e isso deixou tudo mais confuso",
      hook: "Estava arrumando minha mala para viagem quando minha cunhada entrou no quarto.",
      narrativeSummary: "minha cunhada · invasão · mala arrumada sem pedir",
      posts: [
        {
          position: 1,
          content: `Estava arrumando minha mala para viagem quando minha cunhada entrou no quarto.

Olhou para a mala aberta e começou a sugerir o que eu deveria levar.

Não perguntou. Começou a falar.

Fiquei olhando para ela tentando entender se ela percebeu que não tinha pedido ajuda. 1/6`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Primeiro foram sugestões.

Depois ela foi até o armário e puxou uma blusa que eu tinha descartado da mala.

"Essa aqui você deveria levar."

Antes que eu pudesse falar ela já estava dobrando e colocando. 2/6`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Parei tudo e falei: "Eu consigo arrumar sozinha, obrigada."

Ela ficou com uma cara de quem não esperava aquilo. Disse: "Tô só ajudando."

Respondi: "Eu sei. Mas não pedi ajuda."

Ela saiu sem falar mais nada. 3/6`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Meu marido disse que eu fui grossa.

Minha mãe disse que eu tinha razão.

Minha amiga de viagem disse: "Ainda bem que você falou porque senão ia ficar ruminando isso durante a viagem toda."

Perspectivas tão diferentes que me fizeram questionar a minha. 4/6`,
          hasMedia: false,
        },
        {
          position: 5,
          content: `Na viagem, quando abri a mala, a blusa estava lá. Eu tinha esquecido de tirar.

Usei. Ficou ótima.

Fiquei com uma sensação estranha que não consegui bem nomear.

Encontrei isso aqui durante a viagem: ${url} E ri para mim mesma. 5/6`,
          hasMedia: false,
        },
        {
          position: 6,
          content: `Tem coisas que a gente defende pelo princípio, não pelo conteúdo.

E às vezes o princípio está certo mesmo quando o resultado do outro era bom.

Não é sobre a blusa. É sobre o direito de arrumar a própria mala do jeito que quiser.

Vocês acham que eu errei ou acertei em falar? 6/6`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N9 — ARREPENDIMENTO (6 posts) · meu irmão · o celular
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-09",
      theme: "arrependimento",
      role: "meu irmão",
      emotion: "arrependimento",
      conflictObject: "o celular",
      sceneMoment: "antes de dormir",
      moralQuestion: "Vocês já arrependeram de uma decisão que tomaram para se proteger?",
      family: "desgaste_silencioso",
      setting: "troca de mensagens / noite",
      twist: "o pedido de ajuda que pareceu padrão era urgente de verdade",
      hook: "Antes de dormir meu irmão me mandou mensagem pedindo dinheiro emprestado.",
      narrativeSummary: "meu irmão · arrependimento · negar empréstimo que era urgente de verdade",
      posts: [
        {
          position: 1,
          content: `Antes de dormir meu irmão me mandou mensagem pedindo dinheiro emprestado.

Não era a primeira vez. Tinha emprestado antes e a devolução tinha sido lenta, parcial, dolorosa.

Desta vez eu disse não.

Coloquei o celular na mesa e tentei dormir. 1/6`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Ele não respondeu mais nada.

Fiquei com o celular na mão por um tempo olhando para a tela escura.

Pensei: ele entendeu. É o mais saudável.

Desliguei a luz e tentei dormir. Não consegui tão rápido quanto imaginei. 2/6`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Dias depois soube por minha mãe que ele tinha precisado de verdade dessa vez.

Não era para costume. Era para pagar um exame.

Fiquei parada quando ela contou.

Não disse nada. Mas aquilo foi sentar em mim de um jeito diferente. 3/6`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Não consegui ligar para ele por dias.

Quando liguei, ele atendeu normal. Sem ressentimento visível.

Uma amiga disse: "Você não tem obrigação de adivinhar o que é urgente."

Outra disse: "Mas você vai carregar isso." Ambas estavam certas. 4/6`,
          hasMedia: false,
        },
        {
          position: 5,
          content: `Semanas depois encontrei isso aqui: ${url}

Comprei para ele e mandei sem dizer por quê.

Ele agradeceu com um emoji.

Talvez a gente nunca saiba exatamente o momento certo para ceder. Mas às vezes sabe quando foi rígido demais. 5/6`,
          hasMedia: false,
        },
        {
          position: 6,
          content: `Não sei se fiz a coisa errada.

Sei que fiz a coisa que me custou. E custo não é o mesmo que erro. Mas às vezes é parecido.

Se provar do que proteção parece quando ela falha é uma forma de crescer, tudo bem. Mas dói do mesmo jeito.

Vocês já arrependeram de uma decisão que tomaram para se proteger? 6/6`,
          hasMedia: false,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // N10 — DECISÃO DIFÍCIL (6 posts) · minha mãe · o portão
    // ─────────────────────────────────────────────────────────────────
    {
      id: "batch-10",
      theme: "decisão difícil",
      role: "minha mãe",
      emotion: "exaustão",
      conflictObject: "o portão",
      sceneMoment: "numa tarde de sexta",
      moralQuestion: "Vocês já enfrentaram uma decisão que nenhuma resposta resolvia completamente?",
      family: "a_decisão",
      setting: "casa da mãe / telefone",
      twist: "a conversa sobre o portão abriu algo que estava fechado há anos",
      hook: "Numa tarde de sexta meu vizinho me ligou: minha mãe estava do lado de fora do portão há mais de uma hora.",
      narrativeSummary: "minha mãe · exaustão · decisão sobre independência e segurança",
      posts: [
        {
          position: 1,
          content: `Numa tarde de sexta meu vizinho me ligou.

Minha mãe estava do lado de fora do portão há mais de uma hora porque tinha esquecido a senha.

De novo.

Fui até lá. 1/6`,
          hasMedia: false,
        },
        {
          position: 2,
          content: `Ela estava bem. Só frustrada consigo mesma.

Quando me viu disse: "Eu sei que você vai querer me tirar daqui."

Não soube o que falar.

Porque sim, estava pensando nisso. Mas não queria que ela soubesse que estava. 2/6`,
          hasMedia: false,
        },
        {
          position: 3,
          content: `Conversamos por horas naquele dia.

Sobre ela. Sobre o que ela quer. Sobre o que eu preciso. Sobre o que é segurança e o que é controle.

Sobre quando cuidar de alguém começa a parecer tirar a autonomia de alguém.

Não chegamos a uma conclusão. Mas nunca tínhamos chegado tão perto de uma. 3/6`,
          hasMedia: false,
        },
        {
          position: 4,
          content: `Contei para meu irmão. "Você precisa tomar uma decisão."

Contei para uma amiga. "Essa decisão não é só sua."

As duas visões eram verdadeiras ao mesmo tempo.

A decisão era impossível e urgente ao mesmo tempo. 4/6`,
          hasMedia: false,
        },
        {
          position: 5,
          content: `Nessa semana encontrei isso aqui: ${url}

Não foi o que resolveu. Mas foi algo que comprei para ela sem precisar de uma razão grande.

Às vezes o cuidado não precisa de decisão. Ele só acontece enquanto a gente ainda não sabe o que fazer. 5/6`,
          hasMedia: false,
        },
        {
          position: 6,
          content: `Ela ainda mora sozinha. Ainda não tomamos a decisão.

Mas a conversa naquele dia abriu algo que estava fechado há anos entre a gente.

Às vezes a decisão que parece urgente não é sobre resolver. É sobre finalmente conversar.

Vocês já enfrentaram uma decisão que nenhuma resposta resolvia completamente? 6/6`,
          hasMedia: false,
        },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────
// Similarity checker
// ─────────────────────────────────────────────────────────────────

const DIMENSIONS: (keyof BatchNarrative)[] = [
  "role",
  "emotion",
  "conflictObject",
  "sceneMoment",
  "moralQuestion",
  "theme",
];

export function computeSimilarityMatrix(narratives: BatchNarrative[]): number[][] {
  return narratives.map((a) =>
    narratives.map((b) => {
      if (a.id === b.id) return 0;
      const shared = DIMENSIONS.filter((d) => a[d] === b[d]).length;
      return shared / DIMENSIONS.length;
    })
  );
}

export function checkSimilarity(
  narratives: BatchNarrative[],
  threshold = 0.34 // >2 of 6 shared dimensions
): { passed: boolean; violations: Array<{ a: string; b: string; score: number }> } {
  const matrix = computeSimilarityMatrix(narratives);
  const violations: Array<{ a: string; b: string; score: number }> = [];

  for (let i = 0; i < narratives.length; i++) {
    for (let j = i + 1; j < narratives.length; j++) {
      const score = matrix[i][j];
      if (score >= threshold) {
        violations.push({ a: narratives[i].id, b: narratives[j].id, score });
      }
    }
  }

  return { passed: violations.length === 0, violations };
}
