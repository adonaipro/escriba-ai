# 12 — APIs

> *"A API é o contrato entre o que o sistema sabe e o que o mundo pode perguntar."*

---

## Objetivo deste Documento

Definir todos os contratos de API da [PLATAFORMA]: endpoints públicos (frontend ↔ backend), endpoints internos (serviço ↔ serviço) e webhooks de entrada (redes sociais e marketplaces → plataforma). Este documento é a referência para implementação de qualquer consumidor ou produtor de API — frontend, serviços internos e integrações externas.

---

## 1. Princípios de Design

**P1 — CQRS visível na API**
Endpoints de leitura são síncronos e retornam dados imediatamente. Endpoints de escrita que disparam processamento assíncrono retornam `202 Accepted` com um `operation_id` — o cliente não fica esperando o processamento completar. (DECISIONS #025)

**P2 — Erros em linguagem do usuário**
Erros expostos ao frontend nunca contêm mensagens técnicas. Cada código de erro mapeado para uma mensagem humanizada compatível com a voz da Entidade. Detalhes técnicos ficam nos logs — nunca na resposta. (DECISIONS #042)

**P3 — Complexidade arquitetural invisível**
A API não expõe IS como número, CPS como número, nomes de componentes internos, ou estados técnicos de providers. O que o frontend recebe é o que o usuário precisa ver. (DECISIONS #039)

**P4 — Paginação por cursor, não por offset**
Listas paginadas usam cursor-based pagination — `next_cursor` e `prev_cursor`. Offset pagination é O(n) e não tolera inserções durante a paginação. Cursor pagination é O(log n) e consistente.

**P5 — Versionamento por header**
Versão da API via header `API-Version: 1`. A URL não muda com versões — `/api/campaigns` sempre aponta para a versão especificada no header. Versão padrão se o header for omitido: `1`.

---

## 2. Autenticação

### 2.1 Mecanismo

JWT (JSON Web Token) com dois tokens:
- **Access token:** TTL 15 minutos. Enviado no header `Authorization: Bearer <token>` em toda requisição autenticada.
- **Refresh token:** TTL 30 dias. Armazenado em cookie `HttpOnly; Secure; SameSite=Strict`. Nunca acessível via JavaScript.

### 2.2 Fluxo de Renovação

```
Cliente → POST /api/auth/refresh (cookie com refresh token)
        ← 200 { access_token, expires_in }
        (novo access token; refresh token rotacionado se > 7 dias)
```

### 2.3 Endpoint de Autenticação

```
POST /api/auth/login
Body: { email, password }
Response 200: { access_token, expires_in, user: { id, email } }
Response 401: { error: "credentials_invalid" }

POST /api/auth/logout
Response 200: {}
(invalida refresh token no banco)

POST /api/auth/refresh
Response 200: { access_token, expires_in }
Response 401: { error: "session_expired" }

POST /api/auth/register
Body: { email, password }
Response 201: { access_token, expires_in, user: { id, email } }
Response 409: { error: "email_already_registered" }
```

---

## 3. Convenções de Resposta

### 3.1 Formato padrão de sucesso

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-07-11T19:00:00Z"
  }
}
```

### 3.2 Formato padrão de erro

```json
{
  "error": {
    "code": "campaign_not_found",
    "message": "Não encontrei essa campanha.",
    "request_id": "req_abc123"
  }
}
```

Regra: `message` é sempre em português, em primeira pessoa da Entidade quando contextual, e nunca contém informação técnica.

### 3.3 Idempotency-Key

Todo endpoint `POST` que cria recursos aceita o header opcional `Idempotency-Key: <uuid-v4>`. Se uma segunda requisição chegar com o mesmo `Idempotency-Key`, a API retorna a resposta original em cache sem reprocessar. TTL do cache de idempotência: 24 horas.

```
POST /api/campaigns
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
→ 202 { campaign_id, operation_id }

(retry com mesmo header)
POST /api/campaigns
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
→ 202 { campaign_id, operation_id }  ← mesma resposta, sem criar duplicata
```

Sem o header, a operação é processada normalmente. O header é recomendado para qualquer requisição originada de um botão de ação no frontend.

### 3.4 Formato de operação assíncrona (202)

```json
{
  "operation_id": "op_xyz789",
  "status": "processing",
  "estimated_seconds": 30
}
```

O `operation_id` pode ser consultado via `GET /api/operations/:id` para verificar o estado atual sem polling baseado em tempo.

### 3.5 Paginação por cursor

```json
{
  "data": [ ... ],
  "pagination": {
    "next_cursor": "eyJpZCI6IjEyMyJ9",
    "prev_cursor": null,
    "has_more": true,
    "total_count": 47
  }
}
```

---

## 4. Endpoints: Operações Assíncronas

### `GET /api/operations/:id`

Consulta o estado de uma operação assíncrona. Usado pelo frontend após receber um `202` para saber quando o processamento foi concluído — sem polling cego baseado em tempo.

**Response 200:**
```json
{
  "data": {
    "operation_id": "op_xyz789",
    "status": "completed",
    "result": {
      "campaign_id": "uuid"
    },
    "created_at": "2026-07-11T19:00:00Z",
    "completed_at": "2026-07-11T19:00:08Z"
  }
}
```

**Estados possíveis de `status`:** `processing` | `completed` | `failed`

**Em caso de falha:**
```json
{
  "data": {
    "operation_id": "op_xyz789",
    "status": "failed",
    "error": {
      "code": "product_url_invalid",
      "message": "Não consegui identificar esse produto. Verifique o link e tente novamente."
    }
  }
}
```

**Fluxo recomendado de uso:**
```
1. POST /api/campaigns → 202 { operation_id }
2. Frontend aguarda 1s (UX mínima)
3. GET /api/operations/:id
   → status: "processing" → aguarda 2s → repete passo 3
   → status: "completed"  → invalida cache e re-faz GET /api/campaigns
   → status: "failed"     → exibe erro ao usuário
```

TTL das operações no banco: 7 dias. Após esse prazo, retorna `404`.

---

## 5. Endpoints: Dashboard

### `GET /api/dashboard`

Retorna os dados da tela Home. Query síncrona — dados em cache Redis (TTL 5 min).

**Query params:**
- `period`: `week` | `month` | `quarter` | `all` (padrão: automático por antiguidade da conta — DECISIONS #075)

**Response 200:**
```json
{
  "data": {
    "period": {
      "label": "este mês",
      "start": "2026-07-01T00:00:00Z",
      "end": "2026-07-31T23:59:59Z"
    },
    "business_summary": {
      "revenue_brl": 3240.00,
      "revenue_change_pct": 23.0,
      "revenue_change_period": "junho",
      "clicks": 342,
      "conversions": 18,
      "ctr": 0.0530
    },
    "active_campaigns": [
      {
        "id": "uuid",
        "name": "Produto A",
        "status_label": "Em escala",
        "status_key": "scaling",
        "network": "threads",
        "marketplace": "shopee",
        "revenue_brl": 1240.00,
        "revenue_change_pct": 18.0,
        "ctr": 0.0780,
        "conversions": 23,
        "priority_rank": 1
      }
    ],
    "entity_feed": [
      {
        "id": "uuid",
        "message": "Percebi que histórias de transformação estão convertendo melhor esta semana.",
        "why_explanation": "...",
        "has_action": false,
        "created_at": "2026-07-11T18:00:00Z"
      }
    ]
  }
}
```

**Nota:** `entity_feed` é um array vazio `[]` quando não há nada relevante — o frontend simplesmente não renderiza o bloco. (DECISIONS #066)

**Nota:** `priority_rank` é um número inteiro de ordenação — nunca o CPS como número decimal. (DECISIONS #067)

---

## 6. Endpoints: Campanhas

### `GET /api/campaigns`

Lista campanhas do perfil ativo. Ordenadas por prioridade (CPS desc) por padrão.

**Query params:**
- `status`: `testing` | `scaling` | `paused` | `all` (padrão: `all` exceto `ended`)
- `sort`: `priority` | `recent_revenue` | `created_at` (padrão: `priority`)
- `cursor`: cursor de paginação (padrão: início)
- `limit`: 1–50 (padrão: 20)

**Response 200:**
```json
{
  "data": {
    "campaigns": [
      {
        "id": "uuid",
        "name": "Produto A",
        "status_label": "Em escala",
        "status_key": "scaling",
        "network": "threads",
        "marketplace": "shopee",
        "revenue_brl": 1240.00,
        "revenue_change_pct": 18.0,
        "ctr": 0.0780,
        "conversions": 23,
        "priority_rank": 1,
        "entity_message": null
      }
    ],
    "capacity_warning": {
      "show": true,
      "publications_used": 168,
      "publications_limit": 200,
      "pause_date": "2026-07-28"
    }
  },
  "pagination": { ... }
}
```

**Nota:** `capacity_warning.show` é `true` apenas quando uso > 80%. Frontend exibe o banner contextual quando `show === true`. (DECISIONS #071)

---

### `POST /api/campaigns`

Cria nova campanha. Dispara ciclo de TESTE assíncrono.

**Body:**
```json
{
  "name": "Produto A",
  "product_url": "https://shopee.com/produto/...",
  "network": "threads"
}
```

**Response 202:**
```json
{
  "campaign_id": "uuid",
  "operation_id": "op_xyz789",
  "status": "processing"
}
```

O `product_url` é resolvido pelo IMarketplaceProvider para extrair `product_name` e `marketplace`. O cliente não precisa informar o marketplace explicitamente.

---

### `GET /api/campaigns/:id`

Detalhe de uma campanha. Retorna aprendizados desta campanha ordenados por `impact_score DESC`. (DECISIONS #072)

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Produto A",
    "status_label": "Em escala",
    "status_key": "scaling",
    "duration_label": "há 28 dias",
    "network": "threads",
    "marketplace": "shopee",
    "metrics": {
      "revenue_brl": 1240.00,
      "revenue_change_pct": 18.0,
      "ctr": 0.0780,
      "conversions": 23,
      "clicks": 847
    },
    "learnings": [
      {
        "id": "uuid",
        "title": "Histórias de transformação convertem melhor",
        "state": "active",
        "state_label": "Ativo há 28 dias",
        "why_explanation": "Testei 8 abordagens...",
        "impact_score": 87.4
      }
    ],
    "publications_summary": {
      "total_count": 34,
      "next_scheduled_at": "2026-07-11T20:00:00Z"
    },
    "entity_prompt": null,
    "scale_opportunity": null
  }
}
```

Quando há oportunidade de escala, `scale_opportunity` é preenchido:
```json
"scale_opportunity": {
  "message": "Encontrei um padrão que está funcionando.",
  "evidence_summary": "Testei 8 histórias diferentes...",
  "ctr_avg": 0.0840,
  "conversions": 12,
  "action_confirm": "scale",
  "action_dismiss": "keep_testing"
}
```

---

### `PATCH /api/campaigns/:id`

Atualiza estado de uma campanha. Usado para pausar, retomar, ou confirmar/rejeitar escala.

**Body:**
```json
{ "action": "pause" }
```

**Ações válidas:** `pause` | `resume` | `confirm_scale` | `dismiss_scale` | `new_test_cycle`

**Response 202:**
```json
{ "operation_id": "op_xyz789", "status": "processing" }
```

---

### `GET /api/campaigns/:id/publications`

Histórico de publicações de uma campanha. Paginado por cursor.

**Query params:**
- `cursor`, `limit` (padrão: 20)

**Response 200:**
```json
{
  "data": {
    "publications": [
      {
        "id": "uuid",
        "published_at": "2026-07-24T19:30:00Z",
        "content_preview": "Há meses eu buscava...",
        "clicks": 47,
        "ctr": 0.0920
      }
    ]
  },
  "pagination": { ... }
}
```

O que não aparece: QS, IS, arco narrativo, modelo de IA, detalhes técnicos. (DECISIONS #039)

---

## 7. Endpoints: Aprendizados

### `GET /api/learnings`

Retorna a Learning Timeline do perfil. Ordenada por `impact_score DESC` (ativos), depois confirmando, depois expirados. (DECISIONS #045, #068)

**Query params:**
- `state`: `active` | `confirming` | `expired` | `all` (padrão: `all`)
- `cursor`, `limit` (padrão: 30)

**Response 200:**
```json
{
  "data": {
    "learnings": [
      {
        "id": "uuid",
        "title": "Histórias de transformação convertem 3× melhor no seu perfil.",
        "state": "active",
        "state_label": "Descoberto há 45 dias · confirmado em 12 campanhas",
        "why_explanation": "Testei 8 abordagens...",
        "impact_score": 94.2
      },
      {
        "id": "uuid",
        "title": "Histórias longas convertiam bem em março.",
        "state": "expired",
        "state_label": "Descoberto em 10/03 · parece não funcionar mais desde maio",
        "why_explanation": "Funcionava bem até maio. A partir de então...",
        "impact_score": 71.0
      }
    ],
    "is_empty": false
  },
  "pagination": { ... }
}
```

**Nota:** `why_explanation` para entradas expiradas vem do campo `why_expiration` da `learning_timeline` — nunca do campo `why_activation`. (DECISIONS #070)

**Nota:** quando `is_empty: true`, o frontend exibe o empty state com frase da Entidade. (DECISIONS #074)

---

## 8. Endpoints: Contas Conectadas

### `GET /api/accounts/social`

```json
{
  "data": {
    "accounts": [
      {
        "network": "threads",
        "username": "@usuario",
        "status": "active",
        "status_label": "Conectado"
      },
      {
        "network": "x",
        "username": "@usuario",
        "status": "expired",
        "status_label": "Conexão perdida"
      }
    ]
  }
}
```

O frontend exibe apenas `status_label` — nunca o `status` técnico diretamente.

### `DELETE /api/accounts/social/:network`

Desconecta a conta. Response `200 {}`.

### `POST /api/accounts/social/:network/reconnect`

Inicia fluxo OAuth para reconexão. Response `200 { auth_url }`.

### `GET /api/accounts/marketplace`
### `DELETE /api/accounts/marketplace/:marketplace`

Padrão idêntico ao social.

---

## 9. Endpoints: Plano e Uso

### `GET /api/plan`

```json
{
  "data": {
    "plan_name": "Growth",
    "publications_used": 143,
    "publications_limit": 200,
    "publications_pct": 71.5,
    "accounts_connected": 3,
    "accounts_limit": 5,
    "current_period_end": "2026-07-31T23:59:59Z"
  }
}
```

---

## 10. Endpoints Internos (Serviço ↔ Serviço)

Estes endpoints não são expostos ao frontend. Trafegam na rede interna do cluster (VPC). Autenticação via shared secret header `X-Internal-Token`.

### Knowledge Engine → API Gateway

```
POST /internal/entity-feed
Body: { profile_id, message, why_explanation, has_action, action_type? }
→ Armazena no banco e invalida cache do Dashboard

POST /internal/campaign-state
Body: { campaign_id, new_status, entity_message? }
→ Atualiza status da campanha e invalida cache

POST /internal/learning-entry
Body: { profile_id, entry_type, title, evidence, why_activation, impact_score }
→ Insere na learning_timeline e invalida cache de Aprendizados
```

### Story Engine → API Gateway

```
POST /internal/story-generated
Body: { campaign_id, story_id, status, quality_score }
→ Atualiza status da história

POST /internal/story-failed
Body: { campaign_id, decision_package_id, failure_reason }
→ Registra falha de geração
```

### Scheduling Engine → API Gateway

```
POST /internal/publication-result
Body: { publication_id, status, external_post_id?, failure_reason? }
→ Atualiza status da publicação
```

---

## 11. Webhooks de Entrada

Webhooks recebem callbacks assíncronos de redes sociais e marketplaces. Cada rede tem seu próprio endpoint. Autenticação via HMAC-SHA256 com secret por conta (validação obrigatória antes de processar).

### `POST /webhooks/threads`
### `POST /webhooks/x`

Recebem eventos de analytics das publicações (impressões, cliques, engajamento). O ISocialNetworkProvider do Plugin Registry processa e normaliza o payload antes de enfileirar o evento `analytics.collected`.

### `POST /webhooks/shopee`
### `POST /webhooks/amazon`
### `POST /webhooks/mercadolivre`

Recebem eventos de conversão (vendas, comissões confirmadas). O IMarketplaceProvider normaliza para o evento `conversion.registered`.

**Resposta obrigatória de todos os webhooks:** `200 {}` imediatamente após validação HMAC. O processamento é assíncrono — nunca fazer o webhook wait por processamento pesado.

---

## 12. Rate Limiting

| Endpoint | Limite | Janela |
|---|---|---|
| `/api/auth/login` | 10 req | por IP por minuto |
| `/api/auth/register` | 5 req | por IP por hora |
| Demais endpoints autenticados | 120 req | por usuário por minuto |
| `/internal/*` | 1000 req | por serviço por minuto |
| `/webhooks/*` | sem limite explícito | (controle por HMAC) |

Rate limit excedido retorna `429 Too Many Requests` com header `Retry-After` em segundos.

---

## 13. Mapeamento de Erros

| Código interno | HTTP status | `error.code` | `error.message` |
|---|---|---|---|
| Credenciais inválidas | 401 | `credentials_invalid` | "E-mail ou senha incorretos." |
| Sessão expirada | 401 | `session_expired` | "Sua sessão expirou. Entre novamente." |
| Não autorizado | 403 | `forbidden` | "Você não tem acesso a este recurso." |
| Campanha não encontrada | 404 | `campaign_not_found` | "Não encontrei essa campanha." |
| Limite de campanhas atingido | 422 | `campaign_limit_reached` | "Você atingiu o limite de campanhas do seu plano." |
| Rede não conectada | 422 | `network_not_connected` | "Conecte sua conta do [rede] antes de criar uma campanha." |
| Produto não reconhecido | 422 | `product_url_invalid` | "Não consegui identificar esse produto. Verifique o link e tente novamente." |
| Erro interno | 500 | `internal_error` | "Algo deu errado. Estou verificando." |

Detalhes técnicos de erros 500 vão para logs (com `request_id`) — nunca para o cliente.

---

## 14. Documentação OpenAPI

A especificação OpenAPI 3.1 completa é gerada automaticamente a partir das definições de schema TypeScript (`zod` → `openapi`). O arquivo `openapi.yaml` é gerado no build e versionado no repositório. Disponível em `/api/docs` no ambiente de desenvolvimento.

---

## 15. Casos Extremos

### CE-API-001: Frontend solicita Dashboard durante processamento de nova publicação
**Comportamento:** Retorna dados em cache (TTL 5 min). O processamento assíncrono não bloqueia a leitura. O dashboard atualiza na próxima expiração de cache ou no próximo `GET /api/dashboard` após a invalidação por evento.

### CE-API-002: Webhook recebido com HMAC inválido
**Comportamento:** `401` imediato com log de alerta. Nunca retorna `200` para webhooks com HMAC inválido — a rede poderia interpretar como entregue e parar de reenviar.

### CE-API-003: Dois clientes (mobile + web) do mesmo usuário em sessões paralelas
**Comportamento:** Ambos usam o mesmo `profile_id`. Dados são consistentes via cache compartilhado no Redis. Operações de escrita são idempotentes por `operation_id` — duplo envio não cria duplicatas.

### CE-API-004: `GET /api/campaigns/:id` de campanha que pertence a outro usuário
**Comportamento:** `403 { error: "forbidden" }`. Nunca `404` — `404` revelaria que o ID existe para outro usuário.

### CE-API-005: Webhook de analytics para publicação que não existe no banco
**Comportamento:** Log de warning + `200 {}`. Não falha — a rede não deve ser penalizada por dado inconsistente do nosso lado. O dado é descartado silenciosamente.

---

## 16. Possíveis Melhorias Futuras

1. **GraphQL para consultas compostas:** quando o frontend precisar de composições complexas (ex: Dashboard + Campanhas + Feed em uma única requisição), uma camada GraphQL elimina round-trips. Para MVP, REST com cache Redis resolve.

2. **Server-Sent Events (SSE) para atualizações em tempo real:** quando a Entidade registra um insight de alta prioridade, o frontend recebe a notificação sem necessidade de polling. Elimina a latência do "próximo refresh de cache".

3. **API de exportação de dados:** o usuário pode solicitar exportação de todo seu histórico (LGPD Art. 18 — portabilidade). Endpoint assíncrono que gera CSV/JSON e notifica via e-mail quando pronto.

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | CQRS visível na API: leitura síncrona (200), escrita assíncrona (202 + operation_id) |
| 2026-07-11 | Erros sempre em português, linguagem da Entidade, sem informação técnica |
| 2026-07-11 | Paginação por cursor em todas as listas |
| 2026-07-11 | Versionamento por header `API-Version`, não por URL |
| 2026-07-11 | `capacity_warning` retornado em `GET /api/campaigns` — frontend controla exibição do banner |
| 2026-07-11 | `why_explanation` de padrão expirado vem de `why_expiration`, nunca de `why_activation` |
| 2026-07-11 | `entity_feed: []` quando vazio — frontend simplesmente não renderiza o bloco |
| 2026-07-11 | Webhooks respondem `200` imediatamente após HMAC válido; processamento sempre assíncrono |
| 2026-07-11 | `403` em vez de `404` para recursos de outros usuários — não revelar existência |
| 2026-07-11 | Endpoints internos em `/internal/*`, autenticados por shared secret, não expostos externamente |
| 2026-07-11 | `GET /api/operations/:id` para consulta explícita de operações assíncronas — sem polling cego |
| 2026-07-11 | Idempotency-Key obrigatório em todos os `POST` que criam recursos |
| 2026-07-11 | `request_id` presente em toda resposta de sucesso e de erro — rastreabilidade universal |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aprovado com endpoint de operações e Idempotency-Key*
