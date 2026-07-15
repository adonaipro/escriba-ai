# 17 — Roadmap

> *"O roadmap não é um calendário. É uma sequência de apostas ordenadas por risco e aprendizado."*

---

## Objetivo deste Documento

Definir a sequência de evolução da [PLATAFORMA]: o que entra em cada versão, por quê nessa ordem, e quais critérios determinam a graduação entre versões. Este documento também define os planos e preços (DECISIONS #022) e o plano de execução do projeto paralelo de LGPD (DECISIONS #024).

---

## 1. Filosofia do Roadmap

**R1 — O MVP valida uma hipótese, não entrega um produto completo**
O MVP existe para responder uma pergunta: "afiliados pagam por uma plataforma que descobre e escala padrões de compra automaticamente?" Tudo que não ajuda a responder essa pergunta não entra no MVP.

**R2 — Cada versão libera a próxima**
V1 só começa quando o MVP confirma que a hipótese central é válida (usuários pagam e voltam). V2 só começa quando V1 prova que a plataforma tem valor além do caso básico. Versões não são calendário — são apostas que dependem de evidência anterior.

**R3 — Arquitetura não bloqueia versões futuras**
Todas as interfaces, contratos e extensões de V1/V2 são previstas na arquitetura do MVP — sem bloquear o lançamento. Adicionar Amazon, imagens, multi-rede ou Kafka em V1/V2 é ativar o que já existe na arquitetura, não refatorar o que foi feito.

**R4 — Débitos técnicos planejados são aceitos conscientemente**
O MVP inclui simplificações conhecidas que serão resolvidas em V1. Elas são documentadas aqui — não são dívida acidental, são decisões de trade-off deliberadas.

---

## 2. Versões e Fases

```
MVP ──────────────── V1 ─────────────── V2 ─────────── V3+
│                    │                  │               │
│ Valida o core      │ Expande escopo   │ Aprofunda IA  │ Enterprise
│ Shopee + Threads+X │ + MercadoLivre  │ + Amazon      │ + Multi-tenant
│ Texto puro         │ + Imagens        │ + Persona 4   │ + SOC 2
│ Trial → Pago       │ + SSE           │ + Kafka       │ + Internacional
│                    │ + Prompt CI/CD  │ + EKS         │
```

---

## 3. MVP — Validação do Core

### 3.1 Escopo

O MVP valida a hipótese central: **descoberta automática de padrões de compra + escala automática gera resultado mensurável para afiliados.**

**O que entra no MVP:**

| Componente | Escopo |
|---|---|
| Redes sociais | Threads + X (Twitter) |
| Marketplaces | Shopee apenas |
| Formato de conteúdo | Texto puro (sem imagens ou vídeos) |
| Decision Package | 12 dimensões completas |
| Intelligence Score | Escala 0–100 com decaimento |
| Quality Score | 7 dimensões + disqualifiers |
| Motor TESTE | Completo (geração, publicação, coleta, aprendizado) |
| Motor ESCALA | Completo (escala, monitoramento, saturação, pausa) |
| Knowledge Engine | Completo (IS, QS, DNA, anti-padrões, learnings) |
| ML Engine | Calibração semanal de parâmetros |
| Story Engine | Geração + avaliação (gpt-4o + gpt-4o-mini) |
| Scheduling Engine | Síncrono (sem cache próprio) |
| Dashboard | Home + Campanhas + Aprendizados |
| Autenticação | JWT RS256 + refresh token rotation |
| Trial | 14 dias, sem cartão de crédito |
| Planos | Starter / Growth / Scale (ver seção 7) |
| Infraestrutura | AWS ECS Fargate + PostgreSQL + Redis + BullMQ |
| Segurança | Controles do Documento 16 completos |
| LGPD | Compliance obrigatório (projeto paralelo, ver seção 8) |

**O que não entra no MVP:**

| Item | Quando entra |
|---|---|
| Imagens e vídeos | V1 (IContentProvider) |
| MercadoLivre | V1 |
| Amazon | V2 (condicionado à solução de conversão) |
| SSE / WebSockets | V1 |
| Escala multi-rede automática | V2 |
| Momento da Compra (13ª dimensão) | V2+ |
| Story sub-arcs específicos | V1+ |
| Persona 4 (Gestor/Agência) | V2/V3 |
| Pentest externo formal | Pré-V1 (quando há usuários pagantes) |
| Scheduling Engine com cache | V1 |
| Kafka | V2 |
| EKS | V2+ |
| Revalidação rápida após adiamento | V2+ |

### 3.2 Itens de Engenharia Obrigatórios no MVP

Além das features de produto, os seguintes itens de engenharia são obrigatórios no MVP:

- **Dependency scanning no CI/CD:** `npm audit` + `pip-audit` bloqueando merge em vulnerabilidades críticas/altas (DECISIONS #096)
- **Prompts versionados como código:** estrutura `prompts/generation/v{N}.ts` desde o primeiro commit — o MVP nasce com esse padrão (DECISIONS #084)
- **Flyway migrations:** migrações de banco versionadas e testadas desde o dia 1
- **Plugin Registry:** arquitetura de providers completa, mesmo com apenas Threads, X e Shopee ativos
- **Feature flags:** Amazon e MercadoLivre implementados mas desabilitados via flag (DECISIONS #080)
- **Checklist de lançamento de segurança:** todos os 17 itens do Documento 16 verificados antes de qualquer usuário real

### 3.3 Critérios de Graduação do MVP para V1

O MVP é concluído quando **todos** os critérios abaixo forem atingidos:

| Critério | Métrica |
|---|---|
| Conversão trial → pago | ≥ 25% dos usuários que completam o trial convertem |
| Retenção | ≥ 60% dos usuários pagantes atingem o mês 3 |
| Engajamento | ≥ 70% dos usuários pagantes têm campanha ativa no mês 2 |
| Resultado mensurável | ≥ 50% dos usuários com ≥ 30 dias de uso possuem ao menos 1 padrão em estado Promising (IS ≥ 61) ou superior |
| Estabilidade técnica | < 2 incidentes P1/P2 por mês nos últimos 3 meses |

Esses critérios são revisados antes do início do desenvolvimento — os valores numéricos são placeholders a confirmar com o contexto de mercado no momento do lançamento.

---

## 4. V1 — Expansão de Escopo

V1 expande o escopo após confirmar que a hipótese central do MVP foi validada.

### 4.1 Features de V1

**Marketplace:**
- MercadoLivre: `MercadoLivreAdapter` implementado e habilitado (feature flag ativada)
- Atribuição de conversão testada e validada no MercadoLivre antes da ativação

**Formato de conteúdo:**
- IContentProvider: primeiro provider visual habilitado (Stability AI ou DALL-E)
- Story Engine agora consulta IContentProvider — histórias com imagem são geradas quando o provider está disponível
- Decision Package mantém os 12 campos originais; imagem é uma propriedade do output, não uma nova dimensão

**UX e Performance:**
- SSE (Server-Sent Events) para substituir polling de operações assíncronas (`GET /api/operations/:id` permanece como fallback)
- Scheduling Engine com cache em memória (atualizado a cada hora), eliminando queries em tempo real de horários
- Story sub-arcs: Knowledge Engine começa a registrar sub-arcos emergentes dentro dos 8 arcos base (DECISIONS #048)

**Arquitetura:**
- Prompts em CI/CD: processo de revisão e deploy de prompts via PR documentado e operacional
- Pentest externo formal executado antes da abertura do V1 para o público amplo

**Analytics:**
- Dashboard com período relativo configurável
- Comparação de performance entre períodos
- Export de dados (preparação para crescimento do Direito de Portabilidade LGPD)

### 4.2 Itens Técnicos de V1

| Item | Decisão de origem |
|---|---|
| Scheduling Engine com cache | DECISIONS #038 |
| SSE para operações assíncronas | Evolução de DECISIONS #077 |
| MercadoLivre habilitado | DECISIONS #080 |
| IContentProvider (imagens) | DECISIONS #035 |
| Story sub-arcs em registro | DECISIONS #048 |
| Comunicação interna com TLS | DECISIONS #005 (Documento 16) |

### 4.3 Critérios de Graduação de V1 para V2

| Critério | Métrica |
|---|---|
| Expansão de mercado | ≥ 2 marketplaces ativos com usuários em escala |
| Retenção longa | ≥ 50% dos usuários pagantes atingem o mês 6 |
| Uso de imagens | ≥ 30% das publicações utilizam conteúdo visual |
| Volume | Base de usuários pagantes que justifica investimento em infra de maior complexidade |

---

## 5. V2 — Aprofundamento de Inteligência

V2 aprofunda a inteligência da plataforma e expande para casos de uso mais sofisticados.

### 5.1 Features de V2

**Inteligência:**
- **Momento da Compra:** 13ª dimensão do Decision Package — etapa da jornada de compra da audiência (DECISIONS #049). O Story Engine passa a selecionar arcos narrativos adequados ao estágio identificado pelo Knowledge Engine.
- **Revalidação rápida:** quando IS decaiu exclusivamente por tempo (não por queda de performance real) e a queda é leve, a plataforma realiza 2–3 publicações de revalidação em vez de reiniciar ciclo completo de TESTE (DECISIONS #059)
- **Escala multi-rede automática:** Knowledge Engine propõe escala multi-rede e executa quando aprovado, usando conhecimento da rede original como bootstrap acelerado (DECISIONS #058)
- **Meta-aprendizado Nível 2:** modelo de causalidade contextual — "por que histórias vendem em quais contextos, públicos e momentos" (DECISIONS #052)

**Marketplace:**
- Amazon Associates: condicionado à existência de solução robusta para coleta automatizada de conversões. Se solução técnica disponível, `AmazonAdapter` é habilitado em V2. Se não houver solução, entra em V3.
- Feature flag `amazon.enabled` passa para `true` apenas após teste de integração bem-sucedido

**Infraestrutura:**
- **Kafka:** substituição do BullMQ por Kafka para Event Bus (DECISIONS #027). Os contratos de eventos já são compatíveis — a mudança é de transporte, não de interface.
- **EKS:** migração de ECS Fargate para EKS quando o volume justificar a complexidade operacional adicional (DECISIONS #028)

**Produto:**
- Persona 4 (Gestor/Agência): multi-tenancy, múltiplas contas gerenciadas, permissionamento por cliente (DECISIONS #009, #098). Esta expansão **não está comprometida com V2** — entra no roadmap oficial somente após análise arquitetural dedicada que avalie impacto em schema de banco, modelo de autorização, billing e UX. O início dessa análise é uma entrega de V1, não uma decisão do blueprint.
- Bug Bounty Program: programa de divulgação responsável de vulnerabilidades

### 5.2 Pré-requisito para V2

A feature **Momento da Compra** requer que o banco de dados do MVP já tenha coletado dados de contexto suficientes (horário, dia, produto, nicho, audiência estimada) para que o ML Engine possa treinar o modelo de identificação de estágio. Esse requisito foi incorporado ao schema do banco no MVP (DECISIONS #052 — o MVP registra contexto suficiente mesmo que não processe no Nível 2).

---

## 6. V3+ — Enterprise e Escala Global

V3 é especulativo e depende dos aprendizados de V2. Direções prováveis:

- **SOC 2 Type II:** certificação formal de controles de segurança para clientes enterprise
- **Multi-idioma:** expansão para inglês e espanhol; suporte a redes sociais internacionais
- **Marketplace internacional:** Shopee internacional, TikTok Shop, outras plataformas de afiliado
- **Redes adicionais:** TikTok, Instagram (via API), Bluesky
- **Detecção de anomalia comportamental:** ML Engine aprende padrões de uso normal e alerta quando o comportamento muda (possível sinal de comprometimento ou oportunidade)
- **API pública:** para integrações com ferramentas de terceiros por usuários avançados

V3 não é roadmap — é horizonte. As decisões de V3 dependem de quem são os usuários de V2 e o que eles precisam.

---

## 7. Planos e Preços

**Princípio:** preços devem ser viáveis para o afiliado brasileiro e sustentáveis para a plataforma considerando os custos de infraestrutura e IA.

**Custo de referência (do Documento 14):**
- ~R$0,11 por história aprovada (caso típico)
- ~R$0,32 por história aprovada (pior caso — 3 retries + avaliação)

### 7.1 Estrutura de Planos (Placeholders — ver DECISIONS #022)

| Plano | Perfis sociais | Publicações/mês | Campanhas ativas | Preço placeholder |
|---|---|---|---|---|
| **Starter** | 1 | 60 | 3 | R$ 97/mês |
| **Growth** | 3 | 200 | 10 | R$ 197/mês |
| **Scale** | 8 | 600 | Ilimitadas | R$ 397/mês |

**Notas sobre os placeholders:**
- Os limites de publicações serão calibrados com base em comportamento real de usuários (padrão de uso, taxa de aprovação, volume de retries)
- Os preços serão definidos com base em custos reais de infraestrutura + margem viável + benchmarks de mercado para ferramentas SaaS de afiliado no Brasil
- A calibração final é obrigatória antes do lançamento (DECISIONS #022)

### 7.2 Lógica de Limites

**"Perfis sociais":** número de contas de redes sociais conectadas. Um usuário com Threads + X = 2 perfis sociais.

**"Publicações/mês":** total de histórias publicadas com sucesso em qualquer rede e campanha. A distribuição entre campanhas é gerenciada automaticamente pelo Scheduling Engine + Campaign Priority Score.

**"Campanhas ativas":** campanhas no estado TESTING ou SCALING. Campanhas PAUSED não contam para o limite.

### 7.3 Trial

- Duração: 14 dias
- Sem cartão de crédito (DECISIONS #017)
- **Plano e limites do trial:** hipótese de negócio a validar durante o MVP. O formato específico — qual plano o trial simula, quantas publicações permite, como comunica os limites ao usuário — deve ser testado empiricamente com dados reais de conversão, não fixado no blueprint. (DECISIONS #097)

O único compromisso fixo do trial é a duração (14 dias) e a ausência de cartão de crédito. Todo o resto é variável de experimento.

### 7.4 Gestão de Capacidade no Plano

Quando o usuário está próximo do limite de publicações (> 80% do plano):
- Banner contextual na tela de Campanhas (DECISIONS #071)
- Entidade comunica proativamente a consequência futura (não um alerta de urgência)
- Scheduling Engine prioriza campanhas com maior CPS ao distribuir as publicações restantes

Quando o limite é atingido:
- Novas histórias não são agendadas
- Campanhas ativas permanecem visíveis mas sem novos agendamentos
- O aprendizado continua sobre publicações já feitas

---

## 8. Projeto Paralelo: LGPD

A conformidade com a LGPD é obrigatória desde o MVP e tratada como projeto paralelo com suas próprias entregas e dependências (DECISIONS #024).

### 8.1 Entregas Obrigatórias Antes do Lançamento do MVP

| Entrega | Responsável | Prazo |
|---|---|---|
| Política de Privacidade redigida e revisada por advogado | Fundador + Advogado | Pré-launch |
| Termos de Uso redigidos e revisados por advogado | Fundador + Advogado | Pré-launch |
| DPA assinado com AWS | Fundador | Pré-launch |
| DPA assinado com OpenAI | Fundador | Pré-launch |
| DPA assinado com Anthropic | Fundador | Pré-launch |
| DPO nomeado (pode ser o próprio fundador) | Fundador | Pré-launch |
| Registro de operações de tratamento (Art. 37) | Fundador | Pré-launch |
| Mecanismo de exclusão de conta testado end-to-end | Engenharia | Pré-launch |
| Mecanismo de exportação de dados (GET /api/user/data) | Engenharia | Pré-launch |
| Base legal documentada para cada dado tratado | Fundador + Advogado | Pré-launch |

### 8.2 Evolução da Conformidade por Versão

| Versão | Item adicional |
|---|---|
| V1 | Relatório de impacto à proteção de dados (RIPD) para novas features de IA |
| V1 | Revisão de DPAs com novos subprocessadores (se houver) |
| V2 | Revisão de conformidade para multi-tenancy (Persona 4 trata dados de múltiplos usuários) |
| V3+ | Engajamento de DPO externo especializado quando base de usuários crescer |

---

## 9. Débitos Técnicos Planejados

Simplificações conscientes do MVP com plano de resolução:

| Débito | Quando resolve | Decisão |
|---|---|---|
| Scheduling Engine síncrono (queries em tempo real) | V1 → cache em memória | DECISIONS #038 |
| BullMQ em vez de Kafka | V2 | DECISIONS #027 |
| ECS Fargate em vez de EKS | V2+ | DECISIONS #028 |
| GET /api/operations/:id (polling) em vez de SSE | V1 | DECISIONS #077 |
| Comunicação interna sem TLS | V1 | Documento 16 |
| Somente Shopee ativo | V1 (MercadoLivre), V2 (Amazon) | DECISIONS #080 |
| Texto puro (sem imagens) | V1 (IContentProvider) | DECISIONS #035 |
| Sem cache no Scheduling Engine | V1 | DECISIONS #038 |
| Calibração de parâmetros com dados reais | V1 (após 3 meses de dados) | DECISIONS #062 |

---

## 10. Evolução do Modelo de IA

| Versão | Mudança |
|---|---|
| MVP | gpt-4o (geração) + gpt-4o-mini (avaliação); fallback para Claude |
| V1 | Avaliação de modelos mais recentes (nova geração GPT/Claude); re-benchmark de custo × qualidade |
| V2 | Momento da Compra exige embedding de estágio de audiência — avaliar modelo de classificação próprio vs. prompt-based |
| V3+ | Fine-tuning em dados da plataforma (histórias aprovadas + rejeitadas) como candidato a substituir ou complementar gpt-4o |

**Processo de troca de modelo:** toda mudança de modelo de geração ou avaliação passa pelo mesmo processo de prompt como código (DECISIONS #084) — versionamento, PR, teste em staging, deploy controlado.

---

## 11. Riscos e Mitigações por Versão

### MVP
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Cold start: usuários não veem valor nos primeiros 14 dias | Alta | Alto | Em até 48 horas de uso, a plataforma comunica ao usuário que já começou a aprender sobre seu perfil — mesmo que utilizando conhecimento global do nicho como apoio. O objetivo é eliminar a sensação de "plataforma vazia" nos primeiros dias. A Entidade usa dados globais do nicho como ponto de partida explícito ("Com base em perfis semelhantes ao seu...") até que dados próprios do perfil estejam disponíveis. (DECISIONS #010, #099) |
| Taxa de conversão trial → pago abaixo de 25% | Média | Crítico | Investigar qual etapa do trial não demonstra valor; ajustar comunicação da Entidade ou timing de aprendizados |
| Abuso de trial (múltiplas contas) | Alta | Médio | E-mail verification + heurísticas de fingerprint + bloqueio IP (Documento 16, seção 8) |
| Rate limit do X na camada Basic (1.500 tweets/mês) | Alta | Médio | Comunicar limitação no onboarding; Scheduling Engine prioriza Threads quando capacidade X é limitada |
| Shopee altera API de conversão | Baixa | Alto | Arquitetura de adapter abstrai a mudança; adaptação em 1 sprint |

### V1
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Saturação de nicho: múltiplos afiliados no mesmo nicho usando os mesmos padrões | Média (quando a base cresce) | Médio | DECISIONS #011 — problema de escala, não de MVP. Investigar quando densidade por nicho justificar |
| Custo de geração de imagens aumenta custo total por publicação acima do sustentável | Média | Médio | IContentProvider com cache de imagens similares; geração apenas para publicações prioritárias |

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | Critérios de graduação MVP → V1: 5 métricas definidas; critério de resultado = IS ≥ 61 (Promising) em ≥ 50% dos usuários com ≥ 30 dias |
| 2026-07-11 | Preços placeholder: Starter R$97 / Growth R$197 / Scale R$397 — calibração obrigatória antes do lançamento |
| 2026-07-11 | Amazon V2 condicionado à existência de solução robusta de coleta de conversão — sem prazo fixo |
| 2026-07-11 | Trial: apenas duração (14d) e ausência de cartão são fixos — demais parâmetros são hipóteses a validar no MVP (DECISIONS #097) |
| 2026-07-11 | Persona 4 não comprometida com V2 — requer análise arquitetural dedicada antes de entrar no roadmap oficial (DECISIONS #098) |
| 2026-07-11 | Cold start: em até 48h de uso, plataforma comunica início de aprendizado usando conhecimento global do nicho como apoio (DECISIONS #099) |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aguardando aprovação*
