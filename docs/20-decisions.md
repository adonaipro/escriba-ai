# 20 — DECISIONS.md
# Registro Oficial de Decisões

> *Este documento é a memória oficial do projeto. Toda decisão arquitetural, de produto, de UX ou de negócio tomada durante o Blueprint deve ser registrada aqui.*

---

## Como Usar Este Documento

**Para registrar uma nova decisão:**  
Adicione uma entrada seguindo o template abaixo. Use o próximo número sequencial. Nunca delete entradas — se uma decisão for revertida, registre a reversão como uma nova decisão referenciando a original.

**Para consultar uma decisão:**  
Use o índice abaixo ou busque pelo número da decisão (ex: `#007`).

**Para decisões pendentes:**  
Registre na seção de Decisões Pendentes com o documento responsável por resolvê-la.

---

## Template

```
## [ANO-MÊS-DIA] — #NNN — [Assunto curto]

**Documento de origem:** [nome do documento]
**Status:** ✅ Aprovada | ⚠️ Pendente | 🔄 Revisada

### Decisão
[O que foi decidido, em linguagem clara e direta.]

### Motivo
[Por que essa decisão foi tomada. O contexto que a originou.]

### Alternativas Descartadas
[O que foi considerado e rejeitado, e por quê. Omitir se não houver.]

### Impacto
[Quais componentes, documentos ou práticas são afetados por essa decisão.]

### Próximos Documentos Afetados
[Quais documentos devem incorporar ou detalhar essa decisão.]
```

---

## Índice de Decisões

| # | Data | Assunto | Status | Documento de origem |
|---|------|---------|--------|-------------------|
| [001](#001) | 2026-07-11 | Knowledge Engine como motor de decisão | ✅ | README |
| [002](#002) | 2026-07-11 | Event Bus como backbone de comunicação | ✅ | README |
| [003](#003) | 2026-07-11 | Intelligence Score: escala 0–100 | ✅ | README |
| [004](#004) | 2026-07-11 | Motores internos ocultos ao usuário | ✅ | README |
| [005](#005) | 2026-07-11 | DNA do Perfil: descoberto, não configurado | ✅ | README |
| [006](#006) | 2026-07-11 | Learning Timeline: imutável | ✅ | README |
| [007](#007) | 2026-07-11 | Nome da plataforma: [PLATAFORMA] até conclusão de PRD | ✅ | README |
| [008](#008) | 2026-07-11 | MVP foca em afiliado individual (Personas 1–3) | ✅ | 01 - Visão Geral |
| [009](#009) | 2026-07-11 | Persona 4 (Gestor) → V2/V3 | ✅ | 01 - Visão Geral |
| [010](#010) | 2026-07-11 | Momento de revelação do MVP | ✅ | 01 - Visão Geral |
| [011](#011) | 2026-07-11 | Risco de saturação por nicho: problema de escala | ✅ | 01 - Visão Geral |
| [012](#012) | 2026-07-11 | Métricas do MVP: operacionais simples | ✅ | 01 - Visão Geral |
| [013](#013) | 2026-07-11 | Quality Score como componente obrigatório | ✅ | 02 - Filosofia |
| [014](#014) | 2026-07-11 | Decaimento do Intelligence Score: princípio filosófico | ✅ | 02 - Filosofia |
| [015](#015) | 2026-07-11 | Transparência obrigatória ao usuário | ✅ | 02 - Filosofia |
| [016](#016) | 2026-07-11 | Produto mais valioso enquanto opera continuamente | ✅ | 02 - Filosofia |
| [P001](#p001) | 2026-07-11 | ⚠️ PENDENTE: Cold start do DNA do Perfil | ⚠️ | README |
| [P002](#p002) | 2026-07-11 | ⚠️ PENDENTE: Threshold exato do Intelligence Score | ⚠️ | README |
| [P003](#p003) | 2026-07-11 | ⚠️ PENDENTE: CQRS (sync vs async) | ⚠️ | README |
| [P004](#p004) | 2026-07-11 | ⚠️ PENDENTE: Modelo de negócio (freemium vs trial) | ⚠️ | 01 - Visão Geral |
| [P005](#p005) | 2026-07-11 | ⚠️ PENDENTE: Parâmetros do Quality Score | ⚠️ | 02 - Filosofia |
| [P006](#p006) | 2026-07-11 | ⚠️ PENDENTE: Parâmetros de decaimento do Intelligence Score | ⚠️ | 02 - Filosofia |
| [P007](#p007) | 2026-07-11 | ⚠️ PENDENTE: Mecanismo de transparência ao usuário | ⚠️ | 02 - Filosofia |
| [P008](#p008) | 2026-07-11 | ⚠️ PENDENTE: Critério de pausa de teste com baixo performance | ⚠️ | Antecipada |
| [017](#017) | 2026-07-11 | Modelo de negócio: trial 14 dias → assinatura mensal | ✅ | 03 - PRD |
| [018](#018) | 2026-07-11 | MVP: texto apenas, sem imagens ou vídeos | ✅ | 03 - PRD |
| [019](#019) | 2026-07-11 | Rate limits: operar sempre dentro dos limites oficiais das APIs | ✅ | 03 - PRD |
| [020](#020) | 2026-07-11 | Rastreamento de links: validação de compatibilidade obrigatória | ✅ | 03 - PRD |
| [021](#021) | 2026-07-11 | Modo Revisão: rejeições são sinais de aprendizado distintos | ✅ | 03 - PRD |
| [022](#022) | 2026-07-11 | Limites de plano: placeholders, definidos com dados reais no Roadmap | ✅ | 03 - PRD |
| [023](#023) | 2026-07-11 | Trial sem cartão: risco registrado para documento de Segurança | ✅ | 03 - PRD |
| [024](#024) | 2026-07-11 | LGPD: projeto paralelo obrigatório, sem bloquear documentação | ✅ | 03 - PRD |
| [P003](#p003) | 2026-07-11 | ~~PENDENTE~~ CQRS resolvido em #025 | ✅ | 04 - Arquitetura Geral |
| [025](#025) | 2026-07-11 | CQRS: Commands async (Event Bus) / Queries sync (PostgreSQL) | ✅ | 04 - Arquitetura Geral |
| [026](#026) | 2026-07-11 | Stack: TypeScript/Node.js + Python (ML) + Next.js + PostgreSQL + Redis | ✅ | 04 - Arquitetura Geral |
| [027](#027) | 2026-07-11 | Event Bus: BullMQ para MVP, arquitetura preparada para Kafka em V2 | ✅ | 04 - Arquitetura Geral |
| [028](#028) | 2026-07-11 | Infraestrutura: AWS ECS Fargate (MVP) → EKS (V2+) | ✅ | 04 - Arquitetura Geral |
| [029](#029) | 2026-07-11 | Busca vetorial: pgvector (extensão PostgreSQL, sem banco adicional) | ✅ | 04 - Arquitetura Geral |
| [030](#030) | 2026-07-11 | Intelligence Layer: implementação custom (sem LangChain/LlamaIndex) | ✅ | 04 - Arquitetura Geral |
| [031](#031) | 2026-07-11 | Plugin Architecture como padrão mandatório para integrações externas | ✅ | 04 - Arquitetura Geral |
| [032](#032) | 2026-07-11 | ISocialNetworkProvider: interface contratual para todas as redes sociais | ✅ | 04 - Arquitetura Geral |
| [033](#033) | 2026-07-11 | IMarketplaceProvider: interface contratual para todos os marketplaces | ✅ | 04 - Arquitetura Geral |
| [034](#034) | 2026-07-11 | IAIProvider: Intelligence Layer formalizada como AI plugin registry | ✅ | 04 - Arquitetura Geral |
| [035](#035) | 2026-07-11 | IContentProvider: slot reservado para provedores visuais (MVP: nenhum implementado) | ✅ | 04 - Arquitetura Geral |
| [036](#036) | 2026-07-11 | Plugin Registry: gerenciamento central, health monitoring e feature flags de providers | ✅ | 04 - Arquitetura Geral |
| [037](#037) | 2026-07-11 | PgBouncer: entra no MVP (não V1) como medida preventiva de connection pooling | ✅ | 04 - Arquitetura Geral |
| [038](#038) | 2026-07-11 | Scheduling Engine: síncrono no MVP; cache próprio extraído em V1 | ✅ | 04 - Arquitetura Geral |
| [039](#039) | 2026-07-11 | Complexidade arquitetural permanece invisível ao usuário — sempre | ✅ | 04 - Arquitetura Geral |
| [040](#040) | 2026-07-11 | Persona Unificada: usuário percebe uma única inteligência trabalhando por ele | ✅ | 05 - UX |
| [041](#041) | 2026-07-11 | Voz da Entidade: primeira pessoa, proativa, orientada a resultado, nunca técnica | ✅ | 05 - UX |
| [042](#042) | 2026-07-11 | Hierarquia de comunicação: silêncio / consequência / ação — nunca causa técnica | ✅ | 05 - UX |
| [043](#043) | 2026-07-11 | Entidade silenciosa: fala apenas quando há valor real (descobertas, oportunidades, ações) | ✅ | 05 - UX |
| [044](#044) | 2026-07-11 | Dashboard: resultado de negócio primeiro, campanhas depois, insights por último | ✅ | 05 - UX |
| [045](#045) | 2026-07-11 | Insights ordenados por impacto, não por cronologia | ✅ | 05 - UX |
| [046](#046) | 2026-07-11 | Entidade não é chatbot: inicia comunicações; usuário responde via ações ou "Por quê?" | ✅ | 05 - UX |
| [047](#047) | 2026-07-11 | Plataforma demonstra memória: evolução, confirmação e expiração de padrões visíveis | ✅ | 05 - UX |
| [048](#048) | 2026-07-11 | Arcos narrativos: categorias abertas com subarcos evolutivos, não conjunto fechado | ✅ | 06 - Story Engine |
| [049](#049) | 2026-07-11 | Momento da Compra (Buying Stage): dimensão futura do Decision Package — V2+ | ✅ | 06 - Story Engine |
| [050](#050) | 2026-07-11 | Story Family: explorar derivações de alta performance antes de pivotar para novo território | ✅ | 06 - Story Engine |
| [051](#051) | 2026-07-11 | Prova Social: permitida apenas com contexto autêntico — proibido fabricar ou exagerar | ✅ | 06 - Story Engine |
| [052](#052) | 2026-07-11 | Meta-aprendizado: aprender por que histórias vendem em quais contextos, públicos e momentos | ✅ | 06 - Story Engine |
| [053](#053) | 2026-07-11 | Story Family: princípio sem threshold fixo — calibração pelo ML Engine com dados reais | ✅ | 07 - Test Engine |
| [054](#054) | 2026-07-11 | Intervalo entre publicações: dinâmico (Scheduling Engine decide), não valor fixo | ✅ | 07 - Test Engine |
| [055](#055) | 2026-07-11 | Conhecimento Global vs. Privado: padrões genéricos compartilháveis; DNA de perfil nunca | ✅ | 07 - Test Engine |
| [056](#056) | 2026-07-11 | Anti-padrões: KE registra explicitamente combinações de baixo desempenho para evitar retrabalho | ✅ | 07 - Test Engine |
| [057](#057) | 2026-07-11 | Saturação parcial: explorar todas as variações da Story Family antes de concluir saturação total | ✅ | 08 - Scale Engine |
| [058](#058) | 2026-07-11 | Escala Multi-Rede: conhecimento reutilizável como ponto de partida; validação própria por rede obrigatória | ✅ | 08 - Scale Engine |
| [059](#059) | 2026-07-11 | Decaimento com janela de revalidação rápida para campanhas adiadas por pouco tempo (V2+) | ✅ | 08 - Scale Engine |
| [060](#060) | 2026-07-11 | Campaign Priority Score: priorização automática de campanhas quando há limitação de recursos | ✅ | 08 - Scale Engine |
| [061](#061) | 2026-07-11 | Gestão inteligente de capacidade: distribuição de volume disponível por potencial, IS e retorno esperado | ✅ | 08 - Scale Engine |
| [062](#062) | 2026-07-11 | Parâmetros numéricos desta fase são placeholders provisórios — calibração obrigatória pelo ML Engine | ✅ | 09 - Knowledge Engine |
| [063](#063) | 2026-07-11 | Anti-padrão "reavaliado" (não "reabilitado"): volta a Inconclusivo para ser retestado se contexto mudou | ✅ | 09 - Knowledge Engine |
| [064](#064) | 2026-07-11 | KE opera sem certezas absolutas: todo conhecimento tem grau de confiança que evolui com evidência | ✅ | 09 - Knowledge Engine |
| [065](#065) | 2026-07-11 | Dashboard Home: três blocos em hierarquia fixa — negócio / campanhas / entidade | ✅ | 10 - Dashboards |
| [066](#066) | 2026-07-11 | Feed da Entidade: sem área reservada — aparece somente quando há conteúdo de valor real | ✅ | 10 - Dashboards |
| [067](#067) | 2026-07-11 | Campanhas ordenadas por CPS, exibido ao usuário como "Prioridade" | ✅ | 10 - Dashboards |
| [068](#068) | 2026-07-11 | Aprendizados: três estados visuais (ativo / em confirmação / expirado) | ✅ | 10 - Dashboards |
| [069](#069) | 2026-07-11 | "Por quê?" pré-calculado junto à decisão — nunca gerado on-demand | ✅ | 10 - Dashboards |
| [070](#070) | 2026-07-11 | "Por quê?" de padrão expirado explica a expiração — eventos distintos geram explicações distintas | ✅ | 10 - Dashboards |
| [071](#071) | 2026-07-11 | Banner de capacidade contextual na tela de Campanhas quando uso > 80% do plano | ✅ | 10 - Dashboards |
| [072](#072) | 2026-07-11 | Detalhe de campanha: aprendizados antes do histórico de publicações | ✅ | 10 - Dashboards |
| [073](#073) | 2026-07-11 | "Pausar campanha" requer confirmação em bottom sheet com linguagem da Entidade | ✅ | 10 - Dashboards |
| [074](#074) | 2026-07-11 | Empty state de Aprendizados: frase única da Entidade, sem tutorial nem lista de features | ✅ | 10 - Dashboards |
| [075](#075) | 2026-07-11 | Período padrão do Dashboard automático por antiguidade (< 30 dias → "desde o início") | ✅ | 10 - Dashboards |
| [076](#076) | 2026-07-11 | Anti-padrões nascem específicos (combinação completa) e são promovidos a gerais apenas com evidência suficiente | ✅ | 11 - Banco de Dados |
| [077](#077) | 2026-07-11 | GET /api/operations/:id para consulta explícita de operações assíncronas — sem polling baseado em tempo | ✅ | 12 - APIs |
| [078](#078) | 2026-07-11 | Idempotency-Key em todos os POST que criam recursos — evita duplicações em retries | ✅ | 12 - APIs |
| [079](#079) | 2026-07-11 | request_id presente em toda resposta (sucesso e erro) — rastreabilidade universal | ✅ | 12 - APIs |
| [080](#080) | 2026-07-11 | MVP com Shopee apenas; Amazon e MercadoLivre: arquitetura pronta, providers desabilitados até solução robusta | ✅ | 13 - Integrações |
| [081](#081) | 2026-07-11 | Disqualifiers no QS representam violações de princípios da plataforma — reprovam independente de score | ✅ | 14 - IA |
| [082](#082) | 2026-07-11 | Prompts não armazenados em produção; reconstrução via Decision Package + versão de prompt + versão de DNA | ✅ | 14 - IA |
| [083](#083) | 2026-07-11 | IA nunca decide sozinha: modelos geram conteúdo; a plataforma decide como utilizá-lo | ✅ | 14 - IA |
| [084](#084) | 2026-07-11 | Prompts tratados como código: versionados, revisados e implantados pelo mesmo fluxo de engenharia | ✅ | 14 - IA |
| [085](#085) | 2026-07-11 | ML Engine propõe anti-padrões gerais via tabela intermediária; Knowledge Engine é o único que aplica ao estado operacional | ✅ | 15 - ML |
| [086](#086) | 2026-07-11 | Argon2id para hashing de senhas de usuário | ✅ | 16 - Segurança |
| [087](#087) | 2026-07-11 | RS256 (assimétrico) para JWT — chave privada confinada ao servidor de autenticação | ✅ | 16 - Segurança |
| [088](#088) | 2026-07-11 | Refresh token rotation com invalidação de família para detectar roubo de token | ✅ | 16 - Segurança |
| [089](#089) | 2026-07-11 | Tokens OAuth de redes sociais criptografados AES-256-GCM com chave no AWS KMS | ✅ | 16 - Segurança |
| [090](#090) | 2026-07-11 | 403 (nunca 404) para recursos de outros usuários — evita enumeração de IDs | ✅ | 16 - Segurança |
| [091](#091) | 2026-07-11 | E-mail verification obrigatório antes de qualquer publicação | ✅ | 16 - Segurança |
| [092](#092) | 2026-07-11 | Exclusão de conta: cascade + anonimização para global_patterns + soft delete 30 dias | ✅ | 16 - Segurança |
| [093](#093) | 2026-07-11 | PII nunca entra em logs de produção | ✅ | 16 - Segurança |
| [094](#094) | 2026-07-11 | CSRF: SameSite=Strict suficiente para o MVP; sem CSRF token explícito | ✅ | 16 - Segurança |
| [095](#095) | 2026-07-11 | Troca de senha invalida todos os refresh tokens ativos do usuário | ✅ | 16 - Segurança |
| [096](#096) | 2026-07-11 | Dependency scanning (npm audit + pip-audit) obrigatório no CI/CD | ✅ | 16 - Segurança |
| [097](#097) | 2026-07-11 | Trial: apenas duração e ausência de cartão são fixos — demais parâmetros são hipóteses a validar | ✅ | 17 - Roadmap |
| [098](#098) | 2026-07-11 | Persona 4 não comprometida com V2 — requer análise arquitetural antes de entrar no roadmap | ✅ | 17 - Roadmap |
| [099](#099) | 2026-07-11 | Cold start: em até 48h, plataforma comunica início de aprendizado usando conhecimento global do nicho | ✅ | 17 - Roadmap |
| [100](#100) | 2026-07-11 | Downgrade de plano: campanhas pausadas e perfis desconectados, nunca deletados; dados preservados | ✅ | 18 - Regras de Negócio |
| [101](#101) | 2026-07-12 | Disqualifiers: postura conservadora — qualquer suspeita rejeita; falsos positivos monitorados e calibrados | ✅ | 19 - AI_CONTEXT |
| [102](#102) | 2026-07-12 | ML Engine separado por responsabilidade (batch assíncrono), não por tecnologia | ✅ | 19 - AI_CONTEXT |

---

## Decisões Aprovadas

---

<a name="001"></a>
## 2026-07-11 — #001 — Knowledge Engine como Motor de Decisão

**Documento de origem:** README  
**Status:** ✅ Aprovada

### Decisão
O Knowledge Engine não é um repositório de dados. É o motor de decisão e aprendizado da plataforma. Ele decide o que testar, o que escalar, o que pausar e o que arquivar. Outros componentes executam. Ele decide.

### Motivo
Repositórios são passivos. A principal proposta de valor da plataforma é inteligência ativa — uma plataforma que toma decisões melhores que o usuário com base em dados acumulados. Isso exige que o Knowledge Engine seja o centro de inteligência, não apenas de armazenamento.

### Alternativas Descartadas
- **KE como repositório central (passivo):** descartado. Um repositório responde a perguntas mas não toma iniciativas. A plataforma precisa de um componente que decida pro-ativamente.
- **Decisões distribuídas por componente:** descartado. Sem centralização da lógica de decisão, não há como garantir coerência entre Test Engine, Scale Engine e Story Engine.

### Impacto
- Toda a arquitetura gira em torno do KE como cérebro, não como banco de dados
- O Event Bus existe para que todos os componentes possam reportar ao KE e receber decisões dele
- O design do banco de dados deve ser orientado a padrões e decisões, não a transações

### Próximos Documentos Afetados
`04 - Arquitetura Geral` `09 - Knowledge Engine` `11 - Banco de Dados` `15 - Machine Learning`

---

<a name="002"></a>
## 2026-07-11 — #002 — Event Bus como Backbone de Comunicação

**Documento de origem:** README  
**Status:** ✅ Aprovada

### Decisão
Nenhum componente se comunica diretamente com outro. Toda comunicação entre componentes é assíncrona via Event Bus. O Knowledge Engine assina todos os eventos e tem visibilidade global.

### Motivo
Chamadas síncronas diretas criam acoplamento rígido. Se o Story Engine chama diretamente o Knowledge Engine e um falha, o outro para. Com Event Bus: cada componente é independente, substituível, testável isoladamente e escalável de forma autônoma. O sistema continua funcionando mesmo se um componente cair — os eventos ficam na fila esperando.

### Alternativas Descartadas
- **Chamadas síncronas diretas (REST interno):** descartado. Cria acoplamento que torna o sistema frágil e difícil de escalar componentes independentemente.
- **Knowledge Engine como roteador central (God Object):** descartado. Tornaria o KE um gargalo e um ponto único de falha, além de criar acoplamento de todos os componentes a ele.

### Impacto
- Toda a arquitetura é orientada a eventos
- Cada componente produz e consome eventos, sem conhecer os internos dos outros
- Implica eventual consistency (não strong consistency) em algumas operações

### Próximos Documentos Afetados
`04 - Arquitetura Geral` `11 - Banco de Dados` `12 - APIs`

---

<a name="003"></a>
## 2026-07-11 — #003 — Intelligence Score: Escala 0–100, Threshold Provisório de 81 para Escala

**Documento de origem:** README  
**Status:** ✅ Aprovada (threshold de 81 é provisório — ver P002)

### Decisão
O Intelligence Score é uma métrica única de confiança (0–100) para qualquer afirmação que a plataforma faz. Scores abaixo de 81 não são elegíveis para o Motor Escala. O valor 81 é provisório e será calibrado com dados reais no documento 15.

### Motivo
A plataforma precisa de uma linguagem unificada de confiança que atravesse todos os componentes. Um número único (0–100) é compreensível, calculável e comparável. O threshold de 81 foi estabelecido como ponto de partida razoável representando "evidência sólida mas não perfeita" — baseado em julgamento inicial, não em dados.

### Alternativas Descartadas
- **Classificações qualitativas (Baixo/Médio/Alto):** descartado. Não permite cálculos precisos nem comparações entre domínios diferentes.
- **Threshold configurável pelo usuário:** descartado. A fronteira entre Teste e Escala é sagrada (Princípio 5 da Filosofia). Deixar o usuário configurar essa fronteira viola o princípio.

### Impacto
- Todos os componentes que tomam decisões usam o Intelligence Score como insumo
- O threshold de escala (81) aparece como constante em múltiplos sistemas

### Próximos Documentos Afetados
`07 - Test Engine` `08 - Scale Engine` `09 - Knowledge Engine` `15 - Machine Learning` `18 - Regras de Negócio`

---

<a name="004"></a>
## 2026-07-11 — #004 — Motores Internos São Ocultos ao Usuário

**Documento de origem:** README  
**Status:** ✅ Aprovada

### Decisão
Campaign Engine, Scheduling Engine, Intelligence Layer e Analytics Engine são infraestrutura interna. O usuário nunca vê, nomeia ou configura esses componentes diretamente. O usuário vê apenas Motor TESTE e Motor ESCALA.

### Motivo
Princípio 4 da Filosofia: simplicidade na superfície, profundidade no motor. Expor nomes de componentes internos ao usuário criaria complexidade desnecessária sem agregar valor perceptível.

### Alternativas Descartadas
- **Expor o Campaign Engine como "Gerenciador de Campanhas":** descartado. O usuário já tem acesso à entidade Campanha via interface — não precisa saber que existe um engine gerenciando seu ciclo de vida.

### Impacto
- UX expõe apenas os dois motores + resultados
- Documentação interna documenta todos os engines; documentação de produto não os menciona

### Próximos Documentos Afetados
`04 - Arquitetura Geral` `05 - UX`

---

<a name="005"></a>
## 2026-07-11 — #005 — DNA do Perfil: Descoberto, Não Configurado

**Documento de origem:** README  
**Status:** ✅ Aprovada

### Decisão
O DNA do Perfil não é configurado pelo usuário. Ele é descoberto e construído pela plataforma ao longo do tempo com base em dados de performance. O usuário pode visualizar o DNA, mas não editá-lo diretamente.

### Motivo
Configuração manual é imprecisa, trabalhosa e tende a refletir a autopercepção do usuário, não o comportamento real da audiência. A plataforma tem acesso aos dados reais de comportamento e pode construir um DNA mais preciso do que qualquer configuração manual.

### Alternativas Descartadas
- **Configuração manual com refinamento por dados:** descartado. Cria viés inicial que pode demorar muito tempo para ser corrigido pelos dados. Adiciona carga cognitiva no onboarding.

### Impacto
- O onboarding precisa gerenciar expectativa de que o DNA é descoberto gradualmente
- Cold start problem é inevitável e precisa de estratégia explícita (ver P001)

### Próximos Documentos Afetados
`05 - UX` `09 - Knowledge Engine` `18 - Regras de Negócio`

---

<a name="006"></a>
## 2026-07-11 — #006 — Learning Timeline: Imutável

**Documento de origem:** README  
**Status:** ✅ Aprovada

### Decisão
Entradas na Learning Timeline nunca são deletadas. Quando um padrão se torna inválido, a entrada é marcada como "expirada" — não removida. O histórico completo de aprendizado é preservado permanentemente.

### Motivo
O histórico de padrões que deixaram de funcionar é tão valioso quanto o histórico de padrões que funcionam. Deletar entradas destruiria conhecimento sobre ciclos de saturação, sazonalidade e evolução de mercado. A imutabilidade também garante que o usuário nunca perde dados ao mudar de plano ou pausar o uso.

### Alternativas Descartadas
- **Deletar entradas antigas para economizar espaço:** descartado. O custo de armazenamento é aceitável; o custo de perder histórico é inaceitável.

### Impacto
- Estratégia de banco de dados deve suportar crescimento contínuo do histórico
- Interface deve diferenciar claramente padrões ativos de expirados

### Próximos Documentos Afetados
`09 - Knowledge Engine` `10 - Dashboards` `11 - Banco de Dados`

---

<a name="007"></a>
## 2026-07-11 — #007 — Nome da Plataforma: [PLATAFORMA] até Conclusão do PRD

**Documento de origem:** README  
**Status:** ✅ Aprovada

### Decisão
A plataforma usará o placeholder [PLATAFORMA] em toda a documentação até que os documentos 01 (Visão Geral), 02 (Filosofia) e 03 (PRD) estejam completos. A decisão de branding será tomada quando a identidade completa do produto estiver consolidada.

### Motivo
Nomear antes de consolidar a identidade do produto pode criar um nome que não representa o posicionamento final. O nome deve emergir naturalmente da visão completa do produto.

### Próximos Documentos Afetados
`03 - PRD` (momento de definir o nome)

---

<a name="008"></a>
## 2026-07-11 — #008 — MVP Foca em Afiliado Individual (Personas 1, 2 e 3)

**Documento de origem:** 01 - Visão Geral  
**Status:** ✅ Aprovada

### Decisão
O MVP é projetado exclusivamente para o afiliado individual. Funcionalidades de gestão de múltiplas contas, multi-tenant, permissionamento por cliente e relatórios para terceiros não entram no MVP nem no V1.

### Motivo
Focar no afiliado individual simplifica radicalmente o escopo do MVP, permite validar o core value proposition da plataforma (descoberta de padrões + escala) sem complexidade de multi-tenancy, e reduz risco de distrações arquiteturais.

### Alternativas Descartadas
- **Incluir Persona 4 (Gestor) no MVP:** descartado. Multi-tenancy e permissionamento complexo aumentariam o escopo em 40–60% sem validar o diferencial central do produto.

### Impacto
- Arquitetura de V1 deve ser construída sem criar impedimentos para multi-tenancy em V2
- Toda feature de MVP é avaliada pela pergunta: isso serve a um afiliado individual?

### Próximos Documentos Afetados
`03 - PRD` `04 - Arquitetura Geral` `05 - UX` `17 - Roadmap`

---

<a name="009"></a>
## 2026-07-11 — #009 — Persona 4 (Gestor/Agência) → V2/V3

**Documento de origem:** 01 - Visão Geral  
**Status:** ✅ Aprovada

### Decisão
A Persona 4 (Gestor de afiliados / Agência) está documentada como evolução futura (V2/V3) mas não influencia nenhuma decisão de MVP ou V1.

### Próximos Documentos Afetados
`17 - Roadmap`

---

<a name="010"></a>
## 2026-07-11 — #010 — Momento de Revelação do MVP

**Documento de origem:** 01 - Visão Geral  
**Status:** ✅ Aprovada

### Decisão
O momento de revelação do MVP é: **organização, campanhas bem estruturadas e primeiros insights simples**. A descoberta de padrões comportamentais profundos é consequência natural do uso contínuo, não uma promessa de onboarding.

O momento de revelação profunda (Fase 2) emerge organicamente após 30–90 dias de uso com dados suficientes.

### Motivo
O cold start problem torna impossível entregar padrões comportamentais profundos nos primeiros dias de uso. Prometer isso criaria expectativa frustrada. O valor imediato deve ser acessível desde os primeiros dias.

### Impacto
- Onboarding comunica valor imediato (organização + estrutura), não valor futuro (padrões comportamentais)
- Métricas de ativação do MVP medem engajamento operacional, não profundidade de aprendizado

### Próximos Documentos Afetados
`05 - UX` `17 - Roadmap`

---

<a name="011"></a>
## 2026-07-11 — #011 — Risco de Saturação por Nicho: Problema de Escala, Não de MVP

**Documento de origem:** 01 - Visão Geral  
**Status:** ✅ Aprovada

### Decisão
O risco de saturação quando múltiplos afiliados do mesmo nicho usam os mesmos padrões simultaneamente é registrado como problema de escala. Não impacta o MVP. Endereçar quando a densidade de usuários por nicho justificar.

### Próximos Documentos Afetados
`18 - Regras de Negócio` (fase de escala)

---

<a name="012"></a>
## 2026-07-11 — #012 — Métricas do MVP: Operacionais Simples

**Documento de origem:** 01 - Visão Geral  
**Status:** ✅ Aprovada

### Decisão
O MVP usa métricas operacionais simples: campanhas criadas, cliques, CTR, conversões, comissão gerada. Métricas avançadas (Knowledge Depth, Decision Accuracy Rate, Autonomy Rate) são introduzidas em V1/V2 quando houver dados suficientes para que sejam significativas.

### Motivo
Métricas sofisticadas sem dados suficientes para alimentá-las são ruído. O MVP precisa de clareza operacional, não de sofisticação analítica.

### Próximos Documentos Afetados
`03 - PRD` `10 - Dashboards` `17 - Roadmap`

---

<a name="013"></a>
## 2026-07-11 — #013 — Quality Score como Componente Obrigatório

**Documento de origem:** 02 - Filosofia  
**Status:** ✅ Aprovada

### Decisão
A plataforma deve possuir um Quality Score independente do Performance Score. O Quality Score avalia a qualidade da execução narrativa de uma história. O Performance Score avalia o resultado da campanha. Os dois não podem ser confundidos.

### Motivo
Uma história mal executada narrativamente pode causar um resultado ruim mesmo que a hipótese testada seja válida. Se o sistema não separa execução de hipótese, aprende a hipótese errada: "esse padrão não funciona" quando na verdade "essa execução foi fraca."

Isso seria um bug permanente no aprendizado do Knowledge Engine — falsos negativos que descartam hipóteses válidas por culpa de execução ruim.

### Alternativas Descartadas
- **Usar apenas Performance Score:** descartado. Contamina o aprendizado com variáveis de execução que não pertencem à hipótese.
- **Pedir ao usuário que avalie a qualidade manualmente:** descartado. Inconsistente, trabalhoso e sujeito a viés do usuário.

### Impacto
- Story Engine deve gerar um Quality Score para cada história produzida
- Knowledge Engine deve filtrar resultados com Quality Score abaixo do mínimo antes de atualizar o aprendizado
- Dashboard deve mostrar os dois scores separadamente

### Próximos Documentos Afetados
`06 - Story Engine` `09 - Knowledge Engine` `10 - Dashboards` `11 - Banco de Dados`

---

<a name="014"></a>
## 2026-07-11 — #014 — Decaimento do Intelligence Score: Princípio Filosófico

**Documento de origem:** 02 - Filosofia  
**Status:** ✅ Aprovada

### Decisão
O decaimento temporal do Intelligence Score é um princípio filosófico imutável: conhecimento envelhece e precisa ser revalidado. Os parâmetros específicos (velocidade de decaimento, gatilhos, curva de degradação) são decisões de implementação a serem definidas no documento 15 (Machine Learning) com base em dados reais.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `15 - Machine Learning`

---

<a name="015"></a>
## 2026-07-11 — #015 — Transparência ao Usuário: Obrigatória

**Documento de origem:** 02 - Filosofia  
**Status:** ✅ Aprovada

### Decisão
A plataforma deve ser capaz de explicar ao usuário, em linguagem simples, o motivo de qualquer decisão que tomou. O usuário tem direito à transparência, não ao controle. O mecanismo de UX para essa transparência será definido no documento 05.

### Motivo
Usuários que não entendem por que uma decisão foi tomada tendem a desconfiar e a tentar contornar o sistema. Transparência constrói confiança. Confiança aumenta delegação. Delegação aumenta valor entregue.

### Impacto
- Toda decisão do Knowledge Engine deve ser acompanhada de um raciocínio legível
- A UI deve ter um mecanismo de "por que?" acessível em pontos de decisão visíveis

### Próximos Documentos Afetados
`05 - UX` `09 - Knowledge Engine`

---

<a name="016"></a>
## 2026-07-11 — #016 — Produto Fica Mais Valioso Enquanto Opera Continuamente

**Documento de origem:** 02 - Filosofia  
**Status:** ✅ Aprovada

### Decisão
A afirmação filosófica correta é: "o produto fica mais valioso enquanto opera continuamente, sem exigir decisões operacionais do usuário." Não "sem que o usuário faça nada" — o usuário precisa ter campanhas ativas para que haja dados.

### Motivo
A formulação anterior ("sem que o usuário faça nada") era imprecisa e poderia criar expectativas incorretas no onboarding. A plataforma aprende com campanhas em execução — sem campanhas, não há aprendizado.

### Próximos Documentos Afetados
`05 - UX` `17 - Roadmap`

---

## Decisões Pendentes

> Decisões pendentes são questões que não podem ser resolvidas ainda — por falta de dados, por dependerem de documentos futuros ou por envolverem trade-offs que requerem mais contexto. Elas não bloqueiam o avanço da documentação. Cada uma tem um documento responsável por resolvê-la.

---

<a name="p001"></a>
## ⚠️ PENDENTE — #P001 — Estratégia de Cold Start do DNA do Perfil

**Documento de origem:** README  
**Documento responsável pela resolução:** `09 - Knowledge Engine`

### Problema
Perfis novos não têm DNA. A plataforma não sabe nada sobre voz, tom, audiência ou padrões do perfil. O Story Engine fica cego, e as primeiras campanhas são apostas — não hipóteses fundamentadas.

### Opções em consideração
1. **Bootstrap por nicho declarado:** onboarding captura o nicho e a plataforma usa o DNA médio de perfis daquele nicho como ponto de partida
2. **Bootstrap por rede:** usa padrões globais da plataforma para Threads ou X como fallback inicial
3. **Modo exploratório explícito:** primeiros N dias em modo de descoberta deliberada, com comunicação explícita ao usuário

### Impacto esperado
Afeta diretamente o onboarding, a UX dos primeiros dias, e a expectativa do usuário da Persona 1 (Explorador).

---

<a name="p002"></a>
## ⚠️ PENDENTE — #P002 — Threshold Exato do Intelligence Score para Escala

**Documento de origem:** README  
**Documento responsável pela resolução:** `15 - Machine Learning` + `18 - Regras de Negócio`

### Problema
O valor 81 foi estabelecido como threshold de escala por julgamento inicial, sem base em dados. Pode ser muito alto (poucos padrões elegíveis para escala) ou muito baixo (padrões não suficientemente validados entram em escala prematuramente).

### Impacto esperado
Afeta diretamente o volume de campanhas no Motor Escala e a taxa de sucesso da escala.

---

<a name="p003"></a>
## ⚠️ PENDENTE — #P003 — CQRS: Separação de Comandos e Consultas

**Documento de origem:** README  
**Documento responsável pela resolução:** `04 - Arquitetura Geral`

### Problema
A regra "tudo passa pelo Event Bus" (Decisão #002) é correta para operações assíncronas (publicar, processar, aprender). Mas algumas operações precisam de resposta imediata (gerar preview, mostrar dashboard). Forçar essas operações pelo Event Bus criaria latência inaceitável.

### Solução candidata
CQRS: Commands (write/async) vão pelo Event Bus. Queries (read/sync) fazem chamadas diretas ao banco de leitura. Os dois caminhos são separados por design.

### Impacto esperado
Afeta toda a arquitetura de comunicação entre componentes e o design do banco de dados.

---

<a name="p004"></a>
## ⚠️ PENDENTE — #P004 — Modelo de Negócio: Freemium vs Trial

**Documento de origem:** 01 - Visão Geral  
**Documento responsável pela resolução:** `03 - PRD`

### Problema
O modelo de negócio ainda não foi definido. Freemium (plano gratuito limitado permanentemente) e trial (acesso completo por tempo limitado) têm implicações muito diferentes para onboarding, curva de ativação, churn e cold start.

### Impacto esperado
Afeta o PRD, o Roadmap, o UX de onboarding e as regras de negócio de limites por plano.

---

<a name="p005"></a>
## ⚠️ PENDENTE — #P005 — Parâmetros do Quality Score

**Documento de origem:** 02 - Filosofia  
**Documento responsável pela resolução:** `06 - Story Engine` + `09 - Knowledge Engine`

### Problema
O Quality Score foi aprovado como componente obrigatório (Decisão #013), mas os parâmetros que definem "qualidade narrativa" não foram especificados. O que é uma história "boa o suficiente"? Como medir objetivamente?

### Impacto esperado
Define o mínimo de qualidade que uma história precisa ter para que seu resultado seja usado como dado de aprendizado.

---

<a name="p006"></a>
## ⚠️ PENDENTE — #P006 — Parâmetros de Decaimento do Intelligence Score

**Documento de origem:** 02 - Filosofia  
**Documento responsável pela resolução:** `15 - Machine Learning`

### Problema
A filosofia estabelece que o Intelligence Score decai com o tempo (Decisão #014). Mas com que velocidade? Por quais gatilhos? A curva é linear, exponencial ou por limiar de tempo?

### Impacto esperado
Afeta quantas revalidações a plataforma realiza, a frequência de campanhas no Motor Teste para revalidação, e a estabilidade da Learning Timeline.

---

<a name="p007"></a>
## ⚠️ PENDENTE — #P007 — Mecanismo de Transparência ao Usuário

**Documento de origem:** 02 - Filosofia  
**Documento responsável pela resolução:** `05 - UX`

### Problema
A Decisão #015 estabelece que a plataforma deve explicar suas decisões ao usuário em linguagem simples. Mas como isso se manifesta na interface? Um botão "por que?"? Um tooltip? Um painel lateral? Uma notificação?

### Impacto esperado
Afeta o design de todas as telas que apresentam decisões da plataforma ao usuário.

---

<a name="p008"></a>
## ⚠️ PENDENTE — #P008 — Critério de Pausa de Teste por Baixa Performance

**Documento de origem:** Antecipada  
**Documento responsável pela resolução:** `07 - Test Engine` + `18 - Regras de Negócio`

### Problema
Se o Motor Escala tem um critério de entrada (Intelligence Score ≥ 81), o Motor Teste precisa de critérios de saída. Quando uma campanha deve ser pausada por desempenho insuficiente? Após quantas publicações? Com qual taxa de resultado negativo? O critério é absoluto ou relativo ao nicho?

### Impacto esperado
Afeta o controle de gastos do usuário (campanhas ruins consumindo recursos) e a qualidade do aprendizado (experimentos encerrados cedo demais não geram dados suficientes).

---

---

<a name="017"></a>
## 2026-07-11 — #017 — Modelo de Negócio: Trial 14 Dias → Assinatura Mensal

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
Modelo de negócio: trial de 14 dias com acesso completo (sem cartão de crédito), seguido de conversão para assinatura mensal. Três planos: Starter (1–2 perfis), Growth (3–5 perfis), Scale (6–15 perfis). Preços definidos no documento 17.

### Motivo
Freemium cria dois produtos. O produto gratuito limitado nunca demonstra o valor real da plataforma (learning depende de dados que um plano limitado não gera). Trial com acesso completo permite que o usuário experimente o valor real — se o produto entrega, a conversão é natural.

### Alternativas Descartadas
- **Freemium:** descartado. Usuário gratuito vive em cold start permanente e nunca chega ao momento de revelação.
- **Trial com cartão obrigatório:** descartado. Atrito desnecessário na aquisição, especialmente para mercado brasileiro.

### Próximos Documentos Afetados
`17 - Roadmap` `16 - Segurança` (risco de abuso sem cartão)

---

<a name="018"></a>
## 2026-07-11 — #018 — MVP: Texto Apenas (Sem Imagens ou Vídeos)

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
O MVP publica apenas conteúdo textual. Sem imagens, sem vídeos, sem carrosséis.

### Motivo
Adicionar geração de imagem ou vídeo ao MVP aumentaria o escopo em 40–60% sem validar o core value proposition. O diferencial da plataforma é o aprendizado e a escala de padrões — não a qualidade visual do conteúdo.

### Próximos Documentos Afetados
`06 - Story Engine` `17 - Roadmap`

---

<a name="019"></a>
## 2026-07-11 — #019 — Rate Limits: Operar Sempre Dentro dos Limites Oficiais

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
A plataforma nunca promete números absolutos de publicações por período. O volume efetivo de publicações é sempre subordinado aos rate limits oficiais de cada rede social. Documentação detalhada e atualização contínua obrigatórias no documento 13.

### Motivo
Rate limits mudam. Prometer números que dependem de APIs externas é uma promessa que a plataforma não pode honrar sozinha.

### Próximos Documentos Afetados
`12 - APIs` `13 - Integrações`

---

<a name="020"></a>
## 2026-07-11 — #020 — Rastreamento de Links: Validação Técnica Obrigatória

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
Nenhum mecanismo de rastreamento de links de afiliado será implementado sem validação técnica prévia de compatibilidade com os sistemas de atribuição de Shopee, Amazon e Mercado Livre. A validação é pré-requisito para implementação.

### Motivo
Um mecanismo de rastreamento que quebre a atribuição de comissões faz o afiliado perder receita — o pior bug possível para um produto cujo objetivo é aumentar as vendas do usuário.

### Próximos Documentos Afetados
`12 - APIs` `13 - Integrações`

---

<a name="021"></a>
## 2026-07-11 — #021 — Modo Revisão: Rejeições São Sinais de Aprendizado

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
No Modo Revisão, aprovações e rejeições são sinais de aprendizado distintos para o Knowledge Engine. Histórias rejeitadas são registradas com o sinal de rejeição (e motivo, quando fornecido). O KE pondera rejeições em futuras gerações — campanhas com Modo Revisão ativado não ficam num "buraco negro" de aprendizado.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `11 - Banco de Dados`

---

<a name="022"></a>
## 2026-07-11 — #022 — Limites de Plano: Placeholders Até Análise de Custos Reais

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
Os limites de publicações por plano (60/200/ilimitado) são placeholders. Serão definidos com base em custos reais de geração de IA, comportamento dos usuários e estratégia comercial. Definição obrigatória no documento 17 (Roadmap).

### Próximos Documentos Afetados
`17 - Roadmap`

---

<a name="023"></a>
## 2026-07-11 — #023 — Trial Sem Cartão: Risco Registrado para Segurança

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
O trial sem cartão de crédito é mantido por redução de atrito de aquisição. O risco de abuso (múltiplas contas para trials infinitos) é registrado como risco operacional a ser mitigado no documento 16 (Segurança). Não bloqueia o PRD.

### Próximos Documentos Afetados
`16 - Segurança`

---

<a name="024"></a>
## 2026-07-11 — #024 — LGPD: Projeto Paralelo Obrigatório

**Documento de origem:** 03 - PRD  
**Status:** ✅ Aprovada

### Decisão
Conformidade com LGPD é obrigatória desde o MVP mas tratada como projeto paralelo com suas próprias dependências (política de privacidade, bases legais, mecanismo de exclusão, DPA com processadores). Deve aparecer como bloco específico no Roadmap, não como item genérico de checklist.

### Próximos Documentos Afetados
`16 - Segurança` `17 - Roadmap`

---

---

<a name="025"></a>
## 2026-07-11 — #025 — CQRS: Commands Async / Queries Sync

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada (resolve P003)

### Decisão
O sistema implementa CQRS com dois caminhos explicitamente separados: Commands (operações de escrita) vão de forma assíncrona pelo Event Bus. Queries (operações de leitura) vão de forma síncrona direto ao PostgreSQL, com cache Redis.

### Motivo
Forçar queries pelo Event Bus criaria latência de 500ms–2s no dashboard quando o usuário espera < 100ms. CQRS mantém escrita assíncrona e leitura síncrona — melhor performance em cada direção.

### Próximos Documentos Afetados
`11 - Banco de Dados` `12 - APIs`

---

<a name="026"></a>
## 2026-07-11 — #026 — Stack Principal: TypeScript + Python + Next.js + PostgreSQL + Redis

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
Stack completa: TypeScript/Node.js para serviços principais; Python para ML Engine; Next.js 14+ para frontend; PostgreSQL com pgvector para dados; Redis para cache e BullMQ.

### Próximos Documentos Afetados
`11 - Banco de Dados` `15 - Machine Learning`

---

<a name="027"></a>
## 2026-07-11 — #027 — Event Bus: BullMQ/Redis no MVP, Arquitetura Preparada para Kafka em V2

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
BullMQ sobre Redis é o Event Bus do MVP. Os contratos de evento (TypeScript interfaces com envelope padrão) são desenhados para ser transportados por Kafka sem alteração em V2. Zero infraestrutura adicional no MVP além do Redis.

### Próximos Documentos Afetados
`17 - Roadmap`

---

<a name="028"></a>
## 2026-07-11 — #028 — Infraestrutura: AWS ECS Fargate (MVP) → EKS (V2+)

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
MVP roda em AWS ECS Fargate: zero gerenciamento de cluster, escalabilidade automática, custo proporcional ao uso. Migração para EKS em V2 quando o volume justificar a complexidade operacional adicional.

### Próximos Documentos Afetados
`17 - Roadmap`

---

<a name="029"></a>
## 2026-07-11 — #029 — Busca Vetorial: pgvector (Extensão PostgreSQL)

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
Busca vetorial implementada via pgvector, extensão do PostgreSQL. Nenhum banco de dados vetorial adicional (Pinecone, Weaviate) é necessário no MVP ou V1. Padrões, DNA e evidências vivem no mesmo PostgreSQL já necessário.

### Motivo
Banco adicional = custo operacional adicional + complexidade de sincronização. Para o volume de MVP/V1, pgvector é suficiente e elimina uma dependência inteira.

### Próximos Documentos Afetados
`11 - Banco de Dados` `15 - Machine Learning`

---

<a name="030"></a>
## 2026-07-11 — #030 — Intelligence Layer: Implementação Custom (Sem LangChain/LlamaIndex)

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
A Intelligence Layer é implementada sem frameworks de orquestração de IA (LangChain, LlamaIndex, etc.). Toda a lógica de seleção de modelo, engenharia de prompt, cache e fallback é código TypeScript próprio.

### Motivo
LangChain e similares adicionam abstração que não necessariamente encaixa no modelo plugin-based desta plataforma. Controle total permite otimizações específicas (ex: cache de respostas idênticas, custo por tarefa) que frameworks genéricos não suportam facilmente.

### Próximos Documentos Afetados
`14 - Inteligência Artificial`

---

<a name="031"></a>
## 2026-07-11 — #031 — Plugin Architecture como Padrão Mandatório para Integrações Externas

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
Toda integração com sistemas externos (redes sociais, marketplaces, provedores de IA, provedores de conteúdo) deve ser implementada como um plugin via interface TypeScript contratual. Nenhum serviço interno pode chamar diretamente uma API externa — toda chamada passa pelo Plugin Registry e pelo adapter correspondente.

### Motivo
A filosofia da plataforma é agnóstica de rede, agnóstica de marketplace e agnóstica de modelo de IA. A Plugin Architecture transforma essa filosofia de intenção em garantia verificável em compilação. Um desenvolvedor que tente integrar Threads diretamente no Publisher receberá erro de TypeScript — não vai descobrir o problema em produção. Adicionar suporte a uma nova rede social não exige nenhuma alteração nos serviços existentes.

### Alternativas Descartadas
- **Integração direta com condicionais (if network === 'threads'):** descartado. Escala O(n) — cada nova rede adiciona complexidade em múltiplos serviços. Violação da regra "aberto para extensão, fechado para modificação."
- **Strategy Pattern sem registry central:** descartado. Sem um ponto central de health monitoring e feature flags, não há como gerenciar degradação de um provider sem afetar o restante.

### Impacto
- Publisher, Analytics Engine, Story Engine e Campaign Engine nunca chamam APIs externas diretamente
- O Plugin Registry é o único ponto de contato entre serviços internos e o mundo exterior
- Testes de integração podem usar adapters mock sem alterar nenhum serviço

### Próximos Documentos Afetados
`12 - APIs` `13 - Integrações` `14 - Inteligência Artificial` `18 - Regras de Negócio`

---

<a name="032"></a>
## 2026-07-11 — #032 — ISocialNetworkProvider: Interface Contratual para Redes Sociais

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
Toda rede social implementa a interface `ISocialNetworkProvider`, que define: identificação, capacidades (`SocialNetworkCapabilities`), OAuth, rate limits, publicação, métricas de post, métricas de conta, e health check. Implementações no MVP: `ThreadsAdapter`, `XAdapter`.

### Motivo
Publisher e Analytics Engine precisam tratar todas as redes de forma uniforme. A interface é o contrato que garante que qualquer rede adicionada no futuro (TikTok, Instagram, Bluesky) funciona imediatamente com todos os serviços existentes.

### Impacto
- Capacidades variáveis entre redes (ex: vídeo no TikTok, texto puro no Threads) são representadas pelo campo `SocialNetworkCapabilities` — o Story Engine consulta esse campo para saber o que pode gerar
- Autenticação OAuth varia por rede mas é encapsulada no adapter — o sistema de auth não precisa saber sobre Threads especificamente

### Próximos Documentos Afetados
`13 - Integrações`

---

<a name="033"></a>
## 2026-07-11 — #033 — IMarketplaceProvider: Interface Contratual para Marketplaces

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
Todo marketplace implementa a interface `IMarketplaceProvider`, que define: identificação, validação de compatibilidade de rastreamento (obrigatório — DECISIONS #020), geração de links de afiliado, busca de produtos, coleta de conversões, configuração de auth e health check. Implementações no MVP: `ShopeeAdapter`, `AmazonAdapter`, `MercadoLivreAdapter`.

### Próximos Documentos Afetados
`13 - Integrações` `18 - Regras de Negócio`

---

<a name="034"></a>
## 2026-07-11 — #034 — IAIProvider: Intelligence Layer Formalizada como AI Plugin Registry

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
A Intelligence Layer já implementava informalmente uma abstração sobre modelos de IA. Essa abstração é agora formalizada como a interface `IAIProvider`. Todo provedor de IA (OpenAI, Anthropic, Groq, Google, modelos locais) implementa essa interface. A Intelligence Layer usa o `AIProviderRegistry` para selecionar o provider adequado por tarefa, com fallback automático para providers saudáveis.

### Motivo
A formalização garante que adicionar um novo provedor de IA nunca exige modificar a Intelligence Layer ou qualquer serviço que a usa. É a aplicação do mesmo princípio de #031 ao domínio de IA.

### Próximos Documentos Afetados
`14 - Inteligência Artificial`

---

<a name="035"></a>
## 2026-07-11 — #035 — IContentProvider: Slot Reservado para Provedores de Conteúdo Visual

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada (slot reservado; nenhum adapter implementado no MVP)

### Decisão
A interface `IContentProvider` é definida na arquitetura mas nenhum adapter é implementado no MVP. O Story Engine já está preparado para verificar o `IContentProvider Registry` — quando nenhum provider estiver disponível, opera em modo texto (comportamento padrão do MVP). Quando Stability AI ou DALL-E for integrado em V1, o Story Engine já sabe como usá-lo.

### Motivo
MVP é texto apenas (DECISIONS #018). Mas construir o slot agora evita que o Story Engine precise ser reescrito quando a geração de imagens for adicionada. O custo é zero (uma interface TypeScript). O benefício é eliminação de refatoração futura.

### Próximos Documentos Afetados
`06 - Story Engine` `17 - Roadmap`

---

<a name="036"></a>
## 2026-07-11 — #036 — Plugin Registry: Gerenciamento Central, Health Monitoring e Feature Flags

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
O Plugin Registry é um componente singleton inicializado na startup de cada serviço. Responsabilidades: registrar providers, fornecer acesso por tipo e ID, monitorar saúde (health check a cada 60 segundos), manter circuit breakers por provider, e gerenciar feature flags de provider (habilitar/desabilitar sem deploy). O registry persiste health logs e feature flags no banco (`schema: plugins`).

### Motivo
Sem um ponto central de health monitoring, uma degradação do Threads API poderia causar falhas em cascata no Publisher sem um mecanismo claro de fallback. O Plugin Registry centraliza a responsabilidade de saber "quais providers estão saudáveis agora" e serve esse dado a todos os serviços que precisam.

### Impacto
- Todo novo adapter entra com feature flag `disabled=true` por padrão — ativado manualmente após testes
- Circuit breaker automático: provider com health `UNHEALTHY` é removido do pool ativo sem intervenção humana
- Startup da aplicação falha explicitamente se algum adapter não inicializar corretamente (fail fast)

### Próximos Documentos Afetados
`13 - Integrações` `16 - Segurança` `18 - Regras de Negócio`

---

<a name="037"></a>
## 2026-07-11 — #037 — PgBouncer: Entra no MVP como Medida Preventiva

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
PgBouncer (connection pooler) entra no MVP, não no V1 como planejado originalmente. Com múltiplos serviços independentes (KE, CE, Story Engine, Analytics Engine, Publisher) todos abrindo conexões ao PostgreSQL, o limite de conexões pode ser atingido rapidamente sem pooling.

### Motivo
O custo de configurar PgBouncer é baixo. O custo de uma crise de connection exhaustion em produção com usuários reais é alto. Não há razão para adiar.

### Alternativas Descartadas
- **Adiar para V1 como originalmente planejado:** descartado. O risco é real e a mitigação é barata.

### Próximos Documentos Afetados
`11 - Banco de Dados`

---

<a name="038"></a>
## 2026-07-11 — #038 — Scheduling Engine: Síncrono no MVP, Cache Próprio em V1

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada

### Decisão
O Scheduling Engine opera de forma síncrona no MVP (query ao banco para calcular horários). A preocupação de escala — múltiplas queries simultâneas sob carga — é registrada como débito técnico planejado. Em V1, o Scheduling Engine extrai padrões de horário para cache em memória (atualizado a cada hora), eliminando as queries em tempo real.

### Motivo
O volume de cálculos de horário no MVP não justifica a complexidade de um cache dedicado. Em V1, com mais usuários e campanhas simultâneas, o bottleneck se torna real e o cache vale o custo.

### Próximos Documentos Afetados
`17 - Roadmap`

---

---

<a name="039"></a>
## 2026-07-11 — #039 — Complexidade Arquitetural Permanece Invisível ao Usuário

**Documento de origem:** 04 - Arquitetura Geral  
**Status:** ✅ Aprovada  
**Escopo:** Diretriz permanente — aplica-se a todos os documentos de UX, Interface, Integrações e APIs

### Decisão
Toda a complexidade arquitetural da plataforma — Plugin Architecture, Providers, Adapters, Registries, interfaces tipadas, Event Bus, CQRS, engines internos — permanece exclusivamente na implementação. O usuário nunca vê, ouve ou precisa compreender esses conceitos.

Para o usuário, a plataforma é quatro verbos:
1. **Conectar** uma conta
2. **Escolher** um produto
3. **Criar** uma campanha
4. **Ver** os resultados

Qualquer tela, texto, notificação, erro ou documentação de produto que exponha terminologia arquitetural é um bug de UX — não uma feature.

### Motivo
A sofisticação técnica da plataforma é seu diferencial de engenharia, não seu argumento de venda. Expor Providers, Adapters ou Registries ao usuário transfere complexidade sem transferir valor. O usuário quer resultados — não entender como o sistema funciona por dentro.

Esta decisão estende a Decisão #004 (motores internos ocultos ao usuário) ao domínio da Plugin Architecture. O mesmo princípio que esconde o Campaign Engine esconde o `ThreadsAdapter`.

### Exemplos de tradução arquitetura → UX

| Conceito arquitetural | Como aparece para o usuário |
|---|---|
| `ISocialNetworkProvider` | "Contas conectadas" |
| `ThreadsAdapter.validateCredentials()` | "Verificando conexão com Threads..." |
| `IMarketplaceProvider` | Campo de seleção de loja |
| Plugin Registry health check | Banner discreto "Threads com instabilidade" (se necessário) |
| `ProviderHealth: UNHEALTHY` | "Não foi possível publicar agora. Tentaremos novamente em breve." |
| Circuit breaker ativado | Silêncio — o sistema trata internamente |
| `IAIProvider` / modelo de IA | Invisível — o usuário nunca escolhe modelo |
| Feature flag de provider | O provider simplesmente não aparece nas opções |

### Impacto
- Toda mensagem de erro deve ser traduzida para consequência do usuário, não causa técnica
- Documentação de produto não menciona nenhum conceito arquitetural
- A equipe de produto deve revisar cada tela com a pergunta: "algum conceito arquitetural escapou para a superfície?"

### Próximos Documentos Afetados
`05 - UX` `10 - Dashboards` `12 - APIs` `13 - Integrações` `18 - Regras de Negócio`

---

---

<a name="040"></a>
## 2026-07-11 — #040 — Persona Unificada: O Usuário Percebe Uma Única Inteligência

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada  
**Escopo:** Diretriz permanente — aplica-se a todos os documentos de UX, Interface e Produto

### Decisão
Para o usuário, a plataforma é uma única inteligência que aprende, cria, publica, analisa e melhora continuamente. Ele nunca percebe que existem dezenas de serviços, motores e integrações rodando em paralelo. Não existe, na perspectiva do usuário, Story Engine, Campaign Engine, Knowledge Engine, Publisher, Analytics Engine, Plugin Registry ou qualquer outro componente.

Existe apenas *ela* — a inteligência da plataforma — trabalhando por ele.

### Motivo
A fragmentação percebida quebra a magia. Quando o usuário percebe "o módulo de stories fez X mas o módulo de analytics ainda não processou Y", ele passa a gerenciar sistema em vez de confiar nele. A confiança é pré-requisito para delegação. Delegação é pré-requisito para o valor da plataforma existir.

Um produto que parece um único ser inteligente é radicalmente diferente de um produto que parece uma coleção de ferramentas conectadas.

### Impacto
- A plataforma nunca fala no plural de componentes: não "seus engines estão processando" mas "estou analisando"
- Qualquer falha de sincronização entre componentes internos é invisível ao usuário — tratada internamente
- O design visual da interface deve reforçar a sensação de unidade, não de módulos separados

### Próximos Documentos Afetados
`05 - UX` `10 - Dashboards` `18 - Regras de Negócio`

---

<a name="041"></a>
## 2026-07-11 — #041 — Voz da Entidade: Primeira Pessoa, Proativa, Orientada a Resultado

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada

### Decisão
Toda comunicação da plataforma com o usuário é feita em primeira pessoa do singular, como uma inteligência reportando o que fez, está fazendo ou descobriu. A entidade é proativa — ela fala; o usuário ouve. Quando o usuário precisar agir, a entidade instrui em linguagem simples de consequência.

Exemplos canônicos aprovados:
- "Encontrei um bom horário para publicar essa história."
- "Estou testando uma nova narrativa para esse produto."
- "Percebi que histórias de transformação estão performando melhor hoje."
- "Publiquei sua história no melhor horário disponível."
- "Aprendi algo novo sobre o comportamento da sua audiência."
- "Preciso que você reconecte sua conta do Threads para continuar publicando."

### Vocabulário da Entidade

**Verbos permitidos (ação inteligente):** encontrei, percebi, aprendi, testei, publiquei, descobri, analisei, identifiquei, criei, agendei, pausei  
**Verbos em andamento:** estou testando, estou criando, estou analisando, estou aprendendo, estou aguardando  
**Verbos de intenção:** vou publicar, vou tentar novamente, vou verificar, vou aguardar  
**Jamais:** erro ocorreu, sistema processando, campanha foi criada, publicação foi enviada, analytics coletados

### Motivo
"Campanha foi criada" é uma notificação de banco de dados. "Criei uma campanha para esse produto" é uma inteligência reportando uma ação. A segunda cria percepção de agência, confiança e parceria. A primeira é invisível — ruído operacional.

### Próximos Documentos Afetados
`05 - UX` `10 - Dashboards`

---

<a name="042"></a>
## 2026-07-11 — #042 — Hierarquia de Comunicação: Silêncio / Consequência / Ação

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada

### Decisão
Toda situação que requer comunicação da plataforma segue exatamente três níveis, nessa ordem de preferência:

**Nível 1 — Silêncio:** o sistema resolve sozinho e o usuário não é interrompido. Falhas transitórias, retentativas automáticas, lentidão momentânea de API — o usuário não precisa saber.

**Nível 2 — Consequência:** o sistema precisa de tempo ou está aguardando, mas não requer ação do usuário. Comunicar apenas a consequência visível, em linguagem simples. Ex: "Estou tentando publicar sua campanha." Nunca: "Retry limit reached on Threads API."

**Nível 3 — Ação:** o sistema precisa de algo do usuário para continuar. Comunicar apenas o que o usuário precisa fazer e por que importa para ele. Ex: "Reconecte sua conta do Threads para que eu possa continuar publicando." Nunca: "OAuth token expired — reauthorize ISocialNetworkProvider."

### Regra de ouro
Se o sistema pode resolver sozinho, o usuário nunca fica sabendo. Se não pode, ele recebe uma instrução — não uma explicação técnica.

### Próximos Documentos Afetados
`05 - UX` `10 - Dashboards` `16 - Segurança` `18 - Regras de Negócio`

---

---

<a name="043"></a>
## 2026-07-11 — #043 — Entidade Silenciosa por Padrão

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada

### Decisão
A Entidade aparece apenas quando existe valor real para comunicar: uma descoberta nova, uma oportunidade de ação, um aprendizado significativo ou uma ação necessária do usuário. Processamento interno, geração de histórias, coleta de métricas e outras operações de rotina são invisíveis — sem narração, sem spinner com texto, sem notificação.

### Motivo
Uma Entidade que narra tudo que processa deixa de ser uma inteligência e passa a ser um sistema de notificações. O silêncio é parte da personalidade: ela trabalha sem pedir atenção. Quando fala, significa que vale ouvir.

### Impacto
- Geração de história: sem mensagem de "estou criando" — apenas o resultado aparece
- Coleta de analytics: completamente silenciosa
- Retentativas automáticas: silenciosas (Nível 1 da hierarquia de comunicação)
- A Entidade fala apenas nos níveis 2 e 3 definidos em #042

### Próximos Documentos Afetados
`10 - Dashboards` `18 - Regras de Negócio`

---

<a name="044"></a>
## 2026-07-11 — #044 — Dashboard: Resultado de Negócio Primeiro

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada

### Decisão
A hierarquia visual do Dashboard segue esta ordem estrita:
1. **Resultado de negócio:** comissões, vendas, cliques, conversões — o que importa financeiramente
2. **Campanhas:** status e performance das campanhas ativas
3. **Insights da Entidade:** descobertas e oportunidades — apenas quando relevantes

### Motivo
O usuário usa a plataforma para ganhar dinheiro. Abrir o app e ver primeiro os resultados financeiros é a experiência correta. Insights e descobertas são valiosos, mas subordinados ao resultado que motivou o uso da plataforma.

### Próximos Documentos Afetados
`10 - Dashboards`

---

<a name="045"></a>
## 2026-07-11 — #045 — Insights Ordenados por Impacto, Não por Cronologia

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada

### Decisão
A área de insights (Aprendizados / Feed da Entidade) ordena os padrões pelo impacto potencial nos resultados do usuário — não pela data em que foram descobertos. Um padrão descoberto há 30 dias que aumenta CTR em 3× aparece antes de um padrão descoberto ontem que melhora CTR em 10%.

### Motivo
Cronologia é a organização mais fácil de implementar, não a mais útil. O usuário deve ver primeiro o que mais importa para seus resultados — independente de quando foi descoberto.

### Impacto
- O Knowledge Engine deve calcular e manter um "impact score" por padrão, além do Intelligence Score
- A área de Aprendizados re-ordena a cada vez que é aberta com base nos scores atualizados

### Próximos Documentos Afetados
`09 - Knowledge Engine` `10 - Dashboards`

---

<a name="046"></a>
## 2026-07-11 — #046 — Entidade Não é Chatbot

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada

### Decisão
A Entidade inicia comunicações quando tem algo a dizer. O usuário nunca digita para ela. A única forma de "perguntar" à Entidade é o mecanismo estruturado "Por quê?" disponível em pontos de decisão específicos. Não existe campo de texto livre, não existe interface de chat, não existe modo de prompt.

### Motivo
Um chatbot exige que o usuário saiba o que perguntar. A Entidade trabalha de forma autônoma e informa pro-ativamente. Adicionar um chat mudaria o paradigma do produto: de "inteligência que trabalha por você" para "assistente que responde perguntas" — dois produtos fundamentalmente diferentes.

### Impacto
- Nenhuma interface de input de texto livre para comunicação com a Entidade em qualquer versão até V3
- O mecanismo "Por quê?" retorna respostas estruturadas e contextuais, não uma conversa

### Próximos Documentos Afetados
`10 - Dashboards` `18 - Regras de Negócio`

---

<a name="047"></a>
## 2026-07-11 — #047 — Plataforma Demonstra Memória Explicitamente

**Documento de origem:** 05 - UX  
**Status:** ✅ Aprovada

### Decisão
A interface deve tornar visível que a plataforma acumula e evolui seu conhecimento ao longo do tempo. Padrões devem aparecer com três estados percebíveis pelo usuário:
- **Ativo e confiante:** "Histórias de transformação convertem 3× melhor no seu perfil. Descoberto há 45 dias, confirmado em 12 campanhas."
- **Em confirmação:** "Percebo que histórias curtas estão performando melhor. Ainda verificando."
- **Expirado:** "Histórias longas convertiam bem até maio. Esse padrão parece não funcionar mais."

### Motivo
A memória visível é o que diferencia a plataforma de uma ferramenta de automação. Qualquer automação publica posts. Só uma inteligência acumula e demonstra aprendizado ao longo do tempo. Mostrar padrões expirados é tão importante quanto mostrar padrões ativos — prova que o sistema atualiza seu conhecimento, não congela no passado.

### Impacto
- A Learning Timeline (interna) precisa de representação visual adequada para o usuário
- Estados de padrão (ativo / em confirmação / expirado) são conceitos de UX, não apenas de banco de dados

### Próximos Documentos Afetados
`09 - Knowledge Engine` `10 - Dashboards` `11 - Banco de Dados`

---

---

<a name="048"></a>
## 2026-07-11 — #048 — Arcos Narrativos: Categorias Abertas com Subarcos Evolutivos

**Documento de origem:** 06 - Story Engine  
**Status:** ✅ Aprovada

### Decisão
Os 8 arcos narrativos definidos no documento 06 são categorias iniciais, não um conjunto fechado. Cada categoria pode evoluir para conter subarcos específicos conforme a plataforma identifica variações de alta performance que merecem ser distinguidas. Exemplo: "Transformação Pessoal" pode gerar subarcos "Transformação Rápida" (resultado em dias) e "Transformação Gradual" (processo longo e sustentável) se os dados mostrarem que eles performam diferentemente.

### Motivo
Um conjunto fechado de 8 arcos seria suficiente para o MVP mas limitante para uma plataforma que aprende. A descoberta de subarcos é em si um aprendizado valiosos — o Knowledge Engine deve ter um mecanismo para registrar e nomear novos padrões narrativos emergentes.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `15 - Machine Learning`

---

<a name="049"></a>
## 2026-07-11 — #049 — Momento da Compra: Dimensão Futura do Decision Package (V2+)

**Documento de origem:** 06 - Story Engine  
**Status:** ✅ Aprovada (V2+ — não entra no MVP)

### Decisão
O conceito de Momento da Compra (Customer Buying Stage) será incorporado como uma 13ª dimensão do Decision Package em V2+. Os cinco estágios:
1. Ainda não percebeu que tem um problema
2. Já percebeu o problema, busca entender
3. Está pesquisando soluções possíveis
4. Está comparando produtos específicos
5. Está pronta para comprar — precisa apenas de um gatilho

A plataforma identificará o estágio predominante da audiência de cada perfil (ou de segmentos dentro dela) através de dados de comportamento, e o Story Engine selecionará arcos narrativos correspondentes ao estágio.

### Motivo
O objetivo da plataforma é sempre a conversão via clique em link de afiliado. Mas pessoas em estágios 1 e 2 não convertem por CTAs diretos de compra — convertem por narrativas de descoberta e problema. A mesma mensagem para audiências em estágios diferentes produz resultados drasticamente diferentes. Esta dimensão é o que separa uma plataforma de automação de uma plataforma de inteligência de compra.

### Impacto esperado
Essa dimensão pode ser o maior driver de melhoria de conversão após o MVP. Tratada como prioridade de V2 — não como melhoria menor.

### Próximos Documentos Afetados
`07 - Test Engine` `09 - Knowledge Engine` `15 - Machine Learning` `17 - Roadmap`

---

<a name="050"></a>
## 2026-07-11 — #050 — Story Family: Explorar Derivações Antes de Pivotar

**Documento de origem:** 06 - Story Engine  
**Status:** ✅ Aprovada

### Decisão
Quando uma história apresentar desempenho excepcional (performance significativamente acima da média da campanha), a plataforma entra em modo Story Family: cria 3–5 derivações da mesma família narrativa (variando comprimento, CTA, detalhes específicos) antes de explorar arcos completamente diferentes. Somente após esgotar o potencial da família é que o Knowledge Engine autoriza exploração de território novo.

O conceito de "família" preserva o DNA do que funcionou e varia apenas o necessário para identificar os limites e o potencial máximo do padrão.

### Motivo
Pivotar imediatamente para um arco diferente após um sucesso desperdiça o potencial do padrão que funcionou. A Story Family é a implementação do princípio de exploração local antes de exploração global — maximiza o rendimento de cada descoberta.

### Próximos Documentos Afetados
`07 - Test Engine` `09 - Knowledge Engine`

---

<a name="051"></a>
## 2026-07-11 — #051 — Prova Social: Apenas com Contexto Autêntico

**Documento de origem:** 06 - Story Engine  
**Status:** ✅ Aprovada

### Decisão
O arco Prova Social (Arco 7) é utilizado apenas quando há contexto genuíno para uma narrativa de prova social crível. Fabricar ou exagerar prova social é proibido. A plataforma não gera afirmações de popularidade sem base em experiência real do afiliado com o produto ou com sua audiência.

### Motivo
Prova social fabricada corrói a credibilidade do afiliado com sua audiência. No longo prazo, destrói exatamente o ativo que a plataforma está ajudando a construir. Uma plataforma que aprende deve aprender que autenticidade tem valor acumulável — não apenas CTR imediato.

### Próximos Documentos Afetados
`06 - Story Engine` (restrição de uso do Arco 7) `18 - Regras de Negócio`

---

<a name="052"></a>
## 2026-07-11 — #052 — Meta-Aprendizado: Por Que Histórias Vendem em Quais Contextos

**Documento de origem:** 06 - Story Engine  
**Status:** ✅ Aprovada

### Decisão
O aprendizado da plataforma evolui em dois níveis:

**Nível 1 (MVP):** aprender O QUÊ vende — quais arcos, quais gatilhos, quais comprimentos convertem melhor para este perfil.

**Nível 2 (V2+):** aprender POR QUÊ vende — quais combinações de arco × audiência × contexto × momento da jornada produzem conversão. O Knowledge Engine deve ser capaz de fazer afirmações do tipo: "Histórias de transformação convertem melhor para esta audiência quando publicadas às terças-feiras, para pessoas no estágio de comparação de produtos."

O Nível 2 é o diferencial competitivo de longo prazo. A arquitetura deve ser desenhada desde o MVP para que o acúmulo de dados já suporte o Nível 2 quando chegar — mesmo que o processamento desse nível só ocorra depois.

### Motivo
A maioria das ferramentas de automação para afiliados aprende correlações rasas: "esse tipo de post converte mais." A [PLATAFORMA] deve aprender causalidade contextual: "esse tipo de post converte mais para esse tipo de audiência nesse momento de compra." Esse é o salto de automação para inteligência.

### Impacto
- O schema de banco de dados do MVP deve registrar contexto suficiente (horário, dia, audiência estimada, campanha, produto, nicho) para que o Nível 2 possa ser computado com dados históricos — sem refatoração de coleta
- O ML Engine deve planejar modelos de causalidade contextual como evolução natural dos modelos de correlação do MVP

### Próximos Documentos Afetados
`07 - Test Engine` `09 - Knowledge Engine` `11 - Banco de Dados` `15 - Machine Learning` `17 - Roadmap`

---

---

<a name="053"></a>
## 2026-07-11 — #053 — Story Family: Princípio sem Threshold Fixo

**Documento de origem:** 07 - Test Engine  
**Status:** ✅ Aprovada

### Decisão
O princípio da Story Family é: quando uma narrativa apresentar desempenho significativamente acima do comportamento esperado, o Knowledge Engine deve priorizar exploração local (variações da mesma família) antes de explorar território narrativo completamente diferente. Nenhum threshold percentual é fixado agora. Os valores específicos de "significativamente acima" serão calibrados pelo ML Engine com dados reais de comportamento de conversão.

### Motivo
Fixar um threshold arbitrário (50%, 30%, 2×) antes de ter dados reais seria uma decisão de implementação disfarçada de princípio. O princípio é sólido; o valor de corte precisa de dados para ser fundado em evidência.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `15 - Machine Learning`

---

<a name="054"></a>
## 2026-07-11 — #054 — Intervalo entre Publicações: Dinâmico, não Fixo

**Documento de origem:** 07 - Test Engine  
**Status:** ✅ Aprovada

### Decisão
O Scheduling Engine determina dinamicamente o intervalo entre publicações da mesma campanha considerando: velocidade de coleta de dados da rede, comportamento observado da audiência, volume total de publicações em curso, e nível de confiança necessário para a próxima decisão de teste. Nenhum valor fixo (48h, 24h, etc.) é estabelecido — o intervalo é computado por campanha, por rede e por momento.

### Motivo
Um intervalo fixo é uma simplificação que pode ser inadequada. Uma audiência altamente engajada em Threads pode gerar dados válidos em 12h; uma audiência menor no X pode precisar de 72h para gerar dados suficientes. Fixar um único valor prejudica um caso ou o outro.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `(não altera Scheduling Engine — ele já opera por cálculo dinâmico)`

---

<a name="055"></a>
## 2026-07-11 — #055 — Conhecimento Global vs. Conhecimento Privado

**Documento de origem:** 07 - Test Engine  
**Status:** ✅ Aprovada

### Decisão
O Knowledge Engine gerencia dois níveis distintos de conhecimento:

**Conhecimento Global:** padrões genéricos que emergem de múltiplos perfis e campanhas — tendências por categoria de produto, comportamentos por rede, padrões de horário por nicho amplo. Pode ser agregado e usado para bootstrapping de novos perfis (cold start) e calibração de defaults. Nunca exposto como dado de outro usuário.

**Conhecimento Privado:** aprendizados específicos do DNA, da audiência, dos padrões de conversão e do comportamento individual de cada perfil. Nunca compartilhado, nunca agregado de forma identificável, nunca usado para beneficiar outro usuário — nem mesmo em forma anonimizada se houver risco de re-identificação.

### Motivo
O diferencial competitivo de cada usuário está no que a plataforma aprendeu sobre seu perfil específico. Compartilhar esse conhecimento — mesmo involuntariamente via médias agregadas — corrói o valor que o usuário acumulou e cria risco de concorrência indireta entre usuários da mesma plataforma no mesmo nicho.

### Impacto
- Cold start usa apenas Conhecimento Global (médias de nicho, não dados de perfis individuais)
- O schema de banco de dados deve separar explicitamente dados globais de dados privados
- LGPD: Conhecimento Privado é dado pessoal e segue as regras de DECISIONS #024

### Próximos Documentos Afetados
`09 - Knowledge Engine` `11 - Banco de Dados` `16 - Segurança` `15 - Machine Learning`

---

<a name="056"></a>
## 2026-07-11 — #056 — Anti-Padrões: Aprender o Que Não Funciona

**Documento de origem:** 07 - Test Engine  
**Status:** ✅ Aprovada

### Decisão
O Knowledge Engine registra explicitamente combinações de dimensões que repetidamente demonstram baixo desempenho (com QS ≥ 70, eliminando falsos negativos por execução ruim). Esses anti-padrões são tão importantes quanto os padrões positivos: evitam que o sistema desperdice testes futuros em combinações já demonstradas como ineficazes para um perfil/produto/rede específico.

O KE mantém uma lista viva de anti-padrões por perfil, com nível de confiança crescente: uma combinação testada uma vez com baixo resultado é "suspeita"; testada três vezes com baixo resultado consistente é "anti-padrão confirmado" — o KE a evita ativamente na construção de futuros Decision Packages.

### Motivo
Aprender o que não funciona é simetricamente valioso ao que funciona. Sem registro de anti-padrões, o sistema pode repetir os mesmos erros — especialmente após longos períodos sem testar determinada combinação, quando os dados mais antigos perdem peso no Intelligence Score.

### Impacto
- O schema de banco de dados deve suportar registros de anti-padrões com o mesmo rigor que os padrões positivos
- Anti-padrões têm decaimento temporal assim como padrões positivos (o que não funcionou há 6 meses pode funcionar hoje com audiência diferente)
- A Learning Timeline exibe anti-padrões confirmados ao usuário com linguagem simples: *"Aprendi que esse tipo de abordagem não funciona bem com a sua audiência."*

### Próximos Documentos Afetados
`09 - Knowledge Engine` `11 - Banco de Dados` `15 - Machine Learning`

---

---

<a name="057"></a>
## 2026-07-11 — #057 — Saturação Parcial: Explorar Toda a Story Family Antes de Concluir

**Documento de origem:** 08 - Scale Engine  
**Status:** ✅ Aprovada

### Decisão
O Motor ESCALA não declara saturação total enquanto houver variações não testadas dentro da Story Family ativa. Saturação parcial (algumas variações perdendo força) leva o ESCALA a explorar variações remanescentes da família antes de transitar para o estado SATURATING. Somente quando todas as variações relevantes da família demonstrarem queda consistente é que a saturação total é declarada.

### Próximos Documentos Afetados
`09 - Knowledge Engine`

---

<a name="058"></a>
## 2026-07-11 — #058 — Escala Multi-Rede: Sugestão com Validação Obrigatória

**Documento de origem:** 08 - Scale Engine  
**Status:** ✅ Aprovada

### Decisão
Quando um padrão valida em uma rede, o Knowledge Engine pode sugerir ao usuário testar o mesmo padrão em outra rede — usando o conhecimento adquirido como ponto de partida acelerado (bootstrap da linha de base). Cada rede deve passar por seu próprio processo de validação completo. A plataforma nunca executa a expansão multi-rede automaticamente — apenas sugere, aguarda aprovação do usuário e inicia um novo ciclo de TESTE na nova rede com bootstrap informado.

### Motivo
DNA de audiência varia significativamente entre redes. Um padrão validado no Threads pode ter performance diferente no X pela natureza distinta das audiências. Executar automaticamente seria assumir equivalência que os dados podem não confirmar.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `17 - Roadmap`

---

<a name="059"></a>
## 2026-07-11 — #059 — Janela de Revalidação Rápida para Escalas Adiadas (V2+)

**Documento de origem:** 08 - Scale Engine  
**Status:** ✅ Aprovada (V2+)

### Decisão
Em V2+, quando um usuário adiar uma recomendação de escala por pouco tempo (janela a calibrar) e o IS decair levemente abaixo do threshold, a plataforma realiza uma revalidação rápida (2–3 publicações com as dimensões validadas) antes de exigir um novo ciclo completo de TESTE. A revalidação rápida só é aplicada se o IS decaiu exclusivamente por decaimento temporal — não por queda real de performance.

### Motivo
Reiniciar um ciclo completo de TESTE quando a evidência ainda é recente e a queda é puramente temporal é desperdício. A revalidação rápida respeita o princípio de decaimento sem penalizar excessivamente o usuário por uma decisão de timing.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `17 - Roadmap`

---

<a name="060"></a>
## 2026-07-11 — #060 — Campaign Priority Score

**Documento de origem:** 08 - Scale Engine  
**Status:** ✅ Aprovada

### Decisão
O Knowledge Engine calcula um Campaign Priority Score (CPS) para cada campanha ativa. O CPS determina quais campanhas recebem prioridade de recursos (publicações, esforço de geração, capacidade de escala) quando o total de demanda supera a capacidade disponível do plano.

**Fatores do CPS (pesos a calibrar pelo ML Engine):**
- Intelligence Score da campanha
- Retorno esperado por publicação (estimativa de comissão com base em histórico)
- Estado da campanha (SCALING > MONITORING > TESTING em estágio avançado > TESTING em cold start)
- Tendência: crescendo, estável ou declinando

O CPS é recalculado a cada ciclo de analytics (após cada nova publicação com dados coletados).

### Próximos Documentos Afetados
`09 - Knowledge Engine` `11 - Banco de Dados` `18 - Regras de Negócio`

---

<a name="061"></a>
## 2026-07-11 — #061 — Gestão Inteligente de Capacidade de Publicação

**Documento de origem:** 08 - Scale Engine  
**Status:** ✅ Aprovada

### Decisão
O Scheduling Engine distribui automaticamente o volume disponível de publicações entre campanhas ativas com base nos Campaign Priority Scores calculados pelo Knowledge Engine. O usuário define implicitamente a capacidade total pelo plano contratado — a distribuição entre campanhas é responsabilidade da plataforma, não do usuário.

O usuário pode sobrescrever a alocação automática para campanhas específicas se quiser — mas nunca precisa gerenciar a distribuição manualmente para a plataforma funcionar bem.

### Motivo
Transferir para o usuário a decisão de "quanto alocar para cada campanha" é transferência de complexidade operacional — exatamente o que a plataforma deve eliminar. O usuário define o objetivo; a plataforma otimiza os recursos disponíveis.

### Próximos Documentos Afetados
`09 - Knowledge Engine` `18 - Regras de Negócio`

---

---

<a name="062"></a>
## 2026-07-11 — #062 — Parâmetros Numéricos São Placeholders Provisórios

**Documento de origem:** 09 - Knowledge Engine  
**Status:** ✅ Aprovada  
**Escopo:** Regra permanente — aplica-se a todos os documentos desta fase de blueprint

### Decisão
Todo parâmetro numérico definido durante a fase de documentação (taxa de decaimento, thresholds de IS, mínimo de publicações, percentuais de Story Family, pesos do CPS, etc.) representa um valor temporário de ponto de partida. Nenhum valor é tratado como definitivo até que seja calibrado pelo ML Engine com dados reais da plataforma em operação.

Os valores provisórios existem para tornar a documentação concreta e a implementação possível — não para representar certeza sobre o comportamento ideal do sistema.

### Motivo
Definir parâmetros sem dados é necessário para começar, mas aceitar esses parâmetros como definitivos seria um erro. A calibração com dados reais é uma entrega obrigatória do ML Engine — não uma melhoria opcional.

### Próximos Documentos Afetados
`15 - Machine Learning` `18 - Regras de Negócio`

---

<a name="063"></a>
## 2026-07-11 — #063 — Anti-Padrão "Reavaliado", Não "Reabilitado"

**Documento de origem:** 09 - Knowledge Engine  
**Status:** ✅ Aprovada

### Decisão
Após 180 dias sem nova evidência negativa, um anti-padrão passa para o estado "Reavaliado" — o que significa que ele volta para "Inconclusivo" e pode ser testado novamente caso o contexto tenha mudado. O termo correto é "reavaliado" (permite novo teste), não "reabilitado" (que implicaria que o padrão voltou a ser considerado válido).

### Motivo
Terminologia importa para a integridade do sistema. Um anti-padrão reavaliado não é um padrão válido — é uma hipótese que merece nova chance de teste dado que o contexto pode ter mudado. A distinção previne que o KE trate evidências antigas de fracasso como anuladas.

### Próximos Documentos Afetados
`09 - Knowledge Engine` (já incorporado no documento)

---

<a name="064"></a>
## 2026-07-11 — #064 — KE Opera Sem Certezas Absolutas

**Documento de origem:** 09 - Knowledge Engine  
**Status:** ✅ Aprovada  
**Escopo:** Princípio filosófico — aplica-se a todo o comportamento do Knowledge Engine

### Decisão
O Knowledge Engine nunca trabalha com certezas absolutas. Todo conhecimento possui um grau de confiança que aumenta ou diminui conforme novas evidências são coletadas. A plataforma está continuamente aprendendo, revalidando e refinando suas hipóteses — nunca declarando um padrão como verdade permanente.

Consequências práticas:
- O Intelligence Score é sempre uma probabilidade de confiança, nunca uma certeza
- Padrões validados continuam sendo monitorados — a validação não é permanente
- Anti-padrões podem ser reavaliados — o fracasso passado não é sentença permanente
- A recomendação de escala é uma hipótese de alta confiança — não uma garantia de resultado

### Motivo
Um sistema que opera com certezas absolutas para de aprender. A [PLATAFORMA] deve ser fundamentalmente epistêmica: suas crenças sobre o que funciona são proporcionais à evidência disponível e estão sempre sujeitas à revisão. Essa postura é o que torna o sistema confiável ao longo do tempo — ele admite incerteza, age com base nela e corrige quando errou.

### Próximos Documentos Afetados
`10 - Dashboards` `15 - Machine Learning` `18 - Regras de Negócio` `19 - AI_CONTEXT`

---

---

<a name="065"></a>
## 2026-07-11 — #065 — Dashboard Home: Hierarquia de Três Blocos

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
A tela Home do Dashboard é composta por exatamente três blocos em ordem hierárquica fixa:
1. **Resultado do negócio** (comissões, cliques, conversões, CTR) — sempre primeiro
2. **Campanhas ativas** (cards ordenados por Campaign Priority Score) — sempre segundo
3. **Feed da Entidade** (oportunidades, aprendizados de alto impacto) — sempre terceiro, e somente quando há conteúdo relevante

Nenhuma outra organização é permitida. A hierarquia reflete o que o usuário vem ver: o que aconteceu, depois o que está acontecendo, depois o que a plataforma identificou.

### Motivo
Resultado de negócio antes de qualquer outra coisa. O usuário não abre o app para gerenciar processos — abre para ver o que a plataforma produziu. Colocar campanhas ou insights antes do resultado seria colocar o meio antes do fim.

### Próximos Documentos Afetados
`12 - APIs` (endpoints de dashboard devem refletir essa hierarquia)

---

<a name="066"></a>
## 2026-07-11 — #066 — Feed da Entidade: Sem Área Reservada

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
O Feed da Entidade não existe como uma área permanentemente reservada na interface. Quando não há nada de valor real a comunicar, o bloco simplesmente não existe na tela — nenhuma área vazia, nenhum placeholder, nenhuma mensagem de "nada a reportar". Quando há algo relevante, o bloco aparece organicamente abaixo das campanhas.

### Motivo
Uma área vazia reservada para a Entidade transmite a mensagem de que algo deveria estar ali — e não está. Isso cria ansiedade ou expectativa negativa. O silêncio verdadeiro é a ausência de área, não uma área com mensagem de silêncio. Isso reforça o princípio: a Entidade fala porque tem algo a dizer, não porque tem um espaço a preencher.

### Impacto
- Nenhum componente de "Feed vazio" a implementar
- Condicional simples: `if (entityFeedItems.length > 0) render Feed`

### Próximos Documentos Afetados
`12 - APIs`

---

<a name="067"></a>
## 2026-07-11 — #067 — Campanhas Ordenadas por CPS, Exibido como "Prioridade"

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
A lista de campanhas — tanto na Home quanto na tela de Campanhas — é ordenada pelo Campaign Priority Score calculado pelo Knowledge Engine. Para o usuário, o rótulo de ordenação é simplesmente "Prioridade". O termo "Campaign Priority Score" e qualquer explicação técnica de seu cálculo nunca aparecem na interface.

### Motivo
O usuário precisa saber que a plataforma prioriza campanhas de forma inteligente — não precisa saber como. Expor o score ou a fórmula transfere complexidade desnecessária. "Prioridade" comunica o conceito com precisão suficiente.

### Próximos Documentos Afetados
`12 - APIs` `11 - Banco de Dados`

---

<a name="068"></a>
## 2026-07-11 — #068 — Aprendizados: Três Estados Visuais

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
A tela de Aprendizados exibe padrões em três estados visuais distintos:
- **Ativo** (📌 preenchido, destaque): validado em múltiplos contextos, alta confiança
- **Em confirmação** (○ contorno): sinal positivo identificado, ainda verificando consistência
- **Expirado** (○ contorno desbotado): identificado anteriormente, não funciona mais com o contexto atual

Os três estados são visíveis simultaneamente — não há necessidade de filtrar para ver expirados. Padrões expirados são exibidos em seção colapsável por padrão quando a lista excede um tamanho razoável (CE-DB-003).

### Motivo
Mostrar o que a plataforma aprendeu que parou de funcionar é tão valioso quanto mostrar o que continua funcionando. Demonstra memória real e evolução — não apenas acúmulo de regras. Isso é implementação direta de DECISIONS #047.

### Impacto
Implementa DECISIONS #047 (memória visível com evolução, confirmação e expiração).

### Próximos Documentos Afetados
`11 - Banco de Dados` (campo `state` na learning_timeline para renderização correta)

---

<a name="069"></a>
## 2026-07-11 — #069 — "Por quê?" Pré-calculado, Nunca On-Demand

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
A resposta ao mecanismo "Por quê?" é gerada pelo Knowledge Engine **no momento em que a decisão ou insight é produzido** — não quando o usuário clica no botão. O botão [Por quê?] apenas exibe conteúdo já preparado, ele não dispara uma chamada de IA em tempo real.

**Regras do conteúdo do "Por quê?":**
- Linguagem da Entidade (primeira pessoa): "testei", "percebi", "observei"
- Apenas evidências observáveis — sem terminologia técnica
- Sem IS ou QS como números
- Sem afirmações de certeza absoluta (reflexo de DECISIONS #064)
- Máximo 5 frases

**Implementação:** bottom sheet no mobile (60% da tela, fecha ao arrastar ou tocar fora); tooltip expandido no desktop (fecha ao clicar fora).

### Motivo
Gerar on-demand adicionaria latência ao momento de clique — quebrando a sensação de fluidez. Mais importante: o "Por quê?" é parte integrante da decisão, não uma consulta separada. A Entidade já sabe por que chegou a uma conclusão quando a conclusão é formada.

**Clarificação aprovada:** O "Por quê?" representa a justificativa da decisão **no momento em que ela foi tomada**. Se o contexto mudar significativamente, uma nova decisão gera uma nova explicação. O "Por quê?" de uma entrada expirada deve explicar por que o padrão expirou — não por que ele foi ativado.

### Alternativas Descartadas
- **Chat livre com a Entidade:** rejeitado. A Entidade não é um chatbot. O "Por quê?" é uma consulta estruturada sobre uma decisão específica, não uma conversa aberta. (DECISIONS #046)
- **Geração on-demand:** rejeitada por latência e por quebrar a coerência — a Entidade sempre soube por quê.

### Impacto
O evento que gera qualquer decisão ou insight deve incluir o campo `why_explanation` (texto em linguagem da Entidade, pronto para exibição). O Knowledge Engine é responsável por produzir esse campo.

### Próximos Documentos Afetados
`09 - Knowledge Engine` (schema de eventos deve incluir `why_explanation`) `12 - APIs`

---

---

<a name="070"></a>
## 2026-07-11 — #070 — "Por quê?" de Padrão Expirado Explica a Expiração

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada (clarifica DECISIONS #069)

### Decisão
O conteúdo do "Por quê?" varia conforme o estado do padrão. São eventos distintos, com `why_explanation` distintos gerados pelo Knowledge Engine:

- **Padrão ativo:** explica por que o padrão funciona ("Testei 8 abordagens. Histórias de transformação tiveram CTR maior em 7 das 8 vezes.")
- **Padrão expirado:** explica por que parou de funcionar ("Funcionava bem até maio. A partir de então os resultados caíram consistentemente por 3 semanas. Contexto mudou.")

O Knowledge Engine gera o `why_explanation` específico para cada tipo de evento. Nunca reutiliza o texto de ativação para um padrão que depois expirou.

### Próximos Documentos Afetados
`09 - Knowledge Engine` (schema de eventos deve distinguir `why_activation` de `why_expiration`) `12 - APIs`

---

<a name="077"></a>
## 2026-07-11 — #077 — GET /api/operations/:id para Estado de Operações Assíncronas

**Documento de origem:** 12 - APIs  
**Status:** ✅ Aprovada

### Decisão
Operações assíncronas (202 Accepted) retornam um `operation_id`. O frontend consulta `GET /api/operations/:id` para verificar o estado atual: `processing` | `completed` | `failed`. Sem polling cego baseado em tempo fixo.

O fluxo padrão: após receber `202`, o frontend aguarda 1s (UX mínima) e então consulta o endpoint de operação até receber `completed` ou `failed`. Em caso de `failed`, o campo `error` contém mensagem humanizada (nunca técnica).

### Motivo
Polling baseado em tempo fixo (ex: "aguarde 2s e tente GET novamente") cria inconsistências: se o processamento demorar 200ms, o usuário espera 1,8s desnecessários; se demorar 5s, o frontend mostra dados desatualizados. O endpoint explícito permite que o cliente tome a decisão de quando re-consultar, e cria base sólida para futuras evoluções com SSE ou WebSockets sem quebrar o contrato existente.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="078"></a>
## 2026-07-11 — #078 — Idempotency-Key em POST que Criam Recursos

**Documento de origem:** 12 - APIs  
**Status:** ✅ Aprovada

### Decisão
Todo endpoint `POST` que cria um recurso aceita o header opcional `Idempotency-Key: <uuid-v4>`. Requisições com o mesmo `Idempotency-Key` (dentro de 24 horas) retornam a resposta original em cache sem reprocessar — prevenindo duplicações causadas por retries, falhas de rede, ou múltiplos cliques do usuário.

O header é recomendado — não obrigatório. Sem ele, a operação é processada normalmente.

### Motivo
Duplicações de campanhas, publicações e contas conectadas são problemas difíceis de reverter e frustram o usuário. Idempotency-Key é a solução padrão da indústria e tem custo de implementação baixo (cache Redis com TTL 24h). Criar a base agora evita retrabalho quando o volume de usuários aumentar.

### Próximos Documentos Afetados
`16 - Segurança`

---

<a name="079"></a>
## 2026-07-11 — #079 — request_id em Toda Resposta da API

**Documento de origem:** 12 - APIs  
**Status:** ✅ Aprovada

### Decisão
Toda resposta da API — sucesso ou erro — inclui um `request_id` único gerado no recebimento da requisição. O mesmo `request_id` é propagado para os logs de todos os serviços que processaram a requisição (log correlation).

Formato de sucesso: `{ "data": ..., "meta": { "request_id": "req_abc123" } }`  
Formato de erro: `{ "error": { "code": "...", "message": "...", "request_id": "req_abc123" } }`

### Motivo
Sem `request_id`, diagnóstico de problemas em produção exige correlacionar logs por timestamp — impreciso e lento. Com `request_id`, o usuário ou o suporte pode fornecer o ID e a equipe rastreia toda a cadeia de eventos em segundos. É a fundação de observabilidade mais barata de implementar e mais valiosa em operação.

### Próximos Documentos Afetados
`16 - Segurança`

---

<a name="071"></a>
## 2026-07-11 — #071 — Banner de Capacidade Contextual na Tela de Campanhas

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
Quando o uso de publicações do plano ultrapassa 80%, um banner discreto aparece no topo da lista de campanhas — não apenas em Configurações → Plano e Uso. O banner descreve a **consequência** futura ("campanhas de menor prioridade serão pausadas automaticamente a partir do dia X"), não um alerta de urgência.

O banner não aparece na Home — é informação operacional, não decisão crítica.

### Motivo
Enterrar o aviso de capacidade apenas em Configurações cria surpresa negativa: o usuário descobre que campanhas foram pausadas sem ter visto nenhum sinal antecipado. O banner contextual na tela de Campanhas é onde o usuário já está pensando em campanhas — o aviso é relevante ali.

### Próximos Documentos Afetados
`12 - APIs` (endpoint de campanhas deve retornar flag de capacidade crítica)

---

<a name="072"></a>
## 2026-07-11 — #072 — Detalhe de Campanha: Aprendizados Antes do Histórico

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
Na tela de detalhe de campanha, a ordem das seções é:
1. Resultado desta campanha (métricas)
2. O que aprendi sobre este produto (aprendizados)
3. Publicações — colapsado por padrão (histórico operacional)

### Motivo
O histórico de publicações é detalhe operacional. Os aprendizados são o valor diferencial da plataforma. Colocar o histórico antes dos aprendizados esconde o que é mais importante atrás do que é menos importante. O usuário vem ao detalhe para entender o que está funcionando — não para auditar a lista de posts publicados.

### Próximos Documentos Afetados
`12 - APIs`

---

<a name="073"></a>
## 2026-07-11 — #073 — "Pausar Campanha" Requer Confirmação com Linguagem da Entidade

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
Ao tocar em [Pausar campanha], um bottom sheet de confirmação é exibido antes de executar a ação. O conteúdo usa linguagem da Entidade (primeira pessoa), nunca linguagem técnica de alerta.

Exemplo: *"Vou parar de publicar para este produto. O que aprendi sobre ele será mantido — podemos retomar quando você quiser."*

O botão de cancelamento tem destaque **maior** que o de confirmação de pausa — facilita o recuo acidental. Pausar não é destruir: a linguagem e o visual devem refletir isso.

### Motivo
Em mobile, ações destrutivas sem confirmação são armadilhas de usabilidade. Um toque acidental em uma campanha em escala gera dano real. A confirmação é necessária — mas o tom importa tanto quanto a presença dela.

### Próximos Documentos Afetados
`12 - APIs`

---

<a name="074"></a>
## 2026-07-11 — #074 — Empty State de Aprendizados: Frase Única da Entidade

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
Quando a tela de Aprendizados é acessada antes de qualquer padrão ser identificado, exibe apenas:

*"Ainda não aprendi nada sobre o seu perfil. Continue publicando — estou observando os padrões."*

Sem lista de features, sem tutorial, sem barra de progresso, sem CTA adicional. O implícito é que a plataforma está trabalhando — não que o usuário precisa fazer algo diferente.

### Motivo
Um empty state genérico com "Como funciona" ou "Começe agora" transforma a ausência de dados em momento de marketing interno. Isso quebra o tom da Entidade. O silêncio informado (uma frase que explica que ainda está aprendendo) é mais coerente com a filosofia da plataforma.

### Próximos Documentos Afetados
`12 - APIs`

---

<a name="075"></a>
## 2026-07-11 — #075 — Período Padrão do Dashboard Automático por Antiguidade

**Documento de origem:** 10 - Dashboards  
**Status:** ✅ Aprovada

### Decisão
O período padrão exibido no Dashboard é determinado pela antiguidade da conta, de forma invisível ao usuário:
- **Conta com menos de 30 dias:** padrão = "desde o início"
- **Conta com 30 dias ou mais:** padrão = "este mês"

O usuário pode alterar o período manualmente a qualquer momento. A lógica automática se aplica apenas ao carregamento inicial.

### Motivo
Um usuário com 5 dias de uso que vê o Dashboard com período "este mês" encontra poucos dados e pode interpretar como baixa performance da plataforma — quando na verdade é apenas falta de histórico. O período "desde o início" mostra tudo que existe, evitando falsa percepção de resultados ruins.

### Próximos Documentos Afetados
`12 - APIs` (endpoint deve receber metadado de data de criação da conta para renderizar período padrão correto)

---

---

<a name="076"></a>
## 2026-07-11 — #076 — Anti-Padrões: Nascem Específicos, São Promovidos a Gerais

**Documento de origem:** 11 - Banco de Dados  
**Status:** ✅ Aprovada

### Decisão
Anti-padrões sempre nascem como combinações completas de dimensões — evidência negativa em uma combinação específica (arco X + trigger Y + voice Z + ...). Somente após evidência suficiente e consistente um anti-padrão pode ser **promovido** para granularidade mais geral, abstraindo as dimensões que se mostraram irrelevantes para explicar o comportamento.

**Ciclo de vida de um anti-padrão:**
1. **Específico:** combinação completa de dimensões. Ex: arco=problema-solução + trigger=curiosidade + voice=informal → anti-padrão para nicho X
2. **Candidato à promoção:** após acúmulo de evidências, ML Engine detecta que o resultado negativo persiste mesmo variando dimensões específicas (ex: o arc e trigger são constantes em múltiplos anti-padrões — a dimensão variada é irrelevante)
3. **Promovido:** anti-padrão geral com dimensões irrelevantes abstraídas (NULL). Ex: trigger=curiosidade → anti-padrão para nicho X, independente de arco ou voice

O processo de promoção é executado pelo ML Engine, nunca de forma automática baseada em regras fixas.

### Motivo
Anti-padrões parciais nascem de generalização — e generalizar prematuramente desperdiça testes válidos. A progressão de específico → geral garante que a abstração seja sustentada por evidência acumulada, não inferida de poucos dados. Um trigger ruim demonstrado em 2 campanhas pode ser coincidência; demonstrado em 20, em condições variadas, é padrão.

### Impacto
- O schema de `knowledge.anti_patterns` suporta NULL nas dimensões (já implementado no Documento 11)
- O campo `promotion_source_ids` deve ser adicionado ao schema para rastrear quais anti-padrões específicos originaram um anti-padrão geral (ver seção 7.4 do Documento 11)
- ML Engine é o único responsável pela promoção — nenhum outro componente escreve anti-padrões gerais

### Próximos Documentos Afetados
`11 - Banco de Dados` (adicionar `promotion_source_ids`) `15 - Machine Learning` `18 - Regras de Negócio`

---

---

<a name="080"></a>
## 2026-07-11 — #080 — Marketplaces: Shopee no MVP; Amazon e MercadoLivre Desabilitados até Solução Robusta

**Documento de origem:** 13 - Integrações  
**Status:** ✅ Aprovada  
**Escopo:** Decisão estratégica de produto — não técnica

### Decisão
O MVP habilita apenas Shopee como marketplace integrado. Amazon Associates e MercadoLivre permanecem como providers implementados na arquitetura mas **desabilitados via feature flag** até que exista solução robusta para coleta automatizada de dados de conversão.

**Estado por marketplace:**
- **Shopee:** ativo no MVP
- **Amazon Associates:** `AmazonAdapter` implementado, provider desabilitado — bloqueado por ausência de API programática para relatórios de comissão
- **MercadoLivre:** `MercadoLivreAdapter` a implementar, provider desabilitado — habilitação planejada para V1

**Filosofia permanente:** a plataforma é agnóstica em relação ao marketplace. Adicionar ou ativar um novo provider não deve exigir nenhuma alteração nos serviços internos — apenas registro no Plugin Registry e habilitação da feature flag.

### Motivo
Shopee tem a integração mais sólida para validar o produto com o público inicial. Lançar Amazon com coleta manual ou frágil criaria experiência de segunda classe e expectativas incorretas. Menos providers ativos no MVP, mais estabilidade para validar o core do produto.

### Próximos Documentos Afetados
`17 - Roadmap` `18 - Regras de Negócio`

---

*Documento criado em: 2026-07-11*  
---

<a name="081"></a>
## 2026-07-11 — #081 — Disqualifiers Representam Violações de Princípios, Não Critérios de Qualidade

**Documento de origem:** 14 - Inteligência Artificial  
**Status:** ✅ Aprovada

### Decisão
Os `disqualifiers` na avaliação de QS não são critérios de qualidade — são violações dos princípios éticos da plataforma. Uma história que aciona um disqualifier é reprovada independentemente da pontuação obtida nos demais critérios de qualidade.

**Disqualifiers ativos:**
- Urgência manipulativa ou escassez fabricada (ex: "Só restam 3 unidades!", "Oferta termina em 1 hora!")
- Dado fabricado ou estatística inventada sem base real
- Produto representado incorretamente (preço errado, benefício inexistente ou exagerado)
- Prova social fabricada (depoimentos, avaliações inventadas)

A distinção importa para o diagnóstico: uma história reprovada por `low_quality` pode ter prompts melhorados; uma história reprovada por `disqualifier` indica violação de princípio — o problema pode estar na temperatura, no prompt, ou na interpretação do arco narrativo pelo modelo.

### Motivo
Qualidade é gradual — um score 68 pode ser melhorado com um retry. Princípios são binários — urgência manipulativa com score 95 é mais perigosa do que urgência com score 30, porque tem mais chance de ser publicada acidentalmente se o threshold for ajustado. O disqualifier garante que nenhum ajuste de parâmetro futuro contorne regras éticas.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="082"></a>
## 2026-07-11 — #082 — Prompts Não Armazenados em Produção

**Documento de origem:** 14 - Inteligência Artificial  
**Status:** ✅ Aprovada

### Decisão
Prompts completos (texto expandido enviado ao modelo) não são armazenados em ambiente de produção. Para fins de diagnóstico e auditoria, a combinação de três elementos é suficiente para reconstruir qualquer prompt:

1. **`prompt_version`:** versão do template de prompt (ex: `generation-v2`)
2. **`decision_package_id`:** todas as 12 dimensões que parametrizaram o prompt
3. **`dna_version`:** versão do DNA do perfil ativa no momento da geração

Com esses três elementos, qualquer engenheiro pode reconstruir o prompt exato em ambiente de desenvolvimento para diagnóstico — sem precisar ter armazenado o texto completo em produção.

Logs com prompt completo existem apenas em ambiente de desenvolvimento, com TTL de 24 horas.

### Motivo
Armazenar prompts completos em produção armazena, em texto plano, dados de DNA do perfil fora do schema controlado — aumentando superfície de exposição sem benefício proporcional, já que a reconstrução é possível via parâmetros.

### Próximos Documentos Afetados
`16 - Segurança`

---

<a name="083"></a>
## 2026-07-11 — #083 — IA Nunca Decide Sozinha

**Documento de origem:** 14 - Inteligência Artificial  
**Status:** ✅ Aprovada  
**Escopo:** Princípio filosófico — aplica-se a toda a arquitetura da plataforma

### Decisão
Os modelos de linguagem são um componente da plataforma — não o centro dela. Nenhuma decisão de produto é tomada exclusivamente por um modelo de IA. Toda decisão resulta da combinação entre:

- Regras de negócio explícitas (o que nunca pode acontecer)
- Knowledge Engine (o que os dados indicam)
- Validações estruturadas (QS, DNA check, originality check)
- Embeddings e métricas objetivas
- E, como um dos componentes, o modelo de linguagem

O modelo **gera conteúdo**. A plataforma **decide** se esse conteúdo é publicado, quando, para qual campanha, com qual frequência, e o que aprender com o resultado.

### Motivo
Delegar decisões de produto integralmente a modelos de linguagem cria sistemas imprevisíveis, difíceis de auditar e impossíveis de calibrar. A arquitetura da [PLATAFORMA] é intencionalmente híbrida: modelos contribuem com capacidade generativa e avaliativa; a plataforma contribui com regras, memória e contexto de negócio. Nenhum dos dois é suficiente sozinho.

### Próximos Documentos Afetados
`19 - AI_CONTEXT`

---

<a name="084"></a>
## 2026-07-11 — #084 — Prompts Tratados como Código

**Documento de origem:** 14 - Inteligência Artificial  
**Status:** ✅ Aprovada  
**Escopo:** Prática de engenharia permanente

### Decisão
Prompts de geração e avaliação são tratados como código de produção:

- **Versionados** no repositório (estrutura `prompts/generation/v{N}.ts`)
- **Revisados** via pull request — a mesma revisão exigida para qualquer mudança de lógica de negócio
- **Testados** em staging com amostra representativa de Decision Packages antes de ir a produção
- **Implantados** pelo mesmo pipeline de CI/CD do restante da aplicação
- **Nunca alterados diretamente em produção** — qualquer mudança, por menor que seja, passa pelo fluxo completo

### Motivo
Um prompt é o comportamento do sistema. Mudar um prompt muda o produto. Tratar prompts como configuração informal (editável por qualquer pessoa, sem revisão, sem teste) é o mesmo que permitir edição direta de código em produção — com a diferença de que o impacto pode ser imediato, global e difícil de reverter se não houver versão anterior registrada.

### Próximos Documentos Afetados
`17 - Roadmap` (processo de implantação de mudanças de prompt como item de engenharia)

---

---

<a name="085"></a>
## 2026-07-11 — #085 — ML Engine Propõe; Knowledge Engine Aplica Anti-Padrões Gerais

**Documento de origem:** 15 - Machine Learning  
**Status:** ✅ Aprovada

### Decisão
O ML Engine não escreve diretamente em `knowledge.anti_patterns`. Ao detectar candidatos à promoção de anti-padrão geral, o ML Engine persiste uma **proposta** em `ml.anti_pattern_proposals`. O Knowledge Engine consome essa tabela e é o único responsável por criar o registro em `knowledge.anti_patterns`.

**Fluxo:**
```
ML Engine detecta cluster de anti-padrões específicos
    ↓
ml.anti_pattern_proposals ← ML Engine escreve proposta
    ↓
Knowledge Engine consome proposta (job periódico)
    ↓
knowledge.anti_patterns ← Knowledge Engine cria anti-padrão geral
```

O princípio P2 do Documento 15 ("ML Engine nunca escreve em tabelas de usuário") é preservado integralmente — sem exceções.

### Motivo
A separação ML (aprende/sugere) × KE (decide/aplica) é um princípio arquitetural fundamental. Criar uma exceção, mesmo bem delimitada, enfraquece a coerência do modelo. Além disso, a tabela intermediária `ml.anti_pattern_proposals` habilita naturalmente: validação manual antes da aplicação, políticas de promoção configuráveis por nicho, auditoria completa de quais dados embasaram cada anti-padrão geral, e reversão sem impacto em dados de produção.

### Impacto
- Adicionar `ml.anti_pattern_proposals` ao schema do ML Engine (Documento 15)
- Knowledge Engine passa a ter job de consumo de propostas de anti-padrão
- Auditoria de anti-padrões gerais rastreável desde a proposta até a aplicação

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

---

<a name="086"></a>
## 2026-07-11 — #086 — Argon2id para Hashing de Senhas

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
Senhas de usuário são armazenadas como hash Argon2id. Os parâmetros de memória e custo são calibrados para o hardware de produção após benchmark. Senha nunca armazenada em texto plano em qualquer estado — nem temporariamente.

### Motivo
Argon2id é o algoritmo vencedor do Password Hashing Competition (2015), projetado especificamente para resistir a ataques de força bruta em GPU. Combina resistência a ataques de tempo (Argon2i) e resistência a ataques de memória (Argon2d). É o padrão atual da indústria para hashing de senhas.

### Alternativas Descartadas
- **bcrypt:** eficaz, mas limitado a senhas de até 72 bytes e sem resistência a side-channel attacks em hardware paralelo.
- **SHA-256 com sal:** adequado para integridade, não para armazenamento de senha. Sem fator de custo configurável.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="087"></a>
## 2026-07-11 — #087 — RS256 (Assimétrico) para Assinatura de JWT

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
Access tokens JWT são assinados com RS256 (RSA + SHA-256). A chave privada reside exclusivamente no servidor de autenticação e é gerenciada pelo AWS KMS. Outros serviços verificam o token usando apenas a chave pública — sem acesso à chave privada.

### Motivo
Com algoritmos simétricos (HS256), qualquer serviço que verifica tokens precisa ter a chave secreta — e uma chave secreta compartilhada por N serviços é uma chave não-secreta. Com RS256, apenas o servidor de autenticação pode **emitir** tokens; qualquer serviço pode **verificar** sem comprometer a capacidade de emitir.

### Próximos Documentos Afetados
`12 - APIs` `18 - Regras de Negócio`

---

<a name="088"></a>
## 2026-07-11 — #088 — Refresh Token Rotation com Invalidação de Família

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
Refresh tokens são rotacionados a cada uso — o token antigo é imediatamente invalidado ao emitir um novo. Tokens pertencem a uma família: se um refresh token já invalidado é apresentado (indicando que alguém além do usuário legítimo o tem), **toda a família é invalidada** — forçando novo login em todos os dispositivos.

### Motivo
Refresh tokens têm TTL de 30 dias — um horizonte de comprometimento muito longo sem rotação. A detecção por família resolve o caso em que tanto o usuário legítimo quanto um atacante têm o mesmo token (ex: via roubo de cookie). Ao detectar uso de token já rotacionado, o sistema não consegue saber quem é o legítimo — e invalida ambos como medida de segurança.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="089"></a>
## 2026-07-11 — #089 — Tokens OAuth de Redes Sociais Criptografados com AES-256-GCM

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
Tokens de acesso e refresh de redes sociais (Threads, X) armazenados no banco são criptografados com AES-256-GCM. A chave de criptografia é gerenciada pelo AWS KMS — nunca hardcoded, nunca em variável de ambiente. Tokens são descriptografados apenas no momento do uso pelo adapter correspondente.

### Motivo
Um dump do banco de dados não deve ser suficiente para que um atacante publique em contas de usuários. Com criptografia em repouso + chave no KMS, o atacante precisaria de acesso tanto ao banco quanto ao KMS com a IAM role correta — dois sistemas independentes.

### Próximos Documentos Afetados
`11 - Banco de Dados` `13 - Integrações`

---

<a name="090"></a>
## 2026-07-11 — #090 — 403 Nunca 404 para Recursos de Outros Usuários

**Documento de origem:** 16 - Segurança (formalização de prática definida em 12 - APIs)  
**Status:** ✅ Aprovada

### Decisão
Quando um usuário autenticado tenta acessar um recurso que existe mas pertence a outro `profile_id`, a resposta é sempre `403 Forbidden` — nunca `404 Not Found`. A resposta `404` só é retornada quando o recurso genuinamente não existe para nenhum usuário.

### Motivo
Retornar `404` para recursos de outros usuários parece mais "seguro" (não revela que o recurso existe), mas cria inconsistência: o mesmo ID retorna `404` para usuário A e `200` para usuário B. Um atacante pode usar essa inconsistência para enumerar IDs existentes via timing ou força bruta. O `403` é mais correto: o recurso existe, o acesso é negado. Com UUIDs v4 (não sequenciais), a enumeração por tentativa já é impraticável — o `403` é a resposta semanticamente correta.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="091"></a>
## 2026-07-11 — #091 — E-mail Verification Obrigatório Antes de Publicar

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
Contas com e-mail não verificado não podem publicar histórias. E-mail verification é enviado na criação da conta; token de uso único, TTL 24 horas. Um e-mail verificado é pré-requisito para ativar qualquer campanha.

### Motivo
E-mail verification é o controle mais efetivo contra criação automatizada de contas de trial abusivo. Um atacante pode criar infinitas contas, mas verificar infinitos e-mails distintos requer acesso real a essas caixas de entrada. Sem verificação, a prevenção de abuso dependeria exclusivamente de heurísticas de fingerprint (menos confiáveis).

### Alternativas Descartadas
- **Verificação opcional:** descartada. Qualquer feature opcional de segurança que usuários reais raramente usam cria uma classe de usuários não verificados que é exatamente o vetor de abuso.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="092"></a>
## 2026-07-11 — #092 — Exclusão de Conta: Cascade + Anonimização + Soft Delete 30 Dias

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
O processo de exclusão de conta segue este fluxo:
1. Usuário solicita exclusão + confirmação por e-mail
2. Cancelamento imediato da assinatura
3. Anonimização das entradas de `learning_timeline` para contribuição a `global_patterns` (somente se consentimento foi dado)
4. CASCADE DELETE completo da hierarquia de dados do perfil
5. Invalidação de todas as sessões ativas
6. Soft delete em `auth.users` por 30 dias (para compliance e prevenção de reuso imediato)
7. Hard delete de `auth.users` após 30 dias

### Motivo
O "direito ao esquecimento" (LGPD Art. 18, VI) exige exclusão efetiva — não apenas marcação de deleted. O soft delete por 30 dias existe para proteção contra exclusão acidental e para auditoria de compliance. Após 30 dias, não há mais vestígio identificável do usuário no sistema.

### Próximos Documentos Afetados
`11 - Banco de Dados` `18 - Regras de Negócio`

---

<a name="093"></a>
## 2026-07-11 — #093 — PII Nunca Entra em Logs de Produção

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada  
**Complementa:** DECISIONS #079 (request_id em toda resposta)

### Decisão
Logs de produção nunca contêm dados de identificação pessoal. Proibido em logs:
- Nome, e-mail, telefone, CPF de usuários
- Tokens de acesso, refresh tokens ou tokens OAuth
- Prompts completos de geração (DECISIONS #082)
- Conteúdo de stories não publicadas

A correlação de logs é feita exclusivamente por `request_id` e `profile_id` — sem dados que identifiquem diretamente a pessoa por trás do profile.

### Motivo
Logs são frequentemente acessados por múltiplos membros da equipe, armazenados em sistemas de terceiros (CloudWatch), e retidos por períodos longos. Dados pessoais em logs aumentam a superfície de exposição sem benefício operacional — o diagnóstico nunca precisa do nome do usuário, precisa do `profile_id` e do `request_id`.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="094"></a>
## 2026-07-11 — #094 — CSRF: SameSite=Strict Suficiente para o MVP

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
A proteção contra CSRF é implementada via `SameSite=Strict` no cookie de refresh token. Não será implementado CSRF token explícito no MVP.

**Premissas que sustentam a decisão:**
- Access tokens (que autorizam operações de dados) são armazenados em memória no frontend, não em cookies — o browser não os envia automaticamente em requisições cross-site
- O único cookie (`refresh_token`) não executa operações de dados — apenas emite novos access tokens
- `SameSite=Strict` impede que o cookie de refresh seja enviado em qualquer requisição cross-origin

### Motivo
CSRF tokens explícitos adicionam complexidade de implementação (sincronização, validação em cada endpoint) para uma proteção já fornecida pelo modelo de autenticação adotado (tokens em memória + SameSite). Adicionar proteção redundante sem necessidade aumenta superfície de bugs sem aumentar segurança real.

### Alternativas Descartadas
- **CSRF token explícito:** descartado para MVP. Adicionar em V1 se houver mudança no modelo de autenticação ou evidência de vulnerabilidade.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="095"></a>
## 2026-07-11 — #095 — Troca de Senha Invalida Todos os Refresh Tokens Ativos

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
Quando um usuário troca a senha, todos os refresh tokens ativos são imediatamente invalidados — forçando novo login em todos os dispositivos ativos. A troca de senha e a invalidação de sessões ocorrem na mesma transação de banco de dados.

### Motivo
O caso de uso mais importante para troca de senha é recuperação de conta comprometida. Se a senha foi roubada, o atacante provavelmente já tem uma sessão ativa (refresh token). Trocar a senha sem invalidar sessões deixa o atacante com acesso por até 30 dias (TTL do refresh token), tornando a troca de senha ineficaz como medida de contenção.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="096"></a>
## 2026-07-11 — #096 — Dependency Scanning Obrigatório no CI/CD

**Documento de origem:** 16 - Segurança  
**Status:** ✅ Aprovada

### Decisão
Varredura automática de vulnerabilidades em dependências de terceiros é obrigatória no pipeline de CI/CD:
- `npm audit --audit-level=high` em cada Pull Request — bloqueia merge em vulnerabilidades críticas ou altas
- `pip-audit` para dependências Python do ML Engine — mesma política
- Dependabot (ou equivalente) habilitado no repositório para PRs automáticos de atualização

**Política de resposta:**
- CVSS ≥ 9.0 (crítico): bloqueia qualquer deploy; correção em até 24h
- CVSS 7.0–8.9 (alto): bloqueia merge; correção em até 72h
- CVSS 4.0–6.9 (médio): registrado como débito técnico; correção no próximo sprint

### Motivo
Dependências de terceiros são o vetor de supply chain attack mais comum em aplicações Node.js/Python. A maioria dos incidentes de segurança via dependências pode ser prevenida com varredura contínua — o custo de implementação é mínimo (um step de CI/CD), e o custo de não ter é potencialmente catastrófico.

### Próximos Documentos Afetados
`17 - Roadmap` (incluir dependency scanning como item de infra do MVP)

---

---

<a name="097"></a>
## 2026-07-11 — #097 — Trial: Apenas Duração e Ausência de Cartão São Fixos

**Documento de origem:** 17 - Roadmap  
**Status:** ✅ Aprovada

### Decisão
Do modelo de trial, apenas dois parâmetros são fixados no blueprint:
- **Duração:** 14 dias (DECISIONS #017)
- **Sem cartão de crédito:** (DECISIONS #017)

Todos os demais parâmetros — qual plano o trial simula, quantas publicações permite, como comunica os limites ao usuário — são hipóteses de negócio a serem validadas com dados reais de comportamento e conversão durante o MVP. Não serão fixados antes de evidência.

### Motivo
A estratégia de trial tem impacto direto na taxa de conversão e no custo de IA por conta não-convertida. Fixar esses parâmetros no blueprint seria assumir que sabemos o comportamento de conversão dos usuários sem dados. A resposta correta é definir o mínimo necessário para começar e tratar o resto como experimento.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="098"></a>
## 2026-07-11 — #098 — Persona 4 Não Comprometida com Versão Específica

**Documento de origem:** 17 - Roadmap  
**Status:** ✅ Aprovada  
**Refina:** DECISIONS #009

### Decisão
A Persona 4 (Gestor/Agência) não está comprometida com V2 no roadmap. A expansão para multi-tenancy entra no roadmap oficial somente após uma análise arquitetural dedicada que avalie:
- Impacto no schema de banco de dados (separação por tenant)
- Modelo de autorização multi-tenant
- Modelo de billing (quem paga? gestor? afiliado gerenciado?)
- UX de gestão de múltiplas contas
- Impacto nos fluxos de onboarding e trial

Essa análise é uma entrega de V1, não uma decisão do blueprint. A ausência de comprometimento com uma versão específica é intencional — a versão depende de quando a análise for concluída e de o aprendizado do MVP justificar esse investimento.

### Motivo
Multi-tenancy é a mudança arquitetural mais custosa possível em um SaaS — afeta praticamente todas as camadas. Comprometer V2 sem ter feito a análise seria criar uma expectativa que pode não ser cumprida ou que pode forçar atalhos arquiteturais prejudiciais.

### Próximos Documentos Afetados
`18 - Regras de Negócio` `19 - AI_CONTEXT`

---

<a name="099"></a>
## 2026-07-11 — #099 — Cold Start: Comunicação de Aprendizado em até 48 Horas

**Documento de origem:** 17 - Roadmap  
**Status:** ✅ Aprovada

### Decisão
Em até 48 horas de uso, a plataforma comunica ao usuário que já começou a aprender sobre seu perfil — mesmo que o aprendizado inicial seja baseado em conhecimento global do nicho, não em dados exclusivos do perfil ainda.

A Entidade usa dados globais como ponto de partida explícito e sinalizado: *"Com base em perfis similares ao seu neste nicho, percebo que..."*. O objetivo é eliminar a sensação de "plataforma vazia" nos primeiros dias e demonstrar que a inteligência está ativa desde o início — ainda que em calibração inicial.

O marco de 48 horas é um compromisso de produto: se o sistema não tiver nada relevante a comunicar nesse prazo, isso é um bug de produto, não um comportamento esperado.

### Motivo
O cold start problem é inevitável — dados de perfil levam semanas para acumular. Mas a **percepção** de cold start pode ser eliminada com comunicação proativa baseada em conhecimento global. Um usuário que percebe que a plataforma está aprendendo desde o primeiro dia é mais provável de permanecer no trial e converter. Um usuário que vê uma plataforma vazia por 7 dias abandona antes de ver o valor real.

### Impacto
- Knowledge Engine deve ter acesso a dados globais de nicho imediatamente disponíveis para novos perfis (dados agregados anonimizados de perfis existentes no mesmo nicho)
- A Entidade tem um template de comunicação de "início de aprendizado" para as primeiras 48h — diferente das comunicações de padrões validados
- O onboarding define o nicho (produto, categoria) do afiliado para que o Knowledge Engine possa fazer o match com dados globais desde o cadastro

### Próximos Documentos Afetados
`05 - UX` (comunicação de cold start como estado explícito da Entidade) `09 - Knowledge Engine` (acesso a dados globais para cold start) `18 - Regras de Negócio`

---

---

<a name="100"></a>
## 2026-07-11 — #100 — Downgrade de Plano: Dados Sempre Preservados

**Documento de origem:** 18 - Regras de Negócio  
**Status:** ✅ Aprovada

### Decisão
Quando um usuário faz downgrade para um plano com menos perfis sociais ou menos publicações por mês:

- Campanhas que excedam o novo limite são **pausadas** — nunca deletadas automaticamente
- Perfis sociais que excedam o novo limite são **desconectados** — nunca deletados; dados e aprendizados do perfil são preservados
- O usuário escolhe explicitamente quais campanhas pausar e quais perfis desconectar antes de o downgrade ser efetivado
- A Entidade comunica a consequência antecipadamente em linguagem simples, sem urgência

### Motivo
Aprendizados acumulados sobre um perfil têm valor crescente — destruí-los automaticamente em um downgrade seria destruir o principal ativo que o usuário acumulou na plataforma. A política de preservação reforça o princípio de que o conhecimento da plataforma pertence ao usuário e não está amarrado ao plano contratado.

Além disso, dados deletados por automação são irrecuperáveis — e o usuário pode ter feito downgrade temporariamente por razão de caixa, pretendendo retornar ao plano original. Preservar os dados garante que o retorno seja imediato, sem reconstrução de histórico.

### Próximos Documentos Afetados
`12 - APIs` (endpoint de downgrade deve validar seleção do usuário antes de executar)

---

---

<a name="101"></a>
## 2026-07-12 — #101 — Disqualifiers: Postura Conservadora em Violações Éticas

**Documento de origem:** 19 - AI_CONTEXT  
**Status:** ✅ Aprovada

### Decisão
A plataforma adota postura conservadora em relação a disqualifiers: em caso de suspeita de violação de um princípio ético ou operacional, a história é rejeitada — independentemente do grau de confiança da avaliação do modelo. O modelo não precisa de "certeza" para acionar um disqualifier; qualquer flag é suficiente para rejeição.

A taxa de falsos positivos (histórias rejeitadas por disqualifier que não violavam princípios reais) é monitorada continuamente e pode ser calibrada via ajuste de prompt de avaliação, mas a política de segurança permanece prioritária sobre a taxa de aprovação.

### Motivo
Falso positivo de disqualifier = história válida rejeitada → usuário perde uma publicação.  
Falso negativo de disqualifier = história com violação ética publicada → dano à credibilidade do afiliado e da plataforma.

O custo assimétrico justifica a postura conservadora. Uma taxa de falsos positivos monitorada e calibrada é preferível ao risco de publicação de conteúdo manipulativo ou fabricado.

### Próximos Documentos Afetados
`18 - Regras de Negócio`

---

<a name="102"></a>
## 2026-07-12 — #102 — ML Engine Separado por Responsabilidade, Não por Tecnologia

**Documento de origem:** 19 - AI_CONTEXT  
**Status:** ✅ Aprovada  
**Refina:** DECISIONS #085

### Decisão
A separação entre ML Engine e os demais componentes é de **responsabilidade**, não de tecnologia. O princípio que deve ser preservado:

> O ML Engine executa exclusivamente processos assíncronos de aprendizado, calibração e análise. Nenhuma decisão operacional em tempo real depende da execução do ML Engine durante uma requisição do usuário.

Isso significa que o ML Engine pode, no futuro, utilizar qualquer tecnologia disponível (regressão, clustering, embeddings, modelos de linguagem menores para classificação em batch) — desde que sua execução seja sempre assíncrona e nunca esteja no caminho crítico de uma requisição de usuário.

### Motivo
Definir a separação por tecnologia ("ML Engine não usa LLMs") cria uma restrição artificial que pode se tornar limitante à medida que a plataforma evolui (ex: V2+ com classificação de estágio de audiência pode se beneficiar de modelos de linguagem em batch). A restrição correta é arquitetural: ML Engine é batch, não runtime.

### Próximos Documentos Afetados
`15 - Machine Learning` `18 - Regras de Negócio`

---

*Versão: 3.1 — Documento vivo. Atualizado a cada decisão.*  
*Regra: nunca deletar entradas. Decisões revertidas são registradas como novas decisões.*
