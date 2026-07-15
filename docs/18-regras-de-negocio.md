# 18 — Regras de Negócio

> *"Regras de negócio são o que torna a plataforma confiável. O usuário delega decisões porque sabe que as regras são consistentes."*

---

## Objetivo deste Documento

Consolidar as regras que governam o comportamento da plataforma: o que é permitido, o que é proibido, quais condições disparam quais ações, e como os componentes se comportam em cada estado. Este documento é a fonte de verdade para implementação — quando código e regra divergirem, a regra prevalece.

**Todos os parâmetros numéricos neste documento são placeholders provisórios**, calibrados pelo ML Engine com dados reais após o lançamento. (DECISIONS #062)

---

## 1. Regras de Intelligence Score (IS)

### 1.1 Escala e Estados

O Intelligence Score é uma métrica de confiança de 0 a 100 por combinação de dimensões. Todo IS pertence a uma combinação específica de dimensões — não existe IS de um perfil genérico.

| Faixa | Estado | Significado |
|---|---|---|
| 0–20 | `anti_pattern` | Combinação consistentemente associada a baixo desempenho |
| 21–40 | `ineffective` | Poucos dados; resultados negativos predominam |
| 41–60 | `inconclusive` | Dados insuficientes ou resultados mistos |
| 61–80 | `promising` | Tendência positiva confirmada; ainda em validação |
| 81–90 | `validated` | Evidência sólida de alto desempenho; elegível para Escala |
| 91–100 | `high_confidence` | Múltiplos contextos validados; evidência consistente |

### 1.2 Cálculo do IS

```
IS_novo = IS_atual + (α × desvio_baseline × peso_qualidade × peso_volume)
```

Onde:
- `α` (taxa de aprendizado): parâmetro calibrado pelo ML Engine por nicho e rede
- `desvio_baseline`: diferença entre performance observada e baseline esperado para o perfil
- `peso_qualidade`: QS ≥ 70 → peso completo; QS < 70 → contribuição descartada
- `peso_volume`: aumenta com o volume de exposição (mais cliques = evidência mais sólida)

O IS é atualizado após cada ciclo de coleta de analytics com dados suficientes.

### 1.3 Decaimento do IS

O IS decai passivamente ao longo do tempo para refletir que conhecimento sem revalidação perde confiança:

| Condição | Taxa de decaimento base (semanal) |
|---|---|
| Padrão sem campanha ativa | 1,5% por semana (placeholder) |
| Padrão com campanha ativa em ESCALA | 0,45% por semana (×0,3 do base) |
| Padrão em nicho saturado detectado | 3,0% por semana (×2,0 do base) |
| Anti-padrão (`anti_pattern`) | Sem decaimento |

**Anti-padrões não decaem:** um padrão que demonstrou baixo desempenho consistente não "melhora" por falta de dados novos. Só pode ser reavaliado após 180 dias sem nova evidência negativa — e retorna ao estado `inconclusive`, não ao seu IS anterior.

### 1.4 Threshold de Escala

IS ≥ 81 (estado `validated` ou `high_confidence`) é pré-requisito para que uma campanha seja elegível para o Motor ESCALA. O valor 81 é placeholder — calibração obrigatória pelo ML Engine. (DECISIONS #002, #003)

O IS ≥ 61 (estado `promising`) é o critério de saída do cold start: quando ≥ 50% dos usuários ativos atingem esse estado em pelo menos 1 combinação, o MVP é considerado em validação positiva. (DECISIONS #097 critério de graduação)

---

## 2. Regras de Quality Score (QS)

### 2.1 Threshold de Qualidade

QS ≥ 70 é o mínimo para que o resultado de uma publicação seja usado como dado de aprendizado no Knowledge Engine. Publicações com QS < 70 são tratadas como dados não confiáveis — o resultado pode refletir execução ruim, não a validade da hipótese testada. (DECISIONS #013)

O valor 70 é placeholder — calibrado pelo ML Engine com correlação entre QS e CTR real. (DECISIONS #062)

### 2.2 Dimensões do QS (7 critérios)

| Dimensão | Peso | O que avalia |
|---|---|---|
| Coerência narrativa | 25% | A história tem começo, desenvolvimento e conclusão lógicos |
| Autenticidade de voz | 20% | O texto soa como uma pessoa real, não como marketing genérico |
| Consistência com DNA | 20% | Compatível com o registro e padrão de voz descoberto do perfil |
| Representação do produto | 15% | Produto apresentado com precisão, sem exageros ou benefícios inexistentes |
| Clareza da CTA | 10% | O leitor sabe o que fazer após ler |
| Adequação à rede | 5% | Formato e tom adequados para a rede-alvo da publicação |
| Originalidade | 5% | Evita clichês e estruturas idênticas a publicações recentes |

Pesos são placeholders iniciais — calibração com dados reais de CTR definirá os pesos finais (DECISIONS #062). A avaliação é executada por modelo separado (gpt-4o-mini, temperatura 0.1 — para julgamento estável e reproduzível).

### 2.3 Disqualifiers (Violações de Princípio)

Disqualifiers são violações dos princípios éticos da plataforma. Uma história que aciona qualquer disqualifier é **reprovada independentemente do QS**. (DECISIONS #081)

| Disqualifier | Definição |
|---|---|
| Urgência manipulativa | Escassez ou urgência fabricada sem fundamento real ("Só restam 3 unidades!") |
| Dado fabricado | Estatística ou afirmação factual inventada sem base real |
| Produto incorretamente representado | Preço errado, benefício inexistente ou exagerado |
| Prova social fabricada | Depoimentos, avaliações ou popularidade inventados |

**Regra:** disqualifiers são detectados pelo modelo de avaliação (gpt-4o-mini, temperatura 0.1) e retornados no campo `disqualifiers[]` da avaliação de QS. A presença de qualquer item nesse array rejeita a história — nenhum ajuste de parâmetro pode sobrepor esse comportamento.

### 2.4 Restrições de Uso de Arco Narrativo

**Arco Prova Social (Arco 7):** pode ser utilizado apenas quando há contexto genuíno para uma narrativa de prova social crível. (DECISIONS #051)

Proibido:
- Fabricar ou exagerar depoimentos, avaliações ou popularidade
- Afirmar popularidade sem base em experiência real do afiliado com o produto ou audiência
- Usar linguagem de prova social sem evidência específica ("todo mundo está amando", "sucesso garantido")

Permitido:
- Relatar experiência pessoal autêntica com o produto
- Descrever contexto real de uso observado na audiência (quando há base para isso)
- Referenciar avaliações reais com contexto verificável

A detecção de prova social fabricada está coberta pelos disqualifiers (seção 2.3). Esta seção 2.4 define a restrição de uso do arco além do que os disqualifiers capturam — casos em que a prova social é tecnicamente "não-fabricada" mas não tem contexto genuíno suficiente para ser usada.

### 2.5 O que Acontece com Histórias Rejeitadas

| Causa da rejeição | Ação |
|---|---|
| QS < 70 (qualidade insuficiente) | Retry com temperatura +0.05; máximo 3 tentativas |
| Disqualifier detectado | Rejeição definitiva; sinal de aprendizado registrado no Knowledge Engine; sem retry nesse ciclo |
| Similaridade excessiva (cosine > 0.88 em 21 dias) | Rejeição definitiva; nova geração com instrução de diversidade explícita |
| DNA check (ESCALA, cosine similarity < 0.65) | Rejeição definitiva; Decision Package precisa ser revisado |
| DNA check (TESTE, cosine similarity < 0.50) | Warning registrado; história publicada com flag de baixa aderência ao DNA |
| Modo Revisão — rejeição pelo usuário | Sinal de aprendizado distinto registrado com `rejection_signal = true`; KE pondera em gerações futuras (ver seção 4.5) |

---

## 3. Regras de Anti-Padrões

### 3.1 Ciclo de Vida de um Anti-Padrão

```
Específico (combinação completa de dimensões)
    ↓ [após K amostras com IS caindo para anti_pattern]
Candidato à promoção
    ↓ [ML Engine detecta dimensões irrelevantes; escreve proposta]
ml.anti_pattern_proposals (status: pending)
    ↓ [Knowledge Engine consome proposta]
knowledge.anti_patterns (is_general = true, dimensões abstraídas)
```

(DECISIONS #076, #085)

### 3.2 Regras de Criação

- Anti-padrões **nascem específicos** — sempre com combinação completa de dimensões
- Um anti-padrão específico requer evidência mínima (K publicações com QS ≥ 70 e resultado consistentemente baixo) — K é parâmetro calibrado pelo ML Engine
- Anti-padrão específico = IS atingiu estado `anti_pattern` (0–20) com confiança mínima suficiente

### 3.3 Regras de Promoção (Específico → Geral)

- Somente o ML Engine pode **propor** a promoção; somente o Knowledge Engine pode **aplicar**
- A proposta registra `promotion_source_ids[]` — quais anti-padrões específicos embasaram a abstração
- Nenhum outro componente escreve em `knowledge.anti_patterns` com `is_general = true`
- Mínimo K' anti-padrões específicos com dimensão comum para proposta de abstração — K' calibrado pelo ML Engine

### 3.4 Regras de Reavaliação

- Após 180 dias sem nova evidência negativa para a combinação, o anti-padrão passa a estado `reavaliado`
- Estado `reavaliado` = retorna a `inconclusive` (IS 41–60), não ao IS que tinha antes
- A reavaliação significa: "o contexto pode ter mudado — reexaminar com novos dados"
- Anti-padrão reavaliado **não é reabilitado** — é uma hipótese que merece novo teste (DECISIONS #063)

### 3.5 Regras de Uso pelo Knowledge Engine

- O Knowledge Engine não inclui combinações que combinam com anti-padrões ativos ao construir Decision Packages
- Anti-padrões gerais (`is_general = true`) bloqueiam qualquer Decision Package que contenha as dimensões não-nulas do padrão
- Anti-padrões específicos bloqueiam apenas a combinação exata

---

## 4. Regras do Motor TESTE

### 4.1 Elegibilidade de Campanha para TESTE

Uma campanha pode entrar em TESTE quando:
- Tem pelo menos 1 produto de marketplace vinculado com link rastreável
- O perfil tem e-mail verificado (DECISIONS #091)
- O perfil está dentro dos limites do plano
- Não há outro TESTE ativo para a mesma combinação produto × rede (evita conflito de dados)

### 4.2 Construção do Decision Package

O Knowledge Engine constrói o Decision Package (12 dimensões) seguindo esta ordem de prioridade:

1. **Anti-padrões:** exclui dimensões bloqueadas por anti-padrões ativos
2. **DNA do perfil:** prioriza dimensões com alta similaridade ao DNA (especialmente em ESCALA)
3. **Exploração:** em TESTE, introduz variações não testadas para ampliar o espaço de conhecimento
4. **Restrições ativas:** aplica restrições do contexto (ex: comprimento máximo para rede X)

### 4.3 Pausa Automática de Campanha em TESTE

O Knowledge Engine pausa automaticamente uma campanha em TESTE quando:
- IS atingiu estado `anti_pattern` com confiança mínima (K publicações com QS ≥ 70)
- A combinação testada foi identificada como anti-padrão ativo

O usuário é notificado com linguagem da Entidade (nível Consequência na hierarquia de comunicação — DECISIONS #042).

### 4.4 Modo Revisão

Quando o usuário ativa o Modo Revisão em uma campanha, **aprovações e rejeições manuais são sinais de aprendizado distintos** para o Knowledge Engine. (DECISIONS #021)

**Aprovação manual:** confirma que a história tem qualidade percebida pelo usuário — sinal positivo adicional ao IS da combinação.

**Rejeição manual:** registrada com `rejection_signal = true` e motivo (quando fornecido). O KE pondera esse sinal em Decision Packages futuros para a mesma campanha — combinações associadas a rejeições repetidas são depriorizadas.

**Regras do Modo Revisão:**
- Campanhas em Modo Revisão não ficam em "buraco negro" de aprendizado — toda interação do usuário é informação
- Rejeição sem motivo vale como sinal; rejeição com motivo tem peso maior (informação mais específica)
- O padrão de rejeições de um usuário específico não altera IS globalmente — é sinal local do perfil
- Histórias rejeitadas são descartadas (não publicadas) independentemente do QS

### 4.5 Intervalo entre Publicações

O Scheduling Engine calcula o intervalo dinamicamente, nunca usa valor fixo. Fatores considerados:
- Velocidade de coleta de dados da rede (tempo médio entre publicação e analytics disponível)
- Volume de publicações simultâneas do perfil
- Nível de confiança necessário para a próxima decisão
- Rate limits da rede (DECISIONS #019)

(DECISIONS #054)

---

## 5. Regras do Motor ESCALA

### 5.1 Elegibilidade para ESCALA

Uma combinação de dimensões é elegível para ESCALA quando:
- IS ≥ 81 (estado `validated` ou `high_confidence`)
- Pelo menos N publicações com QS ≥ 70 embasaram o IS (N = parâmetro calibrado pelo ML Engine)
- DNA check: similaridade ≥ 0.35 com o DNA atual do perfil (garante coerência de voz)
- A campanha não está em estado `SATURATING`

### 5.2 Story Family

Quando uma história apresenta desempenho significativamente acima do baseline (threshold calibrado pelo ML Engine), o Knowledge Engine ativa modo Story Family antes de explorar novos arcos:

1. O KE cria derivações da mesma família narrativa (variando comprimento, CTA, detalhes) — número de derivações calibrado pelo ML Engine; placeholder inicial: 3–5 (DECISIONS #053, #062)
2. Somente após esgotar o potencial da família (todas as derivações testadas) é que o KE autoriza exploração de novo território
3. "Esgotado" = todas as derivações relevantes mostraram queda consistente de performance

(DECISIONS #050, #053)

### 5.3 Saturação

Uma campanha em ESCALA entra em estado `SATURATING` quando:
- Todas as variações relevantes da Story Family ativa mostraram queda consistente de performance
- O IS da combinação principal começa a decair abaixo do threshold de escala

Uma campanha é `SATURATED` quando:
- IS caiu abaixo de 61 (`promising`) após período de `SATURATING`
- O Knowledge Engine registra a combinação como saturada no contexto atual

Saturação parcial (algumas variações perdendo força) não declara saturação total — o KE continua explorando variações não testadas da família antes de transitar para `SATURATING`. (DECISIONS #057)

---

## 6. Regras de Campaign Priority Score (CPS)

### 6.1 Fórmula do CPS (Pesos Placeholder)

```
CPS = (IS × 0,35) + (retorno_esperado × 0,30) + (multiplicador_estado × 0,20) + (tendência × 0,15)
```

Onde:
- `IS`: Intelligence Score atual da campanha (0–100)
- `retorno_esperado`: estimativa de comissão por publicação com base em histórico (normalizado 0–100)
- `multiplicador_estado`: SCALING = 100, MONITORING = 75, TESTING avançado = 50, TESTING inicial = 25
- `tendência`: crescendo = 100, estável = 50, declinando = 0

Pesos são placeholder — calibração pelo ML Engine minimiza erro de ranking com dados reais. (DECISIONS #060, #062)

### 6.2 Uso do CPS

- Campanhas são ordenadas por CPS na interface do usuário (exibido como "Prioridade" — DECISIONS #067)
- Quando o plano tem limitação de capacidade, o Scheduling Engine distribui publicações disponíveis proporcionalmente ao CPS
- Uma campanha com CPS muito baixo pode não receber nenhuma publicação em ciclos de alta ocupação do plano
- O CPS é recalculado após cada ciclo de analytics com novos dados

---

## 7. Regras de Gestão de Capacidade

### 7.1 Limites por Plano

| Estado de uso | Ação |
|---|---|
| < 80% do plano | Funcionamento normal |
| ≥ 80% do plano | Banner contextual na tela de Campanhas com consequência futura |
| 100% do plano | Sem novo agendamento; campanhas ativas continuam monitoramento; aprendizado continua |

### 7.2 Distribuição de Capacidade

Quando o plano está em ocupação ≥ 80%, o Scheduling Engine:
1. Calcula o CPS de todas as campanhas ativas
2. Distribui as publicações restantes proporcionalmente ao CPS
3. Campanhas com CPS muito baixo podem não receber publicações em determinados ciclos
4. Nenhuma campanha é pausada automaticamente apenas por limitação de capacidade — ela simplesmente não recebe novo agendamento até que capacidade libere

### 7.3 Comunicação de Capacidade

- A Entidade não usa linguagem de urgência ou alerta. Usa consequência futura: *"A partir do dia X, campanhas de menor prioridade deixarão de receber novas publicações neste ciclo."*
- Nunca mostra o percentual de uso como número — a comunicação é sempre em consequência de resultado para o usuário

---

## 8. Regras de Learning Timeline

A Learning Timeline é o histórico de aprendizado do Knowledge Engine para um perfil. (DECISIONS #006)

### 8.1 Imutabilidade

- Entradas **nunca são deletadas**
- Quando um padrão expira, a entrada é marcada como `expired` com `why_expiration` preenchido
- Quando um padrão é supersedido por um mais específico, a entrada é marcada como `superseded`
- O `impact_score` de cada entrada é recalculado periodicamente e determina a ordem de exibição ao usuário

### 8.2 Campos Obrigatórios

Toda entrada da Learning Timeline inclui:
- `why_activation`: por que o padrão foi reconhecido (linguagem da Entidade, máximo 5 frases)
- `why_expiration`: por que o padrão expirou (preenchido somente quando `state = expired`)
- `impact_score`: relevância atual para os resultados do perfil (usado para ordenação)
- `state`: `active` | `confirming` | `expired` | `superseded`

### 8.3 Exibição ao Usuário

- Padrões são exibidos ordenados por `impact_score` — não por data de criação (DECISIONS #045)
- Padrões expirados são exibidos em seção colapsável por padrão quando a lista excede tamanho razoável
- O "Por quê?" de padrão ativo usa `why_activation`; o de padrão expirado usa `why_expiration` (DECISIONS #070)

---

## 9. Regras de DNA do Perfil

### 9.1 Construção do DNA

- O DNA é descoberto pela plataforma — não configurado pelo usuário (DECISIONS #005)
- Construído como centróide dos embeddings de stories aprovadas com alta performance (QS ≥ 70 + IS acima do baseline)
- `bootstrap_weight` começa em 1.0 (DNA global do nicho é referência total) e decresce conforme dados próprios do perfil se acumulam: `bootstrap_weight = max(0, atual × 0,85^N_datapoints)`
- Quando `bootstrap_weight` = 0, o DNA é 100% baseado em dados do perfil — o DNA global não influencia mais

### 9.2 Versionamento

- O DNA é versionado — cada atualização gera uma nova versão
- A versão do DNA ativa no momento de geração de uma história é armazenada junto à história (para reconstrução de prompt — DECISIONS #082)
- Versões anteriores do DNA não são deletadas — fazem parte do histórico de evolução do perfil

### 9.3 DNA Check na Geração

| Motor | Threshold | Ação em falha |
|---|---|---|
| ESCALA | similaridade < 0.35 | Rejeição definitiva da história; Decision Package precisa ser revisado |
| TESTE | similaridade < 0.50 | Warning registrado; história publicada com flag de baixa aderência |

---

## 10. Regras de Planos e Limites

### 10.1 O Que Conta para o Limite de Publicações

- Publicações com sucesso confirmado pela rede social (não agendamentos, não tentativas)
- Retentas de publicações com falha de rede **não** contam até que a publicação seja confirmada
- O Trial tem limites próprios definidos experimentalmente (DECISIONS #097)

### 10.2 Limites Placeholder por Plano

| Plano | Perfis sociais | Publicações/mês | Campanhas ativas |
|---|---|---|---|
| Starter | 1 | 60 | 3 |
| Growth | 3 | 200 | 10 |
| Scale | 8 | 600 | Ilimitadas |

Esses valores são placeholders — calibração obrigatória antes do lançamento. (DECISIONS #022)

### 10.3 Downgrade de Plano

Quando o usuário faz downgrade para um plano com menos publicações ou perfis:
- Campanhas ativas que excedam o novo limite são **pausadas** — não deletadas
- Perfis que excedam o novo limite são **desconectados** — não deletados; dados e aprendizados preservados
- O usuário escolhe quais campanhas pausar e quais perfis desconectar antes de o downgrade ser efetivado
- A Entidade comunica a consequência antecipadamente, em linguagem simples

---

## 11. Regras de Comunicação da Entidade

### 11.1 Hierarquia de Comunicação

Toda situação de comunicação segue este fluxo de decisão, em ordem:

```
O sistema pode resolver sozinho?
    → SIM: Silêncio (nível 1) — nunca notifica o usuário
    → NÃO: O usuário precisa agir agora?
        → NÃO: Consequência (nível 2) — informa resultado/impacto sem pedir ação
        → SIM: Ação (nível 3) — instrução simples + consequência se não agir
```

(DECISIONS #042)

### 11.2 Vocabulário Permitido e Proibido

| Permitido | Proibido |
|---|---|
| "Encontrei", "percebi", "aprendi" | "Erro", "falha", "sistema" |
| "Estou testando", "estou analisando" | "Engine processando", "módulo X" |
| "Pausei", "publiquei", "agendei" | "Publicação foi enviada", "campanha foi criada" |
| "Preciso que você..." | "Token expirado", "API indisponível" |

(DECISIONS #041)

### 11.3 Regras do "Por quê?"

- O conteúdo do "Por quê?" é **pré-calculado no momento da decisão** — nunca gerado on-demand (DECISIONS #069)
- O evento de ativação de um padrão gera `why_activation`
- O evento de expiração de um padrão gera `why_expiration`
- Os dois conteúdos são distintos e nunca substituídos um pelo outro (DECISIONS #070)
- Máximo 5 frases, sem IS como número, sem terminologia técnica, sem afirmações de certeza absoluta (DECISIONS #064, #069)

### 11.4 Cold Start (Primeiras 48 Horas)

- Em até 48 horas de uso, a Entidade deve comunicar que já começou a aprender sobre o perfil
- Se o perfil ainda não tem dados próprios suficientes, usa conhecimento global do nicho como base explícita e sinalizada
- Comunicação de cold start usa template específico — diferente das comunicações de padrões validados
- Exemplo: *"Com base em perfis similares ao seu neste nicho, estou identificando os primeiros pontos de partida para testar."*
- O onboarding coleta nicho (categoria de produto) para habilitar esse match desde o cadastro

(DECISIONS #099)

---

## 12. Regras de Segurança com Impacto em Produto

### 12.1 E-mail Verification

- Nenhuma publicação é realizada antes do e-mail da conta ser verificado
- A Entidade comunica: *"Confirme seu e-mail para que eu possa começar a publicar por você."*
- Campanha pode ser criada e configurada antes da verificação — apenas publicação é bloqueada

### 12.2 Troca de Senha

- Troca de senha invalida todos os refresh tokens ativos em transação atômica
- O usuário é informado de que precisará fazer login novamente em todos os dispositivos

### 12.3 Exclusão de Conta

- Usuário deve confirmar via e-mail antes da exclusão ser executada
- A Entidade comunica claramente: *"Vou apagar todos os seus dados e aprendizados. Isso não pode ser desfeito."*
- Assinatura ativa é cancelada imediatamente no momento da confirmação

---

## 13. Regras de Separação ML Engine / Knowledge Engine

Estas regras não têm exceções. (DECISIONS #083, #085)

| Componente | Pode | Não pode |
|---|---|---|
| ML Engine | Ler dados de `stories.*`, `campaigns.*`, `knowledge.*` | Escrever em tabelas fora do schema `ml.*` |
| ML Engine | Escrever em `ml.*` (incluindo `ml.anti_pattern_proposals`) | Modificar qualquer estado operacional diretamente |
| Knowledge Engine | Ler e escrever em `knowledge.*` | Treinar modelos ou executar análises estatísticas |
| Knowledge Engine | Consumir `ml.anti_pattern_proposals` | Ignorar ou modificar propostas do ML sem registro |
| Modelos de IA | Gerar conteúdo e avaliações | Tomar qualquer decisão de produto |

A plataforma decide: o que publicar, quando publicar, qual campanha recebe recursos, o que é anti-padrão. Modelos de IA geram e avaliam conteúdo — não decidem. (DECISIONS #083)

---

## 14. Regras de Redes Sociais e Marketplaces

### 14.1 Rate Limits

- A plataforma nunca promete números absolutos de publicações — o volume é subordinado aos rate limits oficiais de cada rede (DECISIONS #019)
- Rate limits do X Basic: 1.500 tweets/mês — Scheduling Engine distribui respeitando esse limite
- Quando a rede está indisponível: retentativa com exponential backoff + jitter ±20%; máximo 3 tentativas; circuit breaker após N falhas consecutivas

### 14.2 Marketplaces Habilitados

| Marketplace | Estado | Feature flag |
|---|---|---|
| Shopee | ✅ Ativo | `shopee.enabled = true` |
| Amazon Associates | ⚠️ Desabilitado | `amazon.enabled = false` |
| MercadoLivre | ⚠️ Desabilitado | `mercadolivre.enabled = false` |

Amazon e MercadoLivre permanecem desabilitados até que exista solução robusta de coleta automatizada de conversões. A mudança de estado é feita via feature flag — sem deploy. (DECISIONS #080)

### 14.3 Links de Afiliado

- Nenhum mecanismo de rastreamento de link é implementado sem validação técnica prévia de compatibilidade com o sistema de atribuição do marketplace (DECISIONS #020)
- Links com parâmetros de rastreamento (`utm_campaign={campaign_id}`) são gerados pelo adapter correspondente — nunca construídos diretamente por outros serviços
- A validação de compatibilidade de rastreamento é obrigatória antes de habilitar qualquer marketplace

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | CPS: pesos placeholder IS(35%) + retorno(30%) + estado(20%) + tendência(15%) — calibração obrigatória |
| 2026-07-11 | Saturação: somente declarada após esgotar variações da Story Family ativa |
| 2026-07-11 | Downgrade de plano: campanhas pausadas e perfis desconectados, nunca deletados; usuário escolhe quais (DECISIONS #100) |
| 2026-07-11 | Cold start: comunicação explícita usando conhecimento global nas primeiras 48h (consolida DECISIONS #099) |
| 2026-07-11 | DNA check ESCALA < 0.35: rejeição definitiva da história |
| 2026-07-11 | DNA check TESTE < 0.50: warning + publicação com flag |
| 2026-07-11 | Prova Social (Arco 7): restrito a contexto genuíno — nunca fabricado ou exagerado (consolida DECISIONS #051) |
| 2026-07-11 | Modo Revisão: aprovações e rejeições manuais são sinais de aprendizado distintos para o KE (consolida DECISIONS #021) |
| 2026-07-11 | Story Family: número de derivações é placeholder calibrado pelo ML Engine (consolida DECISIONS #053) |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aprovado*
