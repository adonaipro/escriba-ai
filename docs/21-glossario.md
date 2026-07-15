# 21 — Glossário

> *"Um vocabulário compartilhado é a fundação de uma arquitetura coerente. Quando engenheiros, designers e gestores usam as mesmas palavras com o mesmo significado, o produto que constroem reflete isso."*

---

## Objetivo deste Documento

Este glossário define os termos técnicos e de produto da [PLATAFORMA]. Toda a documentação do blueprint usa estes termos com os significados aqui definidos. Em caso de divergência entre uso informal e este glossário, o glossário prevalece.

---

## A

**Analytics Engine**
Componente responsável por coletar métricas de performance das publicações nas redes sociais e marketplaces (cliques, impressões, CTR, conversões, receita). Normaliza os dados via ISocialNetworkProvider e IMarketplaceProvider e os entrega ao Knowledge Engine para atualização dos Intelligence Scores. Definido no Documento 04; referenciado nos requisitos RF-080–083. Ver: *Knowledge Engine*, *ISocialNetworkProvider*, *IMarketplaceProvider*.

**Anti-Padrão**
Combinação de dimensões do Decision Package que demonstrou consistentemente baixo desempenho para um perfil/rede/produto específico. Anti-padrões são registrados pelo Knowledge Engine e evitados ativamente na construção de futuros Decision Packages. Nascem como combinações específicas (completas) e podem ser promovidos a padrões gerais pelo ML Engine via proposta. Não decaem com o tempo. Ver: *Intelligence Score*, *Promoção de Anti-Padrão*.

**Arco Narrativo**
Uma das 8 categorias base de estrutura narrativa disponíveis no Decision Package (ex: Transformação Pessoal, Problema-Solução, Prova Social). Cada arco define a forma como a história é contada — não o conteúdo específico. Arcos podem evoluir para incluir subarcos mais específicos conforme a plataforma identifica variações de alta performance. Ver: *Decision Package*, *Story Family*, *Subarco*.

---

## B

**Bootstrap Weight (`bootstrap_weight`)**
Peso atribuído ao DNA Global do Nicho na composição do DNA do Perfil de um usuário novo. Começa em 1.0 (referência total no DNA global) e decresce conforme dados próprios do perfil se acumulam: `max(0, atual × 0,85^N_datapoints)`. Quando atinge 0, o DNA do Perfil é 100% baseado em dados próprios do usuário.

**BullMQ**
Biblioteca de filas de tarefas para Node.js construída sobre Redis. Implementação do Event Bus no MVP. Planejado para ser substituído por Kafka em V2+ quando o volume justificar. Ver: *Event Bus*, *Kafka*.

---

## C

**Campaign Engine**
Componente responsável por gerenciar o ciclo de vida completo de uma campanha: criação, transição de estados (testing → scale_eligible → scaling → monitoring → saturating → paused/ended), aplicação de regras de elegibilidade para escala, e coordenação com o Scheduling Engine para alocação de publicações via CPS. Define o `mode` da campanha ('test' | 'scale') que informa o Story Engine sobre como gerar histórias. Ver: *Motor TESTE*, *Motor ESCALA*, *Campaign Priority Score*.

**Campaign Priority Score (CPS)**
Métrica calculada pelo Knowledge Engine que determina a prioridade de alocação de recursos (publicações, capacidade) entre campanhas ativas quando o plano do usuário tem limitação de capacidade. Fórmula: IS(35%) + retorno esperado(30%) + multiplicador de estado(20%) + tendência(15%). Pesos são provisórios — calibração pelo ML Engine. Exibido ao usuário simplesmente como "Prioridade". Ver: *Intelligence Score*, *Gestão de Capacidade*.

**Circuit Breaker**
Mecanismo de resiliência do Plugin Registry. Quando um provider externo (rede social, marketplace, provedor de IA) acumula N falhas consecutivas, o circuit breaker abre: o provider é marcado como `UNHEALTHY` e removido do pool ativo. Após período de recuperação, entra em modo `HALF-OPEN` para teste. Ver: *Plugin Registry*, *ISocialNetworkProvider*.

**Cold Start**
Período inicial de uso de um perfil novo, quando o Knowledge Engine ainda não tem dados suficientes do perfil específico para construir Decision Packages com alta confiança. Durante o cold start, o DNA do Perfil usa o DNA Global do Nicho como base (via `bootstrap_weight`). Em até 48 horas de uso, a Entidade comunica ao usuário que o aprendizado já começou. Ver: *Bootstrap Weight*, *DNA do Perfil*, *DNA Global do Nicho*.

**CQRS (Command Query Responsibility Segregation)**
Padrão arquitetural adotado pela plataforma. Commands (operações de escrita) trafegam de forma assíncrona pelo Event Bus. Queries (operações de leitura) são síncronas, direto ao PostgreSQL com cache Redis. Ver: *Event Bus*, *Knowledge Engine*.

---

## D

**Decision Package**
Conjunto de 12 dimensões que especificam completamente o que uma história deve ser: arco narrativo, gatilho emocional, comprimento, registro de voz, estilo de CTA, e outros. É o input principal do Story Engine e o output principal do Knowledge Engine para geração. Cada combinação de dimensões tem um Intelligence Score próprio. Ver: *Story Engine*, *Intelligence Score*, *Arco Narrativo*.

**Disqualifier**
Violação dos princípios éticos da plataforma detectada durante a avaliação de Quality Score. Uma história com qualquer disqualifier ativo é reprovada independentemente do QS total. Os 4 disqualifiers ativos: urgência manipulativa, dado fabricado, produto incorretamente representado, prova social fabricada. Não é critério de qualidade — é critério ético. Ver: *Quality Score*.

**DNA do Perfil**
Representação vetorial (embedding 1536 dimensões) dos padrões narrativos, de voz e de performance de um perfil específico. Descoberto e construído pela plataforma com base em dados de publicações de alta performance — nunca configurado manualmente pelo usuário. Versionado; cada atualização gera nova versão preservando as anteriores. Ver: *DNA Global do Nicho*, *Bootstrap Weight*, *pgvector*.

**Decaimento do IS**
Mecanismo pelo qual o Intelligence Score de uma combinação de dimensões diminui passivamente ao longo do tempo sem revalidação. Taxa base: 1,5%/semana (placeholder). Modificadores: campanha ativa em ESCALA (×0,3 = 0,45%/semana); nicho saturado (×2,0 = 3%/semana). Anti-padrões não decaem. Implementado para garantir que conhecimento antigo não revalidado perde influência gradualmente. Ver: *Intelligence Score*, *Versão Placeholder*, *DECISIONS #006*.

**DNA Global do Nicho**
Representação vetorial agregada de padrões de alta performance de múltiplos perfis em um mesmo nicho (categoria de produto). Usado como referência durante o cold start de novos perfis. Nunca exposto individualmente — apenas como média anonimizada. Ver: *DNA do Perfil*, *Bootstrap Weight*, *Cold Start*.

---

## E

**A Entidade**
A persona unificada da plataforma para o usuário. Para o usuário, existe uma única inteligência trabalhando por ele — nunca componentes separados, nunca arquitetura, nunca linguagem técnica. Comunica-se em primeira pessoa, de forma proativa, usando apenas linguagem de resultado e consequência. Ver: *Hierarquia de Comunicação*, *"Por quê?"*.

**Event Bus**
Backbone de comunicação assíncrona entre componentes. No MVP: BullMQ sobre Redis. Em V2+: Kafka. Todos os Commands (operações de escrita) trafegam pelo Event Bus. Ver: *CQRS*, *BullMQ*, *Kafka*.

**Exponential Backoff**
Estratégia de retentativa em que o intervalo entre tentativas cresce exponencialmente (ex: 1s, 2s, 4s, 8s...) com variação aleatória (jitter de ±20%) para evitar thundering herd. Usado para chamadas a APIs externas e retentativas de publicação.

---

## F

**Feature Flag**
Mecanismo de ativação/desativação de providers ou funcionalidades sem necessidade de deploy. Gerenciado pelo Plugin Registry. Exemplo: `amazon.enabled = false` mantém o AmazonAdapter no código mas o impede de receber requisições. Ver: *Plugin Registry*, *IMarketplaceProvider*.

**Flyway**
Ferramenta de versionamento e migração de banco de dados. Todas as migrações de schema do PostgreSQL são gerenciadas pelo Flyway — nunca executadas manualmente em produção.

---

## G

**Gatilho Emocional**
Uma das dimensões do Decision Package. Define o mecanismo psicológico principal que a história deve ativar na audiência (ex: curiosidade, medo de perder, aspiração, pertencimento). Cada gatilho tem padrões de desempenho distintos dependendo do arco narrativo, nicho e perfil.

**Gestão de Capacidade**
Sistema que distribui o volume disponível de publicações do plano entre campanhas ativas com base no Campaign Priority Score. Quando o plano está próximo do limite, o Scheduling Engine redistribui automaticamente as publicações restantes pelas campanhas de maior prioridade. Ver: *Campaign Priority Score*, *Scheduling Engine*.

---

## H

**Health Check**
Verificação periódica (a cada 60 segundos) do estado de saúde de cada provider registrado no Plugin Registry. Retorna `HEALTHY`, `DEGRADED` ou `UNHEALTHY`. Ver: *Plugin Registry*, *Circuit Breaker*.

**Hierarquia de Comunicação**
Os três níveis de comunicação da Entidade com o usuário, em ordem de preferência: (1) Silêncio — o sistema resolve sozinho; (2) Consequência — informa impacto sem pedir ação; (3) Ação — instrução simples quando o usuário precisa agir. A plataforma sempre tenta o nível mais baixo primeiro. Ver: *A Entidade*.

**HMAC-SHA256**
Algoritmo de autenticação de mensagem usado para validar a autenticidade de webhooks recebidos de provedores externos. Todo webhook é validado antes de qualquer processamento. Comparação em tempo constante (`timingSafeEqual`) para evitar timing attacks. Ver: *Webhook*.

**HNSW (Hierarchical Navigable Small World)**
Tipo de índice usado pelo pgvector para busca de similaridade vetorial de alta performance. Usado nos índices de embeddings de DNA do Perfil e de histórias publicadas. Ver: *pgvector*, *DNA do Perfil*.

---

## I

**impact_score**
Campo numérico (0–100) de cada entrada da Learning Timeline que representa a relevância estimada daquele aprendizado para os resultados do perfil. Usado para ordenar a exibição dos aprendizados ao usuário (maiores primeiro). Calculado pelo Knowledge Engine no momento do registro da entrada. Entradas expiradas mantêm seu `impact_score` original — não é recalculado. Ver: *Learning Timeline*, *Knowledge Engine*.

**IAIProvider**
Interface TypeScript contratual que todo provedor de IA (OpenAI, Anthropic, etc.) deve implementar. Define: geração de texto, avaliação de QS, geração de embeddings, health check, e capacidades do modelo. Ver: *Plugin Architecture*, *Plugin Registry*.

**IContentProvider**
Interface TypeScript contratual para provedores de conteúdo visual (imagens, vídeos). Nenhum adapter implementado no MVP — slot arquitetural reservado para V1+. Ver: *Plugin Architecture*.

**Idempotency-Key**
Header UUID-v4 opcional em todos os endpoints POST que criam recursos. Garante que requisições com o mesmo key (dentro de 24h) retornam a resposta original sem reprocessar — prevenindo duplicações em cenários de retry ou múltiplos cliques. Ver: *request_id*.

**IMarketplaceProvider**
Interface TypeScript contratual que todo marketplace (Shopee, Amazon, MercadoLivre) deve implementar. Define: validação de compatibilidade de rastreamento, geração de links de afiliado, busca de produtos, coleta de conversões. Ver: *Plugin Architecture*, *Plugin Registry*.

**Intelligence Score (IS)**
Métrica de confiança de 0 a 100 por combinação específica de dimensões do Decision Package. Representa a probabilidade estimada de que aquela combinação produzirá alto desempenho para aquele perfil/rede/produto. Não é uma métrica de performance — é uma métrica de confiança. Decai com o tempo. Estados: `anti_pattern` (0–20), `ineffective` (21–40), `inconclusive` (41–60), `promising` (61–80), `validated` (81–90), `high_confidence` (91–100). Ver: *Decision Package*, *Decaimento do IS*.

**ISocialNetworkProvider**
Interface TypeScript contratual que toda rede social (Threads, X) deve implementar. Define: OAuth, publicação, coleta de métricas de post e de conta, health check. Ver: *Plugin Architecture*, *Plugin Registry*.

---

## J

**jti (JWT ID)**
Campo único por token JWT que permite revogação individual de tokens sem invalidar toda a família. Armazenado em Redis com TTL correspondente ao token. Ver: *JWT*, *Refresh Token*.

**JWT (JSON Web Token)**
Token de acesso de curta duração (15 minutos) que autentica requisições de usuários. Assinado com RS256 (assimétrico) — chave privada confinada ao servidor de autenticação. Ver: *Refresh Token*, *jti*.

---

## K

**Kafka**
Sistema de mensageria distribuída de alta throughput. Planejado como substituto do BullMQ em V2+ quando o volume de eventos justificar a complexidade operacional. Os contratos de evento do MVP são compatíveis com Kafka por design. Ver: *Event Bus*, *BullMQ*.

**Knowledge Engine (KE)**
O motor de decisão central da plataforma. Único componente com permissão para modificar o estado operacional (Intelligence Scores, DNA, Learning Timeline, anti-padrões). Decide o que testar, o que escalar, o que pausar, o que arquivar. Não aprende diretamente — recebe propostas e sugestões do ML Engine e decide o que aplicar. Ver: *ML Engine*, *Intelligence Score*, *DECISIONS #001*.

---

## L

**Learning Timeline**
Histórico imutável e append-only de aprendizados de um perfil. Entradas nunca são deletadas — apenas marcadas como `expired` ou `superseded`. Cada entrada inclui `why_activation`, `why_expiration` (quando aplicável), `impact_score`, e `state`. Ordenada por `impact_score` para exibição ao usuário. Ver: *"Por quê?"*, *impact_score*.

---

## M

**ML Engine**
Componente Python responsável por aprendizado em batch, calibração de parâmetros e análise estatística. Executa em jobs periódicos assíncronos — nunca no caminho crítico de requisições. Escreve apenas no schema `ml.*`. Propõe mudanças ao Knowledge Engine via tabelas intermediárias. Não toma decisões operacionais. Ver: *Knowledge Engine*, *Calibração*, *ml.anti_pattern_proposals*.

**ml.anti_pattern_proposals**
Tabela intermediária no schema `ml.*` onde o ML Engine registra propostas de promoção de anti-padrões específicos para gerais. O Knowledge Engine consome essa tabela e é o único que aplica as mudanças em `knowledge.anti_patterns`. Garante a separação ML (propõe) / KE (aplica). Ver: *Anti-Padrão*, *Knowledge Engine*, *DECISIONS #085*.

**model_version**
Campo armazenado junto a cada história gerada. Formato: `{provider}:{model}:{prompt_version}` (ex: `openai:gpt-4o:generation-v2`). Permite reconstrução exata do prompt de qualquer história para diagnóstico, sem armazenar o prompt completo em produção. Ver: *Prompt Versioning*.

**Motor ESCALA**
Um dos dois motores visíveis ao usuário. Responsável por multiplicar, preservar e maximizar padrões já validados (IS ≥ 81). Gerencia Story Families, monitora saturação, e sugere escala multi-rede. Ver: *Motor TESTE*, *Intelligence Score*, *Story Family*.

**Motor TESTE**
Um dos dois motores visíveis ao usuário. Responsável por descobrir, aprender e validar novos padrões de performance. Constrói Decision Packages, coordena geração de histórias, coleta resultados e atualiza o Intelligence Score. Ver: *Motor ESCALA*, *Decision Package*.

---

## P

**Publisher**
Componente responsável por executar a publicação efetiva de histórias nas redes sociais via ISocialNetworkProvider. Recebe as publicações agendadas pelo Scheduling Engine e as envia às APIs das redes. Trata erros de publicação com retry e backoff exponencial. Em caso de falha permanente, notifica o Campaign Engine para acionar a Hierarquia de Comunicação. Ver: *ISocialNetworkProvider*, *Scheduling Engine*, *Exponential Backoff*.

**pgvector**
Extensão do PostgreSQL para armazenamento e busca de vetores de alta dimensão. Usada para embeddings de DNA do Perfil e de histórias publicadas. Índices HNSW para busca de similaridade eficiente. Elimina a necessidade de banco vetorial externo. Ver: *DNA do Perfil*, *HNSW*.

**PII (Personally Identifiable Information)**
Dados que identificam diretamente ou indiretamente uma pessoa (nome, e-mail, CPF, etc.). PII nunca entra em prompts enviados a modelos de linguagem externos. PII nunca aparece em logs de produção. Ver: *Prompt Architecture*, *DECISIONS #093*.

**Plugin Architecture**
Padrão arquitetural obrigatório para todas as integrações externas. Todo provider externo é implementado como um plugin com interface TypeScript contratual, registrado no Plugin Registry. Nenhum serviço interno chama APIs externas diretamente. Ver: *Plugin Registry*, *ISocialNetworkProvider*, *IMarketplaceProvider*, *IAIProvider*.

**Plugin Registry**
Singleton que gerencia todos os providers externos: registro, health monitoring (60s), circuit breakers, e feature flags. Ponto único de contato entre serviços internos e o mundo exterior. Ver: *Plugin Architecture*, *Circuit Breaker*, *Feature Flag*.

**"Por quê?"**
Mecanismo de transparência da plataforma. Um botão contextual em pontos de decisão que exibe a justificativa pré-calculada de uma decisão ou insight da Entidade. Para padrões ativos, usa `why_activation`. Para padrões expirados, usa `why_expiration`. Nunca gerado on-demand — sempre calculado no momento da decisão. Máximo 5 frases, sem terminologia técnica, sem IS como número. Ver: *Learning Timeline*, *DECISIONS #069*, *DECISIONS #070*.

**Profile DNA**
Ver: *DNA do Perfil*.

**Prompt Versioning**
Prática de tratar prompts como código: versionados em `prompts/{tipo}/v{N}.ts`, revisados via PR, testados em staging, deployados pelo pipeline de CI/CD. Mudanças nunca aplicadas diretamente em produção. Ver: *model_version*, *DECISIONS #084*.

**PromptAssembler**
Componente responsável por compor o prompt completo a partir das 4 camadas: (1) identidade da Entidade, (2) DNA do Perfil, (3) Decision Package, (4) restrições ativas. Input do IAIProvider. Ver: *Prompt Architecture*, *Decision Package*.

---

## Q

**Quality Score (QS)**
Avaliação de qualidade narrativa de uma história gerada. Composto por 7 dimensões com pesos iniciais: coerência narrativa (25%), autenticidade de voz (20%), consistência com DNA (20%), representação do produto (15%), clareza da CTA (10%), adequação à rede (5%), originalidade (5%). Threshold de aprovação: QS ≥ 70. Histórias com QS < 70 têm resultado descartado do aprendizado — o problema pode ser de execução, não de hipótese. Calculado por modelo separado (gpt-4o-mini, temperatura 0.1) para julgamento estável. Pesos são placeholders — calibração pelo ML Engine. Ver: *Disqualifier*, *Intelligence Score*.

---

## R

**Refresh Token**
Token de longa duração (30 dias) armazenado em cookie `HttpOnly; Secure; SameSite=Strict`. Usado para obter novos access tokens (JWTs) sem novo login. Rotacionado a cada uso. Pertence a uma família — uso de token expirado da família invalida toda a família. Ver: *JWT*, *jti*.

**request_id**
Identificador único gerado no recebimento de cada requisição. Presente em todas as respostas da API (sucesso e erro) e propagado para logs de todos os serviços que processaram a requisição. Permite rastreamento de toda a cadeia de eventos de uma requisição específica. Ver: *DECISIONS #079*.

---

## S

**Saturação**
Estado de uma campanha em ESCALA onde todas as variações relevantes da Story Family ativa demonstraram queda consistente de performance. O Knowledge Engine declara saturação somente após explorar toda a família — nunca por queda isolada de algumas variações. Ver: *Story Family*, *Motor ESCALA*.

**Scheduling Engine**
Componente responsável por calcular quando publicar cada história. Opera de forma síncrona no MVP (query ao banco para calcular horários). Em V1, extrai padrões de horário para cache em memória (atualizado a cada hora). Considera: comportamento da audiência, rate limits da rede, volume total de publicações em curso. Ver: *Campaign Priority Score*.

**Story Engine**
Componente responsável por gerar histórias a partir do Decision Package fornecido pelo Knowledge Engine. Usa o PromptAssembler para compor o prompt, chama o IAIProvider, avalia o QS, aplica validações e retorna a história aprovada. Ver: *Decision Package*, *Quality Score*, *PromptAssembler*.

**Story Family**
Conjunto de variações narrativas geradas a partir de uma história de alto desempenho. Quando uma história apresenta performance significativamente acima do baseline, o Knowledge Engine prioriza exploração local (derivações da mesma família) antes de explorar arcos completamente diferentes. O número de derivações é calibrado pelo ML Engine (placeholder: 3–5). Ver: *Motor ESCALA*, *DECISIONS #050*, *DECISIONS #053*.

**Subarco**
Variação específica dentro de um arco narrativo base, identificada pelo Knowledge Engine quando os dados mostram que ela performa de forma consistentemente distinta das outras variações do mesmo arco. Exemplos: "Transformação Rápida" e "Transformação Gradual" dentro do Arco Transformação Pessoal. Ver: *Arco Narrativo*, *DECISIONS #048*.

---

## T

**Trial**
Período de 14 dias com acesso completo à plataforma sem necessidade de cartão de crédito. Os únicos parâmetros fixos do trial são duração (14 dias) e ausência de cartão — demais parâmetros (plano simulado, limites) são hipóteses de negócio a validar com dados reais. Ver: *DECISIONS #017*, *DECISIONS #097*.

---

## V

**Versão Placeholder**
Todo parâmetro numérico definido durante a fase de blueprint (taxa de decaimento do IS, thresholds, pesos do CPS, etc.) é uma estimativa inicial de ponto de partida. Nunca deve ser tratado como definitivo antes de calibração pelo ML Engine com dados reais da plataforma em operação. Ver: *DECISIONS #062*.

---

## W

**Webhook**
Notificação HTTP enviada por um sistema externo (rede social, marketplace) para informar um evento (nova conversão, alteração de status de publicação). Todo webhook recebido é validado via HMAC-SHA256 antes de qualquer processamento. Resposta imediata com 200 + processamento assíncrono via BullMQ. Ver: *HMAC-SHA256*, *BullMQ*.

---

*Documento criado em: 2026-07-12*  
*Versão: 0.2 — Aprovado (Analytics Engine, Campaign Engine, Publisher, Decaimento do IS, impact_score adicionados; QS atualizado para dimensões canônicas)*
