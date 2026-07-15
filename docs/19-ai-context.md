# 19 — AI_CONTEXT

> *"Modelos de linguagem são um dos componentes da plataforma. Um componente poderoso — mas um componente. A inteligência da plataforma emerge da combinação entre o modelo, o Knowledge Engine, as regras de negócio e o aprendizado acumulado. Nenhum desses elementos, sozinho, é a plataforma."*

---

## Objetivo deste Documento

Este documento define como a inteligência artificial é utilizada na [PLATAFORMA]: seus papéis, seus limites, as regras que governam seu uso, e os princípios que nenhum engenheiro, prompt ou feature pode violar. É a referência obrigatória para qualquer pessoa que implemente ou modifique features que envolvam modelos de linguagem, embeddings ou qualquer forma de inferência de IA.

---

## 1. O Princípio Fundamental: A IA Nunca Decide Sozinha

**Esta é a regra mais importante deste documento. Não tem exceções.** (DECISIONS #083)

A [PLATAFORMA] usa modelos de linguagem como um componente — não como o centro de decisão. Toda decisão de produto resulta de uma combinação entre:

```
Decisão de Produto =
    Regras de Negócio Explícitas      (o que nunca pode acontecer)
  + Knowledge Engine                  (o que os dados do perfil indicam)
  + Validações Estruturadas           (QS, DNA check, originality check)
  + Métricas e Embeddings Objetivos   (IS, similarity scores)
  + Modelo de Linguagem               (geração ou avaliação de conteúdo)
```

O modelo **gera** e **avalia** conteúdo. A plataforma **decide** o que publicar, quando, para qual campanha, com qual frequência, e o que aprender com o resultado.

### O que isso significa na prática

| Decisão | Quem decide | O modelo contribui como |
|---|---|---|
| Qual arco narrativo usar | Knowledge Engine (com dados do perfil) | Não contribui |
| Gerar o texto da história | Modelo (gpt-4o) | Executor principal |
| Se a história tem qualidade suficiente | Plataforma (QS ≥ 70) | Avalia dimensões de qualidade |
| Se a história viola princípios éticos | Plataforma (disqualifiers) | Detecta violações via avaliação |
| Se a história é original o suficiente | Plataforma (cosine similarity) | Não contribui |
| Se a história é consistente com o DNA | Plataforma (DNA check) | Não contribui |
| Qual campanha escalar | Knowledge Engine (IS ≥ 81) | Não contribui |
| Quando publicar | Scheduling Engine | Não contribui |
| O que é um anti-padrão | ML Engine → KE | Não contribui |
| O que o usuário vê como "Por quê?" | Knowledge Engine (pré-calculado) | Não contribui |

### A regra de ouro

Se um engenheiro está tentando fazer um modelo de linguagem **decidir** algo em vez de gerar/avaliar — isso é um sinal de que a feature está sendo implementada errado. A decisão pertence à plataforma; o modelo é chamado para contribuir com geração ou avaliação estruturada.

---

## 2. Arquitetura da Intelligence Layer

### 2.1 Diagrama de Fluxo de Geração

```
Story Engine
    ↓
Decision Package (12 dimensões)
    ↓
PromptAssembler
    ↓ (4 camadas compostas)
[Prompt Completo]
    ↓
IAIProvider → AIProviderRegistry → Modelo selecionado
    ↓
Conteúdo Gerado
    ↓
QS Evaluator (modelo separado, temperatura 0.1)
    ↓
[QS Score + Disqualifiers[]]
    ↓
Validações da Plataforma (originality, DNA, business rules)
    ↓
Decisão: Publicar / Retry / Rejeitar
```

### 2.2 Composição do Prompt (4 Camadas)

Todo prompt de geração é composto de 4 camadas em ordem fixa:

| Camada | Conteúdo | Estático/Dinâmico |
|---|---|---|
| 1 — Identidade da Entidade | Quem é a plataforma, como ela pensa, o que nunca faz | Estático (por versão de prompt) |
| 2 — DNA do Perfil | Voz, tom, padrões de alta performance do perfil específico | Dinâmico (por perfil + versão do DNA) |
| 3 — Decision Package | As 12 dimensões que especificam esta história | Dinâmico (por campanha + ciclo) |
| 4 — Restrições Ativas | Anti-padrões ativos, rejeições recentes, restrições de rede | Dinâmico (por contexto atual) |

Nenhuma camada pode ser omitida. Nenhum conteúdo do usuário entra diretamente no prompt — apenas dados processados e estruturados pelas camadas.

### 2.3 Modelos Usados por Tarefa

| Tarefa | Modelo | Temperatura | Justificativa |
|---|---|---|---|
| Geração de história (TESTE) | gpt-4o | 0.85 | Alta criatividade necessária para exploração |
| Geração de história (ESCALA) | gpt-4o | 0.60 | Menor variação para preservar padrão validado |
| Retry de geração | gpt-4o | +0.05 por retry | Progressivamente mais diverso a cada tentativa |
| Avaliação de QS | gpt-4o-mini | 0.10 | Alta consistência e previsibilidade; custo menor |
| Embeddings (DNA, similarity) | text-embedding-ada-002 | N/A | Vetorização de texto para busca semântica |

Qualquer mudança de modelo passa pelo processo de prompts como código (DECISIONS #084): nova versão, PR, teste em staging, deploy controlado.

### 2.4 Cadeia de Fallback

```
OpenAI gpt-4o
    ↓ (falha ou timeout)
Anthropic claude-sonnet-5
    ↓ (falha ou timeout)
Fila de retentativa (30 min) → nova tentativa com gpt-4o
```

Circuit breaker por provider: após N falhas consecutivas, o provider é marcado como `UNHEALTHY` e removido do pool por período de recuperação. O Plugin Registry gerencia o estado de saúde de todos os providers.

---

## 3. O que a IA Pode e Não Pode Fazer

### 3.1 Pode

- Gerar texto de histórias dentro dos parâmetros do Decision Package
- Avaliar histórias geradas e retornar scores estruturados
- Gerar embeddings para comparação semântica
- Detectar padrões linguísticos que correspondem a disqualifiers
- Produzir saída estruturada (JSON) para processamento determinístico posterior

### 3.2 Não Pode

- Decidir qual arco narrativo testar (isso é o Knowledge Engine)
- Decidir se uma campanha vai para ESCALA (isso é IS ≥ 81 + KE)
- Decidir quando publicar (isso é o Scheduling Engine)
- Aprender com dados de usuários (isso é o ML Engine em batch)
- Ter acesso a PII do usuário (ver seção 5)
- Ser o único critério de rejeição ou aprovação de qualquer conteúdo
- Modificar qualquer estado operacional da plataforma diretamente

### 3.3 Outputs Aceitos vs. Outputs que Exigem Validação Adicional

| Output do modelo | Tratamento pela plataforma |
|---|---|
| Texto da história (string) | Passa por QS evaluation + validações antes de qualquer uso |
| QS scores (0–100 por dimensão) | Aceitos como input para cálculo de QS total; threshold aplicado pela plataforma |
| Disqualifiers detectados (array) | Aceitos como trigger de rejeição; o modelo não precisa de "certeza" — qualquer flag aciona rejeição |
| JSON estruturado de avaliação | Validado contra schema antes de processamento — nunca confiado como "correto" sem validação |
| Embeddings (vetores) | Aceitos como representação; similaridade calculada pela plataforma, não pelo modelo |

---

## 4. Regras para Engenheiros de Prompt

### 4.1 Prompts São Código (DECISIONS #084)

Todo prompt de geração ou avaliação é tratado como código de produção:

```
prompts/
├── generation/
│   ├── v1.ts        ← versão ativa
│   ├── v2.ts        ← em desenvolvimento
│   └── index.ts     ← exporta versão ativa
├── evaluation/
│   ├── v1.ts
│   └── index.ts
└── system/
    ├── entity-identity.ts   ← Camada 1 (raramente muda)
    └── restrictions.ts      ← Camada 4 (gerada dinamicamente)
```

**Processo obrigatório para qualquer mudança de prompt:**
1. Criar nova versão (`v{N+1}.ts`) — nunca editar versão existente
2. Abrir Pull Request com descrição da mudança e justificativa
3. Revisar em pair (pelo menos 1 revisor adicional)
4. Testar em staging com amostra representativa de Decision Packages (mínimo 50 histórias)
5. Comparar QS médio e taxa de disqualifier entre versão antiga e nova
6. Deploy pelo mesmo pipeline de CI/CD do restante da aplicação
7. Monitorar métricas nas primeiras 24h após deploy

Mudanças pequenas (ortografia, clareza de instrução) seguem o mesmo processo — não há "mudanças menores" em prompts.

### 4.2 Como Nomear e Versionar

- Versão de prompt: `generation-v{N}` (ex: `generation-v2`)
- `model_version` armazenada em banco: `{provider}:{model}:{prompt_version}` (ex: `openai:gpt-4o:generation-v2`)
- Ao mudar o modelo mantendo o prompt: incrementa a versão do model_version mesmo sem nova versão de prompt
- Rollback: mudar a versão ativa no `index.ts` de volta para a anterior; fazer novo deploy

### 4.3 O Que Nunca Deve Entrar em um Prompt

| Nunca incluir | Por quê |
|---|---|
| Nome ou e-mail do usuário | PII — não deve sair da plataforma para provedores externos |
| IDs de usuário, perfil ou campanha | Desnecessário para a tarefa; expõe estrutura interna |
| Dados de performance (CTR, conversões) | Específicos demais; o DNA do perfil já captura padrões relevantes |
| Tokens OAuth ou credenciais | Óbvio, mas explícito |
| Dados de audiência identificáveis | PII potencial |
| Instruções de usuário em texto livre | Vetor de prompt injection |

(DECISIONS #082, Documento 16 seção 6.5)

### 4.4 Saída Estruturada Obrigatória para Avaliações

Prompts de avaliação (QS, disqualifiers) **devem** retornar JSON estruturado validado contra um schema TypeScript. Nunca confiar em parsing de texto livre para decisões de aprovação/rejeição.

```typescript
// Schema obrigatório para avaliação de QS
interface QSEvaluationOutput {
  scores: {
    narrative_coherence: number;       // 0-100
    tone_authenticity: number;         // 0-100
    product_relevance: number;         // 0-100
    cta_clarity: number;               // 0-100
    length_appropriateness: number;    // 0-100
    absence_of_cliches: number;        // 0-100
    originality: number;               // 0-100
  };
  disqualifiers: DisqualifierType[];   // [] se nenhum
  evaluation_confidence: number;       // 0-100: confiança do modelo na própria avaliação
}
```

Se o modelo retornar estrutura inválida: retry imediato com instrução explícita de formato. Máximo 2 retries de avaliação; se falhar, história é descartada nesse ciclo (sinal de geração inválida).

---

## 5. Privacidade e IA (PII Rules)

**PII nunca entra em prompts.** (DECISIONS #082, DECISIONS #093)

### 5.1 O que É e O que Não É PII para Este Contexto

| É PII (não entra no prompt) | Não é PII (pode entrar no prompt) |
|---|---|
| Nome do usuário | Nicho do produto (ex: "moda feminina") |
| E-mail do usuário | Arco narrativo (ex: "transformação") |
| IDs de usuário, perfil, campanha | Tom de voz (ex: "informal e próximo") |
| Dados de performance (CTR exato, comissões) | Comprimento alvo (ex: "longo") |
| Tokens OAuth | Estilo de CTA (ex: "interrogativo") |
| Dados de audiência identificáveis | Gatilho emocional (ex: "curiosidade") |
| Histórico de rejeições manuais | Restrições de conteúdo (ex: "sem urgência fabricada") |

O DNA do Perfil é composto de vetores e padrões de estilo — nunca de dados identificáveis. Quando o DNA é "injetado" no prompt, o que entra é uma representação destilada de padrões de escrita e performance, não dados brutos de usuário.

### 5.2 Prompts Não São Armazenados em Produção (DECISIONS #082)

O prompt completo expandido nunca é armazenado em banco de produção. Para reconstrução e diagnóstico, armazenam-se:
- `prompt_version`: versão do template (ex: `generation-v2`)
- `decision_package_id`: as 12 dimensões que parametrizaram o prompt
- `dna_version`: versão do DNA ativo no momento da geração

Com esses três elementos, qualquer engenheiro pode reconstruir o prompt exato em ambiente de desenvolvimento. Logs de prompts completos existem apenas em staging, com TTL de 24 horas.

### 5.3 O que Fazer se um Bug Envia PII ao Modelo

1. Identificar o escopo (quais chamadas foram afetadas; usar `request_id`)
2. Revogar/rotacionar as chaves de API afetadas se necessário
3. Notificar o DPO imediatamente
4. Avaliar obrigação de notificação LGPD (art. 48)
5. Corrigir o bug como P1 (bloqueante de deploy)
6. Documentar no post-mortem

---

## 6. Separação ML / KE / AI: Quem Faz O Quê

```
┌─────────────────────────────────────────────────────────────┐
│                     RUNTIME (por requisição)                │
│                                                             │
│  Story Engine → PromptAssembler → IAIProvider → Modelo      │
│                        (gera conteúdo)                      │
│                              ↓                              │
│              QS Evaluator → Modelo de avaliação             │
│                        (avalia conteúdo)                    │
│                              ↓                              │
│    Knowledge Engine → valida, decide, aprende, registra     │
│              (única entidade que modifica estado operacional)│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BATCH (jobs periódicos)                   │
│                                                             │
│  ML Engine → analisa dados históricos → calibra parâmetros  │
│           → propõe anti-padrões gerais (ml.proposals)       │
│                              ↓                              │
│    Knowledge Engine → consome propostas → aplica            │
└─────────────────────────────────────────────────────────────┘
```

**Fronteira mais importante:** o ML Engine e os modelos de linguagem de runtime são separados por **responsabilidade**, não por tecnologia. O ML Engine executa exclusivamente processos assíncronos de aprendizado, calibração e análise — em batch, fora do caminho crítico de requisições. Nenhuma decisão operacional em tempo real depende da execução do ML Engine durante uma requisição do usuário. Independentemente da tecnologia que o ML Engine venha a usar no futuro (regressão, embeddings, modelos de linguagem menores para classificação em batch), essa separação de responsabilidade permanece intacta. (DECISIONS #085, #102)

---

## 7. Métricas de Qualidade da Camada de IA

Estas métricas devem ser monitoradas em produção e em staging após cada deploy de nova versão de prompt:

| Métrica | O que mede | Alerta se |
|---|---|---|
| Taxa de aprovação de QS | % de histórias geradas com QS ≥ 70 na 1ª tentativa | < 60% |
| Taxa de disqualifier | % de histórias com algum disqualifier detectado | > 5% |
| Taxa de retry de avaliação | % de avaliações que precisaram retry por formato inválido | > 2% |
| Latência de geração (p95) | Tempo total do ciclo geração + avaliação | > 30s |
| Custo por história aprovada | Custo de API em R$ por história publicada | > R$0,50 |
| Taxa de fallback para Claude | % de chamadas que caíram para o provider secundário | > 10% em janela de 1h |

---

## 8. Evolução da IA por Versão

| Versão | Mudança planejada |
|---|---|
| MVP | gpt-4o + gpt-4o-mini; fallback para Claude; embeddings com text-embedding-ada-002 |
| V1 | Re-benchmark de modelos da nova geração; reavaliação de custo × qualidade; avaliação de modelos mais rápidos para QS |
| V2 | Momento da Compra (#049) — possível modelo de classificação de estágio de audiência; avaliação de fine-tuning com dados históricos da plataforma |
| V3+ | Fine-tuning em histórias aprovadas × rejeitadas; possível modelo próprio de avaliação treinado em dados da plataforma |

---

## 9. Checklist para Qualquer Feature que Envolva IA

Antes de qualquer PR que adicione ou modifique o uso de modelos de linguagem:

- [ ] A feature viola o princípio "IA nunca decide sozinha"? (Se sim: redesenhar)
- [ ] Algum dado de PII entra no prompt? (Se sim: remover antes de qualquer teste)
- [ ] O prompt está versionado em `prompts/{tipo}/v{N}.ts`?
- [ ] A saída do modelo é validada contra um schema antes de ser usada?
- [ ] O fallback para provider secundário foi testado?
- [ ] As métricas de qualidade foram medidas em staging (taxa de aprovação de QS, taxa de disqualifier)?
- [ ] Nenhum prompt completo é armazenado em banco de produção?
- [ ] O `model_version` está sendo registrado corretamente junto à história?
- [ ] O custo estimado por história foi avaliado? (ref: ~R$0,11 típico, ~R$0,32 pior caso)

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | IA nunca decide sozinha — modelos geram e avaliam; plataforma decide (DECISIONS #083) |
| 2026-07-11 | Prompts tratados como código — versionados, revisados, testados em staging, deployados via CI/CD (DECISIONS #084) |
| 2026-07-11 | PII nunca entra em prompts em nenhuma circunstância (DECISIONS #082, #093) |
| 2026-07-11 | Prompts não armazenados em produção — reconstrução via prompt_version + DP + DNA_version (DECISIONS #082) |
| 2026-07-11 | Saída estruturada obrigatória para avaliações — nunca parsing de texto livre para decisões |
| 2026-07-11 | Disqualifiers: postura conservadora — qualquer suspeita de violação ética rejeita a história; taxa de falsos positivos monitorada e calibrada (DECISIONS #101) |
| 2026-07-11 | ML Engine separado por responsabilidade: executa apenas em batch assíncrono; nenhuma decisão de runtime depende de sua execução (DECISIONS #102) |
| 2026-07-11 | Métricas de qualidade de IA monitoradas continuamente; alertas definidos por threshold |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aprovado*
