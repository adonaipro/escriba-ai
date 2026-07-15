# 15 — Machine Learning Engine

> *"O ML Engine é o único componente da plataforma que aprende sobre si mesmo. Todos os outros aprendem sobre o usuário."*

---

## Objetivo deste Documento

Definir a arquitetura, responsabilidades e operação do ML Engine: o componente Python responsável por calibrar todos os parâmetros provisórios da plataforma com dados reais, detectar padrões em escala, promover anti-padrões de específicos para gerais, e atualizar o DNA narrativo dos perfis.

**Distinção essencial com o Documento 14 (IA):**
- **Documento 14 (IA):** usa modelos de linguagem em tempo de execução para gerar e avaliar conteúdo — operação síncrona ou quase-síncrona, por história
- **Este documento (ML):** analisa dados acumulados em jobs agendados para calibrar como o sistema se comporta — operação assíncrona, por lote, sem impacto em tempo real

---

## 1. Princípios do ML Engine

**P1 — Calibração é uma entrega, não uma melhoria opcional**
Todo parâmetro numérico definido nos documentos anteriores é um placeholder provisório. O ML Engine transforma esses placeholders em valores calibrados com dados reais. Isso não é uma feature futura — é uma obrigação arquitetural. (DECISIONS #062)

**P2 — O ML Engine nunca escreve diretamente em tabelas de usuário**
O ML Engine produz parâmetros calibrados e os persiste em tabelas de calibração dedicadas. Os serviços de produção leem essas tabelas para se comportar de acordo. O ML Engine não altera `knowledge.intelligence_scores`, `knowledge.profile_dna` ou `stories.stories` diretamente — esses são domínios dos serviços de produção.

**P3 — Toda calibração é versionada e auditável**
Nenhum parâmetro é sobrescrito sem registro da versão anterior. É possível reverter para qualquer versão anterior de calibração em minutos.

**P4 — O ML Engine nunca trabalha com certezas**
Calibração é hipótese com grau de confiança, não verdade descoberta. Cada parâmetro calibrado vem acompanhado de intervalo de confiança e tamanho da amostra utilizada. (DECISIONS #064)

**P5 — Separação entre aprender e agir**
O ML Engine aprende (analisa, calibra, sugere). Os serviços de produção agem (publicam, avaliam, decidem). Nunca inverter essa separação — o ML Engine não tem acesso ao Event Bus de produção.

---

## 2. Responsabilidades do ML Engine

### 2.1 Mapa de Responsabilidades

| Responsabilidade | Frequência | Entrada | Saída |
|---|---|---|---|
| Calibrar parâmetros do IS | Semanal | `intelligence_scores` + `publications` | `ml.calibration_params` |
| Calibrar thresholds de QS | Semanal | `stories` (QS + performance) | `ml.calibration_params` |
| Calibrar pesos do CPS | Semanal | `campaign_priority_scores` + resultados reais | `ml.calibration_params` |
| Recalcular DNA de perfis | Após N publicações com analytics | `stories` + `publications` (alta performance) | Evento para serviço de DNA |
| Promover anti-padrões para gerais | Semanal | `anti_patterns` (específicos com evidência acumulada) | Novos registros em `anti_patterns` |
| Agregar padrões globais | Mensal | Todos os perfis (anonimizado) | `knowledge.global_patterns` |
| Detectar anomalias de calibração | Diário | Métricas de produção | Alertas para engenharia |

### 2.2 O que o ML Engine NÃO faz

- Gerar histórias (responsabilidade do Story Engine + IAIProvider)
- Calcular IS em tempo real (responsabilidade do Knowledge Engine)
- Publicar em redes sociais
- Interagir com usuários ou com o Event Bus de produção
- Tomar decisões de escala ou pause (responsabilidade do Test/Scale Engine)

---

## 3. Schema: `ml` (Tabelas de Calibração)

O ML Engine opera em seu próprio schema, separado do schema `knowledge` de produção.

### 3.1 `ml.calibration_params`

Tabela central de parâmetros calibrados. Versionada — nenhum registro é deletado.

```sql
CREATE TABLE ml.calibration_params (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  param_name      VARCHAR(100) NOT NULL,
  param_group     VARCHAR(50) NOT NULL,   -- 'is_formula' | 'qos' | 'cps' | 'decay' | 'dna' | 'anti_pattern'
  value           NUMERIC(10,6) NOT NULL,
  confidence      NUMERIC(5,4),           -- intervalo de confiança (ex: 0.95 = 95%)
  sample_size     INTEGER,                -- quantas observações embasaram este valor
  is_active       BOOLEAN NOT NULL DEFAULT true,
  niche           VARCHAR(100),           -- NULL = global; preenchido = específico por nicho
  network         VARCHAR(50),            -- NULL = global; preenchido = específico por rede
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,            -- preenchido quando supersedido por nova calibração
  produced_by_run UUID,                   -- referência ao job que gerou este valor
  notes           TEXT,                   -- justificativa da calibração
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calib_active ON ml.calibration_params(param_name, is_active)
  WHERE is_active = true;
CREATE INDEX idx_calib_group  ON ml.calibration_params(param_group, is_active)
  WHERE is_active = true;
```

### 3.2 `ml.calibration_runs`

Log de cada execução do ML Engine.

```sql
CREATE TABLE ml.calibration_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type        VARCHAR(50) NOT NULL,   -- 'is_calibration' | 'dna_update' | 'anti_pattern_promotion' | etc.
  status          VARCHAR(20) NOT NULL DEFAULT 'running',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  params_updated  INTEGER,                -- quantos parâmetros foram atualizados
  profiles_affected INTEGER,
  error_message   TEXT,
  metadata        JSONB,

  CONSTRAINT chk_run_status CHECK (status IN ('running', 'completed', 'failed', 'skipped'))
);
```

### 3.3 `ml.anti_pattern_proposals`

Tabela intermediária onde o ML Engine registra candidatos a anti-padrões gerais. O Knowledge Engine consome essas propostas e é o único que cria registros em `knowledge.anti_patterns`. (DECISIONS #085)

```sql
CREATE TABLE ml.anti_pattern_proposals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),

  -- Dimensões do anti-padrão geral proposto (NULLs nas dimensões abstraídas)
  network               VARCHAR(50) NOT NULL,
  narrative_arc         SMALLINT,
  emotional_trigger     VARCHAR(50),
  length_bucket         VARCHAR(20),
  voice_register        VARCHAR(50),
  cta_style             VARCHAR(50),

  -- Evidência
  promotion_source_ids  UUID[] NOT NULL,  -- IDs dos anti-padrões específicos que embasaram a proposta
  sample_size           INTEGER NOT NULL,
  confidence            NUMERIC(5,4) NOT NULL,
  avg_performance_ratio NUMERIC(5,4),

  -- Ciclo de vida
  status                VARCHAR(20) NOT NULL DEFAULT 'pending',
  produced_by_run       UUID REFERENCES ml.calibration_runs(id),
  proposed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  applied_at            TIMESTAMPTZ,
  rejected_reason       TEXT,

  CONSTRAINT chk_proposal_status CHECK (
    status IN ('pending', 'applied', 'rejected', 'superseded')
  )
);

CREATE INDEX idx_ap_proposals_pending ON ml.anti_pattern_proposals(profile_id, status)
  WHERE status = 'pending';
```

### 3.4 `ml.dna_update_queue`

Fila de perfis que precisam de recálculo de DNA. O ML Engine consome esta fila periodicamente.

```sql
CREATE TABLE ml.dna_update_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles.affiliate_profiles(id),
  network         VARCHAR(50) NOT NULL,
  reason          VARCHAR(50) NOT NULL,   -- 'publication_threshold' | 'performance_shift' | 'scheduled'
  publications_since_last_update INTEGER,
  queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',

  CONSTRAINT uq_dna_queue UNIQUE (profile_id, network, status)
    DEFERRABLE INITIALLY DEFERRED
);
```

---

## 4. Calibração de Parâmetros

### 4.1 Parâmetros do Intelligence Score

**O que calibrar:**

| Parâmetro | Placeholder atual | Método de calibração |
|---|---|---|
| `α` (coeficiente de aprendizado da fórmula IS) | — | Regressão: maximizar correlação entre IS e CTR real futuro |
| Decay base (`0.015/week`) | Provisório | Análise de sobrevivência: quando IS deixa de predizer performance? |
| Decay multiplier ESCALA (`×0.3`) | Provisório | Comparar decay de campanhas ativas vs. inativas |
| Decay multiplier saturação (`×2.0`) | Provisório | Velocidade real de queda em campanhas saturadas |
| Threshold Inconclusive→Promising (`61`) | Provisório | Percentil de CTR: IS > X prediz CTR acima da mediana do nicho? |
| Threshold Promising→Validated (`81`) | Provisório | Idem, com confiança estatística adequada |
| Mínimo de publicações para Validated (`≥2`) | Provisório | Análise: quantas confirmações eliminam falsos positivos? |

**Método geral:**

```python
def calibrate_is_threshold(df_publications, target_percentile=0.75):
    """
    Encontra o IS threshold que melhor separa publicações
    acima do percentile-alvo de CTR das demais.
    """
    # Agrupar por combinação de dimensões → IS médio no momento
    # Verificar CTR realizado nas próximas N publicações
    # Encontrar IS que maximiza F1 score da predição
    ...
```

O resultado é um conjunto de thresholds calibrados com `confidence` e `sample_size` — nunca um único valor sem contexto estatístico.

### 4.2 Calibração do QS Threshold

**Questão:** o threshold de 70 para publicação é correto?

**Método:** correlacionar QS com CTR real:

```python
# Para cada história publicada:
# QS avaliado no momento → CTR realizado nos 7 dias seguintes

correlation_matrix = df.groupby('qs_bucket').agg({
    'ctr': ['mean', 'std', 'count'],
    'conversion_rate': ['mean']
})

# Encontrar o QS abaixo do qual CTR médio cai abaixo
# do baseline do nicho de forma estatisticamente significativa
```

Se o threshold ótimo for significativamente diferente de 70 (com evidência suficiente), o ML Engine propõe nova calibração. A mudança de threshold é aplicada via `ml.calibration_params` — o Story Engine lê o threshold do banco, não do código.

### 4.3 Calibração dos Pesos do CPS

**Pesos atuais (provisórios):** IS (35%) + retorno esperado (30%) + multiplicador de estágio (20%) + tendência (15%).

**Método:** comparar qual combinação de pesos, aplicada retroativamente, teria predito melhor quais campanhas de fato geraram mais resultado:

```python
from scipy.optimize import minimize

def cps_loss(weights, df_campaigns):
    """
    Minimize a diferença entre CPS predito e resultado real.
    weights = [w_is, w_return, w_stage, w_trend]
    sum(weights) deve ser 1.0
    """
    predicted_ranking = compute_cps(df_campaigns, weights)
    actual_ranking = df_campaigns['actual_revenue_rank']
    return spearman_distance(predicted_ranking, actual_ranking)

result = minimize(cps_loss, x0=[0.35, 0.30, 0.20, 0.15],
                  constraints={'type': 'eq', 'fun': lambda w: sum(w) - 1},
                  bounds=[(0.05, 0.60)] * 4)
```

Os pesos calibrados são persistidos em `ml.calibration_params` com `param_group = 'cps'`.

### 4.4 Calibração dos Multiplicadores de Estágio do CPS

Os multiplicadores de estágio (SCALING 1.4, SCALE_ELIGIBLE 1.2, etc.) são calibrados separadamente dos pesos, verificando se campanhas em cada estágio realmente têm a diferença de resultado proporcional ao multiplicador.

### 4.5 Calibração do Story Family Threshold

O princípio de Story Family (DECISIONS #053) não tem threshold fixo — é o ML Engine que determina quando uma performance é "significativamente acima do esperado" para ativar exploração de família.

**Método:** análise de distribuição de CTR por campanha:

```python
# Para cada campanha com ≥5 publicações:
# Calcular desvio padrão de CTR das publicações
# Story Family é ativada quando uma publicação excede
# (média + N×desvio_padrão) — N calibrado por nicho

def calibrate_story_family_threshold(df_by_niche):
    # N que maximiza: taxa de histórias de "família" que
    # geram CTR consistentemente acima da média
    ...
```

### 4.6 Calibração dos Critérios de Pause de Teste

Os critérios de pause (≥8 histórias com QS≥70, CTR <50% do baseline por ≥3 semanas) são calibrados verificando:

- Campanhas que pausaram por esses critérios: qual percentual realmente não teria funcionado se continuasse?
- Campanhas que não pausaram: qual percentual teria se beneficiado de pausa mais cedo?

O objetivo é minimizar tanto falsos positivos (pausar campanha que iria melhorar) quanto falsos negativos (continuar campanha que não vai melhorar).

---

## 5. Atualização de DNA

### 5.1 Quando Atualizar

O DNA de um perfil é candidato à atualização quando:

1. O perfil acumulou N novas publicações com analytics desde a última atualização de DNA (N provisório — DECISIONS #062)
2. O ML Engine detecta que a distribuição de CTR mudou significativamente (possível mudança de audiência ou contexto)
3. Job semanal de recálculo planejado (para perfis com muitos dados, mesmo sem gatilho específico)

### 5.2 Processo de Atualização

```python
def update_profile_dna(profile_id, network):
    # 1. Selecionar histórias de alta performance
    high_perf_stories = db.query("""
        SELECT s.content, s.content_embedding, p.ctr
        FROM stories.stories s
        JOIN stories.publications p ON s.id = p.story_id
        WHERE s.profile_id = %s AND p.network = %s
          AND s.quality_score >= 70
          AND p.ctr >= (
            SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ctr)
            FROM stories.publications
            WHERE profile_id = %s AND network = %s
          )
        ORDER BY p.published_at DESC
        LIMIT 100  -- últimas N histórias de alta performance
    """, [profile_id, network, profile_id, network])

    # 2. Calcular centroid dos embeddings
    embeddings = np.array([s['content_embedding'] for s in high_perf_stories])
    centroid = embeddings.mean(axis=0)
    centroid_normalized = centroid / np.linalg.norm(centroid)

    # 3. Verificar se centroid difere significativamente do DNA atual
    current_dna = db.query_one("""
        SELECT voice_embedding FROM knowledge.profile_dna
        WHERE profile_id = %s AND network = %s AND is_current = true
    """, [profile_id, network])

    if current_dna:
        similarity = cosine_similarity(centroid_normalized, current_dna['voice_embedding'])
        if similarity > DNA_UPDATE_THRESHOLD:  # parâmetro calibrado
            return  # DNA não mudou o suficiente para nova versão

    # 4. Atualizar bootstrap_weight
    new_bootstrap_weight = max(
        0.0,
        current_dna['bootstrap_weight'] * 0.85 ** len(high_perf_stories)
        if current_dna else 1.0
    )

    # 5. Enfileirar atualização de DNA para o Knowledge Engine aplicar
    db.insert('ml.dna_update_queue', {
        'profile_id': profile_id,
        'network': network,
        'new_embedding': centroid_normalized.tolist(),
        'new_bootstrap_weight': new_bootstrap_weight,
        'reason': 'ml_recalculation'
    })
```

O ML Engine **não escreve diretamente em `knowledge.profile_dna`** — enfileira a atualização para o Knowledge Engine aplicar, mantendo a separação de responsabilidades. (P2 desta seção)

### 5.3 `bootstrap_weight` e Maturidade do DNA

```
bootstrap_weight = 1.0   → DNA 100% derivado de padrões globais do nicho (cold start)
bootstrap_weight = 0.5   → DNA 50% global, 50% dados reais do perfil
bootstrap_weight < 0.05  → DNA considerado maduro — dados reais dominam completamente
```

A fórmula de decaimento `× 0.85 por ponto de dados real` é provisória. O ML Engine calibra esse fator verificando em quais perfis o DNA convergiu mais rapidamente para comportamento estável.

---

## 6. Promoção de Anti-Padrões

### 6.1 Detecção de Candidatos à Promoção

```python
def find_anti_pattern_promotion_candidates(profile_id):
    """
    Detecta grupos de anti-padrões específicos que compartilham
    uma ou mais dimensões constantes, sugerindo que a dimensão
    variável é irrelevante para explicar o baixo desempenho.
    (DECISIONS #076)
    """
    specific_patterns = db.query("""
        SELECT * FROM knowledge.anti_patterns
        WHERE profile_id = %s
          AND is_general = false
          AND state = 'confirmed'
          AND confirmation_count >= %s
    """, [profile_id, MIN_CONFIRMATIONS_FOR_PROMOTION])

    # Agrupar por dimensões constantes
    # Ex: todos os anti-padrões com emotional_trigger='urgency'
    # têm narrative_arc variado → trigger é o fator explicativo
    candidates = cluster_by_constant_dimensions(specific_patterns)

    for candidate in candidates:
        if candidate['sample_size'] >= PROMOTION_SAMPLE_THRESHOLD:
            yield {
                'constant_dimensions': candidate['constant_dims'],
                'null_dimensions': candidate['variable_dims'],  # serão NULL no geral
                'source_ids': candidate['specific_pattern_ids'],
                'confidence': candidate['confidence']
            }
```

### 6.2 Proposta de Anti-Padrão Geral

O ML Engine **não escreve em `knowledge.anti_patterns`**. Ao identificar um candidato à promoção, persiste uma proposta em `ml.anti_pattern_proposals`. (DECISIONS #085)

```python
def propose_anti_pattern_promotion(profile_id, candidate):
    db.insert('ml.anti_pattern_proposals', {
        'profile_id':           profile_id,
        'network':              candidate['constant_dimensions'].get('network'),
        'narrative_arc':        candidate['constant_dimensions'].get('narrative_arc'),
        'emotional_trigger':    candidate['constant_dimensions'].get('emotional_trigger'),
        'length_bucket':        candidate['constant_dimensions'].get('length_bucket'),
        'voice_register':       candidate['constant_dimensions'].get('voice_register'),
        'cta_style':            candidate['constant_dimensions'].get('cta_style'),
        # Dimensões variáveis ficam como NULL — são os campos acima não preenchidos
        'promotion_source_ids': candidate['source_ids'],
        'sample_size':          candidate['sample_size'],
        'confidence':           candidate['confidence'],
        'avg_performance_ratio': candidate['avg_performance_ratio'],
        'produced_by_run':      current_run_id,
        'status':               'pending'
    })
```

O Knowledge Engine tem job periódico que consome propostas `status = 'pending'`, valida os critérios mínimos e cria o anti-padrão geral em `knowledge.anti_patterns` — atualizando a proposta para `status = 'applied'`. O princípio P2 é preservado integralmente: o ML Engine aprende e sugere; o Knowledge Engine decide e aplica.

---

## 7. Agregação de Padrões Globais

### 7.1 O que são Padrões Globais

`knowledge.global_patterns` contém padrões genéricos agregados anonimamente de todos os perfis ativos. Usados exclusivamente para bootstrap de novos perfis (cold start). Nunca contêm dados individuais identificáveis. (DECISIONS #055)

### 7.2 Processo de Agregação (Job Mensal)

```python
def aggregate_global_patterns():
    """
    Agrega padrões de performance anônimos por nicho + rede.
    Requisitos de privacidade: mínimo de K perfis distintos
    para qualquer padrão ser incluído (K provisório — DECISIONS #062).
    """
    patterns = db.query("""
        SELECT
          p.niche,
          pub.network,
          dp.narrative_arc,
          dp.emotional_trigger,
          dp.length_bucket,
          dp.cta_style,
          AVG(pub.ctr) AS avg_ctr,
          AVG(pub.conversions::float / NULLIF(pub.clicks, 0)) AS avg_conv_rate,
          COUNT(DISTINCT s.profile_id) AS profile_count,
          COUNT(*) AS publication_count
        FROM stories.publications pub
        JOIN stories.stories s ON pub.story_id = s.id
        JOIN campaigns.decision_packages dp ON s.decision_package_id = dp.id
        JOIN campaigns.campaigns c ON dp.campaign_id = c.id
        JOIN profiles.affiliate_profiles p ON c.profile_id = p.id
        WHERE pub.published_at > NOW() - INTERVAL '90 days'
          AND s.quality_score >= 70
          AND pub.ctr IS NOT NULL
        GROUP BY p.niche, pub.network, dp.narrative_arc,
                 dp.emotional_trigger, dp.length_bucket, dp.cta_style
        HAVING COUNT(DISTINCT s.profile_id) >= %(min_profiles)s
    """, {'min_profiles': MIN_PROFILES_FOR_GLOBAL_PATTERN})

    # Marcar versões anteriores como inativas
    # Inserir novas versões com valid_from = NOW()
    ...
```

---

## 8. Operação e Agendamento

### 8.1 Jobs e Frequência

| Job | Frequência | Horário | Motivo |
|---|---|---|---|
| `calibrate_is_params` | Semanal | Domingo 02:00 | Acumular dados da semana |
| `calibrate_cps_weights` | Semanal | Domingo 02:30 | Após calibração de IS |
| `calibrate_qos_threshold` | Semanal | Domingo 03:00 | Após calibração de IS |
| `update_dna_queue` | Diário | 03:00 | Processar fila de DNA |
| `promote_anti_patterns` | Semanal | Segunda 01:00 | Análise de padrões da semana |
| `aggregate_global_patterns` | Mensal | Dia 1 do mês, 04:00 | Dados estáveis do mês anterior |
| `detect_calibration_anomalies` | Diário | 06:00 | Verificar saúde dos parâmetros |

Todos os jobs são idempotentes — podem ser re-executados sem efeito colateral indesejado.

### 8.2 Aplicação de Parâmetros Calibrados

Os serviços de produção não leem parâmetros de variáveis de ambiente — leem de `ml.calibration_params` com cache Redis (TTL 1 hora). Quando o ML Engine publica nova calibração, a próxima expiração de cache nos serviços de produção aplica os novos valores automaticamente.

```typescript
// Knowledge Engine — exemplo de leitura de parâmetro calibrado
async function getISDecayRate(niche: string): Promise<number> {
  const cacheKey = `ml:decay_rate:${niche}`;
  const cached = await redis.get(cacheKey);
  if (cached) return parseFloat(cached);

  const param = await db.queryOne(`
    SELECT value FROM ml.calibration_params
    WHERE param_name = 'is_decay_base'
      AND (niche = $1 OR niche IS NULL)
      AND is_active = true
    ORDER BY niche NULLS LAST
    LIMIT 1
  `, [niche]);

  const value = param?.value ?? 0.015; // fallback para placeholder
  await redis.setex(cacheKey, 3600, value.toString());
  return value;
}
```

### 8.3 Rollback de Calibração

Se uma calibração produz comportamento anômalo detectado pelo job `detect_calibration_anomalies`, o rollback é imediato:

```sql
-- Desativar calibração atual
UPDATE ml.calibration_params
SET is_active = false, valid_until = NOW()
WHERE param_group = 'is_formula' AND is_active = true;

-- Reativar versão anterior
UPDATE ml.calibration_params
SET is_active = true, valid_until = NULL
WHERE id = :previous_version_id;
```

Cache Redis invalidado após rollback — serviços de produção carregam versão anterior em até 60 segundos.

---

## 9. Detecção de Anomalias de Calibração

O job diário `detect_calibration_anomalies` verifica:

| Anomalia | Critério | Ação |
|---|---|---|
| IS médio da plataforma caiu >20% em 7 dias | Monitorar IS de todos os perfis ativos | Alerta para engenharia |
| Taxa de aprovação de QS caiu >15% | % histórias com QS≥70 vs. semana anterior | Alerta + verificar mudança de prompt |
| CPS não prediz mais o resultado real | Correlação CPS×resultado cai abaixo de threshold | Recalibração imediata de pesos |
| DNA de perfil divergiu >30% em 1 semana | Similaridade entre DNA semanal consecutivo | Investigar mudança de comportamento ou dado corrompido |
| Anti-padrão geral bloqueando >10% das gerações | Cobertura do anti-padrão no total de Decision Packages | Revisar critério de promoção |

---

## 10. Dados de Treinamento e Volume Mínimo

Todos os valores de volume mínimo são provisórios — DECISIONS #062.

| Calibração | Volume mínimo para primeira calibração | Volume para re-calibração |
|---|---|---|
| IS decay rates | 500 publicações com analytics completos | 200 novas publicações desde última calibração |
| CPS weights | 50 campanhas com histórico de 30+ dias | 20 novas campanhas encerradas |
| QS threshold | 1.000 histórias com QS + CTR | 500 novas histórias |
| DNA update por perfil | 20 publicações com analytics | 10 novas publicações desde último update |
| Promoção de anti-padrão | 20 anti-padrões específicos no mesmo cluster | — |
| Global patterns | 10 perfis distintos por padrão | — |

Quando o volume mínimo não é atingido, o parâmetro permanece no valor placeholder. O ML Engine registra em `ml.calibration_runs` que a calibração foi `skipped` por volume insuficiente.

---

## 11. Casos Extremos

### CE-ML-001: Primeira semana de operação — sem dados para calibrar
**Comportamento:** todos os jobs retornam `skipped` por volume insuficiente. Todos os parâmetros permanecem no valor placeholder. O sistema opera normalmente com placeholders — eles foram escolhidos como valores razoáveis de partida.

### CE-ML-002: Calibração sugere mudança drástica de threshold de IS (ex: de 81 para 55)
**Comportamento:** mudanças >20% em thresholds críticos disparam alerta para revisão manual. O ML Engine não aplica automaticamente — gera um `calibration_run` com status `pending_review` e notifica a equipe de engenharia. Aplicação manual após validação.

### CE-ML-003: Campanha com 10.000 publicações distorce os pesos do CPS
**Comportamento:** outliers são detectados e excluídos da calibração (IQR ou percentil de corte). Um perfil com volume muito acima da média não deve dominar os pesos calibrados para a plataforma inteira.

### CE-ML-004: Anti-padrão geral promovido incorretamente bloqueia geração válida
**Comportamento:** o job `detect_calibration_anomalies` detecta cobertura excessiva. Engenharia reverte a promoção usando o `promotion_source_ids` para identificar quais anti-padrões específicos embasaram o geral — e redefine o critério de promoção para aquele cluster.

### CE-ML-005: Job de calibração falha no meio da execução
**Comportamento:** todos os jobs são idempotentes e transacionais. Se falhar após atualizar 5 de 10 parâmetros, o estado inconsistente é detectado na próxima execução, que re-processa todos os parâmetros do grupo. Sem estado parcialmente aplicado em produção.

---

## 12. Possíveis Melhorias Futuras

1. **Calibração por nicho:** atualmente calibração é global. Em V2, com volume suficiente por nicho, parâmetros específicos por nicho (ex: decay mais rápido em nichos de tendência como moda).

2. **Calibração em tempo quase-real (streaming):** para métricas que mudam rapidamente (tendências sazonais), jobs semanais podem ser muito lentos. Um pipeline de streaming (Kafka + Spark Streaming) permitiria atualização de parâmetros em horas, não dias.

3. **Modelo de previsão de CTR:** em vez de calibrar thresholds manualmente, treinar um modelo que preveja CTR diretamente a partir do Decision Package + DNA. O IS seria a probabilidade estimada pelo modelo — mais preciso que a fórmula atual.

4. **Feedback explícito do usuário como sinal de treinamento:** quando o usuário rejeita uma história no Modo Revisão, esse sinal pode ser incorporado como dado de treinamento negativo — além dos dados de performance de publicações.

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | ML Engine opera em schema `ml` separado — nunca escreve em tabelas de usuário; propõe anti-padrões via `ml.anti_pattern_proposals`; KE aplica em `knowledge.anti_patterns` (DECISIONS #085) |
| 2026-07-11 | Toda calibração é versionada — rollback possível sem deploy |
| 2026-07-11 | Serviços de produção leem parâmetros de `ml.calibration_params` via Redis cache (TTL 1h) |
| 2026-07-11 | Jobs são idempotentes e transacionais — sem estado parcialmente aplicado |
| 2026-07-11 | Mudanças >20% em thresholds críticos requerem revisão manual antes de aplicação |
| 2026-07-11 | Volume mínimo por calibração definido como provisório — calibrado com dados reais |
| 2026-07-11 | ML Engine não tem acesso ao Event Bus de produção — separação aprendizado × ação |
| 2026-07-11 | Anti-padrões gerais: ML Engine propõe via `ml.anti_pattern_proposals`; KE aplica (DECISIONS #085) |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aprovado com separação ML/KE preservada integralmente*
