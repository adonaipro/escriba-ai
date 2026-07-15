# 13 — Integrações

> *"A plataforma nunca fala diretamente com o mundo externo. Ela fala com seus adaptadores — e os adaptadores falam com o mundo."*

---

## Objetivo deste Documento

Definir como a [PLATAFORMA] se integra com redes sociais, marketplaces e provedores de IA através da Plugin Architecture estabelecida no Documento 04. Este documento especifica o comportamento de cada adaptador: autenticação, publicação, coleta de analytics, tratamento de erros e estratégias de resiliência.

---

## 1. Princípios das Integrações

**P1 — Nenhum serviço chama APIs externas diretamente**
Todo acesso a sistemas externos passa pelo Plugin Registry. Nenhum serviço interno instancia um cliente de API externo diretamente — recebe o provider via injeção pelo Registry. (DECISIONS #031)

**P2 — Operar sempre dentro dos limites oficiais**
Rate limits das APIs externas são limites, não alvos. A plataforma opera com margem de segurança (70% do limite como target operacional — valor provisório, DECISIONS #062) para absorver picos e retries sem nunca violar os termos de uso dos provedores. (DECISIONS #019)

**P3 — Falha de integração nunca vaza para o usuário como erro técnico**
O usuário não sabe o que é um OAuth token expirado ou um rate limit 429. Toda falha de integração é traduzida para linguagem de consequência antes de chegar ao frontend. (DECISIONS #042)

**P4 — Cada rede exige validação própria**
Padrões aprendidos em uma rede não são automaticamente transferidos para outra. As diferenças de audiência, formato e algoritmo de cada rede são reais — a plataforma trata cada rede como contexto independente de aprendizado. (DECISIONS #058)

---

## 2. Plugin Registry — Visão de Integração

O Plugin Registry (definido em Documento 04) gerencia todos os providers. Para integrações externas, seu papel específico é:

- **Registro:** mantém mapa de `profileId → provider instanciado por rede/marketplace`
- **Health check:** verifica status de cada provider a cada 60 segundos (provisório — DECISIONS #062)
- **Circuit breaker:** após N falhas consecutivas (N provisório), abre o circuit e para de chamar o provider por uma janela de tempo
- **Feature flags:** permite desabilitar um provider específico sem deploy (ex: Shopee com instabilidade → flag `shopee.disabled = true` → campanhas com Shopee ficam em fila)

```typescript
// Contrato já definido no Documento 04 — referência aqui para contexto
interface ISocialNetworkProvider {
  publishStory(content: string, profileId: string): Promise<PublishResult>;
  getAnalytics(postId: string, since: Date): Promise<AnalyticsData>;
  validateAccount(credentials: OAuthCredentials): Promise<boolean>;
  refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials>;
}

interface IMarketplaceProvider {
  resolveProduct(url: string): Promise<ProductInfo>;
  getConversions(affiliateId: string, since: Date): Promise<ConversionData[]>;
  validateAccount(affiliateId: string, credentials: unknown): Promise<boolean>;
}
```

---

## 3. Integrações com Redes Sociais

### 3.1 Threads (Meta)

**Status MVP:** ativo  
**API:** Threads API (Meta for Developers)  
**Auth:** OAuth 2.0 com permissões `threads_basic`, `threads_content_publish`, `threads_read_replies`

**Fluxo de publicação:**
```
1. Criar container de mídia (POST /me/threads com text, media_type=TEXT)
   → retorna threads_media_id

2. Publicar container (POST /me/threads_publish com threads_media_id)
   → retorna id do post publicado

3. Armazenar external_post_id em stories.publications
```

**Coleta de analytics:**
```
GET /{threads-media-id}/insights
  ?metric=views,likes,replies,reposts,quotes,followers_count
  &since={unix_timestamp}

Periodicidade: a cada 6 horas após publicação (provisório — DECISIONS #062)
Janela: 7 dias após publicação (após isso, analytics são considerados estáveis)
```

**Rate limits Threads (referência — sujeitos a mudança pela Meta):**
- Publicação: 250 posts por 24h por conta
- Insights: 200 requisições por hora
- Target operacional: 70% desses limites

**Tratamento de erros específicos:**

| Código de erro Threads | Ação da plataforma | Mensagem ao usuário |
|---|---|---|
| 190 (token expirado) | Tentar refresh; se falhar → marcar conta como `expired` | "Preciso que você reconecte sua conta do Threads." |
| 32 (rate limit) | Enfileirar para retry com backoff exponencial | (invisível — resolvido automaticamente) |
| 100 (conta suspensa) | Marcar conta como `error`; notificar usuário | "Há um problema com sua conta do Threads. Verifique diretamente no app." |
| 200 (permissão negada) | Marcar conta como `error` | "Não tenho permissão para publicar no Threads. Reconecte sua conta." |

---

### 3.2 X (Twitter)

**Status MVP:** ativo  
**API:** X API v2  
**Auth:** OAuth 2.0 com PKCE, scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`

**Fluxo de publicação:**
```
POST /2/tweets
Body: { "text": "..." }
→ retorna { data: { id, text } }
```

**Coleta de analytics:**
```
GET /2/tweets/{id}
  ?tweet.fields=public_metrics,organic_metrics

public_metrics:  impressions, retweet_count, reply_count, like_count
organic_metrics: impression_count, url_link_clicks, user_profile_clicks
                 (disponível apenas para posts do próprio usuário)

Periodicidade: a cada 6 horas (alinhado com Threads para simplificar o Scheduling Engine)
```

**Rate limits X (referência — plano Basic):**
- Publicação: 1.500 tweets por mês por app (limite crítico para volume alto)
- Leitura de métricas: 15 req por 15 min (user auth)
- Target operacional: 70% desses limites

**Consideração importante sobre limites do X:**
Os limites do plano Basic do X são significativamente mais restritivos que o Threads. Campanhas com alta frequência de publicação no X atingem o limite mensal mais rapidamente. O Scheduling Engine deve considerar esse limite ao calcular a frequência de publicações quando o usuário tem múltiplas campanhas no X. A distribuição de capacidade via CPS (DECISIONS #061) já resolve isso — campanhas de maior prioridade recebem as publicações disponíveis primeiro.

**Tratamento de erros específicos:**

| Código de erro X | Ação da plataforma | Mensagem ao usuário |
|---|---|---|
| 401 Unauthorized | Tentar refresh; se falhar → marcar `expired` | "Preciso que você reconecte sua conta do X." |
| 429 Too Many Requests | Retry com backoff; respeitar `x-rate-limit-reset` | (invisível) |
| 403 Forbidden (limite mensal) | Pausar campanhas no X até virada do mês | "Você atingiu o limite de publicações do X este mês. As campanhas serão retomadas no próximo ciclo." |
| 187 (tweet duplicado) | Sinalizar para Story Engine gerar nova versão | (invisível — retry automático) |

---

### 3.3 Redes Futuras (V2+)

O contrato `ISocialNetworkProvider` já está definido. Para adicionar TikTok ou Instagram:
1. Criar `TikTokAdapter` implementando `ISocialNetworkProvider`
2. Registrar no Plugin Registry
3. Zero mudança nos serviços internos

Cada nova rede exige ciclo de validação próprio antes de integração ao produto. (DECISIONS #058)

---

## 4. Integrações com Marketplaces

### 4.1 Shopee

**Status MVP:** ativo  
**Integração:** Shopee Affiliate Program API  
**Auth:** API Key + Secret (não OAuth — credenciais de programa de afiliados)

**Resolução de produto:**
```
GET /api/v2/product/get_item_base_info
  ?item_id={id_extraído_da_url}
  → product_name, price, category, commission_rate
```

**Coleta de conversões:**
```
GET /api/v2/reports/get_affiliate_report
  ?start_date={date}&end_date={date}
  → clicks, orders, commission_brl

Periodicidade: diária (D+1 — Shopee processa conversões com 1 dia de atraso)
```

**Rastreamento de links:**
O IMarketplaceProvider da Shopee gera links de afiliado com UTM params para atribuição. O link gerado inclui o `campaign_id` como parâmetro customizado, permitindo que a coleta de conversões correlacione comissão → campanha corretamente.

```
Link gerado: https://s.shopee.com.br/{affiliate_code}?utm_campaign={campaign_id}
```

Validação de compatibilidade de link de rastreamento é obrigatória antes de publicar. (DECISIONS #020)

---

### 4.2 Amazon Associates

**Status MVP:** arquitetura pronta, provider **desabilitado** (DECISIONS #080)  
**Integração planejada:** Product Advertising API 5.0 + AWS Signature v4  
**Bloqueador:** ausência de API programática para relatórios de comissão dos associados.

O `AmazonAdapter` é implementado com a estrutura técnica abaixo e registrado no Plugin Registry com feature flag `amazon.enabled = false`. Habilitação planejada para V1 após solução robusta de coleta de conversões.

**Resolução de produto (referência — inativo no MVP):**
```
POST /paapi5/getitems
Body: { ItemIds: [asin], Resources: ["ItemInfo.Title", "Offers.Listings.Price"] }
→ product_name, price, category
```

**Bloqueador de coleta de conversões:**
```
Método atual: Amazon SiteStripe Reports (sem API programática para associados)
Risco em aberto: verificar viabilidade de importação via e-mail automatizado, CSV exportável,
ou webhook customizado antes da ativação em V1.
```

### 4.3 MercadoLivre

**Status MVP:** slot reservado via `IMarketplaceProvider`, provider **desabilitado** (DECISIONS #080)
O `MercadoLivreAdapter` será implementado em V1. A interface garante zero mudança nos serviços internos quando for habilitado.

---

## 5. Integrações com Provedores de IA

### 5.1 Visão Geral da Intelligence Layer

Todos os provedores de IA são acessados exclusivamente via `IAIProvider`. O Story Engine nunca instancia um cliente de IA diretamente — recebe o provider via Plugin Registry. Isso permite:
- Trocar o modelo de geração sem alterar o Story Engine
- Ter modelos diferentes para geração e para avaliação de QS
- Acionar providers alternativos quando o primário está indisponível (fallback)

```typescript
interface IAIProvider {
  generateText(prompt: string, options: GenerationOptions): Promise<GenerationResult>;
  generateEmbedding(text: string): Promise<number[]>;
  evaluateQuality(story: string, criteria: QSCriteria): Promise<QSResult>;
}
```

### 5.2 OpenAI

**Status MVP:** provider primário de geração  
**Modelos:**
- Geração de histórias: `gpt-4o` (qualidade máxima, custo justificado pelo impacto)
- Avaliação de QS: `gpt-4o-mini` (avaliação separada e mais rápida — DECISIONS do doc 06)
- Embeddings: `text-embedding-3-small` (1536 dims — compatível com pgvector)

**Configuração por uso:**

| Uso | Modelo | Temperature | Max tokens |
|---|---|---|---|
| Geração TESTE | gpt-4o | 0.85 | 800 |
| Geração ESCALA | gpt-4o | 0.60 | 800 |
| Avaliação QS | gpt-4o-mini | 0.1 | 300 |
| Embedding | text-embedding-3-small | n/a | n/a |

**Rate limits OpenAI (Tier 1 — referência):**
- RPM (requests per minute): 500 para gpt-4o
- TPM (tokens per minute): 30.000 para gpt-4o
- Target operacional: 70% (provisório — DECISIONS #062)

**Tratamento de erros:**

| Código | Ação |
|---|---|
| 429 (rate limit) | Retry com backoff exponencial; se persistir → acionar fallback provider |
| 500/503 (OpenAI indisponível) | Circuit breaker abre → fallback para Anthropic |
| Timeout (> 30s) | Retry uma vez; se falhar → fallback |

---

### 5.3 Anthropic (Fallback)

**Status MVP:** provider de fallback para geração  
**Modelo:** `claude-sonnet-5` (ou equivalente disponível ao lançamento)  
**Ativação:** automática quando OpenAI está indisponível (circuit breaker aberto) ou rate-limited acima do limiar de retry

**Importante:** o usuário nunca é informado de qual modelo gerou sua história. A Entidade fez o trabalho — qual ferramenta ela usou é irrelevante para o usuário. (DECISIONS #039)

---

### 5.4 Groq (V2+ — Opção de Performance)

**Status:** slot reservado. Groq oferece inferência significativamente mais rápida em modelos open-source (Llama, Mixtral). Em V2, pode ser avaliado como provider de avaliação de QS (latência crítica, custo menor) liberando OpenAI/Anthropic para geração.

---

## 6. Estratégia de Resiliência

### 6.1 Circuit Breaker

Implementado no Plugin Registry para cada provider. Estados:

```
CLOSED (operação normal)
  → após N falhas consecutivas em janela T →
OPEN (sem chamadas ao provider)
  → após janela de recuperação W →
HALF-OPEN (uma chamada de teste)
  → se sucesso → CLOSED
  → se falha  → OPEN (reset da janela W)
```

Valores de N, T, W são provisórios — DECISIONS #062. Cada provider tem seus próprios parâmetros (APIs mais instáveis têm limiares mais tolerantes).

### 6.2 Retry com Backoff Exponencial

Para erros transitórios (rate limit, timeout, 5xx):

```
Tentativa 1: imediata
Tentativa 2: após 1s
Tentativa 3: após 4s
Tentativa 4: após 16s
Tentativa 5: após 64s (máximo)
→ se ainda falhar: marcar como falha permanente e notificar via Event Bus
```

Jitter aleatório (±20%) adicionado a cada delay para evitar thundering herd quando múltiplas campanhas falham simultaneamente.

### 6.3 Filas de Retry (BullMQ)

Publicações com falha transitória entram em fila de retry no BullMQ com os parâmetros acima. O usuário não vê nada — a publicação é tratada como "em processamento". Somente após esgotar todas as tentativas a plataforma notifica o usuário (nível 3 da hierarquia de comunicação — DECISIONS #042).

### 6.4 Fallback de IA

```
Geração de história:
  OpenAI gpt-4o
    ↓ (circuit open ou 3 retries falharam)
  Anthropic claude-sonnet-5
    ↓ (circuit open ou 3 retries falharam)
  Enfileirar para retry em 30 minutos
  (Story Engine não tenta um terceiro provider no MVP)
```

---

## 7. Rastreamento de Links de Afiliado

Todo link publicado pela plataforma passa pelo IMarketplaceProvider do marketplace correspondente para geração do link de afiliado rastreado.

**Estrutura de rastreamento:**

```
URL original:    https://shopee.com.br/produto/123
URL rastreada:   https://s.shopee.com.br/{affiliate_code}?smtt=0.0.9&utm_campaign={campaign_id}
```

**Validação obrigatória antes de publicar (DECISIONS #020):**
1. URL resolvida pelo provider → confirma que produto existe e está ativo
2. Link de afiliado gerado → confirma que credenciais do programa são válidas
3. Se qualquer etapa falhar → publicação bloqueada; usuário notificado com linguagem de consequência

**Atribuição de conversão:**
O `campaign_id` nos parâmetros permite que a coleta de conversões do marketplace correlacione:
`comissão → campaign_id → campanha → Knowledge Engine atualiza IS e analytics`

---

## 8. Webhooks de Entrada — Processamento

Webhooks chegam no API Gateway via `POST /webhooks/{rede}`. O processamento segue o padrão:

```
1. Validar HMAC-SHA256 com secret da conta
   → HMAC inválido: 401, log de alerta, descarte
   → HMAC válido: 200 imediato (sem aguardar processamento)

2. Enfileirar payload bruto no BullMQ (fila: webhooks.{rede})

3. Worker do provider correspondente processa:
   a. Normalizar para formato interno
   b. Correlacionar com publication_id via external_post_id
   c. Emitir evento analytics.collected no Event Bus

4. Knowledge Engine consome analytics.collected:
   a. Atualizar IS da combinação
   b. Atualizar CPS da campanha
   c. Verificar elegibilidade de escala
   d. Verificar saturação
```

**Por que enfileirar antes de processar:**
O webhook espera `200` em < 5 segundos ou tenta reenviar. Processamento pesado (atualização de IS, verificação de escala) pode levar mais tempo. A fila garante que o webhook sempre recebe resposta rápida, independente do tempo de processamento downstream.

---

## 9. Monitoramento de Integrações

| Métrica | Alerta | Observação |
|---|---|---|
| Taxa de erro por provider > 5% | Warning | Verificar status da API externa |
| Taxa de erro por provider > 20% | Critical | Circuit breaker deve ter aberto |
| Latência de publicação P95 > 5s | Warning | Pode indicar throttling |
| Webhook sem receber > 24h (por conta ativa) | Warning | Pode indicar perda de conexão |
| Conversões = 0 por 7 dias (campanha ativa) | Warning | Verificar rastreamento de links |
| Refresh de token falhou | Critical | Conta vai para status `expired` |

---

## 10. Casos Extremos

### CE-INT-001: Rede social derruba a API sem aviso
**Comportamento:** Circuit breaker abre após N falhas. Publicações vão para fila de retry. Usuário não é notificado até que a janela de retry se esgote. Se o esgotamento ocorrer, notificação de consequência: *"O Threads está com instabilidade. Suas publicações estão na fila e serão retomadas em breve."*

### CE-INT-002: Token de rede social expira enquanto há publicação em andamento
**Comportamento:** `refreshToken()` é chamado automaticamente. Se refresh bem-sucedido: publicação continua. Se refresh falhar: publicação vai para fila; conta marcada como `expired`; notificação ao usuário para reconexão.

### CE-INT-003: Produto saiu do ar ou foi descontinuado
**Comportamento:** `resolveProduct()` retorna erro no momento da geração da história. Campanha é pausada automaticamente. Notificação ao usuário: *"O produto desta campanha não está mais disponível. Verifique o link ou encerre a campanha."*

### CE-INT-004: Rate limit de publicações do X atingido no meio do mês
**Comportamento:** Provider X retorna 403 com código de limite mensal. Plugin Registry ativa feature flag `x.monthly_limit_reached = true` para o perfil. Scheduling Engine para de agendar para o X. CPS redistribui capacidade para campanhas em outras redes. Notificação ao usuário com data de retomada.

### CE-INT-005: OpenAI e Anthropic indisponíveis simultaneamente
**Comportamento:** Todos os providers de IA com circuit breaker aberto. Story Engine para de gerar novas histórias. Publicações existentes continuam (já geradas). Nenhuma notificação ao usuário — silêncio enquanto a situação se resolve. Monitoramento interno com alerta crítico.

### CE-INT-006: Risco técnico Amazon Associates (sem API de relatórios)
**Situação:** Amazon não tem API programática para relatórios de comissão de associados.  
**Abordagem MVP:** verificar se Amazon oferece relatórios via e-mail automatizado ou CSV exportável; implementar importação manual assistida ou via parsing de e-mail autorizado.  
**Decisão pendente:** estratégia exata de coleta de conversões para Amazon deve ser confirmada antes do MVP. Registrado como risco em aberto.

---

## 11. Possíveis Melhorias Futuras

1. **TikTok:** alta demanda em nichos de produto com audiência jovem. O contrato `ISocialNetworkProvider` já suporta — apenas implementar `TikTokAdapter`.

2. **Instagram:** requer conta Business conectada ao Meta e aprovação da API. Fluxo mais complexo que Threads mas potencialmente valioso para nichos visuais (quando IContentProvider for implementado em V1+).

3. **Shopee Live / TikTok Shop:** marketplaces com venda via live commerce — modelo diferente do afiliado tradicional. V3+.

4. **Webhook de conversão em tempo real (Shopee):** atualmente coleta D+1. Com webhook de conversão imediato, o Knowledge Engine poderia correlacionar publicação e conversão em minutos, acelerando o aprendizado.

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | Todo acesso externo via Plugin Registry — nenhum serviço instancia cliente direto |
| 2026-07-11 | Target operacional de rate limits: 70% do limite oficial (provisório — DECISIONS #062) |
| 2026-07-11 | Circuit breaker implementado por provider no Plugin Registry |
| 2026-07-11 | Retry com backoff exponencial + jitter para erros transitórios |
| 2026-07-11 | Fallback de IA: OpenAI → Anthropic (dois providers no MVP) |
| 2026-07-11 | Webhooks enfileirados antes de processar — 200 imediato após HMAC válido |
| 2026-07-11 | Rastreamento de conversão via campaign_id em parâmetros de URL |
| 2026-07-11 | MVP com Shopee apenas; Amazon e MercadoLivre: arquitetura pronta, providers desabilitados (DECISIONS #080) |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aprovado com decisão estratégica de marketplaces*
