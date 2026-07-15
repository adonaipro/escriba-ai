# 16 — Segurança

> *"Segurança não é uma feature. É a ausência de vulnerabilidades que o usuário nunca deveria precisar conhecer."*

---

## Objetivo deste Documento

Definir os controles de segurança da [PLATAFORMA]: autenticação, autorização, proteção de dados, conformidade com LGPD, prevenção de abuso, monitoramento e resposta a incidentes. Este documento consolida os requisitos de segurança mencionados nos documentos anteriores e define os que ainda não foram especificados.

---

## 1. Princípios de Segurança

**P1 — Defesa em profundidade**
Nenhuma camada única de segurança é suficiente. A plataforma combina controles em múltiplas camadas: rede, aplicação, dados e monitoramento. A falha de qualquer camada individual não compromete o sistema inteiro.

**P2 — Menor privilégio**
Cada serviço, usuário e processo tem acesso apenas ao que precisa — nada além. Um desenvolvedor com acesso ao banco de desenvolvimento não tem acesso ao banco de produção. O Story Engine não lê `knowledge.*`. O ML Engine não escreve no Event Bus.

**P3 — Privacidade por design**
Dados pessoais não são coletados além do necessário. Dados de identificação nunca saem da plataforma para provedores externos. Dados de usuários deletados são eliminados, não apenas desativados.

**P4 — Segurança é auditável**
Toda ação sensível gera registro imutável. Quando algo der errado, a investigação nunca depende de memória ou suposição — depende de logs.

---

## 2. Autenticação

### 2.1 Credenciais de Usuário

- **Hashing:** Argon2id com parâmetros de memória e custo adequados ao hardware de produção (calibrar após benchmark — DECISIONS #062)
- **Nunca armazenar senha em texto plano**, mesmo temporariamente
- **Recuperação de senha:** token de uso único, TTL 1 hora, invalidado após uso; enviado por e-mail; nunca exibido em logs

### 2.2 JWT (Access Token)

```
Header:  { "alg": "RS256", "typ": "JWT" }
Payload: {
  "sub": "<user_id>",
  "profile_id": "<profile_id>",
  "plan": "growth",
  "iat": <timestamp>,
  "exp": <timestamp + 15min>,
  "jti": "<unique_token_id>"  ← para revogação individual
}
```

- **Algoritmo:** RS256 (assimétrico) — chave privada nunca sai do servidor de autenticação
- **TTL:** 15 minutos — janela de comprometimento limitada
- **Revogação:** `jti` registrado em Redis com TTL correspondente; tokens revogados são rejeitados mesmo dentro do prazo de expiração

### 2.3 Refresh Token

- Armazenado em cookie `HttpOnly; Secure; SameSite=Strict`
- TTL: 30 dias
- Rotacionado a cada uso (refresh token rotation) — token usado uma vez é imediatamente invalidado
- Família de tokens: se um refresh token expirado é tentado, toda a família é invalidada (detecta roubo de token)
- Armazenado no banco como hash SHA-256 — nunca em texto plano

### 2.4 Eventos que Invalidam Todas as Sessões

Além da invalidação individual de tokens (revogação de `jti`), os eventos abaixo invalidam **todos** os refresh tokens ativos do usuário, exigindo novo login em todos os dispositivos:

| Evento | Motivo |
|---|---|
| Troca de senha | Se a conta foi comprometida, o atacante perde acesso ao trocar a senha |
| Suspeita de comprometimento detectada (família invalidada) | Contenção automática |
| Solicitação de exclusão de conta confirmada | Encerramento de todas as sessões ativas |
| Revogação manual de sessões (futura feature de "Sair de todos os dispositivos") | Controle explícito do usuário |

```typescript
async function changePassword(userId: string, newPasswordHash: string) {
  await db.transaction(async (tx) => {
    // 1. Atualizar senha
    await tx.query('UPDATE auth.users SET password_hash = $1 WHERE id = $2', 
      [newPasswordHash, userId]);
    // 2. Invalidar todos os refresh tokens da família
    await tx.query('UPDATE auth.sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]);
  });
  // 3. O próximo request com o refresh token antigo receberá 401
}
```

### 2.5 OAuth de Redes Sociais (Contas Conectadas)

- Tokens de acesso de redes sociais armazenados **criptografados em repouso** (AES-256-GCM)
- Chave de criptografia gerenciada pelo AWS KMS — nunca hardcoded, nunca em variável de ambiente em texto plano
- Refresh tokens de redes sociais seguem o mesmo padrão
- Tokens são descriptografados apenas no momento do uso pelo provider correspondente — nunca trafegam decriptografados entre serviços

---

## 3. Autorização

### 3.1 Modelo de Autorização

Cada recurso pertence a um `profile_id`. Toda query de produção que acessa dados sensíveis inclui `WHERE profile_id = :authenticated_profile_id` — nunca confia no ID recebido no path ou body sem verificação.

```typescript
// Padrão correto — nunca confiar no :id sem verificar ownership
async function getCampaign(campaignId: string, authenticatedProfileId: string) {
  const campaign = await db.queryOne(
    'SELECT * FROM campaigns.campaigns WHERE id = $1 AND profile_id = $2',
    [campaignId, authenticatedProfileId]
  );
  if (!campaign) throw new ForbiddenError(); // 403, não 404
}
```

O `profile_id` vem exclusivamente do JWT validado — nunca do corpo da requisição.

### 3.2 Isolamento de Dados entre Usuários

- Nenhuma query retorna dados de outro `profile_id`, mesmo que o ID seja adivinhádo
- IDs de campanhas e publicações são UUIDs v4 — não sequenciais, não adivinháveis
- Respostas de recurso não encontrado ou não autorizado retornam sempre `403` — nunca `404` (evita enumeração de IDs existentes). (DECISIONS do doc 12)

### 3.3 Endpoints Internos

Endpoints `/internal/*` são bloqueados no API Gateway para requisições externas. Acessíveis apenas dentro da VPC privada, autenticados com shared secret rotacionado a cada 30 dias.

---

## 4. Proteção de Dados em Repouso

### 4.1 Criptografia de Credenciais de Terceiros

| Dado | Onde | Criptografia |
|---|---|---|
| Tokens OAuth de redes sociais | `profiles.social_accounts` | AES-256-GCM, chave no KMS |
| Credenciais de marketplace | `profiles.marketplace_accounts` | AES-256-GCM, chave no KMS |
| Refresh tokens de usuário | `auth.sessions` | SHA-256 hash (one-way) |
| Senha de usuário | `auth.users` | Argon2id hash (one-way) |

### 4.2 Dados em Repouso — Banco de Dados

- PostgreSQL com criptografia de volume (AWS EBS encrypted volumes)
- Backups criptografados com chave separada da chave de dado
- Snapshots automáticos diários com retenção de 30 dias
- Backups não contêm chaves de descriptografia — exigem acesso ao KMS para uso

### 4.3 Gerenciamento de Chaves (AWS KMS)

```
KMS Key Hierarchy:
├── master-key (CMK)               ← nunca sai do KMS
│   ├── data-encryption-key        ← criptografa tokens OAuth
│   ├── backup-encryption-key      ← criptografa backups
│   └── jwt-signing-key (RSA)      ← chave privada RS256
```

- Rotação automática de data-encryption-key a cada 90 dias
- Acesso ao KMS por IAM role — nunca por credenciais de usuário
- Logs de uso do KMS no CloudTrail

---

## 5. Proteção de Dados em Trânsito

- TLS 1.3 obrigatório em todos os endpoints públicos
- TLS 1.2 como fallback mínimo (TLS 1.0 e 1.1 desabilitados)
- Comunicação interna (dentro da VPC): TLS opcional em MVP; obrigatório em V1
- HSTS habilitado com `max-age=31536000; includeSubDomains; preload`
- Certificados gerenciados pelo AWS Certificate Manager (renovação automática)

---

## 6. Segurança da API

### 6.1 Rate Limiting (Camada de Segurança)

Além do rate limiting de performance (Documento 12), há rate limiting de segurança:

| Endpoint | Limite | Janela | Ação em violação |
|---|---|---|---|
| `POST /api/auth/login` | 10 req | por IP por minuto | 429 + backoff progressivo |
| `POST /api/auth/register` | 5 req | por IP por hora | 429 + CAPTCHA trigger |
| `POST /api/auth/refresh` | 20 req | por usuário por hora | 429 + alerta de segurança |
| `POST /webhooks/*` | 500 req | por IP por minuto | 429 (proteção contra webhook flooding) |

Violações repetidas (> 3× em 1 hora) adicionam o IP a blocklist temporária (TTL 24h) e geram alerta.

### 6.2 CORS

```typescript
const corsOptions = {
  origin: [
    'https://app.plataforma.com.br',     // produção
    'https://staging.plataforma.com.br', // staging
    // localhost apenas em desenvolvimento — nunca em produção
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type', 'API-Version', 'Idempotency-Key'],
  credentials: true, // necessário para cookies de refresh token
  maxAge: 86400
};
```

### 6.3 Headers de Segurança

```
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 6.4 Proteção contra Injeção de SQL

Toda query usa parâmetros posicionais (`$1`, `$2`) — nunca interpolação de string. ORM ou query builder com prepared statements obrigatório. Revisão de código inclui verificação explícita de queries brutas.

### 6.5 Proteção contra Prompt Injection

Conteúdo fornecido pelo usuário (nome de produto, descrição) que entra no prompt de geração é sanitizado antes da injeção:

```typescript
function sanitizeForPrompt(userInput: string): string {
  // Remove caracteres de controle que poderiam alterar o comportamento do modelo
  return userInput
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, MAX_FIELD_LENGTH);
}
```

A sanitização não tenta "filtrar injeções de prompt" semanticamente — limita o que pode ser injetado estruturalmente. O modelo, por design, não recebe instruções do usuário diretamente — apenas dados sobre o produto.

### 6.6 Proteção contra CSRF (Cross-Site Request Forgery)

O cookie de refresh token usa `SameSite=Strict`, que impede o browser de enviá-lo em requisições originadas de outros domínios. Isso mitiga os ataques CSRF para o fluxo de renovação de token.

Os endpoints de API (que realizam operações sensíveis) são autenticados via header `Authorization: Bearer <access_token>`. Access tokens são armazenados em memória no frontend — não em cookies — e portanto não são enviados automaticamente pelo browser em requisições cross-site. Isso elimina o vetor de CSRF clássico para a grande maioria das operações.

**Decisão:** `SameSite=Strict` é suficiente como controle de CSRF para o MVP. Não será implementado CSRF token explícito. Premissa: clientes SPA modernos com tokens em memória (não em cookies) são imunes a CSRF para operações de dados. O único cookie da aplicação (refresh token) não altera dados — apenas emite novos tokens. (DECISIONS #094)

---

## 7. Segurança de Webhooks

Todo webhook recebido passa por validação HMAC-SHA256 antes de qualquer processamento:

```typescript
function validateWebhookSignature(
  payload: Buffer,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Comparação em tempo constante — evita timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

- HMAC inválido: `401` imediato + log de alerta de segurança
- Secret por conta (não global) — comprometimento de um secret não afeta outros usuários
- Secrets armazenados criptografados no banco (mesmo padrão dos tokens OAuth)
- Rotação de secrets disponível para o usuário via Configurações

---

## 8. Prevenção de Abuso (Trial)

O trial sem cartão de crédito (DECISIONS #023) cria risco de múltiplas contas para trials infinitos. Controles implementados:

### 8.1 Detecção de Contas Múltiplas

```
Sinais de uso múltiplo de trial:
├── Mesmo endereço IP na criação de conta
├── Mesmo dispositivo fingerprint (user-agent + tela + timezone)
├── Mesmo endereço de e-mail com variações (user+tag@email.com)
└── Mesmo conjunto de contas sociais conectadas
```

Quando dois ou mais sinais coincidem entre uma conta nova e uma conta com trial expirado: flag para revisão manual, não bloqueio automático. Falsos positivos (família usando mesmo IP) são prováveis.

### 8.2 Limites Técnicos no Trial

Independente da detecção de abuso, o trial tem limites técnicos reforçados:
- Máximo de 1 conta por e-mail verificado (e-mail verification obrigatório)
- Conta sem e-mail verificado: funcionalidade limitada (não pode publicar)
- Publicações no trial contabilizadas normalmente — não há "publicações gratuitas" além do plano trial

### 8.3 Verificação de E-mail

E-mail verification obrigatório antes de qualquer publicação. Token de verificação de uso único, TTL 24 horas, enviado ao endereço informado no cadastro.

---

## 9. Conformidade LGPD

A LGPD (Lei Geral de Proteção de Dados — Lei 13.709/2018) é obrigatória desde o MVP. (DECISIONS #024)

### 9.1 Base Legal para Tratamento de Dados

| Dado | Base Legal | Artigo LGPD |
|---|---|---|
| E-mail e senha | Execução de contrato | Art. 7º, V |
| Tokens de redes sociais | Execução de contrato | Art. 7º, V |
| Histórico de publicações e analytics | Legítimo interesse (melhoria do serviço) | Art. 7º, IX |
| DNA narrativo do perfil | Execução de contrato + legítimo interesse | Art. 7º, V e IX |
| Dados agregados para Global Patterns | Legítimo interesse (anonimizado) | Art. 7º, IX + Art. 12 |

### 9.2 Direitos dos Titulares (Art. 18)

| Direito | Implementação |
|---|---|
| Acesso | `GET /api/user/data` — exportação completa dos dados do perfil em JSON |
| Retificação | Interface de atualização de perfil existente |
| Exclusão ("Direito ao Esquecimento") | `DELETE /api/user/account` — exclusão completa com cascade |
| Portabilidade | Mesmo endpoint de exportação, formato JSON estruturado |
| Revogação de consentimento | Configurações → Privacidade → Revogar consentimentos |
| Oposição | Configurações → Privacidade → Dados para melhoria do produto |

### 9.3 Processo de Exclusão de Conta

```
1. Usuário solicita exclusão em Configurações
2. Confirmação por e-mail (link de uso único, TTL 48h)
3. Após confirmação:
   a. Cancelar assinatura ativa imediatamente
   b. Anonymizar learning_timeline entries → contribuir para global_patterns
      (somente se consentimento para uso agregado foi dado)
   c. CASCADE DELETE da hierarquia completa de dados do perfil
   d. Invalidar todas as sessões ativas
   e. Marcar user como deleted (soft delete em auth.users por 30 dias para compliance)
   f. Após 30 dias: hard delete de auth.users
4. Confirmação por e-mail de exclusão concluída
```

Dados de `stories.publications` com `published_at NOT NULL` são mantidos por 90 dias para fins de auditoria de compliance (verificação de que publicações ocorreram conforme esperado), depois deletados.

### 9.4 Política de Privacidade e Termos

- Política de Privacidade: documento legal obrigatório, revisado por advogado antes do lançamento
- DPA (Data Processing Agreement) com todos os subprocessadores (AWS, OpenAI, Anthropic)
- Registro de operações de tratamento (exigido pelo Art. 37)
- Encarregado de Dados (DPO): pode ser o próprio fundador no MVP — nomeação formal registrada

---

## 10. Segurança de Infraestrutura

### 10.1 Rede (AWS VPC)

```
Internet
    ↓
[Application Load Balancer] ← ponto único de entrada HTTPS
    ↓
[Public Subnet]
    ├── ECS Fargate Tasks (API Gateway)
    └── ECS Fargate Tasks (Webhooks)
    ↓
[Private Subnet]
    ├── ECS Fargate Tasks (Knowledge Engine, Story Engine, Scheduling Engine)
    ├── ElastiCache Redis
    └── RDS PostgreSQL (Multi-AZ)
```

- Serviços internos na subnet privada — sem acesso direto da internet
- Security Groups com regras mínimas: cada serviço aceita conexões apenas dos serviços que precisam se comunicar com ele
- NAT Gateway para tráfego de saída dos serviços privados (chamadas a APIs externas)

### 10.2 Gerenciamento de Secrets

- **Nunca** armazenar secrets em variáveis de ambiente em texto plano
- **Nunca** commitar secrets no repositório (`.env` no `.gitignore`; pre-commit hook verifica)
- Secrets em produção: AWS Secrets Manager, injetados em tempo de execução via ECS Task Definition
- Rotação automática de secrets configurada no Secrets Manager para credenciais de banco

### 10.3 Acesso a Produção

- Acesso ao banco de produção apenas via bastion host (AWS Systems Manager Session Manager — sem SSH direto)
- MFA obrigatório para todos os acessos à conta AWS de produção
- Princípio do menor privilégio em IAM: cada serviço tem IAM role com permissões mínimas necessárias
- Nenhum acesso de longa duração (IAM Users com access keys permanentes) — apenas roles temporárias

### 10.4 Varredura de Dependências (Supply Chain Security)

Dependências de terceiros (pacotes npm, bibliotecas Python) são um vetor de ataque crescente. A plataforma implementa varredura contínua de dependências como prática obrigatória de CI/CD: (DECISIONS #096)

**No pipeline de CI/CD (em cada Pull Request e merge para main):**
- `npm audit --audit-level=high` — bloqueia merge se vulnerabilidades críticas ou altas forem detectadas
- `pip-audit` para dependências Python do ML Engine — mesma política

**Monitoramento contínuo (em produção):**
- Dependabot ou equivalente habilitado no repositório — PRs automáticos quando uma dependência com CVE é encontrada
- Alertas de segurança do GitHub (ou equivalente) habilitados

**Política:**
- Vulnerabilidades críticas (CVSS ≥ 9.0): bloqueiam qualquer deploy; corrigi em até 24h
- Vulnerabilidades altas (CVSS 7.0–8.9): bloqueiam merge; corrigir em até 72h
- Vulnerabilidades médias: registrar como débito técnico; corrigir no próximo sprint

---

## 11. Logs e Auditoria

### 11.1 O que é Logado

| Evento | Nível | Retido por |
|---|---|---|
| Login bem-sucedido | INFO | 90 dias |
| Login com falha | WARNING | 1 ano |
| Criação/exclusão de conta | INFO | 5 anos |
| Operação de exclusão de dados (LGPD) | INFO | 5 anos |
| Webhook com HMAC inválido | WARNING | 1 ano |
| Rotação de token | INFO | 30 dias |
| Acesso a dados de outro usuário (tentativa) | CRITICAL | 5 anos |
| Erros de API (5xx) | ERROR | 90 dias |
| Chamadas a provedores externos | DEBUG | 7 dias (apenas staging) |

### 11.2 O que Nunca é Logado

- Senhas (em qualquer forma)
- Tokens de acesso ou refresh tokens
- Tokens OAuth de redes sociais
- Prompts completos de geração (DECISIONS #082)
- PII de usuários em logs de debug

### 11.3 Correlação de Logs

Todo log inclui `request_id` (DECISIONS #079), propagado para todos os serviços que processaram a requisição. Buscar por `request_id` no CloudWatch Logs Insights retorna toda a cadeia de eventos de uma requisição específica.

---

## 12. Monitoramento de Segurança

| Anomalia detectada | Ação |
|---|---|
| > 50 logins com falha de um IP em 5 min | Blocklist temporária + alerta |
| Token de refresh tentado após expiração (família invalidada) | Alerta de segurança + log crítico |
| HMAC inválido em webhook > 5× em 1 min | Alerta + investigação manual |
| Query com `profile_id` diferente do token (tentativa) | Log crítico + alerta imediato |
| Pico anormal de criação de contas (> 10× média) | Alerta + ativação de CAPTCHA |
| Acesso ao KMS fora de horário comercial por role inesperada | Alerta crítico imediato |

Monitoramento implementado via AWS CloudWatch Alarms + notificação por e-mail/SMS no MVP. PagerDuty ou equivalente em V1 quando há SLA de resposta.

---

## 13. Plano de Resposta a Incidentes

### 13.1 Classificação de Incidentes

| Nível | Descrição | Tempo de resposta |
|---|---|---|
| P1 — Crítico | Vazamento de dados, acesso não autorizado confirmado, sistema completamente indisponível | 1 hora |
| P2 — Alto | Suspeita de comprometimento, degradação severa, falha de segurança detectada | 4 horas |
| P3 — Médio | Comportamento anômalo, tentativas de exploração não bem-sucedidas | 24 horas |
| P4 — Baixo | Vulnerabilidade detectada sem exploração confirmada | 72 horas |

### 13.2 Passos para P1 (Vazamento de Dados)

```
1. Isolar: revogar todos os tokens ativos; colocar sistema em modo read-only se necessário
2. Investigar: usar request_id para rastrear a cadeia de acesso
3. Conter: revogar credenciais comprometidas; rotacionar chaves KMS afetadas
4. Notificar: usuários afetados em até 72h (obrigação LGPD Art. 48)
5. Reportar: ANPD em até 72h se houver risco relevante aos titulares
6. Corrigir: patch, deploy, validação
7. Documentar: post-mortem com timeline, causa raiz, ações tomadas
```

### 13.3 Responsabilidade de Notificação LGPD (Art. 48)

Em caso de incidente de segurança com potencial impacto a titulares de dados:
- Comunicar à ANPD em prazo razoável (72 horas como referência da LGPD)
- Comunicar aos titulares afetados com descrição do incidente e medidas adotadas
- Registro do incidente e das ações mantido por 5 anos

---

## 14. Checklist de Lançamento de Segurança

Antes do lançamento do MVP, todos os itens abaixo devem estar completos:

- [ ] Política de Privacidade publicada e revisada por advogado
- [ ] Termos de Uso publicados e revisados por advogado
- [ ] DPAs assinados com AWS, OpenAI e Anthropic
- [ ] DPO nomeado e registrado
- [ ] E-mail verification implementado e testado
- [ ] Fluxo de exclusão de conta testado end-to-end
- [ ] Rate limiting de segurança validado em staging
- [ ] HMAC de webhooks testado com payloads malformados
- [ ] Scan de vulnerabilidades (OWASP ZAP ou equivalente) executado
- [ ] `npm audit` sem vulnerabilidades críticas ou altas
- [ ] Dependabot habilitado no repositório
- [ ] Fluxo de troca de senha testado: confirmar que todas as sessões ativas são invalidadas
- [ ] Revisão de secrets no repositório (nenhum secret commitado)
- [ ] Backup e restore do banco testados
- [ ] Plano de resposta a incidentes documentado e comunicado à equipe
- [ ] Acesso ao KMS restrito e auditado
- [ ] MFA habilitado para todos os acessos à conta AWS

---

## 15. Possíveis Melhorias Futuras

1. **Pentest externo:** engajar empresa especializada para pentest formal antes do lançamento de V1 (quando há usuários pagantes reais).

2. **Bug Bounty Program:** programa de divulgação responsável para pesquisadores de segurança. Scope bem definido, recompensas proporcionais à severidade.

3. **SOC 2 Type II:** para clientes enterprise (V3+), certificação formal de controles de segurança.

4. **Detecção de anomalia comportamental:** ML Engine pode aprender padrões de uso normal por usuário e alertar quando o padrão muda (ex: publicação em horário incomum, volume incomum de requisições à API).

---

## Decisões Registradas

| Data | Decisão |
|---|---|
| 2026-07-11 | Argon2id para hashing de senhas (DECISIONS #086) |
| 2026-07-11 | RS256 (assimétrico) para JWT — chave privada nunca sai do servidor de autenticação (DECISIONS #087) |
| 2026-07-11 | Refresh token rotation com invalidação de família em detecção de roubo (DECISIONS #088) |
| 2026-07-11 | Tokens OAuth criptografados com AES-256-GCM, chave no AWS KMS (DECISIONS #089) |
| 2026-07-11 | 403 (nunca 404) para recursos de outros usuários — evita enumeração (DECISIONS #090) |
| 2026-07-11 | E-mail verification obrigatório antes de publicar (controle de abuso de trial) (DECISIONS #091) |
| 2026-07-11 | Exclusão de conta com cascade + anonimização para global_patterns (com consentimento) (DECISIONS #092) |
| 2026-07-11 | PII nunca em logs de produção (DECISIONS #093) |
| 2026-07-11 | Notificação LGPD à ANPD em até 72h em caso de incidente com impacto a titulares |
| 2026-07-11 | CSRF: SameSite=Strict suficiente no MVP; sem CSRF token explícito (DECISIONS #094) |
| 2026-07-11 | Troca de senha invalida todos os refresh tokens ativos do usuário (DECISIONS #095) |
| 2026-07-11 | Dependency scanning (npm audit + pip-audit) obrigatório no CI/CD (DECISIONS #096) |

---

*Documento criado em: 2026-07-11*  
*Versão: 0.2 — Aguardando aprovação*
