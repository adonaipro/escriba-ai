import "dotenv/config";
import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  if (raw.startsWith("file:") && !raw.startsWith("file://")) {
    const filePath = raw.slice("file:".length);
    const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    return "file:" + abs.replace(/\\/g, "/");
  }
  return raw;
}

const adapter = new PrismaLibSql({ url: resolveDbUrl() });
const prisma = new PrismaClient({ adapter });

const NOW = new Date("2026-07-12T12:00:00Z");
function daysAgo(n: number) { return new Date(NOW.getTime() - n * 86400000); }
function daysAhead(n: number) { return new Date(NOW.getTime() + n * 86400000); }

function mk(marketplace: string) {
  if (marketplace === "shopee") return "Shopee";
  if (marketplace === "amazon") return "Amazon";
  if (marketplace === "hotmart") return "Hotmart";
  return marketplace;
}

function genPosts(format: string, product: string, marketplace: string): string[] {
  const M = mk(marketplace);
  switch (format) {
    case "transformation": return [
      `Passei quase 4 meses tentando resolver esse problema. A mudança veio de onde eu menos esperava.`,
      `Tentei de tudo antes: alternativas genéricas, produtos mais baratos, recomendações aleatórias. Nada resolveu de verdade.`,
      `Um amigo que tinha o mesmo problema me indicou o ${product}. Fui cético — parecia mais do mesmo.`,
      `Comprei na ${M}. Chegou em 5 dias. Comecei a usar sem muita expectativa.`,
      `Primeira semana: diferença pequena. Segunda semana: diferença real, impossível de ignorar.`,
      `Com 3 semanas de uso: o resultado que parecia improvável virou parte da minha rotina.`,
      `Hoje não consigo imaginar sem. Parte essencial do meu dia a dia.`,
      `Disponível na ${M}. Link abaixo 👇`,
    ];
    case "review": return [
      `Review honesto do ${product} depois de 6 semanas de uso. Sem filtro.`,
      `O que gostei: qualidade real, resultado consistente, fácil de incorporar na rotina.`,
      `O que não gostei: embalagem poderia ser melhor e o frete demorou mais do esperado.`,
      `Resultado final depois de 6 semanas: entregou o que prometeu. Simples assim.`,
      `Vale o preço? Sim. É um dos melhores custo-benefícios que já encontrei nessa categoria.`,
      `Comparado ao que eu usava antes: diferença clara. Não tem nem comparação.`,
      `Nota final: 9/10. Recomendo com consciência e dados de uso real.`,
      `Link na ${M} 👇`,
    ];
    case "discovery": return [
      `Não estava procurando por isso. Estava pesquisando outra coisa quando o ${product} apareceu.`,
      `Os comentários eram absurdos — gente falando coisas que eu achei exagero. Resolvi testar mesmo assim.`,
      `Comprei sem expectativa. Pior caso seria mais um produto medíocre na gaveta.`,
      `Chegou. Comecei a usar. Aí entendi por que todo mundo estava exagerando.`,
      `O resultado apareceu antes do que esperava. Visível, real, sem enganação.`,
      `Mostrei pra minha irmã. Ela quis comprar na mesma hora.`,
      `Ainda fico surpreso toda vez que uso. Acidente feliz que mudou minha rotina.`,
      `Disponível na ${M} 👇`,
    ];
    case "comparison": return [
      `Antes do ${product}: R$ 120 em alternativa genérica + frustração acumulada. Depois: resultado real.`,
      `ANTES — Usava o que parecia mais barato. Resultado: medíocre e inconsistente.`,
      `Tentei 3 produtos diferentes em 6 meses. Cada um prometia. Nenhum entregou.`,
      `DEPOIS — Comprei o ${product} na ${M}. Chegou em 5 dias. Comecei com as instruções.`,
      `Semana 1: diferença pequena. Semana 2: já era impossível ignorar.`,
      `Com 4 semanas: resultado que os outros não entregaram em 6 meses.`,
      `A lição: produto certo no problema certo. Simples assim.`,
      `Link na ${M} pra quem quer parar de perder dinheiro em genérico 👇`,
    ];
    case "routine": return [
      `Minha rotina com o ${product} — o que faço todo dia às 7h da manhã.`,
      `Acordo. Café feito. O ${product} já está pronto pra usar. Não preciso pensar.`,
      `Enquanto faço outra coisa, o produto faz o trabalho. Sem esforço extra.`,
      `Resultado acumulado depois de 5 semanas: consistência que não tinha antes.`,
      `O que mais gosto: virou automático. Não preciso me lembrar de fazer.`,
      `Levei 10 dias pra criar o hábito. Menos do que imaginei. Hoje é natural.`,
      `Sem o ${product} parece que falta algo. É o sinal de que funciona.`,
      `Link na ${M} pra montar a mesma rotina 👇`,
    ];
    case "other_person": return [
      `Minha mãe tinha o mesmo problema há anos. Não sabia o que fazer pra ajudar.`,
      `Ela tentou várias coisas: cremes, suplementos, rotinas. Nada resolveu de verdade.`,
      `Indiquei o ${product}. No início ela duvidou — já tinha tentado muita coisa antes.`,
      `Comprou na ${M}. Usou por 3 semanas seguindo as instruções direitinho.`,
      `Me mandou mensagem: "filha, por que não fiz isso antes?" Não precisei falar mais nada.`,
      `Hoje ela recomenda pra todo mundo que tem o mesmo problema.`,
      `O que me surpreendeu: a velocidade do resultado. Não esperava tão rápido.`,
      `Se alguém próximo passa por isso, manda o link 👇`,
    ];
    case "real_case": return [
      `Caso real — compartilhando com permissão de quem viveu essa história.`,
      `Carlos, 38 anos, analista de sistemas. Problema: 8 meses tentando resolver sem sucesso.`,
      `Tentou 4 soluções diferentes em 6 meses. Cada uma prometia. Nenhuma entregou.`,
      `Chegou ao ${product} por indicação de um colega de trabalho. Cético no começo.`,
      `3 semanas depois: me mandou foto do resultado. Não precisei perguntar se valeu.`,
      `O que ele disse: "por que ninguém me contou sobre isso antes?" Ficou na cabeça.`,
      `Não é marketing. É história real de alguém que conheço.`,
      `Link na ${M} pra quem quiser entender 👇`,
    ];
    case "numbered_list": return [
      `5 coisas que aprendi usando o ${product} por 6 semanas:`,
      `1. O resultado aparece antes do que você espera. Semana 2 já é diferente da semana 1.`,
      `2. Consistência importa mais que intensidade. Usar todo dia > usar pesado uma vez por semana.`,
      `3. Qualidade certa vale mais do que preço baixo. Aprendi da pior forma possível.`,
      `4. Simples de incorporar na rotina. Não precisa de esforço extra ou mudança radical.`,
      `5. O resultado se mantém. Não é efeito passageiro de primeira semana.`,
      `Bônus: custo-benefício melhor do que esperava. Durou mais do que o previsto.`,
      `Disponível na ${M}. Link 👇`,
    ];
    case "case_study": return [
      `Fiz um experimento de 6 semanas com o ${product}. Aqui estão os dados reais.`,
      `Contexto: usuário com histórico de tentativas fracassadas na categoria. Objetivo: resultado em 30 dias.`,
      `Semana 1: adaptação inicial. Resultado abaixo do esperado — faz parte da curva de aprendizado.`,
      `Semana 2: primeiro sinal real de mudança. Diferença pequena mas mensurável.`,
      `Semana 4: ponto de inflexão. Tudo mudou aqui. Resultado visível e consistente.`,
      `Semana 6: objetivo atingido e superado. Números acima da expectativa inicial.`,
      `Conclusão: funciona, tem dados pra provar. Recomendo com consciência.`,
      `Disponível na ${M} 👇`,
    ];
    case "storytelling": return [
      `Novembro do ano passado. Eu estava no ponto mais baixo há meses.`,
      `Tinha tentado de tudo. Nada funcionava. Cada dia que passava piorava.`,
      `Foi quando um post aleatório no Threads me apresentou o ${product}. Parecia pequeno.`,
      `Decidi tentar mais uma vez. Comprei sem muita esperança. Recebi, comecei a usar.`,
      `Duas semanas depois, olhei pro espelho e não acreditei no que vi.`,
      `Olhei pra onde tinha chegado. A diferença era maior do que eu tinha imaginado.`,
      `Hoje quando conto essa história parece exagero. Mas é a verdade mais simples que tenho.`,
      `Link na ${M} pra quem estiver passando pelo mesmo 👇`,
    ];
    case "opinion": return [
      `Opinião impopular: produto mais barato nem sempre é mais econômico. Aprendi isso na prática.`,
      `A maioria vai no preço baixo. Depois reclama que não funciona. Eu já fiz isso.`,
      `Gastei mais tentando economizar do que teria gastado comprando o certo desde o começo.`,
      `Com o ${product}: resultado real. Com o que usava antes: resultado zero.`,
      `A diferença é óbvia pra quem viveu os dois cenários. Não precisa de teoria.`,
      `Vai discordar? Tudo bem. Mas testa por 4 semanas e depois me conta.`,
      `Não estou vendendo milagre. Só compartilhando o que funcionou pra mim.`,
      `Link na ${M} pra quem quiser testar 👇`,
    ];
    case "behind_scenes": return [
      `Bastidores do que uso no dia a dia — sem filtro e sem produto patrocinado.`,
      `Essa é minha rotina real. O ${product} faz parte há 4 meses.`,
      `Muita gente me pergunta o que uso. Então vou mostrar sem enrolação.`,
      `Comprei na ${M} por indicação de um amigo. Sem expectativa alta no começo.`,
      `Resultado depois de 4 meses: virou essencial. Não troco por nada.`,
      `O que mais me surpreendeu: como algo tão simples resolveu tanto.`,
      `Custo-benefício: excelente. Uma das melhores compras que fiz esse ano.`,
      `Link direto na ${M} 👇`,
    ];
    case "myths_truths": return [
      `4 mitos sobre esse tipo de produto que eu acreditava antes de testar o ${product}:`,
      `MITO 1: "É difícil de usar". VERDADE: É simples desde o primeiro dia. Aprendi em 10 minutos.`,
      `MITO 2: "Não vale o preço". VERDADE: Custo-benefício excelente. Durou mais do que esperava.`,
      `MITO 3: "Funciona só pro curto prazo". VERDADE: Resultado que se mantém. 4 meses e continua igual.`,
      `MITO 4: "Qualquer similar faz o mesmo". VERDADE: Testei 2 similares antes. A diferença é absurda.`,
      `O maior mito era que eu precisava de algo mais caro. Não precisava.`,
      `A realidade: produto certo pro problema certo. Sem exagero.`,
      `Link na ${M} pra quem quer ver por si mesmo 👇`,
    ];
    case "qa": return [
      `Respondi 5 perguntas sobre o ${product} que recebo toda semana:`,
      `P: Vale a pena? R: Sim, sem dúvida. Testei por 6 semanas e confirmo.`,
      `P: Funciona mesmo? R: Funcionou pra mim. Dados de 6 semanas mostram isso.`,
      `P: Qual a diferença dos concorrentes? R: Qualidade superior e resultado mais rápido.`,
      `P: Tem algum defeito? R: Embalagem discreta. Entrega pode demorar em regiões distantes.`,
      `P: Recomenda? R: Sim. Sem hesitar. Pra quem tem esse problema específico.`,
      `Se tiver mais dúvidas, me manda mensagem. Respondo tudo.`,
      `Link na ${M} 👇`,
    ];
    case "curiosity": return [
      `Você sabia que 73% das pessoas que tentam resolver isso desistem na primeira tentativa? Eu também tentei.`,
      `Fato que ninguém conta: o problema raramente é o que você acha que é.`,
      `Passei meses focado no sintoma. Ignorei a causa. Aí encontrei o ${product}.`,
      `O ${product} age na causa, não no sintoma. Por isso funciona quando os outros não funcionam.`,
      `Testei por 4 semanas. Os dados confirmaram a teoria.`,
      `Compartilhei com 5 pessoas da minha rede. 4 já compraram depois de ver meu resultado.`,
      `Não é achismo. É princípio simples e testado. Funciona por razões específicas.`,
      `Link na ${M} 👇`,
    ];
    case "mistake": return [
      `Quase perdi R$ 400 por não saber disso antes. Conto pra você não errar como eu.`,
      `Comprei o produto errado 3 vezes. Cada vez achando que ia ser diferente.`,
      `O problema não era o produto. Era que eu não sabia o que realmente precisava.`,
      `Aí alguém me disse: procura o ${product}. Específico pro meu problema exato.`,
      `Comprei na ${M}. Chegou rápido. Finalmente funcionou.`,
      `Resultado depois de 3 semanas: o que 3 produtos anteriores não entregaram em 6 meses.`,
      `O erro? Ficar no genérico quando existia algo feito exatamente pra esse caso.`,
      `Link abaixo. Não erra como eu errei 👇`,
    ];
    default: return [
      `${product} — descoberta que mudou minha rotina.`,
      `Passei meses sem resultado. Mudança veio de onde não esperava.`,
      `Testei por 4 semanas. O resultado surpreendeu.`,
      `Simples de usar. Fácil de incorporar no dia a dia.`,
      `Custo-benefício excelente. Melhor compra do mês.`,
      `Recomendo pra quem tem esse problema.`,
      `Disponível na ${mk(marketplace)} 👇`,
    ];
  }
}

type TrendSeed = {
  id: string;
  campRef: string;
  format: string;
  status: "draft" | "approved" | "scheduled" | "published";
  qScore: number;
  publishedDaysAgo?: number;
  scheduledDaysAhead?: number;
  metrics?: { clicks: number; impressions: number; conversions: number; revenue: number };
};

const TREND_SEEDS: TrendSeed[] = [
  // Camp 1 — Tênis Runner Pro (scale_eligible)
  { id: "tr-001", campRef: "camp-001", format: "transformation", status: "published", qScore: 0.87, publishedDaysAgo: 35, metrics: { clicks: 847, impressions: 31200, conversions: 23, revenue: 1847.50 } },
  { id: "tr-002", campRef: "camp-001", format: "review", status: "published", qScore: 0.82, publishedDaysAgo: 28, metrics: { clicks: 621, impressions: 24800, conversions: 17, revenue: 1365.00 } },
  { id: "tr-003", campRef: "camp-001", format: "comparison", status: "published", qScore: 0.79, publishedDaysAgo: 21, metrics: { clicks: 589, impressions: 22100, conversions: 15, revenue: 1203.75 } },
  { id: "tr-004", campRef: "camp-001", format: "numbered_list", status: "scheduled", qScore: 0.84, scheduledDaysAhead: 3 },
  { id: "tr-005", campRef: "camp-001", format: "discovery", status: "scheduled", qScore: 0.76, scheduledDaysAhead: 10 },

  // Camp 2 — Sérum Anti-Idade (scaling)
  { id: "tr-006", campRef: "camp-002", format: "storytelling", status: "published", qScore: 0.91, publishedDaysAgo: 40, metrics: { clicks: 1124, impressions: 43500, conversions: 31, revenue: 3472.00 } },
  { id: "tr-007", campRef: "camp-002", format: "other_person", status: "published", qScore: 0.88, publishedDaysAgo: 30, metrics: { clicks: 934, impressions: 36800, conversions: 26, revenue: 2912.50 } },
  { id: "tr-008", campRef: "camp-002", format: "review", status: "published", qScore: 0.85, publishedDaysAgo: 20, metrics: { clicks: 782, impressions: 29400, conversions: 21, revenue: 2352.00 } },
  { id: "tr-009", campRef: "camp-002", format: "discovery", status: "published", qScore: 0.83, publishedDaysAgo: 10, metrics: { clicks: 543, impressions: 21200, conversions: 14, revenue: 1568.00 } },
  { id: "tr-010", campRef: "camp-002", format: "routine", status: "scheduled", qScore: 0.80, scheduledDaysAhead: 5 },

  // Camp 3 — Fone X200 (paused)
  { id: "tr-011", campRef: "camp-003", format: "transformation", status: "published", qScore: 0.71, publishedDaysAgo: 60, metrics: { clicks: 234, impressions: 11200, conversions: 4, revenue: 198.00 } },
  { id: "tr-012", campRef: "camp-003", format: "comparison", status: "draft", qScore: 0.68 },

  // Camp 4 — Creme Facial (testing)
  { id: "tr-013", campRef: "camp-004", format: "discovery", status: "published", qScore: 0.74, publishedDaysAgo: 15, metrics: { clicks: 312, impressions: 13800, conversions: 7, revenue: 392.00 } },
  { id: "tr-014", campRef: "camp-004", format: "transformation", status: "draft", qScore: 0.71 },
  { id: "tr-015", campRef: "camp-004", format: "storytelling", status: "draft", qScore: 0.69 },

  // Camp 5 — Suplemento Vitamina D3 (testing)
  { id: "tr-016", campRef: "camp-005", format: "curiosity", status: "published", qScore: 0.77, publishedDaysAgo: 12, metrics: { clicks: 289, impressions: 12400, conversions: 6, revenue: 178.20 } },
  { id: "tr-017", campRef: "camp-005", format: "numbered_list", status: "published", qScore: 0.73, publishedDaysAgo: 7, metrics: { clicks: 198, impressions: 9800, conversions: 4, revenue: 118.80 } },
  { id: "tr-018", campRef: "camp-005", format: "qa", status: "draft", qScore: 0.70 },

  // Camp 6 — Cadeira Ergonômica (monitoring)
  { id: "tr-019", campRef: "camp-006", format: "transformation", status: "published", qScore: 0.85, publishedDaysAgo: 45, metrics: { clicks: 678, impressions: 25600, conversions: 12, revenue: 2140.00 } },
  { id: "tr-020", campRef: "camp-006", format: "case_study", status: "published", qScore: 0.82, publishedDaysAgo: 35, metrics: { clicks: 521, impressions: 19800, conversions: 9, revenue: 1605.00 } },
  { id: "tr-021", campRef: "camp-006", format: "routine", status: "published", qScore: 0.79, publishedDaysAgo: 25, metrics: { clicks: 445, impressions: 17200, conversions: 8, revenue: 1426.00 } },
  { id: "tr-022", campRef: "camp-006", format: "review", status: "published", qScore: 0.81, publishedDaysAgo: 15, metrics: { clicks: 398, impressions: 15600, conversions: 7, revenue: 1248.50 } },

  // Camp 7 — Kit Skincare (scale_eligible)
  { id: "tr-023", campRef: "camp-007", format: "storytelling", status: "published", qScore: 0.89, publishedDaysAgo: 50, metrics: { clicks: 956, impressions: 37200, conversions: 28, revenue: 3976.00 } },
  { id: "tr-024", campRef: "camp-007", format: "other_person", status: "published", qScore: 0.86, publishedDaysAgo: 38, metrics: { clicks: 812, impressions: 31400, conversions: 23, revenue: 3266.50 } },
  { id: "tr-025", campRef: "camp-007", format: "comparison", status: "published", qScore: 0.83, publishedDaysAgo: 26, metrics: { clicks: 634, impressions: 24700, conversions: 18, revenue: 2557.50 } },
  { id: "tr-026", campRef: "camp-007", format: "routine", status: "scheduled", qScore: 0.85, scheduledDaysAhead: 1 },

  // Camp 8 — Smartwatch (testing)
  { id: "tr-027", campRef: "camp-008", format: "review", status: "published", qScore: 0.72, publishedDaysAgo: 8, metrics: { clicks: 187, impressions: 8600, conversions: 3, revenue: 267.00 } },
  { id: "tr-028", campRef: "camp-008", format: "numbered_list", status: "draft", qScore: 0.69 },

  // Camp 9 — Perfume (saturating)
  { id: "tr-029", campRef: "camp-009", format: "transformation", status: "published", qScore: 0.76, publishedDaysAgo: 70, metrics: { clicks: 398, impressions: 18400, conversions: 9, revenue: 765.00 } },
  { id: "tr-030", campRef: "camp-009", format: "discovery", status: "published", qScore: 0.74, publishedDaysAgo: 55, metrics: { clicks: 312, impressions: 14800, conversions: 6, revenue: 510.00 } },
  { id: "tr-031", campRef: "camp-009", format: "review", status: "published", qScore: 0.71, publishedDaysAgo: 42, metrics: { clicks: 267, impressions: 13200, conversions: 5, revenue: 425.00 } },

  // Camp 10 — Suporte Notebook (testing)
  { id: "tr-032", campRef: "camp-010", format: "behind_scenes", status: "draft", qScore: 0.70 },
  { id: "tr-033", campRef: "camp-010", format: "routine", status: "scheduled", qScore: 0.73, scheduledDaysAhead: 7 },

  // Camp 11 — Protetor Solar (scaling)
  { id: "tr-034", campRef: "camp-011", format: "curiosity", status: "published", qScore: 0.84, publishedDaysAgo: 32, metrics: { clicks: 567, impressions: 21800, conversions: 15, revenue: 1192.50 } },
  { id: "tr-035", campRef: "camp-011", format: "transformation", status: "published", qScore: 0.87, publishedDaysAgo: 22, metrics: { clicks: 698, impressions: 26400, conversions: 19, revenue: 1510.50 } },
  { id: "tr-036", campRef: "camp-011", format: "myths_truths", status: "scheduled", qScore: 0.82, scheduledDaysAhead: 2 },

  // Camp 12 — Máscara Capilar (testing)
  { id: "tr-037", campRef: "camp-012", format: "other_person", status: "published", qScore: 0.75, publishedDaysAgo: 18, metrics: { clicks: 234, impressions: 10200, conversions: 5, revenue: 224.50 } },
  { id: "tr-038", campRef: "camp-012", format: "storytelling", status: "draft", qScore: 0.72 },
  { id: "tr-039", campRef: "camp-012", format: "review", status: "draft", qScore: 0.70 },

  // Camp 13 — Earbuds (ended)
  { id: "tr-040", campRef: "camp-013", format: "transformation", status: "published", qScore: 0.70, publishedDaysAgo: 90, metrics: { clicks: 145, impressions: 7800, conversions: 2, revenue: 89.00 } },
  { id: "tr-041", campRef: "camp-013", format: "comparison", status: "published", qScore: 0.68, publishedDaysAgo: 75, metrics: { clicks: 112, impressions: 6400, conversions: 1, revenue: 44.50 } },

  // Camp 14 — Tênis Casual (testing)
  { id: "tr-042", campRef: "camp-014", format: "discovery", status: "draft", qScore: 0.71 },
  { id: "tr-043", campRef: "camp-014", format: "opinion", status: "scheduled", qScore: 0.74, scheduledDaysAhead: 14 },

  // Camp 15 — Curso Marketing (monitoring)
  { id: "tr-044", campRef: "camp-015", format: "real_case", status: "published", qScore: 0.86, publishedDaysAgo: 55, metrics: { clicks: 1023, impressions: 39800, conversions: 34, revenue: 5440.00 } },
  { id: "tr-045", campRef: "camp-015", format: "transformation", status: "published", qScore: 0.83, publishedDaysAgo: 40, metrics: { clicks: 876, impressions: 34200, conversions: 28, revenue: 4480.00 } },
  { id: "tr-046", campRef: "camp-015", format: "case_study", status: "published", qScore: 0.80, publishedDaysAgo: 25, metrics: { clicks: 712, impressions: 28600, conversions: 22, revenue: 3520.00 } },
];

type CampSeed = {
  id: string;
  name: string;
  productUrl: string;
  productName: string;
  marketplace: string;
  targetNetwork: string;
  status: string;
  mode: string;
  objective?: string;
  trendsPerDay?: number;
  postsPerDay?: number;
  startDate?: Date;
  endDate?: Date;
  pausedAt?: Date;
  endedAt?: Date;
};

const CAMPS: CampSeed[] = [
  { id: "camp-001", name: "Tênis Runner Pro — Shopee", productUrl: "https://shopee.com.br/mock/tenis-runner-pro", productName: "Tênis Runner Pro", marketplace: "shopee", targetNetwork: "threads", status: "scale_eligible", mode: "test", objective: "sales", trendsPerDay: 2, postsPerDay: 8, startDate: daysAgo(40) },
  { id: "camp-002", name: "Sérum Anti-Idade Premium — Shopee", productUrl: "https://shopee.com.br/mock/serum-anti-idade", productName: "Sérum Anti-Idade Premium", marketplace: "shopee", targetNetwork: "threads", status: "scaling", mode: "scale", objective: "sales", trendsPerDay: 3, postsPerDay: 12, startDate: daysAgo(45) },
  { id: "camp-003", name: "Fone Bluetooth X200 — Shopee", productUrl: "https://shopee.com.br/mock/fone-x200", productName: "Fone Bluetooth X200", marketplace: "shopee", targetNetwork: "x", status: "paused", mode: "test", objective: "awareness", trendsPerDay: 1, postsPerDay: 4, startDate: daysAgo(70), pausedAt: daysAgo(30) },
  { id: "camp-004", name: "Creme Facial Hidratante — Shopee", productUrl: "https://shopee.com.br/mock/creme-facial", productName: "Creme Facial Hidratante Plus", marketplace: "shopee", targetNetwork: "threads", status: "testing", mode: "test", objective: "sales", trendsPerDay: 2, postsPerDay: 7, startDate: daysAgo(20) },
  { id: "camp-005", name: "Vitamina D3 Premium — Shopee", productUrl: "https://shopee.com.br/mock/vitamina-d3", productName: "Vitamina D3 Premium", marketplace: "shopee", targetNetwork: "threads", status: "testing", mode: "test", objective: "sales", trendsPerDay: 2, postsPerDay: 6, startDate: daysAgo(16) },
  { id: "camp-006", name: "Cadeira Ergonômica Pro — Amazon", productUrl: "https://amazon.com.br/mock/cadeira-ergo", productName: "Cadeira Ergonômica Pro", marketplace: "amazon", targetNetwork: "threads", status: "monitoring", mode: "test", objective: "sales", trendsPerDay: 2, postsPerDay: 8, startDate: daysAgo(55) },
  { id: "camp-007", name: "Kit Skincare Completo — Shopee", productUrl: "https://shopee.com.br/mock/kit-skincare", productName: "Kit Skincare Completo", marketplace: "shopee", targetNetwork: "threads", status: "scale_eligible", mode: "test", objective: "sales", trendsPerDay: 3, postsPerDay: 10, startDate: daysAgo(58) },
  { id: "camp-008", name: "Smartwatch Ultra — Shopee", productUrl: "https://shopee.com.br/mock/smartwatch-ultra", productName: "Smartwatch Ultra", marketplace: "shopee", targetNetwork: "threads", status: "testing", mode: "test", objective: "awareness", trendsPerDay: 1, postsPerDay: 4, startDate: daysAgo(12) },
  { id: "camp-009", name: "Perfume Importado Masculino — Amazon", productUrl: "https://amazon.com.br/mock/perfume-importado", productName: "Perfume Importado Masculino", marketplace: "amazon", targetNetwork: "threads", status: "saturating", mode: "test", objective: "sales", trendsPerDay: 1, postsPerDay: 4, startDate: daysAgo(80) },
  { id: "camp-010", name: "Suporte Notebook Alumínio — Amazon", productUrl: "https://amazon.com.br/mock/suporte-notebook", productName: "Suporte Notebook Alumínio", marketplace: "amazon", targetNetwork: "threads", status: "testing", mode: "test", objective: "sales", trendsPerDay: 1, postsPerDay: 4, startDate: daysAgo(10) },
  { id: "camp-011", name: "Protetor Solar FPS 70+ — Shopee", productUrl: "https://shopee.com.br/mock/protetor-solar", productName: "Protetor Solar FPS 70+", marketplace: "shopee", targetNetwork: "threads", status: "scaling", mode: "scale", objective: "sales", trendsPerDay: 3, postsPerDay: 10, startDate: daysAgo(38) },
  { id: "camp-012", name: "Máscara Capilar Regeneradora — Shopee", productUrl: "https://shopee.com.br/mock/mascara-capilar", productName: "Máscara Capilar Regeneradora", marketplace: "shopee", targetNetwork: "threads", status: "testing", mode: "test", objective: "sales", trendsPerDay: 2, postsPerDay: 6, startDate: daysAgo(22) },
  { id: "camp-013", name: "Earbuds True Wireless — Shopee", productUrl: "https://shopee.com.br/mock/earbuds-tw", productName: "Earbuds True Wireless", marketplace: "shopee", targetNetwork: "x", status: "ended", mode: "test", objective: "awareness", trendsPerDay: 1, postsPerDay: 4, startDate: daysAgo(100), endedAt: daysAgo(60) },
  { id: "camp-014", name: "Tênis Casual Street Style — Shopee", productUrl: "https://shopee.com.br/mock/tenis-casual", productName: "Tênis Casual Street Style", marketplace: "shopee", targetNetwork: "threads", status: "testing", mode: "test", objective: "sales", trendsPerDay: 2, postsPerDay: 7, startDate: daysAgo(8) },
  { id: "camp-015", name: "Curso Marketing de Afiliados — Hotmart", productUrl: "https://hotmart.com/mock/curso-mkt", productName: "Curso Marketing de Afiliados", marketplace: "hotmart", targetNetwork: "threads", status: "monitoring", mode: "test", objective: "leads", trendsPerDay: 2, postsPerDay: 8, startDate: daysAgo(65) },
];

const LEARNINGS = [
  { id: "lrn-001", campRef: "camp-001", summary: "Formato de transformação pessoal com dor específica gera CTR 40% acima da média em Threads. Combinar com CTA de link direto amplifica o resultado.", type: "format", impact: "positive", autoApplied: true },
  { id: "lrn-002", campRef: "camp-001", summary: "Review honesta com prós e contras converte melhor que post apenas positivo. A transparência gera credibilidade que se traduz em cliques.", type: "tone", impact: "positive", autoApplied: true },
  { id: "lrn-003", campRef: "camp-002", summary: "Histórias de terceiros (mãe, amigo, colega) têm engajamento 35% maior que histórias próprias em produtos de beleza. O leitor se identifica com alguém próximo.", type: "audience", impact: "positive", autoApplied: true },
  { id: "lrn-004", campRef: "camp-002", summary: "Thread longa com 8 posts tem desempenho melhor que thread curta de 4 posts para produtos de skincare. Tempo de leitura maior gera mais intenção de compra.", type: "format", impact: "positive", autoApplied: false },
  { id: "lrn-005", campRef: "camp-003", summary: "CTA de urgência em X (Twitter) gerou menos da metade dos cliques esperados comparado ao mesmo CTA no Threads. A cultura das redes é diferente.", type: "cta", impact: "negative", autoApplied: true },
  { id: "lrn-006", campRef: "camp-003", summary: "Produto de áudio precisa de contexto de uso específico no post — 'para treinar', 'para trabalhar em home office'. Posts genéricos não convertem.", type: "audience", impact: "neutral", autoApplied: false },
  { id: "lrn-007", campRef: "camp-006", summary: "Para produtos de home office, estudo de caso com dados de semanas específicas performa 28% melhor que depoimento emocional. A audiência quer prova, não sentimento.", type: "format", impact: "positive", autoApplied: true },
  { id: "lrn-008", campRef: "camp-006", summary: "Rotina mostrada em steps específicos ('7h da manhã', 'enquanto tomo café') gera mais salvamentos e compartilhamentos que rotina vaga.", type: "hook", impact: "positive", autoApplied: true },
  { id: "lrn-009", campRef: "camp-007", summary: "Kit de produtos com múltiplos itens precisa de thread que aborde cada benefício separado. Post único tentando cobrir tudo não funciona.", type: "format", impact: "positive", autoApplied: true },
  { id: "lrn-010", campRef: "camp-007", summary: "Foto de resultados reais no post de comparação 'antes e depois' duplica o CTR comparado ao mesmo post sem imagem.", type: "hook", impact: "positive", autoApplied: false },
  { id: "lrn-011", campRef: "camp-009", summary: "Produto premium (perfume importado) satura mais rápido em Threads — audiência menor nesse nicho. Considerar migrar para outras redes sociais.", type: "audience", impact: "negative", autoApplied: false },
  { id: "lrn-012", campRef: "camp-011", summary: "Produto sazonal (protetor solar) tem spike em dezembro-fevereiro e março. Escalar em novembro e manter fluxo base durante o inverno.", type: "timing", impact: "positive", autoApplied: false },
  { id: "lrn-013", campRef: "camp-015", summary: "Produto de alto ticket (curso R$ 160) precisa de thread mais longa com prova social específica — resultado de alguém identificável, não depoimento genérico.", type: "tone", impact: "positive", autoApplied: true },
  { id: "lrn-014", campRef: "camp-015", summary: "Para curso digital, o gancho mais eficaz é uma dúvida específica que o leitor tem, não uma promessa de resultado. 'Você já tentou X e não funcionou?' converte mais.", type: "hook", impact: "positive", autoApplied: true },
  { id: "lrn-015", campRef: null, summary: "Trends agendadas para 7h-9h e 19h-21h têm CTR médio 22% maior que trends publicadas em outros horários. Preferir janelas de início e fim de dia de trabalho.", type: "timing", impact: "positive", autoApplied: true },
];

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("demo123456", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@grokplatform.com" },
    update: {},
    create: { name: "Demo User", email: "demo@grokplatform.com", passwordHash, isActive: true },
  });
  console.log("User:", user.email);

  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId: user.id, niche: "Beleza e Saúde", displayName: "Demo Afiliado", state: "learning" },
    });
  }
  console.log("Profile:", profile.id);

  // Social accounts — using findFirst since @@unique([profileId, network]) was removed
  for (const sa of [
    { id: "sa-threads-casareal", network: "threads", username: "casareal", displayName: "Casa Real", externalId: "mock_threads_001" },
    { id: "sa-threads-corridadiaria", network: "threads", username: "corridadiaria", displayName: "Corrida Diária", externalId: "mock_threads_002" },
    { id: "sa-threads-momentoreal", network: "threads", username: "momentoreal", displayName: "Momento Real", externalId: "mock_threads_003" },
    { id: "sa-x-ofertasreais", network: "x", username: "ofertasreais", displayName: "Ofertas Reais", externalId: "mock_x_001" },
    { id: "sa-x-diariasaudavel", network: "x", username: "diariasaudavel", displayName: "Diária Saudável", externalId: "mock_x_002" },
  ]) {
    const existing = await prisma.socialAccount.findFirst({ where: { id: sa.id } });
    if (!existing) {
      await prisma.socialAccount.create({
        data: { id: sa.id, profileId: profile.id, network: sa.network, username: sa.username, displayName: sa.displayName, externalId: sa.externalId, status: "active", isMock: true },
      });
    }
  }
  await prisma.marketplaceAccount.upsert({
    where: { profileId_marketplace: { profileId: profile.id, marketplace: "shopee" } },
    update: {},
    create: { profileId: profile.id, marketplace: "shopee", affiliateId: "mock_shopee_aff_789", status: "active", isMock: true },
  });

  // Create campaigns
  const campMap: Record<string, string> = {};
  for (const c of CAMPS) {
    const camp = await prisma.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        profileId: profile.id,
        name: c.name,
        productUrl: c.productUrl,
        productName: c.productName,
        marketplace: c.marketplace,
        targetNetwork: c.targetNetwork,
        status: c.status,
        mode: c.mode,
        objective: c.objective ?? "sales",
        trendsPerDay: c.trendsPerDay ?? 2,
        postsPerDay: c.postsPerDay ?? 7,
        startDate: c.startDate,
        endDate: c.endDate,
        pausedAt: c.pausedAt,
        endedAt: c.endedAt,
      },
    });
    campMap[c.id] = camp.id;
  }
  console.log("Campaigns created:", Object.keys(campMap).length);

  // Create trends + posts + publications
  let trendCount = 0;
  let postCount = 0;
  let pubCount = 0;

  for (const ts of TREND_SEEDS) {
    const campId = campMap[ts.campRef];
    const camp = CAMPS.find((c) => c.id === ts.campRef)!;
    const posts = genPosts(ts.format, camp.productName, camp.marketplace);

    const scheduledAt = ts.publishedDaysAgo
      ? daysAgo(ts.publishedDaysAgo)
      : ts.scheduledDaysAhead
      ? daysAhead(ts.scheduledDaysAhead)
      : undefined;

    const publishedAt = ts.publishedDaysAgo ? daysAgo(ts.publishedDaysAgo) : undefined;

    const trend = await prisma.trend.upsert({
      where: { id: ts.id },
      update: {},
      create: {
        id: ts.id,
        campaignId: campId,
        format: ts.format,
        hook: posts[0],
        narrativeSummary: ts.format.replace(/_/g, " "),
        status: ts.status,
        qualityScore: ts.qScore,
        postsCount: posts.length,
        scheduledAt,
        publishedAt,
        totalClicks: ts.metrics?.clicks ?? 0,
        totalImpressions: ts.metrics?.impressions ?? 0,
        totalConversions: ts.metrics?.conversions ?? 0,
        totalRevenueBrl: ts.metrics?.revenue ?? 0,
      },
    });
    trendCount++;

    // Create TrendPosts
    const trendPosts: string[] = [];
    for (let i = 0; i < posts.length; i++) {
      const tpId = `${ts.id}-p${i + 1}`;
      const tp = await prisma.trendPost.upsert({
        where: { id: tpId },
        update: {},
        create: {
          id: tpId,
          trendId: trend.id,
          position: i + 1,
          content: posts[i],
          hasMedia: i === 1 || i === 4,
          mediaType: i === 1 ? "image" : i === 4 ? "video" : undefined,
        },
      });
      trendPosts.push(tp.id);
      postCount++;

      // Create publications for published/scheduled trends
      if (ts.status === "published" || ts.status === "scheduled") {
        const postDayOffset = i; // each post goes out 1 day after previous
        const postScheduledAt = scheduledAt
          ? new Date(scheduledAt.getTime() + postDayOffset * 86400000)
          : new Date();
        const postPublishedAt = ts.status === "published"
          ? new Date(postScheduledAt.getTime() + 2 * 3600000) // 2h after scheduled
          : undefined;

        // Distribute metrics across posts
        const postMetrics = ts.metrics
          ? {
              clicks: Math.round((ts.metrics.clicks / posts.length) * (0.7 + Math.random() * 0.6)),
              impressions: Math.round((ts.metrics.impressions / posts.length) * (0.8 + Math.random() * 0.4)),
              conversions: i === 0 ? Math.round(ts.metrics.conversions * 0.4) : Math.round(ts.metrics.conversions / posts.length),
              revenueBrl: i === 0 ? ts.metrics.revenue * 0.4 : ts.metrics.revenue / posts.length,
            }
          : undefined;

        await prisma.publication.upsert({
          where: { id: `pub-${ts.id}-p${i + 1}` },
          update: {},
          create: {
            id: `pub-${ts.id}-p${i + 1}`,
            campaignId: campId,
            trendId: trend.id,
            trendPostId: tp.id,
            scheduledAt: postScheduledAt,
            publishedAt: postPublishedAt,
            status: ts.status === "published" ? "published" : "scheduled",
            clicks: postMetrics?.clicks,
            impressions: postMetrics?.impressions,
            conversions: postMetrics?.conversions,
            revenueBrl: postMetrics?.revenueBrl,
          },
        });
        pubCount++;
      }
    }
  }

  console.log(`Trends: ${trendCount}, Posts: ${postCount}, Publications: ${pubCount}`);

  // Create learnings
  let lrnCount = 0;
  for (const l of LEARNINGS) {
    const campId = l.campRef ? campMap[l.campRef] : undefined;
    await prisma.learning.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        profileId: profile.id,
        campaignId: campId,
        summary: l.summary,
        type: l.type,
        impact: l.impact,
        autoApplied: l.autoApplied,
        recordedAt: daysAgo(lrnCount * 3 + 1),
        state: "active",
      },
    });
    lrnCount++;
  }

  console.log(`Learnings: ${lrnCount}`);

  // Create default LlmConfig (simulated provider)
  await prisma.llmConfig.upsert({
    where: { profileId: profile.id },
    update: {},
    create: {
      profileId: profile.id,
      provider: "simulated",
      apiKey: "",
      model: "",
      baseUrl: "",
    },
  });
  console.log("LlmConfig: simulated");

  // Create campaign events for key campaigns
  const CAMP_EVENTS = [
    // Created events
    ...CAMPS.map((c) => ({
      id: `ev-created-${c.id}`,
      campRef: c.id,
      type: "created",
      title: "Campanha criada",
      description: `Campanha "${c.name}" iniciada no modo ${c.mode}.`,
      metadata: null as string | null,
      createdAt: c.startDate ?? daysAgo(30),
    })),
    // Generated events for campaigns with published trends
    { id: "ev-gen-001", campRef: "camp-001", type: "generated", title: "Nova narrativa gerada", description: 'Família "Saúde e Bem-Estar" · Emoção "Esperança" · Personagem "Profissional exausto"', metadata: JSON.stringify({ trendId: "tr-001", provider: "simulated", family: "Saúde e Bem-Estar", emotion: "Esperança", character: "Profissional exausto" }), createdAt: daysAgo(38) },
    { id: "ev-gen-002", campRef: "camp-001", type: "generated", title: "Nova narrativa gerada", description: 'Família "Transformação Pessoal" · Emoção "Confiança" · Personagem "Pessoa comum"', metadata: JSON.stringify({ trendId: "tr-002", provider: "simulated", family: "Transformação Pessoal", emotion: "Confiança", character: "Pessoa comum" }), createdAt: daysAgo(30) },
    { id: "ev-gen-003", campRef: "camp-001", type: "generated", title: "Nova narrativa gerada", description: 'Família "Saúde e Bem-Estar" · Emoção "Curiosidade" · Personagem "Mãe ocupada"', metadata: JSON.stringify({ trendId: "tr-003", provider: "simulated", family: "Saúde e Bem-Estar", emotion: "Curiosidade", character: "Mãe ocupada" }), createdAt: daysAgo(20) },
    { id: "ev-gen-004", campRef: "camp-002", type: "generated", title: "Nova narrativa gerada", description: 'Família "Beleza e Autoestima" · Emoção "Nostalgia" · Personagem "Jovem ambicioso"', metadata: JSON.stringify({ trendId: "tr-004", provider: "simulated", family: "Beleza e Autoestima", emotion: "Nostalgia", character: "Jovem ambicioso" }), createdAt: daysAgo(43) },
    { id: "ev-gen-005", campRef: "camp-002", type: "generated", title: "Nova narrativa gerada", description: 'Família "Beleza e Autoestima" · Emoção "Esperança" · Personagem "Pessoa comum"', metadata: JSON.stringify({ trendId: "tr-005", provider: "simulated", family: "Beleza e Autoestima", emotion: "Esperança", character: "Pessoa comum" }), createdAt: daysAgo(36) },
    { id: "ev-gen-006", campRef: "camp-007", type: "generated", title: "Nova narrativa gerada", description: 'Família "Beleza e Autoestima" · Emoção "Confiança" · Personagem "Jovem ambicioso"', metadata: JSON.stringify({ trendId: "tr-023", provider: "simulated", family: "Beleza e Autoestima", emotion: "Confiança", character: "Jovem ambicioso" }), createdAt: daysAgo(48) },
    { id: "ev-gen-007", campRef: "camp-015", type: "generated", title: "Nova narrativa gerada", description: 'Família "Transformação Pessoal" · Emoção "Esperança" · Personagem "Profissional exausto"', metadata: JSON.stringify({ trendId: "tr-044", provider: "simulated", family: "Transformação Pessoal", emotion: "Esperança", character: "Profissional exausto" }), createdAt: daysAgo(53) },
    { id: "ev-gen-008", campRef: "camp-006", type: "generated", title: "Nova narrativa gerada", description: 'Família "Produtividade e Rotina" · Emoção "Confiança" · Personagem "Profissional exausto"', metadata: JSON.stringify({ trendId: "tr-019", provider: "simulated", family: "Produtividade e Rotina", emotion: "Confiança", character: "Profissional exausto" }), createdAt: daysAgo(53) },
    // Win events for top performers
    { id: "ev-win-001", campRef: "camp-001", type: "win", title: "Narrativa vencedora detectada", description: "CTR 40% acima da média. Família 'Transformação Pessoal' marcada como vencedora.", metadata: JSON.stringify({ trendId: "tr-001", ctr: 4.2, avgCtr: 2.9 }), createdAt: daysAgo(26) },
    { id: "ev-win-002", campRef: "camp-007", type: "win", title: "Narrativa vencedora detectada", description: "CTR 35% acima da média. Família 'Beleza e Autoestima' confirmada.", metadata: JSON.stringify({ trendId: "tr-023", ctr: 3.8, avgCtr: 2.7 }), createdAt: daysAgo(45) },
    { id: "ev-win-003", campRef: "camp-015", type: "win", title: "Narrativa vencedora detectada", description: "CTR 28% acima da média. Emoção 'Esperança' + Personagem 'Profissional exausto' venceram.", metadata: JSON.stringify({ trendId: "tr-044", ctr: 3.5, avgCtr: 2.6 }), createdAt: daysAgo(49) },
  ];

  let evCount = 0;
  for (const ev of CAMP_EVENTS) {
    const campId = campMap[ev.campRef];
    if (!campId) continue;
    await prisma.campaignEvent.upsert({
      where: { id: ev.id },
      update: {},
      create: {
        id: ev.id,
        campaignId: campId,
        type: ev.type,
        title: ev.title,
        description: ev.description,
        metadata: ev.metadata,
        createdAt: ev.createdAt,
      },
    });
    evCount++;
  }
  console.log(`CampaignEvents: ${evCount}`);

  // Create narrative patterns (pre-populated from simulated usage history)
  const NARRATIVE_PATTERNS = [
    // Families
    { type: "family", value: "Transformação Pessoal",   usageCount: 8, winCount: 3, totalCtr: 12.6 },
    { type: "family", value: "Beleza e Autoestima",     usageCount: 7, winCount: 2, totalCtr: 8.9  },
    { type: "family", value: "Saúde e Bem-Estar",       usageCount: 6, winCount: 1, totalCtr: 5.2  },
    { type: "family", value: "Produtividade e Rotina",  usageCount: 4, winCount: 1, totalCtr: 4.1  },
    { type: "family", value: "Tecnologia e Inovação",   usageCount: 2, winCount: 0, totalCtr: 0    },
    // Emotions
    { type: "emotion", value: "Esperança",    usageCount: 9, winCount: 3, totalCtr: 11.4 },
    { type: "emotion", value: "Confiança",    usageCount: 7, winCount: 2, totalCtr: 8.2  },
    { type: "emotion", value: "Curiosidade",  usageCount: 5, winCount: 1, totalCtr: 4.8  },
    { type: "emotion", value: "Nostalgia",    usageCount: 3, winCount: 0, totalCtr: 0    },
    { type: "emotion", value: "Urgência",     usageCount: 2, winCount: 0, totalCtr: 0    },
    // Characters
    { type: "character", value: "Profissional exausto", usageCount: 8, winCount: 3, totalCtr: 12.1 },
    { type: "character", value: "Pessoa comum",         usageCount: 6, winCount: 1, totalCtr: 4.9  },
    { type: "character", value: "Mãe ocupada",          usageCount: 5, winCount: 1, totalCtr: 4.3  },
    { type: "character", value: "Jovem ambicioso",      usageCount: 4, winCount: 1, totalCtr: 4.5  },
    { type: "character", value: "Cético experiente",    usageCount: 2, winCount: 0, totalCtr: 0    },
    // Settings
    { type: "setting", value: "Casa",            usageCount: 5, winCount: 1, totalCtr: 4.2  },
    { type: "setting", value: "Trabalho",        usageCount: 4, winCount: 1, totalCtr: 4.6  },
    { type: "setting", value: "Rotina matinal",  usageCount: 3, winCount: 1, totalCtr: 3.9  },
    { type: "setting", value: "Academia",        usageCount: 2, winCount: 0, totalCtr: 0    },
    // Objects
    { type: "object", value: "Espelho",       usageCount: 4, winCount: 2, totalCtr: 8.1  },
    { type: "object", value: "Celular",       usageCount: 3, winCount: 0, totalCtr: 0    },
    { type: "object", value: "Agenda",        usageCount: 2, winCount: 0, totalCtr: 0    },
    { type: "object", value: "Xícara de café", usageCount: 3, winCount: 1, totalCtr: 3.7 },
  ];

  let patternCount = 0;
  for (const p of NARRATIVE_PATTERNS) {
    await prisma.narrativePattern.upsert({
      where: { profileId_type_value: { profileId: profile.id, type: p.type, value: p.value } },
      update: {},
      create: {
        profileId: profile.id,
        type: p.type,
        value: p.value,
        usageCount: p.usageCount,
        winCount: p.winCount,
        totalCtr: p.totalCtr,
      },
    });
    patternCount++;
  }
  console.log(`NarrativePatterns: ${patternCount}`);

  // ─── Narrators ────────────────────────────────────────────────────
  const NICHE = "Beleza e Saúde";

  // Laura: female, 26-35, married, has children
  const laura = await prisma.narrator.upsert({
    where: { id: "narrator-laura" },
    update: {},
    create: {
      id: "narrator-laura",
      profileId: profile.id,
      name: "Laura",
      sex: "female",
      ageRange: "26-35",
      maritalStatus: "married",
      hasChildren: true,
      livesAlone: false,
      status: "active",
      totalNarratives: 12,
      totalClicks: 234,
      totalImpressions: 9800,
      totalConversions: 7,
      totalRevenueBrl: 623.50,
    },
  });

  // Rafael: male, 36-45, married, has children
  const rafael = await prisma.narrator.upsert({
    where: { id: "narrator-rafael" },
    update: {},
    create: {
      id: "narrator-rafael",
      profileId: profile.id,
      name: "Rafael",
      sex: "male",
      ageRange: "36-45",
      maritalStatus: "married",
      hasChildren: true,
      livesAlone: false,
      status: "active",
      totalNarratives: 8,
      totalClicks: 145,
      totalImpressions: 6200,
      totalConversions: 4,
      totalRevenueBrl: 356.00,
    },
  });

  // Hypothesis specs: all dimensions × all values
  const HYPOTHESIS_POOLS: Record<string, string[]> = {
    tone:            ["emocional", "objetivo", "reflexivo", "leve", "intenso"],
    rhythm:          ["rápido", "médio", "lento"],
    productStrategy: ["clickbait", "contextual", "hybrid"],
    questionType:    ["moral", "experiência", "decisão", "validação"],
    openingStyle:    ["ação direta", "contexto primeiro", "emoção primeiro"],
    conflictType:    ["familiar", "financeiro", "relacionamento", "trabalho", "cotidiano"],
    structureType:   ["escadaria", "flash", "reflexão", "decisão"],
  };

  // Laura hypotheses — with some winners and usage data simulated
  const LAURA_OVERRIDES: Record<string, { status: string; usageCount: number; winCount: number; confidence: number }> = {
    "tone:emocional":        { status: "winner", usageCount: 5, winCount: 3, confidence: 0.52 },
    "tone:reflexivo":        { status: "testing", usageCount: 3, winCount: 1, confidence: 0 },
    "rhythm:médio":          { status: "winner", usageCount: 4, winCount: 3, confidence: 0.58 },
    "productStrategy:contextual": { status: "winner", usageCount: 4, winCount: 3, confidence: 0.55 },
    "conflictType:familiar": { status: "winner", usageCount: 5, winCount: 4, confidence: 0.66 },
    "conflictType:financeiro": { status: "loser", usageCount: 3, winCount: 0, confidence: 0 },
  };

  const RAFAEL_OVERRIDES: Record<string, { status: string; usageCount: number; winCount: number; confidence: number }> = {
    "tone:objetivo":         { status: "winner", usageCount: 4, winCount: 3, confidence: 0.54 },
    "rhythm:rápido":         { status: "winner", usageCount: 3, winCount: 2, confidence: 0.44 },
    "productStrategy:hybrid": { status: "winner", usageCount: 3, winCount: 2, confidence: 0.44 },
    "openingStyle:ação direta": { status: "winner", usageCount: 4, winCount: 3, confidence: 0.55 },
  };

  let hypCount = 0;
  for (const [dim, values] of Object.entries(HYPOTHESIS_POOLS)) {
    for (const value of values) {
      // Laura
      const lauraKey = `${dim}:${value}`;
      const lauraOv = LAURA_OVERRIDES[lauraKey];
      await prisma.narratorHypothesis.upsert({
        where: { narratorId_dimension_value_niche: { narratorId: laura.id, dimension: dim, value, niche: NICHE } },
        update: {},
        create: {
          narratorId: laura.id,
          niche: NICHE,
          dimension: dim,
          value,
          status:     lauraOv?.status     ?? "testing",
          usageCount: lauraOv?.usageCount ?? 0,
          winCount:   lauraOv?.winCount   ?? 0,
          confidence: lauraOv?.confidence ?? 0,
        },
      });

      // Rafael
      const rafaelKey = `${dim}:${value}`;
      const rafaelOv = RAFAEL_OVERRIDES[rafaelKey];
      await prisma.narratorHypothesis.upsert({
        where: { narratorId_dimension_value_niche: { narratorId: rafael.id, dimension: dim, value, niche: NICHE } },
        update: {},
        create: {
          narratorId: rafael.id,
          niche: NICHE,
          dimension: dim,
          value,
          status:     rafaelOv?.status     ?? "testing",
          usageCount: rafaelOv?.usageCount ?? 0,
          winCount:   rafaelOv?.winCount   ?? 0,
          confidence: rafaelOv?.confidence ?? 0,
        },
      });

      hypCount += 2;
    }
  }
  console.log(`NarratorHypotheses: ${hypCount}`);

  // Narrator insights for Laura
  await prisma.narratorInsight.upsert({
    where: { id: "ins-laura-001" },
    update: {},
    create: {
      id: "ins-laura-001",
      narratorId: laura.id,
      niche: NICHE,
      dimension: "conflictType",
      title: "Conflito familiar ressoa mais com Laura",
      body: "Histórias com conflito familiar geram 35% mais cliques do que as com conflito financeiro no mesmo nicho.",
      impact: "positive",
      confidence: 0.66,
      sampleSize: 5,
    },
  });
  await prisma.narratorInsight.upsert({
    where: { id: "ins-laura-002" },
    update: {},
    create: {
      id: "ins-laura-002",
      narratorId: laura.id,
      niche: NICHE,
      dimension: "productStrategy",
      title: "Estratégia Contextual converte melhor para Laura",
      body: "Produto inserido de forma contextual (coherente com a história) tem CTR 28% superior ao clickbait para este perfil.",
      impact: "positive",
      confidence: 0.55,
      sampleSize: 4,
    },
  });

  // Global insights
  await prisma.globalInsight.upsert({
    where: { id: "gi-001" },
    update: {},
    create: {
      id: "gi-001",
      profileId: profile.id,
      niche: NICHE,
      dimension: "tone",
      title: "Tom emocional vence em narradores femininos",
      body: "Narradores femininos com tom emocional têm CTR médio 32% acima de narradores masculinos no mesmo nicho.",
      impact: "positive",
      confidence: 0.61,
      sampleSize: 9,
    },
  });
  await prisma.globalInsight.upsert({
    where: { id: "gi-002" },
    update: {},
    create: {
      id: "gi-002",
      profileId: profile.id,
      niche: NICHE,
      dimension: "conflictType",
      title: "Narradores com filhos lideram em conflito familiar",
      body: "Narrativas com conflito familiar performam 40% melhor quando o narrador tem filhos, independente do sexo.",
      impact: "positive",
      confidence: 0.71,
      sampleSize: 12,
    },
  });

  console.log("Narrators, hypotheses, insights seeded.");

  // ─────────────────────────────────────────────────────────────────
  // ADDITIONAL NARRATORS — Camila + Pedro
  // ─────────────────────────────────────────────────────────────────

  const camila = await prisma.narrator.upsert({
    where: { id: "narrator-camila" },
    update: {},
    create: {
      id: "narrator-camila",
      profileId: profile.id,
      name: "Camila",
      sex: "female",
      ageRange: "18-25",
      maritalStatus: "single",
      hasChildren: false,
      livesAlone: true,
      status: "active",
      totalNarratives: 6,
      totalClicks: 187,
      totalImpressions: 8900,
      totalConversions: 5,
      totalRevenueBrl: 445.00,
    },
  });

  const pedro = await prisma.narrator.upsert({
    where: { id: "narrator-pedro" },
    update: {},
    create: {
      id: "narrator-pedro",
      profileId: profile.id,
      name: "Pedro",
      sex: "male",
      ageRange: "36-45",
      maritalStatus: "single",
      hasChildren: false,
      livesAlone: true,
      status: "active",
      totalNarratives: 4,
      totalClicks: 98,
      totalImpressions: 4200,
      totalConversions: 2,
      totalRevenueBrl: 178.00,
    },
  });

  // Hypotheses for Camila + Pedro (same pool)
  for (const [dim, values] of Object.entries(HYPOTHESIS_POOLS)) {
    for (const value of values) {
      for (const [nId, overrides] of [
        [camila.id, { "tone:leve": { status: "winner", usageCount: 3, winCount: 2, confidence: 0.50 }, "rhythm:rápido": { status: "winner", usageCount: 3, winCount: 2, confidence: 0.44 } }] as const,
        [pedro.id, {}] as const,
      ] as [string, Record<string, { status: string; usageCount: number; winCount: number; confidence: number }>][]) {
        const key = `${dim}:${value}`;
        const ov = overrides[key];
        await prisma.narratorHypothesis.upsert({
          where: { narratorId_dimension_value_niche: { narratorId: nId, dimension: dim, value, niche: NICHE } },
          update: {},
          create: {
            narratorId: nId,
            niche: NICHE,
            dimension: dim,
            value,
            status:     ov?.status     ?? "testing",
            usageCount: ov?.usageCount ?? 0,
            winCount:   ov?.winCount   ?? 0,
            confidence: ov?.confidence ?? 0,
          },
        });
      }
    }
  }
  console.log("Camila + Pedro narrators and hypotheses seeded.");

  // ─────────────────────────────────────────────────────────────────
  // ACCOUNT NARRATOR LINKS — N:N bindings for 5 accounts
  // ─────────────────────────────────────────────────────────────────

  // Helper: assign narrator to account (deactivate previous first)
  async function linkNarrator(socialAccountId: string, narratorId: string, reason: string, daysAgoN: number, extra?: { totalNarratives?: number; totalClicks?: number }) {
    await prisma.accountNarrator.updateMany({
      where: { socialAccountId, isActive: true, NOT: { narratorId } },
      data: { isActive: false, endedAt: daysAgo(daysAgoN) },
    });
    await prisma.accountNarrator.upsert({
      where: { socialAccountId_narratorId: { socialAccountId, narratorId } },
      update: { isActive: true, startedAt: daysAgo(daysAgoN), endedAt: null, reason },
      create: { socialAccountId, narratorId, isActive: true, startedAt: daysAgo(daysAgoN), reason, totalNarratives: extra?.totalNarratives ?? 0, totalClicks: extra?.totalClicks ?? 0 },
    });
  }

  // casa real → Laura (active) — Laura on multiple accounts
  await linkNarrator("sa-threads-casareal", laura.id, "Narrador inicial para Casa Real", 30, { totalNarratives: 12, totalClicks: 234 });
  // corrida diária → Camila
  await linkNarrator("sa-threads-corridadiaria", camila.id, "Narrador inicial para Corrida Diária", 25, { totalNarratives: 6, totalClicks: 187 });
  // momento real → Laura (also!) — same narrator, different account
  await linkNarrator("sa-threads-momentoreal", laura.id, "Laura expandindo para Momento Real", 15, { totalNarratives: 4, totalClicks: 89 });
  // ofertas reais → Rafael
  await linkNarrator("sa-x-ofertasreais", rafael.id, "Narrador inicial para Ofertas Reais", 20, { totalNarratives: 8, totalClicks: 145 });
  // diária saudável → Pedro
  await linkNarrator("sa-x-diariasaudavel", pedro.id, "Narrador inicial para Diária Saudável", 10, { totalNarratives: 4, totalClicks: 98 });

  // Historic: momento real previously had Camila (before Laura was assigned)
  await prisma.accountNarrator.upsert({
    where: { socialAccountId_narratorId: { socialAccountId: "sa-threads-momentoreal", narratorId: camila.id } },
    update: {},
    create: {
      socialAccountId: "sa-threads-momentoreal",
      narratorId: camila.id,
      isActive: false,
      startedAt: daysAgo(40),
      endedAt: daysAgo(15),
      reason: "Teste inicial com Camila — substituída por Laura",
      totalNarratives: 3,
      totalClicks: 62,
    },
  });

  console.log("AccountNarrator: 5 accounts linked to 4 narrators");

  // Set activeAccountId on profile to first account
  await prisma.profile.update({
    where: { id: profile.id },
    data: { activeAccountId: "sa-threads-casareal" },
  });

  // Assign some campaigns to specific accounts
  const CAMP_ACCOUNT_MAP: Record<string, string> = {
    "camp-001": "sa-threads-casareal",
    "camp-002": "sa-threads-casareal",
    "camp-004": "sa-threads-casareal",
    "camp-007": "sa-threads-corridadiaria",
    "camp-011": "sa-threads-corridadiaria",
    "camp-012": "sa-threads-momentoreal",
    "camp-015": "sa-threads-momentoreal",
    "camp-003": "sa-x-ofertasreais",
    "camp-013": "sa-x-ofertasreais",
    "camp-005": "sa-x-diariasaudavel",
    "camp-008": "sa-x-diariasaudavel",
  };
  for (const [campId, accountId] of Object.entries(CAMP_ACCOUNT_MAP)) {
    const resolvedCampId = campMap[campId];
    if (resolvedCampId) {
      await prisma.campaign.update({
        where: { id: resolvedCampId },
        data: { socialAccountId: accountId },
      });
    }
  }
  console.log(`Campaign → SocialAccount mappings: ${Object.keys(CAMP_ACCOUNT_MAP).length}`);

  // ─────────────────────────────────────────────────────────────────
  // NARRATOR RECOMMENDATION — sample pending recommendation
  // ─────────────────────────────────────────────────────────────────

  const existingRec = await prisma.narratorRecommendation.findFirst({
    where: { profileId: profile.id, status: "pending" },
  });

  if (!existingRec) {
    await prisma.narratorRecommendation.create({
      data: {
        profileId: profile.id,
        niche: NICHE,
        type: "create_narrator",
        title: `Criar novo Narrador para expandir alcance no nicho "${NICHE}"`,
        reasoning:
          `Laura (feminino, 26-35, casada, com filhos) acumulou 2 dimensões com hipóteses eliminadas: conflito financeiro e ritmo lento. Com ${laura.totalNarratives} narrativas geradas e confiança de 66%, os dados sugerem que um perfil demográfico diferente pode gerar narrativas com tonalidade distinta — expandindo o alcance para segmentos ainda não testados.`,
        evidence: JSON.stringify({
          avgCtr: laura.totalImpressions > 0 ? (laura.totalClicks / laura.totalImpressions) * 100 : 2.4,
          avgRetention: 0,
          avgConversions: 0,
          winnerDimensions: [
            { dimension: "tone", value: "emocional", confidence: 0.72, uplift: 28 },
            { dimension: "productStrategy", value: "contextual", confidence: 0.65, uplift: 21 },
            { dimension: "conflictType", value: "familiar", confidence: 0.68, uplift: 35 },
          ],
          loserDimensions: [
            { dimension: "conflictType", value: "financeiro", confidence: 0.6 },
            { dimension: "rhythm", value: "lento", confidence: 0.55 },
          ],
          sampleSize: laura.totalNarratives,
          confidence: 0.66,
          narratorFilter: "female|26-35|married",
        }),
        suggestedProfile: JSON.stringify({
          sex: "male",
          ageRange: "36-45",
          maritalStatus: "single",
          hasChildren: false,
          livesAlone: true,
          rationale:
            "Perfil masculino solteiro pode explorar conflitos de trabalho e cotidiano com ritmo rápido — dimensões ainda não saturadas nos dados atuais.",
        }),
        status: "pending",
        confidence: 0.66,
        sampleSize: laura.totalNarratives,
      },
    });
    console.log("NarratorRecommendation: sample pending recommendation created");
  }

  // ─────────────────────────────────────────────────────────────────

  console.log("Seed completed!");
  console.log("Login: demo@grokplatform.com / demo123456");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
