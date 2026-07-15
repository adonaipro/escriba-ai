# 11 — Banco de Dados

> *"O banco de dados não é onde os dados são armazenados. É onde o conhecimento é construído."*

---

## Objetivo deste Documento

Definir o schema completo de banco de dados da [PLATAFORMA]: tabelas, tipos, índices, relacionamentos, schemas de isolamento e estratégias de acesso. Este documento é a fonte de verdade para implementação do banco — qualquer divergência entre código e este documento deve ser resolvida em favor deste documento.

---

## 1. Princípios de Design do Banco

**P1 — Separação por domínio, não por serviço**
O banco é organizado em schemas PostgreSQL por domínio de negócio, não por microserviço que acessa os dados. Isso permite que o Knowledge Engine e o Test Engine compartilhem a mesma tabela de `intelligence_scores` sem duplicação — o dado pertence ao domínio, não ao serviço.

**P2 — Append-only onde o histórico importa**
A Learning Timeline, o histórico de publicações e os eventos de campanhas são append-only — nunca atualizados, apenas marcados como expirados ou supersedidos. O passado é imutável; o estado atual é derivado do passado. (DECISIONS #006)

**P3 — Conhecimento Global e Privado em schemas separados**
Padrões genéricos agregados ficam em `knowledge.global_patterns`. Dados de perfil (DNA, IS por combinação, timeline) ficam em `knowledge.*` com controle de acesso por `profile_id`. As duas famílias nunca se cruzam em queries de produção. (DECISIONS #055)

**P4 — Todos os parâmetros numéricos são provisórios**
Valores de threshold, TTLs, tamanhos de partição e limites de retenção definidos aqui são placeholders de implementação — calibração pelo ML Engine com dados reais é obrigatória. (DECISIONS #062)

**P5 — Vetores vivem no mesmo PostgreSQL**
pgvector é a extensão para similaridade vetorial. Nenhum banco de dados vetorial adicional. Os embeddings de 1536 dimensões (compatível com OpenAI text-embedding-3-small) vivem em colunas `vector(1536)` nas tabelas de domínio relevantes. (DECISIONS #029)

---

## 2. Visão Geral dos Schemas

```
postgresql://
│
├── public              (tabelas de sistema, extensões)
├── auth                (usuários, sessões, permissões)
├── profiles            (perfis de afiliado, contas conectadas)
├── campaigns           (campanhas, configurações, ciclos de teste)
├── stories             (histórias geradas, publicações, analytics)
└── knowledge           (IS, DNA, Learning Timeline, anti-padrões, CPS)
```

Cada schema tem permissões de acesso explícitas. Nenhum serviço tem acesso a `knowledge.*` exceto o Knowledge Engine e o ML Engine. O Story Engine acessa `campaigns.*` e `stories.*` mas não `knowledge.*` diretamente — recebe o Decision Package via evento.

---

## 3. Schema: `auth`

### 3.1 `auth.users`

```sql
CREATE TABLE auth.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_users_email ON auth.users(email);
```

### 3.2 `auth.sessions`

```sql
CREATE TABLE auth.sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address    INET,
  user_agent    TEXT
);

CREATE INDEX idx_sessions_token_hash ON auth.sessions(token_hash);
CREATE INDEX idx_sessions_user_id    ON auth.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);
```

### 3.3 `auth.plans`

```sql
CREATE TABLE auth.plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(50) NOT NULL UNIQUE,
  max_publications_month INTEGER NOT NULL,
  max_campaigns         INTEGER NOT NULL,
  max_connected_accounts INTEGER NOT NULL,
  price_brl             NUMERIC(10,2) NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true
);

-- Seed inicial (valores provisórios — DECISIONS #062)
INSERT INTO auth.plans VALUES
  (gen_random_uuid(), 'Starter', 50,  3,  2, 97.00,  true),
  (gen_random_uuid(), 'Growth',  200, 10, 5, 197.00, true),
  (gen_random_uuid(), 'Scale',   600, 30, 10, 397.00, true);
```

### 3.4 `auth.subscriptions`

```sql
CREATE TABLE auth.subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  plan_id         UUID NOT NULL REFERENCES auth.plans(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'trial',
  trial_ends_at   TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_subscription_status
    CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'))
);

CREATE INDEX idx_subscriptions_user_id ON auth.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status  ON auth.subscriptions(status);
```

---

## 4. Schema: `profiles`

### 4.1 `profiles.affiliate_profiles`

O perfil de afiliado é o objeto central da plataforma. Um usuário pode ter múltiplos perfis (ex: perfil para nicho de saúde + perfil para nicho de tecnologia — V2+). No MVP, um usuário = um perfil.

```sql
CREATE TABLE profiles.affiliate_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  niche       VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_profiles_user_id ON profiles.affiliate_profiles(user_id);
```

### 4.2 `profiles.social_accounts`

```sql
CREATE TABLE profiles.social_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),
  network        VARCHAR(50) NOT NULL,
  external_id    VARCHAR(255) NOT NULL,
  username       VARCHAR(255),
  access_token   TEXT,           -- criptografado em repouso (AES-256)
  refresh_token  TEXT,           -- criptografado em repouso
  token_expires_at TIMESTAMPTZ,
  status         VARCHAR(20) NOT NULL DEFAULT 'active',
  last_verified_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_social_account UNIQUE (profile_id, network),
  CONSTRAINT chk_social_status CHECK (status IN ('active', 'expired', 'revoked', 'error'))
);

CREATE INDEX idx_social_accounts_profile_id ON profiles.social_accounts(profile_id);
CREATE INDEX idx_social_accounts_status     ON profiles.social_accounts(status);
```

### 4.3 `profiles.marketplace_accounts`

```sql
CREATE TABLE profiles.marketplace_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),
  marketplace    VARCHAR(50) NOT NULL,
  affiliate_id   VARCHAR(255) NOT NULL,
  credentials    JSONB,          -- criptografado em repouso
  status         VARCHAR(20) NOT NULL DEFAULT 'active',
  last_verified_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_marketplace_account UNIQUE (profile_id, marketplace)
);
```

---

## 5. Schema: `campaigns`

### 5.1 `campaigns.campaigns`

```sql
CREATE TABLE campaigns.campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),
  name             VARCHAR(255) NOT NULL,
  product_url      TEXT NOT NULL,
  product_name     VARCHAR(255) NOT NULL,
  marketplace      VARCHAR(50) NOT NULL,
  target_network   VARCHAR(50) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'testing',
  mode             VARCHAR(20) NOT NULL DEFAULT 'test',  -- 'test' | 'scale'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at        TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,

  CONSTRAINT chk_campaign_status CHECK (
    status IN ('testing', 'scale_eligible', 'scaling', 'monitoring',
               'saturating', 'paused', 'ended')
  ),
  CONSTRAINT chk_campaign_mode CHECK (mode IN ('test', 'scale'))
);

CREATE INDEX idx_campaigns_profile_id ON campaigns.campaigns(profile_id);
CREATE INDEX idx_campaigns_status     ON campaigns.campaigns(status);
```

### 5.2 `campaigns.test_cycles`

Cada campanha tem um histórico de ciclos de teste. Um ciclo representa uma fase contínua de exploração — termina quando transita para ESCALA ou é reiniciado após saturação.

```sql
CREATE TABLE campaigns.test_cycles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns.campaigns(id),
  cycle_number  INTEGER NOT NULL DEFAULT 1,
  phase         VARCHAR(30) NOT NULL DEFAULT 'baseline',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  end_reason    VARCHAR(50),  -- 'scale_eligible' | 'paused' | 'saturated' | 'restarted'
  notes         TEXT,         -- usado internamente pelo Test Engine

  CONSTRAINT chk_test_phase CHECK (
    phase IN ('baseline', 'story_family', 'broad_exploration', 'confirmation')
  )
);

CREATE INDEX idx_test_cycles_campaign_id ON campaigns.test_cycles(campaign_id);
```

### 5.3 `campaigns.decision_packages`

Cada história publicada parte de um Decision Package — o conjunto de 12 dimensões que especificou o que a história deveria ser. Armazenar o Decision Package junto à publicação permite ao Knowledge Engine correlacionar resultado com configuração exata.

```sql
CREATE TABLE campaigns.decision_packages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES campaigns.campaigns(id),
  test_cycle_id       UUID REFERENCES campaigns.test_cycles(id),

  -- As 12 dimensões do Decision Package
  product_id          UUID NOT NULL,
  pain_point          VARCHAR(255) NOT NULL,
  target_audience     VARCHAR(255) NOT NULL,
  emotional_trigger   VARCHAR(50) NOT NULL,
  narrative_arc       SMALLINT NOT NULL,
  length_bucket       VARCHAR(20) NOT NULL,  -- 'short' | 'medium' | 'long'
  voice_register      VARCHAR(50) NOT NULL,
  cta_style           VARCHAR(50) NOT NULL,
  differentiator      TEXT,
  target_network      VARCHAR(50) NOT NULL,
  network_constraints JSONB,
  campaign_mode       VARCHAR(20) NOT NULL,  -- 'test' | 'scale'

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decision_packages_campaign_id ON campaigns.decision_packages(campaign_id);
```

---

## 6. Schema: `stories`

### 6.1 `stories.stories`

```sql
CREATE TABLE stories.stories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES campaigns.campaigns(id),
  decision_package_id UUID NOT NULL REFERENCES campaigns.decision_packages(id),
  profile_id          UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),

  -- Conteúdo
  content             TEXT NOT NULL,
  content_hash        VARCHAR(64) NOT NULL,  -- SHA-256, para detecção de duplicatas

  -- Avaliação de qualidade
  quality_score       NUMERIC(5,2),
  qs_breakdown        JSONB,  -- pontuação por dimensão
  qs_evaluated_at     TIMESTAMPTZ,

  -- Status
  status              VARCHAR(20) NOT NULL DEFAULT 'generated',
  rejection_reason    VARCHAR(50),  -- se rejeitado no Modo Revisão

  -- Embeddings (para DNA e originality check)
  content_embedding   vector(1536),

  -- Metadados de geração
  ai_provider         VARCHAR(50) NOT NULL,
  model_version       VARCHAR(50) NOT NULL,
  generation_attempt  SMALLINT NOT NULL DEFAULT 1,
  temperature         NUMERIC(3,2) NOT NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_story_status CHECK (
    status IN ('generated', 'approved', 'rejected', 'published', 'failed')
  )
);

CREATE INDEX idx_stories_campaign_id          ON stories.stories(campaign_id);
CREATE INDEX idx_stories_profile_id           ON stories.stories(profile_id);
CREATE INDEX idx_stories_content_hash         ON stories.stories(content_hash);
CREATE INDEX idx_stories_status               ON stories.stories(status);
-- Índice para busca de similaridade vetorial (HNSW — melhor performance para consultas de originality check)
CREATE INDEX idx_stories_embedding ON stories.stories
  USING hnsw (content_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 6.2 `stories.publications`

Uma história pode ser publicada em múltiplas redes (V2+ — multi-rede). No MVP, uma publicação por história.

```sql
CREATE TABLE stories.publications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        UUID NOT NULL REFERENCES stories.stories(id),
  campaign_id     UUID NOT NULL REFERENCES campaigns.campaigns(id),
  profile_id      UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),
  network         VARCHAR(50) NOT NULL,

  -- Referência externa
  external_post_id VARCHAR(255),
  external_url     TEXT,

  -- Agendamento e publicação
  scheduled_at    TIMESTAMPTZ NOT NULL,
  published_at    TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  failure_reason  VARCHAR(255),
  retry_count     SMALLINT NOT NULL DEFAULT 0,

  -- Analytics (populados após coleta)
  clicks          INTEGER,
  impressions     INTEGER,
  ctr             NUMERIC(6,4),
  conversions     INTEGER,
  revenue_brl     NUMERIC(12,2),
  analytics_collected_at TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_publication_status CHECK (
    status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')
  )
);

CREATE INDEX idx_publications_campaign_id   ON stories.publications(campaign_id);
CREATE INDEX idx_publications_profile_id    ON stories.publications(profile_id);
CREATE INDEX idx_publications_scheduled_at  ON stories.publications(scheduled_at);
CREATE INDEX idx_publications_status        ON stories.publications(status);
CREATE INDEX idx_publications_story_id      ON stories.publications(story_id);
```

---

## 7. Schema: `knowledge`

Este é o schema mais crítico da plataforma. Acesso restrito ao Knowledge Engine e ML Engine. Nenhum outro serviço lê ou escreve aqui diretamente.

### 7.1 `knowledge.intelligence_scores`

IS por combinação de dimensões — não por campanha. A mesma combinação (mesmo arco, mesmo trigger, mesmo voice register) pode existir em múltiplas campanhas e gera um IS consolidado que informa todos elas.

```sql
CREATE TABLE knowledge.intelligence_scores (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id           UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),

  -- Chave da combinação (as dimensões que definem unicidade do IS)
  network              VARCHAR(50) NOT NULL,
  narrative_arc        SMALLINT NOT NULL,
  emotional_trigger    VARCHAR(50) NOT NULL,
  length_bucket        VARCHAR(20) NOT NULL,
  voice_register       VARCHAR(50) NOT NULL,
  cta_style            VARCHAR(50) NOT NULL,

  -- Score e estado
  score                NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  state                VARCHAR(20) NOT NULL DEFAULT 'inconclusive',

  -- Contagens
  publications_count   INTEGER NOT NULL DEFAULT 0,
  publications_valid_qs INTEGER NOT NULL DEFAULT 0,  -- publicações com QS >= 70

  -- Decaimento
  last_active_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decay_multiplier     NUMERIC(4,3) NOT NULL DEFAULT 1.0,

  -- Metadados
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_is_combination UNIQUE (
    profile_id, network, narrative_arc, emotional_trigger,
    length_bucket, voice_register, cta_style
  ),
  CONSTRAINT chk_is_state CHECK (
    state IN ('anti_pattern', 'ineffective', 'inconclusive',
              'promising', 'validated', 'high_confidence')
  ),
  CONSTRAINT chk_is_score CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX idx_is_profile_id ON knowledge.intelligence_scores(profile_id);
CREATE INDEX idx_is_state      ON knowledge.intelligence_scores(state);
CREATE INDEX idx_is_score      ON knowledge.intelligence_scores(score DESC);
```

### 7.2 `knowledge.profile_dna`

DNA do Perfil: identidade narrativa descoberta (nunca configurada). Versionado — versões antigas mantidas para rastrear evolução. Apenas `is_current = true` é consultado em produção.

```sql
CREATE TABLE knowledge.profile_dna (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),
  network           VARCHAR(50) NOT NULL,
  version           INTEGER NOT NULL,

  -- Embeddings e identidade narrativa
  voice_embedding   vector(1536),
  dominant_register VARCHAR(50),
  secondary_register VARCHAR(50),
  avg_sentence_length NUMERIC(6,2),
  vocabulary_richness NUMERIC(5,4),

  -- Padrões temporais
  best_hours        INTEGER[],   -- ex: [19, 20, 21]
  best_weekdays     SMALLINT[],  -- 0=Dom, 1=Seg, ..., 6=Sáb

  -- Maturidade do DNA
  bootstrap_weight  NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  data_points_count INTEGER NOT NULL DEFAULT 0,

  -- Controle de versão
  is_current        BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_dna_version UNIQUE (profile_id, network, version),
  CONSTRAINT chk_bootstrap CHECK (bootstrap_weight >= 0 AND bootstrap_weight <= 1)
);

-- Índice para busca da versão atual (query mais frequente)
CREATE INDEX idx_dna_current ON knowledge.profile_dna(profile_id, network)
  WHERE is_current = true;

-- Índice para similaridade de voz (busca de originalidade e DNA check)
CREATE INDEX idx_dna_voice_embedding ON knowledge.profile_dna
  USING hnsw (voice_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 7.3 `knowledge.learning_timeline`

Append-only. Representa o histórico de descobertas do Knowledge Engine para um perfil. Nunca deletar entradas — apenas marcar `is_expired = true` ou definir `superseded_by`.

```sql
CREATE TABLE knowledge.learning_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),
  campaign_id     UUID REFERENCES campaigns.campaigns(id),

  -- Tipo e conteúdo
  entry_type      VARCHAR(50) NOT NULL,
  title           VARCHAR(255) NOT NULL,   -- exibido ao usuário
  evidence        JSONB NOT NULL,          -- dados brutos que sustentam a entrada

  -- Explicações pré-calculadas para o "Por quê?" (DECISIONS #069, #070)
  why_activation  TEXT,    -- "por que esse padrão foi identificado"
  why_expiration  TEXT,    -- "por que esse padrão expirou" (preenchido na expiração)

  -- Ordenação e estado
  impact_score    NUMERIC(5,2) NOT NULL DEFAULT 0,  -- ordena exibição ao usuário
  state           VARCHAR(20) NOT NULL DEFAULT 'active',
  is_expired      BOOLEAN NOT NULL DEFAULT false,
  superseded_by   UUID REFERENCES knowledge.learning_timeline(id),

  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expired_at      TIMESTAMPTZ,

  CONSTRAINT chk_timeline_type CHECK (
    entry_type IN (
      'pattern_activated',    -- novo padrão identificado
      'pattern_confirmed',    -- padrão confirmado em mais contextos
      'pattern_expired',      -- padrão deixou de funcionar
      'anti_pattern_confirmed', -- anti-padrão registrado
      'anti_pattern_reeval',  -- anti-padrão em reavaliação
      'scale_achieved',       -- escala iniciada com sucesso
      'saturation_detected',  -- saturação detectada
      'dna_update'            -- DNA do perfil atualizado
    )
  ),
  CONSTRAINT chk_timeline_state CHECK (
    state IN ('active', 'confirming', 'expired')
  )
);

CREATE INDEX idx_timeline_profile_id   ON knowledge.learning_timeline(profile_id);
CREATE INDEX idx_timeline_impact_score ON knowledge.learning_timeline(profile_id, impact_score DESC)
  WHERE is_expired = false;
CREATE INDEX idx_timeline_state        ON knowledge.learning_timeline(state);
```

### 7.4 `knowledge.anti_patterns`

Anti-padrões: combinações de dimensões com histórico consistente de baixa performance. Consultados ativamente pelo Test Engine antes de gerar novas histórias.

```sql
CREATE TABLE knowledge.anti_patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),

  -- Combinação que define o anti-padrão
  network           VARCHAR(50) NOT NULL,
  narrative_arc     SMALLINT,
  emotional_trigger VARCHAR(50),
  length_bucket     VARCHAR(20),
  voice_register    VARCHAR(50),
  cta_style         VARCHAR(50),
  -- Nota: algumas dimensões podem ser NULL se o anti-padrão é de granularidade menor
  -- (ex: um trigger específico é ruim independente do arco)

  -- Evidência
  confirmation_count INTEGER NOT NULL DEFAULT 0,  -- publicações com QS>=70 que falharam
  avg_performance_ratio NUMERIC(5,4),             -- vs. baseline do nicho

  -- Granularidade e origem
  is_general        BOOLEAN NOT NULL DEFAULT false,  -- false = combinação completa; true = promovido
  promotion_source_ids UUID[],  -- IDs dos anti-padrões específicos que originaram este geral
  -- Regra: anti-padrões nascem com is_general=false. Somente o ML Engine promove
  -- para is_general=true após evidência suficiente. (DECISIONS #076)

  -- Estado e ciclo de vida
  state             VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  confirmed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reeval_after      TIMESTAMPTZ,   -- data a partir da qual pode ser reavaliado
  last_reeval_at    TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_ap_state CHECK (
    state IN ('confirmed', 'under_reeval', 'inconclusive')
    -- inconclusive = saiu da reavaliação e pode ser testado novamente
  ),
  CONSTRAINT chk_ap_general_has_sources CHECK (
    -- anti-padrão geral deve sempre rastrear sua origem
    NOT is_general OR promotion_source_ids IS NOT NULL
  )
);

CREATE INDEX idx_anti_patterns_profile_id ON knowledge.anti_patterns(profile_id);
CREATE INDEX idx_anti_patterns_state      ON knowledge.anti_patterns(state);
```

### 7.5 `knowledge.campaign_priority_scores`

CPS calculado por campanha. Recalculado a cada ciclo de analytics. Histórico preservado para o ML Engine aprender quais fatores realmente predizem resultado.

```sql
CREATE TABLE knowledge.campaign_priority_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns.campaigns(id),
  profile_id    UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),

  -- Score e composição
  score         NUMERIC(5,2) NOT NULL,
  is_component  NUMERIC(5,2) NOT NULL,    -- contribuição do Intelligence Score
  return_component NUMERIC(5,2) NOT NULL, -- contribuição do retorno esperado
  stage_component  NUMERIC(5,2) NOT NULL, -- contribuição do multiplicador de estágio
  trend_component  NUMERIC(5,2) NOT NULL, -- contribuição da tendência

  -- Estado da campanha no momento do cálculo
  campaign_state VARCHAR(20) NOT NULL,

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apenas o mais recente é consultado em produção
CREATE INDEX idx_cps_campaign_latest ON knowledge.campaign_priority_scores(campaign_id, calculated_at DESC);
CREATE INDEX idx_cps_profile_latest  ON knowledge.campaign_priority_scores(profile_id, calculated_at DESC);
```

### 7.6 `knowledge.global_patterns`

Padrões genéricos agregados anonimamente — usados para bootstrap de novos perfis (cold start). Nenhum dado individual pode ser derivado aqui. (DECISIONS #055)

```sql
CREATE TABLE knowledge.global_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche           VARCHAR(100) NOT NULL,
  network         VARCHAR(50) NOT NULL,
  pattern_type    VARCHAR(50) NOT NULL,

  -- Padrão (pode ter NULLs para dimensões não relevantes)
  narrative_arc   SMALLINT,
  emotional_trigger VARCHAR(50),
  length_bucket   VARCHAR(20),
  cta_style       VARCHAR(50),

  -- Métricas agregadas
  avg_ctr         NUMERIC(6,4),
  avg_conversion_rate NUMERIC(6,4),
  sample_size     INTEGER NOT NULL,    -- quantas publicações compõem este padrão
  confidence      NUMERIC(5,4),        -- grau de confiança baseado no volume

  -- Controle
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,         -- quando este padrão foi supersedido
  is_current      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_global_patterns_niche   ON knowledge.global_patterns(niche, network)
  WHERE is_current = true;
```

---

## 8. Estratégia de Acesso

### 8.1 Padrão de Queries

**Queries síncronas (leitura):**
- Dashboard Home → Redis cache (TTL 5 min); miss → PostgreSQL direto
- Lista de campanhas → Redis cache (TTL 2 min); ordered by CPS latest
- Tela de Aprendizados → Redis cache (TTL 30 min); ordered by `impact_score DESC` where `is_expired = false`
- Detalhe de campanha → Redis cache (TTL 2 min); join com última versão do CPS

**Operações assíncronas (escrita via Event Bus):**
- Geração de história → `story.request` → Story Engine → `story.generated` → `stories.stories`
- Publicação → `publication.request` → Scheduling Engine → `stories.publications`
- Coleta de analytics → `analytics.collected` → Knowledge Engine → atualiza `intelligence_scores`
- Atualização de IS → Knowledge Engine → `knowledge.intelligence_scores` + `knowledge.learning_timeline`

### 8.2 Invalidação de Cache

| Evento | Cache invalidado |
|---|---|
| Nova publicação com analytics | IS da combinação, CPS da campanha, Dashboard |
| IS atualiza estado | Lista de campanhas, Aprendizados |
| Novo aprendizado registrado | Aprendizados |
| Campaign status muda | Lista de campanhas, Dashboard |
| Conta desconectada | Contas conectadas |

### 8.3 Connection Pooling

PgBouncer em modo transaction pooling. Pool size por serviço (valores provisórios — DECISIONS #062):

| Serviço | Pool size |
|---|---|
| API Gateway | 10 |
| Knowledge Engine | 5 |
| Story Engine | 5 |
| Scheduling Engine | 3 |
| ML Engine | 5 |

---

## 9. Migrations e Versionamento

- Ferramenta: **Flyway** (migrations SQL versionadas, compatível com CI/CD)
- Formato: `V{número}__{descrição}.sql` (ex: `V001__create_auth_schema.sql`)
- Regra: nunca dropar colunas em produção sem período de deprecação de duas versões
- Regra: índices criados `CONCURRENTLY` — nunca bloquear tabela em produção durante criação de índice
- Rollback: cada migration tem arquivo de rollback correspondente no repositório

---

## 10. Segurança e LGPD

- Tokens de acesso de redes sociais: criptografados em repouso com AES-256 antes de inserir no banco
- Chave de criptografia: AWS KMS (nunca hardcoded, nunca em variável de ambiente em texto plano)
- Dados de analytics: nunca contêm identificadores de usuário final das redes sociais — apenas métricas agregadas por publicação
- Direito de exclusão: `profiles.affiliate_profiles` com `CASCADE DELETE` propaga para toda a hierarquia de dados do usuário; `knowledge.*` com `profile_id` são deletados na mesma operação
- Retenção de `knowledge.learning_timeline`: dados de perfis deletados são anonimizados e contribuem para `knowledge.global_patterns` antes da exclusão — se e somente se o usuário consentiu (flag de consentimento no perfil, a ser detalhado no Documento 16)

---

## 11. Monitoramento

| Métrica | Alerta | Observação |
|---|---|---|
| Query P95 > 100ms | Warning | Indica necessidade de índice ou query rewrite |
| Query P95 > 500ms | Critical | Impacta experiência do usuário |
| Connection pool > 80% | Warning | Risco de conexões recusadas |
| Dead rows > 20% da tabela | Warning | Necessidade de VACUUM |
| Disk usage > 70% | Warning | Planejamento de expansão |
| Replication lag > 30s | Critical | Risco de perda de dados em failover |

---

## 12. Casos Extremos e Decisões de Borda

### CE-BD-001: IS para combinação ainda não vista
**Situação:** Test Engine solicita IS para combinação nova.  
**Comportamento:** Knowledge Engine insere nova linha em `intelligence_scores` com `score = 50` (Inconclusivo) e `publications_count = 0`. Bootstrap por `global_patterns` do nicho se disponível.

### CE-BD-002: Usuário deleta conta com campanhas em escala ativas
**Comportamento:** Cascade delete para toda hierarquia. `learning_timeline` é anonimizada para `global_patterns` antes da exclusão (com consentimento). `stories.publications` com `published_at NOT NULL` são mantidas por 90 dias para fins de auditoria de compliance, depois deletadas.

### CE-BD-003: `content_embedding` NULL em `stories.stories`
**Situação:** Falha no serviço de embedding durante geração.  
**Comportamento:** História é gerada e publicada normalmente. Originality check e DNA check são pulados com log de warning. Embedding é recomputado em background job antes da próxima publicação da campanha.

### CE-BD-004: `bootstrap_weight` chegando a 0
**Situação:** Perfil com muitos dados reais — `bootstrap_weight` progressivamente se aproxima de 0.  
**Comportamento:** Abaixo de 0.05 (valor provisório — DECISIONS #062), o DNA é considerado totalmente baseado em dados reais. O campo `dominant_register` da última versão de `profile_dna` passa a ser a única fonte de verdade para DNA check.

### CE-BD-005: Tabela `learning_timeline` com milhares de entradas por perfil (usuário avançado)
**Comportamento:** Índice parcial `WHERE is_expired = false` garante que queries de exibição ao usuário acessem apenas entradas ativas. Entradas expiradas ficam acessíveis para o ML Engine mas invisíveis nas queries de frontend. Sem paginação necessária para entradas ativas (esperado máximo de dezenas por perfil ativo).

---

## 13. Possíveis Melhorias Futuras

1. **Particionamento de `stories.publications` por `profile_id`:** quando o volume por perfil superar 100k publicações, particionamento horizontal melhora performance de queries de histórico.

2. **Tabela de analytics por hora:** atualmente analytics são armazenados por publicação. Em V2, uma tabela agregada por hora/dia por campanha permitirá queries de dashboard sem varrer o histórico completo.

3. **Suporte a múltiplos perfis por usuário:** `affiliate_profiles` já suporta múltiplos registros por `user_id`, mas a lógica de sessão MVP assume um único perfil ativo. V2 adiciona `active_profile_id` na sessão do usuário.

4. **Histórico de preços de produtos:** para o ML Engine correlacionar variações de preço do produto com variações de performance de campanha — dado ausente no MVP mas potencialmente valioso.

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | Schemas separados por domínio: auth / profiles / campaigns / stories / knowledge |
| 2026-07-11 | `learning_timeline` append-only; `is_expired` marca, nunca deleta |
| 2026-07-11 | `why_activation` e `why_expiration` como campos distintos na `learning_timeline` |
| 2026-07-11 | HNSW como método de indexação para pgvector (performance vs. IVFFlat) |
| 2026-07-11 | `global_patterns` isolado de dados de perfil — nunca cruzados em queries de produção |
| 2026-07-11 | Tokens criptografados com AES-256; chave via AWS KMS |
| 2026-07-11 | Cascade delete com anonimização prévia para `learning_timeline` (com consentimento) |
| 2026-07-11 | Flyway como ferramenta de migration |
| 2026-07-11 | Anti-padrões nascem específicos (`is_general=false`); ML Engine promove para gerais com `promotion_source_ids` |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aprovado com regra de evolução de anti-padrões aplicada*
