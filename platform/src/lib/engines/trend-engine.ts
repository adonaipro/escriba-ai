// Narrative-first content engine — stories, not copy
// Architecture: 6 story families × 2 variations × 7 posts = 84 unique narrative posts
// Patterns extracted from high-engagement Threads posts (54k–433k views)

export const TREND_FORMATS = [
  { key: "transformation", label: "Transformação" },
  { key: "discovery", label: "Descoberta" },
  { key: "mistake", label: "Erro que Aprendi" },
  { key: "curiosity", label: "Curiosidade" },
  { key: "comparison", label: "Comparação" },
  { key: "routine", label: "Rotina Real" },
  { key: "other_person", label: "A Historia de Alguem" },
  { key: "real_case", label: "Caso Real" },
  { key: "numbered_list", label: "Lista Reveladora" },
  { key: "case_study", label: "Estudo de Caso" },
  { key: "review", label: "Relato Honesto" },
  { key: "storytelling", label: "Narrativa" },
  { key: "opinion", label: "Opiniao Direta" },
  { key: "behind_scenes", label: "Bastidores" },
  { key: "myths_truths", label: "Mitos e Verdades" },
  { key: "qa", label: "Perguntas e Respostas" },
] as const;

export type TrendFormat = (typeof TREND_FORMATS)[number]["key"];

export interface TrendPostData {
  position: number;
  content: string;
  hasMedia: boolean;
  mediaType?: "image" | "video";
}

export interface GeneratedTrend {
  format: TrendFormat;
  hook: string;
  narrativeSummary: string;
  qualityScore: number;
  posts: TrendPostData[];
  rejectionReason?: string;
}

export interface TrendEngineInput {
  productName: string;
  productUrl: string;
  marketplace: string;
  targetNetwork: string;
  niche?: string;
  format?: string;
  campaignId: string;
  regenerationSeed?: number;
}

// --- Utilities ---

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// --- Story Families ---
// {productUrl} and {productName} replaced at generation time

type StoryPost = { content: string; hasMedia?: boolean; mediaType?: "image" | "video" };
type StoryVariation = { posts: StoryPost[]; narrativeSummary: string; qualityBase: number };
type StoryFamily = { formats: TrendFormat[]; variations: StoryVariation[] };

const NARRATIVE_FAMILIES: StoryFamily[] = [
  // Family 0: O Gesto Inesperado
  {
    formats: ["curiosity", "storytelling", "discovery"],
    variations: [
      {
        narrativeSummary: "Gesto de cuidado escondido gera conflito entre gratidao e constrangimento",
        qualityBase: 0.86,
        posts: [
          {
            content: "Minha amiga mais antiga veio tomar cafe aqui em casa semana passada. A gente ficou conversando quase duas horas, como costuma ser. Ela foi embora, eu fui guardar algumas coisas na cozinha. Foi ai que vi o envelope em cima da geladeira.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Meu nome escrito a mao na frente. Dentro tinha dinheiro dobrado e um bilhete: \"Nao pergunta, nao devolve. Sei que as vezes o mes aperta e sei que voce nunca vai aceitar se eu oferecer na sua frente.\" Fiquei ali parada relendo aquilo tres vezes.",
          },
          {
            content: "A primeira reacao foi aquele aperto no peito de quem recebe algo que nao esperava. A segunda foi diferente: em que momento eu passei a imagem de que precisava que minha amiga escondesse dinheiro dentro da minha casa? O que eu disse, ou deixei de dizer, que fez ela chegar a isso?",
          },
          {
            content: "Contei pra familia. Minha mae achou o gesto mais bonito do mundo. Meu marido ficou quieto e depois falou: \"Mas ela assumiu que voces estao mal sem te perguntar. Isso nao te incomoda?\" E eu percebi que as duas reacoes faziam todo o sentido ao mesmo tempo.",
          },
          {
            content: "Tem gestos que chegam cheios de amor e cheios de suposicao juntos. E ai voce nao sabe o que fazer com os dois ao mesmo tempo. Devolver parece ingratidao. Aceitar parece confirmar uma imagem que voce nem sabia que estava projetando.",
          },
          {
            content: "No dia seguinte ela me ligou. Disse que nao queria que ficasse pesado entre a gente. Antes de desligar, disse que tinha pedido isso aqui {productUrl} pra me mandar ha semanas. \"Tava esperando o momento certo.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces aceitariam o gesto com tudo que vem junto, devolveriam o dinheiro, ou ficariam com aquela sensacao de que precisam explicar alguma coisa?",
          },
        ],
      },
      {
        narrativeSummary: "Transferencia anonima gera conflito entre gratidao e percepcao de necessidade",
        qualityBase: 0.83,
        posts: [
          {
            content: "Recebi uma transferencia de uma amiga no sabado de manha. Sem mensagem. So o valor e um emoji de coracao. Mandei mensagem perguntando o que era. Ela demorou horas pra responder.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Quando respondeu, disse que tinha percebido que eu estava num periodo dificil e queria ajudar de algum jeito. \"Eu sei que voce nao ia aceitar se eu oferecesse. Entao eu so mandei.\" Eu nao soube o que responder.",
          },
          {
            content: "Fiquei ali um tempo olhando pra mensagem sem saber se estava feliz, constrangida, ou as duas coisas ao mesmo tempo. Em algum momento eu passei a projetar uma imagem de que estava mal. Ou ela enxergou algo que eu estava escondendo de mim mesma.",
          },
          {
            content: "Quando contei pra minha irma, ela disse: \"Voce tem que agradecer e ponto.\" Quando contei pro meu namorado, ele falou: \"Mas faz sentido ela ter feito isso sem perguntar primeiro?\" E ai eu fiquei com dois pontos de vista completamente validos.",
          },
          {
            content: "Boa intencao e bom gesto as vezes nao sao a mesma coisa. Um gesto pode nascer de amor e ainda assim carregar uma suposicao que doi. Nao porque a pessoa quis machucar. Mas porque ajuda sem pergunta vem embrulhada numa conclusao que ela tirou sobre a sua vida.",
          },
          {
            content: "Acabei aceitando. Dias depois ela mandou esse link {productUrl} dizendo que tinha comprado pra mim. \"Eram duas formas de cuidar.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces conseguem receber ajuda sem se sentir menores por isso, ou sempre fica aquele resto de desconforto?",
          },
        ],
      },
    ],
  },

  // Family 1: O Peso Que Ninguem Ve
  {
    formats: ["transformation", "routine", "behind_scenes", "other_person"],
    variations: [
      {
        narrativeSummary: "A pessoa mais forte escondendo colapso silencioso no unico lugar sem expectativas",
        qualityBase: 0.91,
        posts: [
          {
            content: "Meu cunhado comecou a chegar do trabalho e ir direto pro banheiro. Sem cumprimentar, sem perguntar das criancas. So entrava, fechava a porta. Minha irma perguntou uma vez, duas vezes, tres vezes. Ele dizia que era cansaco. Ate o dia que ela foi atras.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Ela abriu a porta do banheiro e achou ele sentado no chao do box. Agua caindo. Nem fria nem quente. Ele nem se mexeu quando ela entrou. Ficou olhando pro nada, sem pressa nenhuma de sair dali. Minha irma disse que nunca tinha visto aquele olhar nele.",
          },
          {
            content: "Ela sentou no chao do banheiro tambem. Ficou ali em silencio por um tempo. Quando ele finalmente falou, disse: \"Aqui e o unico lugar da casa onde ninguem precisa de mim. Onde eu nao preciso ser forte, dar conta, resolver, responder. Por uns minutos eu nao sou responsavel por nada.\"",
          },
          {
            content: "O que ficou na minha cabeca foi o seguinte: durante o dia ele trabalhava, brincava com os filhos, fazia piada, pagava as contas. Parecia o mais inteiro de todo mundo. A gente pergunta como ta quem ta visivelmente mal. Quem nunca para de funcionar, a gente assume que ta bem.",
          },
          {
            content: "As vezes a pessoa mais cansada da sala e justamente a que aprendeu a nao demonstrar. Porque ja percebeu que se demonstrar, vai ter que consolar quem ficou preocupado. Entao sorri, produz, resolve. E vai descansar no unico lugar onde ninguem espera nada dela.",
          },
          {
            content: "Minha irma convenceu ele a procurar ajuda. Foi um processo longo. Durante esse periodo, ela tambem comecou a cuidar mais da propria rotina. Encontrou esse produto aqui {productUrl} e disse que parecia detalhe, mas que entrou na rotina de um jeito que fez diferenca nos dias mais pesados.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces acham que a maioria das pessoas so pede ajuda quando ja chegou no limite, ou tem gente que consegue reconhecer antes disso?",
          },
        ],
      },
      {
        narrativeSummary: "Ritual escondido de choro no carro revela peso invisivel de quem sempre parece bem",
        qualityBase: 0.88,
        posts: [
          {
            content: "Minha irma passou a chegar da academia na mesma hora todo dia. So que eu percebi que ela saia de casa as 7h mas nao ficava na academia ate as 9h. Perguntei onde ela ficava nas horas que sobravam. Ela ficou me olhando sem responder.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Quando ela finalmente falou, disse que ficava parada no estacionamento. \"Eu preciso de um lugar que seja so meu por uns minutos. Sem ninguem precisando de mim, sem ninguem esperando resposta.\" Ela chorava um pouco, ouvia musica, e ai ia.",
          },
          {
            content: "Ela nao estava mal de um jeito visivel. Trabalhava, cuidava dos filhos, respondia mensagem, ia a aniversario, sorria nas fotos. Por fora tudo ia bem. Mas ela tinha criado um ritual de choro no estacionamento pra nao precisar chorar em mais lugar nenhum.",
          },
          {
            content: "Perguntei por que ela nao tinha falado pra mim. Ela disse: \"Porque ai eu teria que explicar que nao era nada especifico. Que era tudo e era nada ao mesmo tempo. E ai voce ia se preocupar, minha mae ia ligar todo dia, e eu ia acabar cuidando da preocupacao de todo mundo alem da minha.\"",
          },
          {
            content: "Tem um cansaco que nao tem nome facil. Que nao e crise clara. E so o peso de ser responsavel por muita coisa por tempo demais sem uma pausa real. E quem carrega esse peso geralmente e o ultimo a admitir que precisa de ajuda.",
          },
          {
            content: "Ela comecou terapia. Disse que foi a primeira vez em muito tempo que alguem ficou responsavel por entender como ela estava, em vez de ela ser responsavel por fazer o outro entender. Nesse periodo, ela me falou desse produto aqui {productUrl} que incorporou na rotina. \"Me ajudou a criar um espaco de cuidado em casa.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces tem algum lugar ou ritual particular onde vao quando precisam ser so de voces, sem precisar ser nada pra ninguem?",
          },
        ],
      },
    ],
  },

  // Family 2: A Situacao que Virou o Ambiente
  {
    formats: ["mistake", "comparison", "opinion", "real_case"],
    variations: [
      {
        narrativeSummary: "Comportamento fora de controle destroi evento familiar e gera questao sobre perdao",
        qualityBase: 0.85,
        posts: [
          {
            content: "Fui pra um churrasco no domingo. Daqueles que comeca bem: familia reunida, mesa farta, crianca brincando, risada boa. Ficou assim por umas duas horas. Depois um homem bebeu mais do que devia e decidiu estragar tudo.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Ele comecou com um comentario estranho sobre alguem presente. Depois outro. Comecou a misturar nomes, inventar situacoes que nao tinham acontecido, acusar pessoas de coisas que nao existiam. Ninguem entendia de onde aquilo estava vindo.",
          },
          {
            content: "Em quinze minutos o ambiente virou. Nao por briga de verdade, mas por aquele tipo de tensao que faz a gente querer ir embora mas nao conseguir sair sem parecer que esta fugindo. As criancas pararam de brincar. Os adultos ficaram sem graca. A anfitria estava vermelha de vergonha.",
          },
          {
            content: "No dia seguinte ele ligou pra cada pessoa presente dizendo que nao lembrava de nada. Que devia ter misturado alguma coisa. A esposa estava destruida e mandou mensagem pra todo mundo repetindo que ele nunca fazia aquilo.",
          },
          {
            content: "Minutos sao suficientes pra estragar algo que levou semanas pra organizar. E a parte mais dificil e que a pessoa que causou fica sem o peso, porque nao se lembra. Quem ficou carrega o constrangimento, a imagem, a memoria.",
          },
          {
            content: "Uns dias depois ele apareceu pessoalmente pra pedir desculpa. Trouxe isso aqui {productUrl} dizendo que sabia que nao era suficiente, mas que queria fazer algo concreto alem das palavras. \"Nao da pra desfazer. Mas posso fazer diferente a partir de agora.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces aceitariam esse tipo de desculpa depois de uma situacao dessas, ou tem coisas que um pedido de perdao nao resolve?",
          },
        ],
      },
      {
        narrativeSummary: "Revelacao inesperada na hora errada compromete momento importante de outra pessoa",
        qualityBase: 0.82,
        posts: [
          {
            content: "Tinha um jantar de familia marcado ha meses. Aniversario de setenta anos da minha avo. Coisa rara, coisa importante. Todo mundo junto. Ate que no meio do jantar meu tio resolveu contar uma coisa que ele guardou por anos.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Ele anunciou que ele e minha tia estavam se separando. Na mesa do aniversario da minha avo. Na frente dos filhos. Na frente de todo mundo que estava ali pra comemorar outra coisa. \"Prefiro que saibam agora do que ficar fingindo mais tempo.\"",
          },
          {
            content: "O silencio durou uns trinta segundos que pareceram muito mais. Minha avo ficou com o olho cheio d'agua mas nao disse nada. Os filhos deles ficaram paralisados. Minha mae tentou mudar de assunto. Nao funcionou.",
          },
          {
            content: "Na semana seguinte meu tio me ligou dizendo que nao achava que tinha feito errado. \"As pessoas iam saber de qualquer forma. Preferi controlar como iam saber.\" Mas o que ficou foi a imagem da minha avo tentando nao chorar na mesa do proprio aniversario.",
          },
          {
            content: "Tem momentos que existem pra ser vividos como sao. Quando a gente forca uma agenda pessoal dentro de um momento que pertence a outro, a gente nao controla a narrativa. A gente so subtrai do momento dos outros.",
          },
          {
            content: "Meses depois minha avo foi visitar ele. Disse que entendeu a pressao que ele estava sentindo. E levou isso aqui {productUrl} de presente. \"Comprei antes de tudo isso acontecer. Guarda pra quando precisar.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces acham que existe momento certo pra dar noticia dificil, ou as vezes a pressa de falar e inevitavel?",
          },
        ],
      },
    ],
  },

  // Family 3: O Que Ela Guardou
  {
    formats: ["discovery", "storytelling", "case_study"],
    variations: [
      {
        narrativeSummary: "Caixa de cartas nunca enviadas revela dimensao desconhecida da propria mae",
        qualityBase: 0.89,
        posts: [
          {
            content: "Fui ajudar minha mae a organizar o quarto dela no fim de semana. Ela pediu que eu pegasse umas caixas no alto do armario. Peguei a primeira. A segunda. Na terceira, vi meu nome escrito no papel de fora.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Dentro tinha cartas. Umas vinte, talvez mais. Todas enderecadas a mim. Todas fechadas. Com datas espalhadas por anos, alguns de quando eu era crianca. Minha mae entrou no quarto quando eu ainda estava com a primeira na mao.",
          },
          {
            content: "Ela nao ficou brava que eu tinha pego. Ficou quieta por um tempo. Depois disse que tinha escrito quando precisava me falar alguma coisa e nao sabia como. \"Eu aprendi que as vezes e mais facil escrever do que dizer. Mas nunca soube a hora certa de mandar.\"",
          },
          {
            content: "Fiquei la lendo por horas. Cartas sobre quando eu estava mal e ela nao sabia como chegar perto. Sobre escolhas que ela discordou mas ficou quieta. Sobre quando ela ficou com medo de me perder e nao disse nada. Era a minha mae de um jeito que eu nunca tinha tido acesso.",
          },
          {
            content: "Tem pessoas que nao sabem dizer ao vivo o que sentem. Nao por frieza. Nao por falta de amor. E outro jeito de existir, que a gente as vezes nunca enxerga porque fica esperando que a pessoa seja do jeito que a gente conhece.",
          },
          {
            content: "Quando terminei de ler, minha mae tinha feito cafe. A gente ficou sentada na mesa por um tempo em silencio. Antes de eu ir embora, ela me deu um pacote. Disse que tinha pedido isso aqui {productUrl} sabendo que ia precisar de um gesto concreto depois das palavras.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces preferem as pessoas que falam na hora, mesmo que travado, ou as que guardam ate encontrar a forma certa de dizer?",
          },
        ],
      },
      {
        narrativeSummary: "Objeto encontrado numa mudanca abre segredo de quarenta anos sobre amizade perdida",
        qualityBase: 0.84,
        posts: [
          {
            content: "Ajudei minha avo a se mudar mes passado. Quarenta anos na mesma casa. Enquanto a gente embala, a gente encontra coisas. Eu encontrei uma caixa de sapato dentro do guarda-roupa que ela pediu pra eu jogar fora sem abrir.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Eu abri. Tinha fotos de uma mulher que eu nunca tinha visto, cartas com letra que eu nao reconhecia, e um anel que minha avo tinha dito que havia perdido ha anos. Levei a caixa pra ela. Ela ficou olhando sem tocar.",
          },
          {
            content: "Depois de um tempo ela me contou que aquela tinha sido uma amizade muito importante e que as duas tinham se afastado por um mal-entendido quarenta anos atras. \"A gente nunca mais falou. Nao por raiva. Por orgulho que foi ficando grande demais pra desfazer.\"",
          },
          {
            content: "Perguntei se ela sabia se a pessoa ainda estava viva. Ela disse que sabia, mas que nunca tinha entrado em contato. \"Tem coisas que a gente deixa pra depois ate nao ter mais depois.\" Ela ficou segurando o anel sem falar mais nada.",
          },
          {
            content: "Objetos guardam historias que a gente nunca vai contar em voz alta. A caixa que minha avo pediu pra jogar fora era a unica forma que ela tinha de continuar carregando algo que ela nao sabia como carregar de outra forma.",
          },
          {
            content: "Ela nao entrou em contato. Mas ficou com a caixa. Quando a mudanca terminou, ela me deu um presente: esse produto aqui {productUrl}. \"Comprei pra comemorar essa mudanca. Mas aprendi que as vezes a gente muda de endereco e carrega tudo junto.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces tem algo guardado de alguem com quem perderam o contato que nunca conseguiram jogar fora?",
          },
        ],
      },
    ],
  },

  // Family 4: A Ligacao
  {
    formats: ["transformation", "comparison", "opinion"],
    variations: [
      {
        narrativeSummary: "Ligacao inesperada de alguem distante revela que o afastamento foi descuido, nao decisao",
        qualityBase: 0.87,
        posts: [
          {
            content: "O telefone tocou numa terca a tarde. Numero que eu nao tinha mais na agenda mas que reconheci antes mesmo de atender. Era minha prima, com quem eu nao falava ha quase tres anos. A gente nao tinha brigado. A gente simplesmente havia parado.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Ela disse que estava em frente ao hospital. Que minha tia tinha passado mal. Que minha tia havia pedido pra ela me ligar porque queria que eu soubesse. Desliguei e fiquei um tempo sem saber o que fazer.",
          },
          {
            content: "Fui ao hospital. Minha tia estava bem, susto passado. Mas enquanto eu estava sentada la com ela, ela me olhou e disse: \"Eu pedi pra te ligar porque eu sentia sua falta. Nao do que a gente era antes. Da possibilidade de ser de novo.\"",
          },
          {
            content: "Na saida, minha prima e eu tomamos cafe no bar do andar de baixo. Ficamos quase duas horas conversando. Sobre o tempo que passou. Sobre o que foi ficando pra depois ate virar nunca. Sobre como e possivel amar alguem e deixar de aparecer na vida dessa pessoa ao mesmo tempo.",
          },
          {
            content: "A gente se afasta de algumas pessoas nao por raiva. Por falta de atencao. Por deixar pra depois ate nao ter mais jeito obvio de voltar. E um dia voce percebe que passou tempo demais e que isso nao foi uma decisao, foi descuido acumulado.",
          },
          {
            content: "Antes de ir embora, ela me mandou o link desse produto aqui {productUrl} pelo WhatsApp. \"Comprei quando a gente marcou de se encontrar pela ultima vez e ai nao rolou. Fiquei com ele guardado.\" Era detalhe. Mas chegou no momento exato.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces tem alguem de quem se afastaram sem briga, sem motivo claro, que sentem que ainda da tempo de voltar atras?",
          },
        ],
      },
      {
        narrativeSummary: "Reencontro ao acaso revela que a amiga precisou durante ausencia e nao sabia como chamar",
        qualityBase: 0.84,
        posts: [
          {
            content: "Minha melhor amiga do colegio sumiu da minha vida ha seis anos quando eu me mudei de cidade. A gente conversava por mensagem, depois foi espacando, depois parou. Semana passada ela apareceu no sinal enquanto eu esperava o semaforo abrir.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Ela me reconheceu antes de eu reconhecer ela. Abriu o vidro do carro e gritou meu nome. A gente ficou uns segundos sem saber o que fazer. O sinal abriu. Eu botei o carro no acostamento.",
          },
          {
            content: "A gente ficou conversando em pe na calcada por quase uma hora. Ela tinha se casado. Tinha tido uma filha. Tinha passado por uma situacao muito dificil ha tres anos. \"Eu precisei muito de voce nessa epoca. Mas tinha parece tanto tempo que eu nao sabia mais como chegar.\"",
          },
          {
            content: "Aquilo ficou em mim. Ela precisou de alguem e nao soube como me chamar porque tinham passado meses sem conversa e isso tinha virado uma barreira. E eu nem sabia que ela tinha passado por aquilo.",
          },
          {
            content: "A gente acha que amizade que e de verdade resiste ao tempo automaticamente. Mas as vezes ela precisa de manutencao que a gente nao faz porque assume que o afeto ja e suficiente pra manter o elo. E o elo vai afrouxando sem ninguem perceber.",
          },
          {
            content: "Ela me mandou uma mensagem no mesmo dia com esse link {productUrl}. \"Lembrei de voce quando comprei isso. Deixa eu te mandar de presente de reencontro.\" Parecia idiota depois de seis anos. Mas foi a melhor coisa.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces acreditam que amizades que pararam por falta de atencao ainda podem voltar a ser o que eram, ou muda alguma coisa que nao volta?",
          },
        ],
      },
    ],
  },

  // Family 5: A Decisao
  {
    formats: ["mistake", "behind_scenes", "review", "numbered_list", "myths_truths", "qa"],
    variations: [
      {
        narrativeSummary: "Pedido de demissao sem plano B revela colapso silencioso construido por meses",
        qualityBase: 0.90,
        posts: [
          {
            content: "Minha irma me ligou numa quinta a noite pra dizer que tinha pedido demissao. Sem emprego novo. Sem plano B. Depois de seis anos na mesma empresa. \"Acabei de mandar o e-mail.\" Eu nao soube o que dizer.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "A gente ficou em silencio por um momento. Depois ela disse que tinha chegado naquela manha, parado o carro no estacionamento, e ficado sentada por quarenta minutos sem conseguir entrar. \"Nao foi a primeira vez. Mas foi a vez que eu percebi que nao dava mais.\"",
          },
          {
            content: "O que eu nao sabia era que havia tres meses ela chegava em casa e ia direto pro quarto. Que as criancas pararam de contar o que acontecia na escola porque ela nao estava presente mesmo estando presente. Que ela tinha comecado a ter insonia. Ninguem sabia.",
          },
          {
            content: "A familia reagiu diferente. Meu cunhado ficou do lado dela desde o inicio. Minha mae ficou preocupada mas tentou esconder. Meu pai perguntou se ela tinha pensado bem. E eu fiquei pensando em quantas vezes eu percebi que ela estava diferente e nao perguntei.",
          },
          {
            content: "Tem um cansaco que nao aparece em exame. Que nao da febre. Que nao te impede de trabalhar, cuidar dos filhos, parecer bem. Mas que vai tirando pedacos seus ate o dia que voce fica quarenta minutos no estacionamento sem conseguir abrir a porta do carro.",
          },
          {
            content: "Faz dois meses. Ela esta melhor. Nao porque resolveu tudo, mas porque comecou a se reconhecer de novo. Nesse periodo ela me falou desse produto aqui {productUrl} que entrou na nova rotina que ela esta construindo. \"Parece pouca coisa. Mas e meu.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces acreditam que tem hora em que parar e a decisao mais corajosa? Ou ainda acham que da pra aguentar ate ter certeza de que e a hora certa?",
          },
        ],
      },
      {
        narrativeSummary: "Cancelamento de casamento dois meses antes revela diferenca entre coragem e irresponsabilidade",
        qualityBase: 0.86,
        posts: [
          {
            content: "Meu melhor amigo me ligou pra dizer que ia cancelar o casamento. Faltavam dois meses. Tudo pago, tudo marcado. Ele disse que tinha tomado a decisao na noite anterior e que ainda nao tinha contado pra ninguem alem de mim.",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Primeiro fiquei em choque. Depois perguntei o que tinha acontecido. Ele disse que nao tinha acontecido nada especifico. \"Eu percebi que eu estava planejando o casamento porque era o proximo passo, nao porque eu queria. E ai percebi que nao conseguia casar com uma pessoa por inercla.\"",
          },
          {
            content: "A conversa que ele teve com a noiva durou horas. Ela ficou destruida. A familia dos dois ficou indignada. Os amigos se dividiram. Metade achou que ele tinha feito a coisa mais corajosa da vida. A outra metade achou que ele tinha destruido a vida de alguem por medo.",
          },
          {
            content: "Ele me ligou uma semana depois. Disse que a decisao continuava parecendo certa, mas que o peso do que tinha causado era real. \"Fazer a coisa certa nao significa que nao doi. As vezes doi exatamente porque era a coisa certa.\"",
          },
          {
            content: "Tem coragem que nao parece com coragem por fora. Que parece irresponsabilidade, egoismo, falta de consideracao. Mas que por dentro e a unica forma de ser honesto com a propria vida e com a vida do outro.",
          },
          {
            content: "Nesse periodo ele comecou a reorganizar a propria rotina. Um dia me mandou esse link {productUrl}. \"Comprei pra comecar a criar um espaco que seja meu. Sem ser de dois.\"",
            hasMedia: true, mediaType: "image",
          },
          {
            content: "Voces acham que e possivel saber a diferenca entre medo de comprometer e clareza de que nao e certo? Como a gente distingue um do outro?",
          },
        ],
      },
    ],
  },
];

// --- Format to family mapping ---

const FORMAT_TO_FAMILY_IDX: Partial<Record<TrendFormat, number>> = {
  curiosity: 0,
  storytelling: 0,
  discovery: 3,
  transformation: 1,
  routine: 1,
  behind_scenes: 1,
  other_person: 1,
  mistake: 2,
  comparison: 4,
  opinion: 4,
  real_case: 2,
  case_study: 3,
};

// Knowledge formats get dedicated templates
const KNOWLEDGE_TEMPLATES: Partial<Record<TrendFormat, StoryFamily>> = {
  numbered_list: {
    formats: ["numbered_list"],
    variations: [
      {
        narrativeSummary: "5 coisas que ninguem fala sobre esse tipo de produto",
        qualityBase: 0.78,
        posts: [
          { content: "5 coisas que ninguem me falou sobre {productName} antes de eu comprar. Vou de tras pra frente porque a ultima e a mais importante.", hasMedia: true, mediaType: "image" },
          { content: "5. Voce vai achar que esta fazendo errado nas primeiras semanas. Nao esta. E o processo normal. A maioria desiste exatamente aqui." },
          { content: "4. O resultado visivel demora mais do que o resultado real. O que muda por dentro chega antes do que aparece por fora." },
          { content: "3. A consistencia bate a intensidade. Fazer menos toda semana supera fazer muito de vez em quando. Sempre." },
          { content: "2. Vai ter um momento de regressao antes da melhora definitiva. Quase todo mundo interpreta isso como sinal de que nao funciona. E o contrario." },
          { content: "1. A coisa mais importante: voce precisa usar direito pra funcionar. Parece obvio. Mas a maioria nao usa como deveria. Esse link {productUrl} tem as instrucoes que eu deveria ter lido antes.", hasMedia: true, mediaType: "image" },
          { content: "Alguma dessas voce ja tinha ouvido antes, ou tudo foi novidade?" },
        ],
      },
      {
        narrativeSummary: "4 mitos comuns sobre esse produto desmontados um por um",
        qualityBase: 0.76,
        posts: [
          { content: "Vou desmontar os 4 mitos que me impediram de usar {productName} por mais de um ano. Cada um deles era mentira.", hasMedia: true, mediaType: "image" },
          { content: "Mito 1: \"Funciona diferente pra cada pessoa.\" Parcialmente verdade, mas usado como desculpa pra justificar resultado ruim. O que funciona diferente e o tempo, nao o resultado." },
          { content: "Mito 2: \"Voce precisa usar por pelo menos 3 meses pra ver alguma coisa.\" Falso. Resultados parciais aparecem antes. O que demora 3 meses e consolidacao." },
          { content: "Mito 3: \"Quanto mais caro, melhor.\" Esse aqui me custou caro por muito tempo. Preco nao e indicador de qualidade nessa categoria." },
          { content: "Mito 4: \"Se parar, perde tudo que ganhou.\" O mais mentiroso. Alguns resultados diminuem. Outros ficam. Depende do que voce esta trabalhando." },
          { content: "O que de fato funciona: {productUrl}. Usei por tempo suficiente pra falar com autoridade sobre isso.", hasMedia: true, mediaType: "image" },
          { content: "Qual desses mitos voce ja acreditou? Ou tem outro que nao listei?" },
        ],
      },
    ],
  },
  myths_truths: {
    formats: ["myths_truths"],
    variations: [
      {
        narrativeSummary: "Mitos comuns desmontados depois de uso real",
        qualityBase: 0.79,
        posts: [
          { content: "Passei anos acreditando em coisas sobre {productName} que nao eram verdade. Vou contar quais.", hasMedia: true, mediaType: "image" },
          { content: "Mito mais comum: que precisa de muito tempo pra funcionar. A realidade e que os primeiros sinais aparecem bem antes do que a maioria fala." },
          { content: "Segundo mito: que e complicado de usar. Nao e. Leva uns dias pra acostumar, mas depois vira automatico." },
          { content: "Terceiro: que vai ter efeito colateral negativo. Nao vi nada disso. Testei por tempo suficiente pra confirmar." },
          { content: "O mito mais caro que acreditei: que produto mais barato fazia a mesma coisa. Nao fazia. A diferenca e real e visivel." },
          { content: "O que de fato funciona e o que eu uso hoje: {productUrl}. Sem mito, sem enganacao.", hasMedia: true, mediaType: "image" },
          { content: "Qual mito sobre esse tipo de produto voce ja acreditou? Conta nos comentarios." },
        ],
      },
    ],
  },
  review: {
    formats: ["review"],
    variations: [
      {
        narrativeSummary: "Relato honesto com o que funcionou, o que nao funcionou e o que teria feito diferente",
        qualityBase: 0.83,
        posts: [
          { content: "Vou fazer uma avaliacao honesta de {productName} depois de usar por tempo suficiente pra ter opiniao real. Nao vou so falar o que funciona. Vou falar tudo.", hasMedia: true, mediaType: "image" },
          { content: "O que funcionou melhor do que eu esperava: uma coisa especifica que eu nao estava usando como principal beneficio. Descobri por acaso. Agora e o motivo pelo qual eu continuo." },
          { content: "O que nao funcionou como prometido: tem uma promessa no marketing que e exagerada. Funciona? Sim. Na escala que prometem? Nao. Seja realista nas expectativas." },
          { content: "O que eu teria feito diferente: teria comecado com metade da intensidade. Fui muito forte de inicio e isso me atrapalhou nas primeiras semanas." },
          { content: "Quem vai gostar: pessoas que tem consistencia. Quem vai se frustrar: quem quer resultado rapido ou usa de forma irregular." },
          { content: "O link que usei: {productUrl}. Comprei por esse preco. Recomendo? Com as ressalvas que falei acima, sim.", hasMedia: true, mediaType: "image" },
          { content: "Alguem tem duvida especifica sobre o produto? Respondo nos comentarios com o que eu de fato sei." },
        ],
      },
    ],
  },
  case_study: {
    formats: ["case_study"],
    variations: [
      {
        narrativeSummary: "Experimento de 30 dias com resultados honestos e inesperados",
        qualityBase: 0.82,
        posts: [
          { content: "Fiz um experimento de 30 dias com {productName}. Entrei sem expectativa alta. Sai com resultados que eu nao esperava.", hasMedia: true, mediaType: "image" },
          { content: "Primeira semana: absolutamente nada de diferente. Continuei a rotina normal, sem mudar mais nada. Queria isolar a variavel. Semana 2: comecei a notar." },
          { content: "O que mudou nao foi o que eu estava esperando mudar. Era uma coisa menor, que eu nem estava monitorando. Mas era exatamente o que precisava." },
          { content: "Chegando na semana 3, tentei parar por tres dias pra testar o contraste. Percebi a diferenca na ausencia, nao na presenca. Isso mudou como eu passei a ver o produto." },
          { content: "Semana 4. O resultado principal chegou. Nao de forma dramatica. De forma gradual e consistente, que e o tipo de mudanca que dura mais." },
          { content: "O link que eu usei durante todo o experimento: {productUrl}. Comprei pelo preco que aparece ai. Nao recebi nada pra testar. Comprei, usei, esse e o resultado real.", hasMedia: true, mediaType: "image" },
          { content: "Voces costumam dar tempo suficiente pra um produto mostrar resultado, ou desistem antes da virada?" },
        ],
      },
    ],
  },
  qa: {
    formats: ["qa"],
    variations: [
      {
        narrativeSummary: "Perguntas reais respondidas com respostas que a maioria nao da",
        qualityBase: 0.77,
        posts: [
          { content: "Vou responder as perguntas que eu mesmo tinha sobre {productName} antes de comprar. As respostas que ninguem dava direito.", hasMedia: true, mediaType: "image" },
          { content: "\"Funciona mesmo?\" - Depende do que voce espera. Se voce espera o que esta prometido no marketing, decepcionante. Se voce espera o que de fato entrega, sim." },
          { content: "\"Quanto tempo pra ver resultado?\" - Primeiros sinais em 2-3 semanas. Resultado consolidado em 6-8 semanas. Quem fala em dias esta mentindo." },
          { content: "\"Vale o preco?\" - Depende do que voce esta comparando. Comparado com alternativas de qualidade similar, sim." },
          { content: "\"Para de funcionar se parar de usar?\" - Nao. A plato e normal. Nao e o produto parando de funcionar, e seu corpo se adaptando." },
          { content: "O que eu uso: {productUrl}. Comprei por isso aqui. Usei dessa forma. Esse foi o resultado.", hasMedia: true, mediaType: "image" },
          { content: "Tem mais alguma duvida especifica? So perguntar." },
        ],
      },
    ],
  },
};

// --- Main engine ---

export function generateTrend(input: TrendEngineInput): GeneratedTrend {
  const {
    productName,
    productUrl,
    format: rawFormat,
    campaignId,
    regenerationSeed = 0,
  } = input;

  const validFormat = rawFormat && TREND_FORMATS.find((f) => f.key === rawFormat);
  const format: TrendFormat = validFormat
    ? (rawFormat as TrendFormat)
    : TREND_FORMATS[hashStr(campaignId) % TREND_FORMATS.length].key;

  const baseSeed = hashStr(campaignId + productName + format + String(regenerationSeed));

  // Resolve family
  let family: StoryFamily;
  const knowledgeTpl = KNOWLEDGE_TEMPLATES[format as TrendFormat];
  if (knowledgeTpl) {
    family = knowledgeTpl;
  } else {
    const familyIdx = FORMAT_TO_FAMILY_IDX[format as TrendFormat];
    if (familyIdx !== undefined) {
      family = NARRATIVE_FAMILIES[familyIdx];
    } else {
      family = NARRATIVE_FAMILIES[baseSeed % NARRATIVE_FAMILIES.length];
    }
  }

  const variationIdx = (baseSeed >> 4) % family.variations.length;
  const variation = family.variations[variationIdx];

  const posts: TrendPostData[] = variation.posts.map((p, i) => ({
    position: i + 1,
    content: p.content
      .replace(/\{productUrl\}/g, productUrl)
      .replace(/\{productName\}/g, productName),
    hasMedia: p.hasMedia ?? false,
    mediaType: p.mediaType,
  }));

  const qualityScore = variation.qualityBase + ((baseSeed % 8) / 100);

  return {
    format,
    hook: posts[0].content,
    narrativeSummary: variation.narrativeSummary,
    qualityScore,
    posts,
  };
}

export function formatLabel(format: string): string {
  return TREND_FORMATS.find((f) => f.key === format)?.label ?? format;
}
