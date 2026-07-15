# 10 — Dashboards

> *"O usuário abre o app para ver o que aconteceu. Não para gerenciar o que vai acontecer."*

---

## Objetivo deste Documento

Definir a arquitetura de informação, a hierarquia visual, os componentes e os estados de todas as telas principais da [PLATAFORMA]. Este documento é a especificação de produto que qualquer designer ou desenvolvedor frontend pode usar como referência única para implementar a interface.

---

## 1. Princípios do Dashboard

Estes princípios derivam das decisões aprovadas nos documentos 05 (UX) e 09 (Knowledge Engine) e governam toda decisão de interface.

**P1 — Resultado antes de processo**
O usuário vê primeiro o que a plataforma produziu (comissões, cliques, conversões), depois o que está em andamento (campanhas), depois o que foi aprendido (insights). Nunca o contrário. (DECISIONS #044)

**P2 — Contexto obrigatório**
Nenhum número aparece sozinho. Cada métrica vem acompanhada de sua referência: comparação com período anterior, comparação com média do nicho, ou tendência. Um número sem contexto é ruído. (DECISIONS do doc 05)

**P3 — Impacto ordena, cronologia não**
Insights e aprendizados são exibidos por relevância para os resultados do usuário — o padrão mais impactante aparece primeiro, independentemente de quando foi descoberto. (DECISIONS #045)

**P4 — Memória visível**
A plataforma mostra que acumula e evolui conhecimento. Padrões têm estados visíveis: ativo, em confirmação, expirado. O usuário percebe que a plataforma aprende ao longo do tempo — não apenas executa. (DECISIONS #047)

**P5 — Complexidade zero na superfície**
Nenhum termo arquitetural, nenhum ID interno, nenhum score técnico, nenhuma menção a componentes internos. O Intelligence Score nunca aparece como número. A Entidade fala — a arquitetura não. (DECISIONS #039, #040, #041)

**P6 — Silêncio é o padrão**
A Entidade só aparece no Dashboard quando tem algo de valor a comunicar. Processamento em andamento, publicações individuais, coleta de dados — tudo invisível por padrão. (DECISIONS #043)

---

## 2. Mapa de Telas

```
App
│
├── Home (Dashboard principal)
│   ├── Resumo de resultado de negócio
│   ├── Campanhas ativas (cards)
│   └── Feed da Entidade (quando há algo relevante)
│
├── Campanhas
│   ├── Lista de campanhas (com filtros)
│   └── Detalhe de campanha
│       ├── Métricas da campanha
│       ├── Aprendizados desta campanha
│       ├── Publicações recentes (colapsado)
│       └── Ações disponíveis
│
├── Criar Campanha (fluxo de 3 passos)
│
├── Aprendizados
│   ├── Padrões ativos (ordenados por impacto)
│   ├── Padrões em confirmação
│   └── Padrões expirados
│
└── Configurações
    ├── Contas conectadas
    ├── Plano e uso
    └── Preferências
```

---

## 3. Home — Dashboard Principal

### 3.1 Estrutura e Hierarquia

```
┌─────────────────────────────────────────┐
│  [PLATAFORMA]              Jul 2026 ▾  │  ← Seletor de período
├─────────────────────────────────────────┤
│                                         │
│  RESULTADO DO MÊS                       │  ← Bloco 1: Negócio (primeiro)
│  ─────────────────────────────────────  │
│  R$ 3.240                               │
│  em comissões · +23% vs. junho          │
│                                         │
│  342 cliques · 18 conversões · CTR 5.3% │
│  ─────────────────────────────────────  │
│                                         │
│  CAMPANHAS ATIVAS                       │  ← Bloco 2: Campanhas (segundo)
│  ─────────────────────────────────────  │
│  [Card] Produto A · Em escala · Threads │
│  [Card] Produto B · Em teste · X        │
│  [Card] Produto C · Em teste · Threads  │
│                                         │
│  [+ Nova campanha]                      │
│  ─────────────────────────────────────  │
│                                         │
│  🧠 "Percebi que histórias de           │  ← Bloco 3: Entidade (terceiro,
│  transformação estão convertendo         │    apenas quando relevante)
│  melhor esta semana."  [Por quê?]       │
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 Bloco 1 — Resultado do Mês

**Métrica principal:** valor em comissões no período selecionado.  
**Referência obrigatória:** variação percentual vs. período anterior (+23% vs. junho).  
**Métricas secundárias:** cliques · conversões · CTR — em linha, sem hierarquia visual excessiva.

**Períodos disponíveis:** esta semana / este mês / últimos 3 meses / desde o início.

**Período padrão inteligente:** para contas com menos de 30 dias, o período padrão é automaticamente "desde o início" — evita que o usuário veja um mês incompleto com poucos dados e interprete como baixa performance. Após 30 dias, o padrão muda para "este mês". Essa lógica é invisível ao usuário.

**Estados do Bloco 1:**

*Estado normal:*
```
R$ 3.240
em comissões · +23% vs. junho
342 cliques · 18 conversões · CTR 5.3%
```

*Estado sem dados suficientes (< 7 dias de uso):*
```
Ainda coletando dados.
Seus primeiros resultados aparecerão aqui.
```

*Estado sem comissões no período:*
```
0 comissões este mês.
3 histórias publicadas · 47 cliques · CTR 4.1%
```
*(Mostra progresso mesmo sem comissão — o trabalho está acontecendo)*

### 3.3 Bloco 2 — Campanhas Ativas

Cards horizontais roláveis (mobile) ou grid 2 colunas (desktop). Ordenados por Campaign Priority Score — campanhas de maior prioridade aparecem primeiro.

**Anatomia de um card de campanha:**

```
┌──────────────────────────────────────────┐
│ Produto A                    Em escala ● │
│ Shopee · Threads                         │
│                                          │
│ R$ 1.240 este mês  ↑ 18% vs. semana ant. │
│ CTR: 7.8%  ·  23 conversões              │
└──────────────────────────────────────────┘
```

**Status visual dos cards:**

| Estado | Indicador | Cor |
|---|---|---|
| Em escala | ● Em escala | Verde |
| Em teste | ● Em teste | Azul |
| Monitorando (declínio silencioso) | ● Em escala | Âmbar sutil (apenas se declarado) |
| Aguardando decisão (scale eligible) | ● Oportunidade | Roxo |
| Pausada | ○ Pausada | Cinza |

**A Entidade aparece no card apenas quando há algo específico daquela campanha a comunicar.** Não há indicador permanente de "atividade".

### 3.4 Bloco 3 — Feed da Entidade

O Feed da Entidade aparece **somente quando há algo de valor real a comunicar** (DECISIONS #043). Se não há nada relevante, o bloco não existe — não há área vazia reservada para ele.

**O que gera uma entrada no Feed:**
- Oportunidade de escala identificada
- Novo padrão confirmado com impacto significativo
- Saturação confirmada que demanda decisão
- Reconexão de conta necessária (nível 3)
- Aprendizado novo de alta relevância

**O que NÃO gera entrada no Feed:**
- Publicação individual realizada
- Coleta de analytics em andamento
- Retentativa automática de publicação
- Atualização de IS em andamento
- Qualquer operação interna do sistema

**Exemplo de Feed com oportunidade:**
```
🧠 "Encontrei uma oportunidade para Produto A.
Quer que eu escale essa campanha?"
[Escalar]  [Manter em teste]  [Ver detalhes]
```

**Exemplo de Feed com aprendizado:**
```
🧠 "Percebi que histórias de transformação estão
convertendo melhor esta semana."  [Por quê?]
```

---

## 4. Lista de Campanhas

### 4.1 Filtros e Ordenação

```
Campanhas
─────────────────────────────
[Todas] [Em teste] [Em escala] [Pausadas]

Ordenar por: Prioridade ▾
─────────────────────────────
[Card] Produto A · Em escala
[Card] Produto B · Em teste
[Card] Produto C · Em teste
[Card] Produto D · Pausada
─────────────────────────────
[+ Nova campanha]
```

**Filtros disponíveis:** Todas / Em teste / Em escala / Pausadas / Encerradas  
**Ordenação:** por prioridade (padrão) / por resultado recente / por data de criação

O usuário nunca vê "Campaign Priority Score" — vê "Prioridade" e entende que a plataforma está gerenciando a ordem automaticamente.

### 4.2 Banner de Capacidade (Contextual)

O aviso de capacidade de publicação **não vive em Configurações apenas** — aparece como banner discreto no topo da lista de campanhas quando o uso ultrapassa 80% do plano. Não aparece em nenhum outro momento.

```
Campanhas
─────────────────────────────────────────
⚠ Você usou 168 de 200 publicações este mês.
  A partir do dia 28, campanhas de menor
  prioridade serão pausadas automaticamente.
─────────────────────────────────────────
[Todas] [Em teste] [Em escala] [Pausadas]
...
```

**Regras do banner:**
- Aparece apenas quando uso > 80% do limite do plano
- Não aparece na Home (não é alarme, é informação operacional)
- Linguagem de consequência — nunca de urgência alarmista
- Um único link opcional [Ver plano] que leva a Configurações → Plano e uso

---

## 5. Detalhe de Campanha

### 5.1 Estrutura

```
← Campanhas

[Produto A]
Shopee · Threads · Em escala há 28 dias

─────────────────────────────────────────
RESULTADO DESTA CAMPANHA

R$ 1.240 este mês
+18% vs. semana anterior

CTR: 7.8%  ·  23 conversões  ·  847 cliques
─────────────────────────────────────────
O QUE APRENDI SOBRE ESTE PRODUTO

📌 Histórias de transformação convertem
   melhor · Ativo há 28 dias  [Por quê?]

📌 Sua audiência responde mais rápido
   às terças e quartas  [Por quê?]

─────────────────────────────────────────
PUBLICAÇÕES

34 publicadas  ·  Próxima: hoje às 20:00

[Ver histórico de publicações ▾]
─────────────────────────────────────────
[Pausar campanha]
```

**Nota sobre o cabeçalho:** "Em escala desde 15/06" foi substituído por "Em escala há 28 dias" — duração relativa é imediatamente compreensível sem exigir que o usuário calcule o tempo decorrido.

### 5.2 Histórico de Publicações

Lista expansível (oculta por padrão para não sobrecarregar a tela):

```
[Histórico de publicações]

24/07 · 19:30 · "Há meses eu buscava..."
        Cliques: 47 · CTR: 9.2%

22/07 · 20:00 · "Nunca pensei que fosse..."
        Cliques: 31 · CTR: 6.1%

20/07 · 19:00 · "A diferença foi..."
        Cliques: 38 · CTR: 7.4%
```

O texto de cada história é truncado na primeira linha. O usuário pode expandir para ver o texto completo.

### 5.3 Confirmação de Pausa

Ao tocar em [Pausar campanha], um bottom sheet de confirmação aparece antes de executar a ação:

```
┌──────────────────────────────────────────┐
│  Pausar esta campanha?                    │
│  ──────────────────────────────────────  │
│  Vou parar de publicar para este produto. │
│  O que aprendi sobre ele será mantido —  │
│  podemos retomar quando você quiser.      │
│  ──────────────────────────────────────  │
│  [Pausar campanha]    [Cancelar]          │
└──────────────────────────────────────────┘
```

**Regras:**
- Linguagem da Entidade (primeira pessoa): "vou parar", "o que aprendi", "podemos retomar"
- Nunca linguagem de alerta técnico ("Esta ação não pode ser desfeita")
- O botão de confirmação [Pausar campanha] em destaque secundário (não vermelho) — pausar não é destruir, é aguardar
- Cancelar em destaque primário — facilitar o recuo acidental

**O que NÃO aparece no histórico:**
- QS da história
- IS da combinação
- Arco narrativo
- Modelo de IA usado
- Detalhes técnicos de publicação

### 5.4 Estado: Oportunidade de Escala

Quando a campanha atinge elegibilidade de escala, a tela de detalhe muda:

```
[Produto B]
X · Em teste · Oportunidade identificada

─────────────────────────────────────────
🧠 "Encontrei um padrão que está funcionando.

Nos últimos 18 dias, histórias de descoberta
tiveram resultados consistentemente acima
da média. Tenho confiança para multiplicar.

CTR médio: 8.4%  ·  12 conversões
─────────────────────────────────────────
Quer que eu escale esta campanha?

[Escalar]  [Manter em teste]
─────────────────────────────────────────
Por que estou recomendando?           [▾]
```

**Ao expandir "Por que estou recomendando?":**
```
Testei 8 histórias diferentes para esse produto.
Histórias que usam narrativa de descoberta
tiveram CTR 3,2× maior do que as demais.
Esse padrão se repetiu em 7 das 8 histórias.
Não é sorte — é um padrão consistente.
```

Nenhum número técnico (IS, QS, threshold). Apenas evidência observável em linguagem simples.

---

## 6. Tela de Aprendizados

Esta tela é a representação da Learning Timeline para o usuário — mas nunca com esse nome. O título da tela é simplesmente **"Aprendizados"**.

### 6.1 Estrutura

```
Aprendizados

O que aprendi sobre o seu perfil.
─────────────────────────────────────────
ATIVOS                          [ordenados por impacto]

📌 Histórias de transformação convertem
   3× melhor no seu perfil.
   Descoberto há 45 dias · confirmado em 12 campanhas
   [Por quê?]

📌 Sua audiência responde melhor entre
   19h e 21h.
   Descoberto há 30 dias · ainda verificando horários alternativos
   [Por quê?]

📌 Chamadas diretas para ação funcionam
   melhor para o seu perfil no X.
   Descoberto há 20 dias · confirmado em 5 campanhas
   [Por quê?]

─────────────────────────────────────────
EM CONFIRMAÇÃO

○ Histórias curtas (< 150 palavras) parecem
  ter melhor engajamento.
  Descoberto há 8 dias · ainda verificando

─────────────────────────────────────────
EXPIRADOS

○ Histórias longas convertiam bem em março.
  Descoberto em 10/03 · parece não funcionar mais desde maio

○ Chamadas implícitas ("link na bio")
  funcionavam melhor no Threads no início.
  Descoberto em fev · superado por chamadas diretas
```

### 6.2 Estados de Padrão (DECISIONS #047)

| Estado | Ícone | Visual | Significado |
|---|---|---|---|
| Ativo e confiante | 📌 | Preenchido, destaque | Validado em múltiplos contextos |
| Em confirmação | ○ | Contorno, mais sutil | Sinal positivo, ainda verificando |
| Expirado | ○ | Contorno, desbotado | Não funciona mais — contexto mudou |

**Por que mostrar expirados:**
A Entidade que mostra o que aprendeu E o que aprendeu que parou de funcionar demonstra memória real — não apenas acúmulo de regras fixas. Isso constrói confiança. (DECISIONS #047)

### 6.3 Mecanismo "Por quê?"

O conteúdo do "Por quê?" varia conforme o estado do padrão. Para padrões ativos, explica **por que funciona**. Para padrões expirados, explica **por que parou de funcionar**. São eventos distintos, com explicações distintas.

**Padrão ativo — "Por que funciona?"**

```
┌──────────────────────────────────────────┐
│  Por que histórias de transformação       │
│  funcionam melhor?                        │
│  ──────────────────────────────────────  │
│  Testei 8 abordagens diferentes para a   │
│  sua audiência no Threads.               │
│                                          │
│  Histórias que seguem o padrão "eu era   │
│  X, agora sou Y" consistentemente        │
│  tiveram CTR maior — em 7 das 8 vezes.  │
│                                          │
│  Esse padrão se mantém há 45 dias,       │
│  em produtos diferentes.                 │
│  ──────────────────────────────────────  │
│                        [Entendi]         │
└──────────────────────────────────────────┘
```

**Padrão expirado — "Por que parou de funcionar?"**

```
┌──────────────────────────────────────────┐
│  Por que histórias longas pararam de      │
│  funcionar?                               │
│  ──────────────────────────────────────  │
│  Em março e abril funcionavam bem.        │
│  A partir de maio, mesmo nas mesmas       │
│  condições, os resultados caíram          │
│  consistentemente por 3 semanas.          │
│                                          │
│  Contexto mudou — não a abordagem.       │
│  ──────────────────────────────────────  │
│                        [Entendi]         │
└──────────────────────────────────────────┘
```

**Regras do "Por quê?" (comuns a todos os estados):**
- Resposta sempre em linguagem de evidências observáveis — nunca termos técnicos
- Sem menção a IS, QS, arco narrativo, Knowledge Engine
- Linguagem da Entidade (primeira pessoa): "testei", "percebi", "observei"
- Máximo 5 frases — concisão é respeito ao tempo do usuário
- Sem afirmações de certeza absoluta — a Entidade opera com confiança, não com garantia (DECISIONS #064)

**Implementação:** o campo `why_explanation` no evento do Knowledge Engine é específico para o **tipo de evento** (ativação vs. expiração). Os dois geram campos distintos — nunca o mesmo texto reutilizado.

---

## 7. Configurações — Contas Conectadas

```
Contas conectadas
─────────────────────────────────────────
REDES SOCIAIS

● Threads  @usuario           [Desconectar]
● X        @usuario           [Desconectar]

[+ Conectar rede]
─────────────────────────────────────────
LOJAS DE AFILIADO

● Shopee   ID: xxx-xxx        [Desconectar]
● Amazon   ID: xxx-xxx        [Desconectar]

[+ Conectar loja]
─────────────────────────────────────────
```

**Estado de conta com problema:**
```
⚠ Threads  Conexão perdida   [Reconectar]
```

A mensagem "Conexão perdida" é o máximo de informação técnica que o usuário vê. Não há código de erro, não há "OAuth token expired".

---

## 8. Configurações — Plano e Uso

```
Plano e uso
─────────────────────────────────────────
Plano Growth

Publicações este mês
████████████░░░░ 143 de 200

Contas conectadas: 3 de 5
─────────────────────────────────────────
[Fazer upgrade]
```

**Quando o limite está próximo (> 80% usado):**
```
Publicações este mês
████████████████░ 168 de 200

A partir do dia 28, as campanhas com
menor prioridade serão pausadas
automaticamente.
```

A Entidade não envia push notification sobre limite — apenas exibe na tela de configurações. A notificação só vai quando o limite é atingido e campanhas são afetadas (Nível 3).

---

## 9. Estados Especiais

### 9.1 Empty State — Primeiro Acesso

Quando o usuário acabou de se cadastrar e não tem nenhuma campanha:

```
[PLATAFORMA]
─────────────────────────────────────────

Olá. Estou pronta para começar.

Para aprender o que funciona para você,
preciso que você crie sua primeira campanha.

[Criar minha primeira campanha]
─────────────────────────────────────────
```

Sem lista de features. Sem tour guiado. A Entidade convida diretamente para a ação.

### 9.2 Empty State — Tela de Aprendizados (Sem Padrões Ainda)

Quando o usuário acessa a tela de Aprendizados antes de qualquer padrão ser identificado:

```
Aprendizados
─────────────────────────────────────────

Ainda não aprendi nada sobre o seu perfil.

Continue publicando — estou observando
os padrões.
```

Sem lista de features, sem tutorial, sem barra de progresso. Uma frase da Entidade. O implícito é que ela está trabalhando — não que o usuário precisa fazer algo diferente.

### 9.3 Estado com Campanhas mas Sem Dados Suficientes (dias 1–7)

```
RESULTADO DO MÊS
─────────────────────────────────────────
Ainda coletando dados.
Seus primeiros resultados aparecerão em breve.

─────────────────────────────────────────
CAMPANHAS ATIVAS

[Card] Produto A · Em teste · Threads
4 histórias publicadas
```

A ausência de dados não é tratada como fracasso — é tratada como processo em andamento.

### 9.4 Estado de Saturação Visível

Quando o ESCALA detecta saturação e comunica ao usuário:

```
[Card] Produto A · ⚠ Atenção necessária

A abordagem que estava funcionando para
este produto parece estar perdendo força.
[Ver detalhes]
```

No detalhe da campanha:
```
🧠 "O padrão que estava funcionando para
Produto A está perdendo força.

Quer que eu encontre uma nova abordagem?"

[Novo ciclo de descoberta]  [Pausar]
```

---

## 10. Mecanismo "Por quê?" — Especificação Completa

O "Por quê?" resolve a decisão pendente P007 (mecanismo de transparência ao usuário — DECISIONS #015). É a única forma do usuário "conversar" com a Entidade — mas é uma consulta estruturada, não um chat livre (DECISIONS #046).

### 10.1 Onde aparece

- Em qualquer insight da Entidade no Feed do Dashboard
- Em recomendações de escala
- Em cada entrada da tela de Aprendizados
- Em alertas de saturação

### 10.2 Como é implementado

**Mobile:** bottom sheet deslizante que sobe de baixo para cima. Ocupa 60% da tela. Fecha ao arrastar para baixo ou tocar fora.

**Desktop:** tooltip expandido ao lado do elemento. Aparece ao clicar, fecha ao clicar fora.

**Conteúdo:** sempre gerado pelo Knowledge Engine como parte do evento que disparou a comunicação. O "Por quê?" não é gerado on-demand — é pré-calculado junto com a decisão, em linguagem da Entidade.

### 10.3 O que o "Por quê?" nunca contém

- Intelligence Score como número
- QS como número
- Nomes de componentes internos
- IDs de publicações ou campanhas
- Terminologia técnica de qualquer tipo
- Afirmações de certeza absoluta ("com certeza", "garantido") — a Entidade opera com confiança, não com certeza (DECISIONS #064)

---

## 11. Performance

| Tela | Target P95 | Observações |
|---|---|---|
| Home Dashboard | < 1.5s | Dados em cache Redis (TTL 5 min) |
| Lista de Campanhas | < 1s | Cache Redis + query leve |
| Detalhe de Campanha | < 2s | PRD #NF-001 |
| Tela de Aprendizados | < 1.5s | Cache Redis (TTL 30 min) |
| "Por quê?" (expansão) | < 300ms | Pré-calculado, apenas exibição |
| Contas Conectadas | < 1s | Dados locais + health check async |

O health check de providers (Plugin Registry) é feito em background — nunca bloqueia o carregamento de nenhuma tela.

---

## 12. Responsividade

**Mobile (< 768px):**
- Navegação principal: barra inferior com 4 ícones (Home / Campanhas / Aprendizados / Config)
- Cards de campanha: largura 100%, empilhados verticalmente
- "Por quê?": bottom sheet
- Bloco de resultado: tipografia grande, hierarquia clara

**Desktop (≥ 768px):**
- Navegação: sidebar esquerda colapsável
- Cards de campanha: grid 2 colunas
- "Por quê?": tooltip expandido
- Bloco de resultado: layout horizontal com métricas secundárias em linha

---

## 13. O que Nunca Aparece na Interface

Lista de verificação — qualquer item desta lista encontrado na implementação é um bug de produto:

- [ ] Intelligence Score como número (ex: "IS: 84")
- [ ] QS como número (ex: "QS: 91")
- [ ] Nomes de componentes internos (Knowledge Engine, Story Engine, etc.)
- [ ] Termos arquiteturais (Provider, Adapter, Registry, Event Bus, Queue)
- [ ] IDs internos de campanhas, usuários ou publicações
- [ ] Mensagens de erro técnicas (OAuth, API, timeout, retry)
- [ ] Status de provider (HEALTHY, DEGRADED, UNHEALTHY)
- [ ] Arco narrativo por nome técnico (ex: "Arco 3: Problema → Solução")
- [ ] Campaign Priority Score como número
- [ ] Percentuais de confiança brutos

---

## 14. Casos Extremos

### CE-DB-001: Todas as campanhas pausadas ao mesmo tempo
**Tela:** Dashboard mostra "RESULTADO DO MÊS" com dados históricos + seção de campanhas vazia com mensagem: *"Você não tem campanhas ativas. Quer criar uma nova ou retomar uma existente?"*

### CE-DB-002: Usuário tem 15 campanhas simultâneas (plano Scale)
**Tela:** lista de campanhas com scroll. Os 3 cards de maior CPS aparecem na Home. Os demais ficam na lista de campanhas. Sem degradação de performance — paginação após 10 itens.

### CE-DB-003: Aprendizados com mais de 30 entradas
**Tela:** "Aprendizados" mostra os 10 de maior impacto por padrão. Botão "Ver todos" expande a lista. Expirados ficam em seção colapsável por padrão.

### CE-DB-004: Rede social com instabilidade prolongada
**Tela:** banner discreto no topo da Home apenas se a instabilidade afetou publicações do usuário: *"O Threads está com instabilidade. Suas publicações estão na fila e serão retomadas em breve."* Sem ícones de erro em cada campanha individualmente.

### CE-DB-005: Usuário chega pela primeira vez no app após 2 semanas de inatividade
**Tela:** Dashboard normal com resultados acumulados do período. A Entidade pode aparecer no Feed se houve aprendizados relevantes durante o período: *"Aprendi algo novo sobre o seu perfil enquanto você estava ausente."* — mas apenas se houver algo relevante. Se não houver, silêncio.

---

## 15. Possíveis Melhorias Futuras

1. **Resumo semanal por e-mail:** compilado pela Entidade, em linguagem da voz, resumindo os principais aprendizados e resultados da semana. Não uma planilha de dados — uma narrativa curta de 3–5 frases.

2. **Dashboard comparativo entre campanhas:** quando o usuário tem múltiplos produtos em escala, a Entidade pode destacar padrões que funcionam em vários produtos vs. padrões exclusivos de cada um. Visão cruzada de aprendizados.

3. **Projeção de resultado:** com histórico suficiente, a Entidade pode projetar o resultado do mês com base no ritmo atual: *"No ritmo atual, você deve gerar R$ 4.200 em comissões este mês."*

4. **Modo foco:** visualização simplificada que mostra apenas as métricas de negócio e uma ação prioritária recomendada pela Entidade — para usuários que preferem máxima simplicidade.

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | P007 resolvida: mecanismo "Por quê?" — bottom sheet (mobile) / tooltip (desktop), pré-calculado |
| 2026-07-11 | Home: três blocos em ordem — negócio / campanhas / entidade |
| 2026-07-11 | Feed da Entidade: não existe como área reservada — aparece apenas quando há conteúdo relevante |
| 2026-07-11 | Ordenação de campanhas por Campaign Priority Score (exibido como "Prioridade") |
| 2026-07-11 | Aprendizados: três estados visuais (ativo / em confirmação / expirado) |
| 2026-07-11 | "Por quê?" pré-calculado junto com a decisão — não gerado on-demand |
| 2026-07-11 | Lista de verificação de termos proibidos na interface |
| 2026-07-11 | "Por quê?" de padrão expirado explica a expiração, não a ativação (DECISIONS #069 clarificado) |
| 2026-07-11 | Banner de capacidade contextual na lista de campanhas quando uso > 80% do plano |
| 2026-07-11 | Detalhe de campanha: aprendizados antes do histórico de publicações |
| 2026-07-11 | "Pausar campanha" requer confirmação em bottom sheet com linguagem da Entidade |
| 2026-07-11 | Empty state de Aprendizados: frase única da Entidade, sem tutorial |
| 2026-07-11 | Período padrão do Dashboard: automático por antiguidade da conta (< 30 dias → "desde o início") |
| 2026-07-11 | Duração relativa ("há 28 dias") em vez de data absoluta no cabeçalho da campanha |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aprovado com revisão de UX aplicada*
