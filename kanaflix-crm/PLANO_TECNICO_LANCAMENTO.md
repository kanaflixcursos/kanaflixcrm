# Plano técnico de lançamento — Kanaflix CRM

> Documento operacional para execução assistida pelo GPT Astra.
>
> Estado de referência: 16 de setembro de 2026.
>
> Este plano trata da estabilização e do lançamento do produto atual. O editor visual de fluxos de e-mail está documentado somente como trabalho futuro e **não deve ser implementado durante as fases de lançamento**.

## Status da execução

Última execução: 17 de setembro de 2026.

- **Concluído localmente:** aplicação completa versionada no GitHub; CI de lint/build criado; Next.js atualizado para `16.3.5`; auditoria de produção sem vulnerabilidades; headers de segurança básicos; estados globais de carregamento/erro/404; navegação mobile; recuperação e redefinição de senha; callback OAuth com erro recuperável; build e lint aprovados; 38 verificações de isolamento multitenant aprovadas; suíte de captura pública aprovada; uploads de imagem separados por workspace; proteção de rajadas no endpoint público; allowlist opcional de origens por formulário; Turnstile opcional por formulário; validação de formato e status honesto para Meta/GTM; exportação CSV dos leads filtrados por workspace.
- **Operabilidade adicionada:** endpoint público `GET /api/health` para smoke tests e monitores, sem exposição de segredos.
- **Fase de dados em andamento:** importação CSV básica por workspace com limite de arquivo/linhas, validação e deduplicação por e-mail ou telefone; o preview visual e o processamento assíncrono para volumes maiores ainda permanecem pendentes.
- **Commits publicados:** checkpoints de baseline até `3cafdd6` na branch `main` (incluindo rate limit distribuído opcional, healthcheck, importação/exportação CSV, allowlist/Turnstile e validação honesta de Meta/GTM).
- **Preview local:** `http://localhost:8081` ativo.
- **Gate Vercel concluído:** Root Directory configurado como `kanaflix-crm`; o deployment `B6wTvD5hqM6NNrKnRYckNrUX1WPK` foi publicado como Production e as rotas `/`, `/entrar`, `/recuperar-senha`, `/redefinir-senha`, `/privacidade` e `/termos` retornam 200.
- **Gates ainda não executados:** rate limit distribuído/Turnstile, convites por e-mail, observabilidade, backup/restore, importação/exportação, integrações Meta/GTM funcionais, revisão jurídica e beta controlado.

O endpoint público já possui proteção de 30 requisições por minuto por IP e slug, com resposta `429` e `Retry-After`. O código usa Redis/Upstash de forma distribuída quando `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` estão configurados e recua para memória em desenvolvimento ou indisponibilidade do serviço. O gate final ainda requer configurar e validar o Redis em produção e, se necessário, Turnstile.

Não marque uma fase como concluída apenas por causa dos itens locais acima; os gates externos e os critérios de aceite de cada fase continuam obrigatórios.

---

## 1. Objetivo

Levar o Kanaflix CRM do estado atual de MVP funcional para uma versão pública segura, recuperável, observável e coerente com sua proposta:

- CRM simples para profissionais de marketing;
- operação centrada em leads;
- múltiplos workspaces, normalmente um por cliente;
- captura por formulários, endpoints e integrações;
- atribuição automática de marketing;
- ausência de responsáveis por lead e de “temperatura” de lead;
- isolamento absoluto entre usuários e workspaces;
- experiência limpa, rápida e consistente com `DESIGN.md`.

O lançamento não depende de acrescentar muitas funcionalidades. Ele depende de tornar a base existente confiável.

---

## 2. Estado técnico atual

### Stack

- Next.js 16 App Router;
- React 19;
- TypeScript;
- Tailwind CSS 4;
- Supabase Auth, PostgreSQL, RLS e Storage;
- Vercel;
- Zod;
- Framer Motion;
- Lucide;
- Google Sans Flex.

### Módulos existentes

- autenticação por e-mail/senha e Google OAuth;
- workspaces e troca de workspace ativo;
- integrantes e transferência de propriedade;
- leads, empresas, oportunidades e atividades;
- pipeline configurável;
- formulários públicos, iframe e endpoint;
- captura de UTM, `gclid` e `fbclid`;
- timeline de eventos do lead;
- regras simples de automação de status e tags;
- relatórios básicos;
- configurações de perfil, workspace e integrações;
- cor de marca dinâmica por workspace.

### Evidências já verificadas

- `npm run lint` passa;
- `npm run build` passa;
- existem scripts sintéticos para multitenancy e captura;
- o banco utiliza `organization_id` e RLS nas entidades principais;
- o endpoint de captura aceita JSON, URL encoded, multipart e texto simples;
- o código da aplicação está versionado no repositório Git e os checkpoints de lançamento estão publicados na branch `main`;
- `npm audit --omit=dev` retorna zero vulnerabilidades conhecidas nas dependências de produção;
- a busca global, notificações, ajuda e execução das integrações de tracking ainda não estão completas.

---

## 3. Regras de execução para o agente

O agente executor deve seguir estas regras em todas as fases:

1. Ler `AGENTS.md`, `DESIGN.md`, `package.json`, migrations e os arquivos relevantes antes de editar.
2. Não alterar o design system sem atualizar `DESIGN.md`.
3. Não misturar duas fases em uma única mudança grande.
4. Criar um checkpoint Git antes de iniciar cada fase.
5. Preservar dados existentes e criar migrations incrementais; nunca editar uma migration já aplicada para simular uma migration nova.
6. Não incluir tokens, chaves, senhas ou valores de `.env.local` em commits, logs ou mensagens.
7. Toda tabela nova que contenha dados de negócio deve possuir `organization_id`, índices adequados, RLS e testes negativos de isolamento.
8. Toda função `security definer` deve usar `set search_path = ''`, nomes totalmente qualificados, permissões mínimas e testes de autorização.
9. Toda ação server-side deve validar entrada, autenticação e workspace ativo.
10. Toda alteração deve terminar com lint, build e testes proporcionais ao risco.
11. Não considerar uma integração pronta apenas porque um identificador foi salvo.
12. Não implementar o editor de automação de e-mail durante este plano.
13. Se uma fase revelar risco de perda de dados, interromper a execução e documentar uma estratégia de migração/rollback antes de prosseguir.

### Ciclo obrigatório por tarefa

1. Inspecionar o estado atual.
2. Registrar arquivos e comportamento afetados.
3. Implementar a menor mudança coerente.
4. Criar ou atualizar testes.
5. Executar validações.
6. Revisar diff e segurança.
7. Documentar resultado, pendências e rollback.
8. Só então seguir para a próxima tarefa.

---

## 4. Critérios globais de conclusão

O produto só estará pronto para lançamento quando:

- o código completo estiver versionado e o deploy for reproduzível a partir da branch principal;
- não houver vulnerabilidades críticas ou altas conhecidas em dependências de produção;
- todos os testes de isolamento por workspace passarem;
- formulários públicos tiverem proteção contra abuso;
- login, cadastro, OAuth, recuperação de senha e convites funcionarem em produção;
- houver monitoramento, logs, alertas e procedimento de restauração testado;
- a interface funcionar em desktop e mobile;
- não houver controles visíveis sem função real;
- políticas de privacidade, termos, consentimento e exclusão/exportação de dados estiverem definidas;
- o beta controlado terminar sem defeitos críticos abertos.

---

## 5. Fase 0 — Integridade do repositório e baseline

### Objetivo

Garantir que o código local seja a fonte real da produção e que cada mudança futura possa ser revisada e revertida.

### Tarefas

- [ ] Verificar o remote Git e confirmar `kanaflixcursos/kanaflixcrm`.
- [ ] Decidir e documentar a estrutura definitiva do repositório: mover o conteúdo de `kanaflix-crm/` para a raiz ou configurar explicitamente esse diretório como root do projeto.
- [ ] Confirmar que `.env*`, `.vercel`, `.next`, dependências e arquivos temporários estão ignorados.
- [ ] Garantir que `.env.example` contenha apenas nomes e exemplos não secretos.
- [ ] Versionar código, migrations, scripts, assets públicos, `DESIGN.md` e este plano.
- [ ] Atualizar o README genérico com arquitetura, requisitos, setup, comandos, ambientes e deploy.
- [ ] Criar branch de segurança antes da reorganização.
- [ ] Vincular a Vercel à branch principal e ao root correto.
- [ ] Comparar o build local com o deployment de produção.
- [ ] Adicionar CI para instalar dependências de forma reprodutível, rodar lint e build em cada pull request.

### Validações

```bash
git status
git ls-files
npm ci
npm run lint
npm run build
```

### Critérios de aceite

- `git ls-files` inclui toda a aplicação relevante;
- um clone limpo executa `npm ci`, lint e build;
- o deploy de produção referencia um commit conhecido da branch principal;
- existe rollback documentado para o deployment anterior;
- nenhum segredo está no histórico.

### Gate

Nenhuma outra fase deve ser publicada antes desta.

---

## 6. Fase 1 — Dependências e segurança básica

### Objetivo

Eliminar vulnerabilidades conhecidas e padronizar cabeçalhos e limites básicos.

### Tarefas

- [ ] Atualizar Next.js para uma versão corrigida e compatível.
- [ ] Atualizar dependências transitivas vulneráveis, incluindo `sharp`, `postcss` e `nanoid` quando aplicável.
- [ ] Ler a documentação instalada da versão do Next antes de adaptar APIs.
- [ ] Rodar auditoria após a atualização.
- [ ] Revisar `next.config.ts` e configurar cabeçalhos de segurança:
  - Content-Security-Policy adequada ao Supabase, Google OAuth e futuros trackers;
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy`;
  - `Permissions-Policy`;
  - proteção contra framing das páginas privadas, sem bloquear os formulários públicos incorporáveis.
- [ ] Revisar cookies de autenticação e comportamento HTTPS.
- [ ] Impedir cache de páginas privadas e respostas sensíveis.
- [ ] Remover logs de dados pessoais e mensagens técnicas expostas ao usuário.

### Testes

- lint e build;
- smoke test de todas as rotas;
- login por senha e Google;
- iframe público em domínio externo;
- validação da CSP no navegador;
- `npm audit --omit=dev` sem vulnerabilidades críticas ou altas não aceitas formalmente.

### Critérios de aceite

- zero vulnerabilidades críticas/altas de produção sem mitigação registrada;
- autenticação e formulários continuam funcionando;
- headers verificados em preview e produção.

---

## 7. Fase 2 — Ambientes, Supabase e deploy reproduzível

### Objetivo

Separar desenvolvimento e produção, eliminar divergência de configuração e tornar migrations previsíveis.

### Tarefas

- [ ] Criar ou confirmar projetos Supabase separados para desenvolvimento/staging e produção.
- [ ] Definir variáveis distintas por ambiente na Vercel.
- [ ] Documentar URLs de callback e redirect permitidas.
- [ ] Remover URLs antigas de Railway e origens não utilizadas.
- [ ] Conferir Site URL e allowlist do Supabase.
- [ ] Criar processo de migration por ambiente.
- [ ] Adicionar checagem de migrations pendentes ao pipeline.
- [ ] Criar dados sintéticos apenas em ambiente de teste.
- [ ] Garantir que produção não dependa de arquivos locais ou tokens de usuário.
- [ ] Criar preview deployments isolados quando possível.
- [ ] Definir domínio próprio antes da abertura pública e atualizar OAuth/Supabase.

### Critérios de aceite

- desenvolvimento não escreve na produção;
- um deploy novo pode ser criado apenas a partir do Git;
- migrations aplicam em um banco vazio e em uma cópia compatível da produção;
- rollback de aplicação e estratégia de rollback de schema estão documentados.

---

## 8. Fase 3 — Auditoria e blindagem do multitenancy

### Objetivo

Garantir que nenhum usuário possa ler, criar, alterar ou apagar dados de outro workspace.

### Escopo de dados

- `organizations`;
- `organization_members`;
- `profiles`;
- `companies`;
- `contacts`;
- `pipelines` e `pipeline_stages`;
- `deals`;
- `activities`;
- `lead_forms`;
- `form_submissions`;
- `lead_events`;
- `lead_automation_rules`;
- `tracking_integrations`;
- objetos do Storage;
- qualquer tabela adicionada posteriormente.

### Tarefas

- [ ] Inventariar políticas RLS, triggers, funções e grants.
- [ ] Testar SELECT, INSERT, UPDATE e DELETE cruzando dois usuários e três workspaces.
- [ ] Testar usuário integrante de dois workspaces e troca do workspace ativo.
- [ ] Testar URLs diretas com IDs pertencentes a outro workspace.
- [ ] Testar relações cruzadas: contato, empresa, oportunidade, atividade, pipeline e formulário.
- [ ] Revisar todas as funções `security definer`.
- [ ] Garantir que RPCs públicas exponham somente dados necessários.
- [ ] Separar Storage em pelo menos:
  - avatar pessoal, vinculado ao usuário;
  - identidade do workspace, vinculada ao workspace.
- [ ] Definir quais imagens podem ser públicas e usar URLs assinadas para o restante.
- [ ] Fazer upload, update e delete respeitarem papéis e workspace.
- [ ] Formalizar matriz de permissões de `member`, `admin` e `owner`.
- [ ] Impedir que um membro comum altere propriedade, integrações ou identidade sem autorização explícita.
- [ ] Expandir `verify-multitenancy` para cobrir todas as entidades e o Storage.

### Matriz inicial sugerida

| Operação | Member | Admin | Owner |
| --- | --- | --- | --- |
| Gerenciar leads e atividades | Sim | Sim | Sim |
| Gerenciar formulários | Sim | Sim | Sim |
| Gerenciar pipeline | Não | Sim | Sim |
| Gerenciar integrações | Não | Sim | Sim |
| Convidar/remover membros | Não | Sim | Sim |
| Alterar identidade do workspace | Não | Sim | Sim |
| Transferir propriedade | Não | Não | Sim |
| Excluir workspace | Não | Não | Sim |

### Critérios de aceite

- suíte negativa comprova que acessos cruzados falham;
- troca de workspace não mistura cache nem dados renderizados;
- Storage segue o mesmo modelo de isolamento;
- cada nova migration possui teste de isolamento.

---

## 9. Fase 4 — Autenticação, conta e convites

### Objetivo

Completar o ciclo de vida do usuário e do workspace.

### Tarefas

- [ ] Criar “Esqueci minha senha”.
- [ ] Criar página segura para redefinição de senha.
- [ ] Permitir reenvio da confirmação de e-mail.
- [ ] Tratar erros no callback OAuth e mostrar mensagem recuperável.
- [ ] Validar criação de conta via Google quando ainda não existe perfil/workspace.
- [ ] Testar vinculação de identidades com o mesmo e-mail.
- [ ] Implementar confirmação de mudança de e-mail.
- [ ] Adicionar encerramento de outras sessões.
- [ ] Criar processo de exclusão de conta e tratamento dos workspaces possuídos.
- [ ] Substituir “adicionar usuário já existente” por convites:
  - token de uso único com hash;
  - expiração;
  - papel solicitado;
  - aceite, cancelamento e reenvio;
  - prevenção de replay.
- [ ] Personalizar e testar e-mails transacionais.

### E-mails transacionais mínimos

- confirmação de cadastro;
- recuperação de senha;
- confirmação de troca de e-mail;
- convite para workspace;
- aviso de transferência de propriedade;
- aviso de alteração sensível de segurança.

Esses e-mails não são o editor de automação de marketing e precisam existir antes dele.

### Critérios de aceite

- todos os fluxos funcionam em produção e em janela anônima;
- links expiram e não podem ser reutilizados;
- nenhuma mensagem revela se um e-mail existe na plataforma;
- Google OAuth e senha convergem para o mesmo perfil de maneira previsível.

---

## 10. Fase 5 — Segurança e confiabilidade da captura de leads

### Objetivo

Tornar formulários, iframe e endpoints públicos resistentes a abuso e fáceis de diagnosticar.

### Tarefas

- [ ] Configurar e validar em produção o rate limit distribuído por IP e slug (Redis/Upstash) e avaliar Turnstile antes do beta público.
- [x] Adicionar Turnstile opcional por formulário; falta apenas configurar as chaves no ambiente de produção.
- [x] Permitir domínios/origens autorizados por formulário sem quebrar uso server-to-server.
- [ ] Criar segredo opcional para endpoint privado.
- [ ] Implementar idempotência por header e por identificador de webhook.
- [ ] Registrar tentativas aceitas e rejeitadas sem armazenar dados excessivos.
- [ ] Manter honeypot, limites de payload e validação server-side.
- [ ] Validar `redirect_url` contra protocolos inseguros.
- [ ] Impedir open redirect mal configurado ou documentar claramente o risco aceito.
- [ ] Normalizar nomes, e-mails e telefones.
- [ ] Definir estratégia de deduplicação configurável por workspace.
- [ ] Evitar duplicar observações em recapturas idênticas.
- [ ] Não reativar automaticamente leads descartados sem configuração explícita.
- [ ] Preservar campos adicionais em estrutura JSON tipada, além da exibição humana na timeline.
- [ ] Criar tela de teste do formulário com payload, resposta e diagnóstico.
- [ ] Adicionar health/diagnostic para endpoint, iframe e script de atribuição.
- [ ] Expandir testes para Framer e outros construtores comuns.

### Campos e consentimento

- [ ] Adicionar checkbox de consentimento configurável.
- [ ] Registrar texto/versão do consentimento, timestamp, formulário e página.
- [ ] Permitir links para privacidade e termos.
- [ ] Diferenciar consentimento de marketing de simples autorização de contato.

### Critérios de aceite

- testes cobrem JSON, multipart, URL encoded, HTML nativo, texto simples e Framer;
- duplicidade não cria contatos indevidos;
- UTM e click IDs são atribuídos automaticamente;
- abuso recebe 429 e não degrada o banco;
- um formulário de um workspace nunca grava em outro.

---

## 11. Fase 6 — Qualidade e portabilidade dos dados

### Objetivo

Permitir entrada, limpeza, segmentação e saída segura dos dados de leads.

### Tarefas

- [x] Implementar importação CSV básica com limite de arquivo/linhas, validação e deduplicação por workspace.
- [ ] Completar importação CSV com:
  - preview;
  - mapeamento de colunas;
  - validação;
  - deduplicação;
  - limite de arquivo e linhas;
  - processamento assíncrono para volumes maiores;
  - relatório por linha.
- [x] Implementar exportação CSV respeitando filtros e workspace.
- [ ] Implementar exportação completa do workspace.
- [ ] Criar mesclagem manual de duplicados com preview e histórico.
- [ ] Criar campos personalizados tipados:
  - texto;
  - texto longo;
  - número;
  - data;
  - seleção;
  - múltipla seleção;
  - booleano.
- [ ] Adicionar segmentos/filtros salvos por tags, status, origem, campanha, formulário e período.
- [ ] Criar política de retenção, anonimização e exclusão.
- [ ] Garantir que exportações e importações sejam auditadas.

### Critérios de aceite

- importar e exportar 10 mil leads sem timeout ou mistura entre workspaces;
- erros são reportados por linha;
- mesclagem mantém timeline, submissões e atribuição;
- exclusão/exportação atende ao processo de privacidade definido.

---

## 12. Fase 7 — Experiência, mobile e consistência

### Objetivo

Remover controles falsos, completar os fluxos principais e garantir uso confortável em qualquer tela.

### Tarefas

- [ ] Criar navegação mobile com drawer e seletor de workspace.
- [x] Remover busca global e sino enquanto essas capacidades ainda não possuem comportamento real.
- [x] Remover o item de suporte desabilitado até existir um canal real.
- [ ] Criar `loading.tsx`, `error.tsx` e estados vazios coerentes.
- [ ] Tratar erros retornados por todas as consultas do Supabase.
- [ ] Criar páginas de not found apropriadas para entidades.
- [ ] Adicionar paginação ou cursor nas listagens.
- [ ] Criar onboarding curto:
  1. identidade do workspace;
  2. primeiro formulário;
  3. instalação/teste;
  4. primeiro lead;
  5. primeira regra simples.
- [ ] Revisar acessibilidade de teclado, foco, labels, dialogs e mensagens.
- [ ] Garantir contraste automático para qualquer cor de marca permitida.
- [ ] Respeitar `prefers-reduced-motion`.
- [ ] Substituir `window.confirm` por dialog acessível nas ações críticas.
- [ ] Validar layouts em 320 px, tablet, notebook e ultrawide.
- [ ] Ocultar UTMs manuais em uma seção avançada do cadastro manual.
- [ ] Manter exatamente uma ação primária no header de cada página.

### Critérios de aceite

- todos os fluxos principais funcionam somente com teclado;
- não existem botões ou campos visíveis sem comportamento real;
- nenhuma tela fica inacessível no mobile;
- layout segue `DESIGN.md` e não introduz padrões paralelos.

---

## 13. Fase 8 — Tracking e integrações de marketing

### Objetivo

Transformar configurações armazenadas em integrações verificáveis e transparentes.

### Meta e GTM

- [x] Não mostrar estado “ativo” apenas porque um ID foi salvo.
- [ ] Usar estados: não configurada, configurada, validada, ativa e com erro.
- [x] Validar formato de Pixel ID e Container ID.
- [ ] Criar teste de instalação e tela de diagnóstico.
- [ ] Definir eventos padronizados:
  - formulário visualizado;
  - formulário iniciado;
  - lead enviado;
  - lead aceito;
  - erro de validação.
- [ ] Publicar eventos no `dataLayer` quando GTM estiver habilitado.
- [ ] Disparar Pixel somente após consentimento aplicável.
- [ ] Documentar payloads e nomes dos eventos.
- [ ] Planejar Conversions API como fase posterior, com deduplicação por `event_id`.

### Webhooks e API

- [ ] Criar webhooks de saída por workspace.
- [ ] Assinar webhooks com HMAC.
- [ ] Implementar retries, backoff e dead-letter.
- [ ] Criar histórico de entregas e botão de reenvio.
- [ ] Criar API keys com hash, prefixo visível, escopos e revogação.
- [ ] Rate limit por chave e workspace.

### Critérios de aceite

- integração só aparece ativa depois de validada;
- eventos podem ser inspecionados no modo de diagnóstico;
- falhas não bloqueiam a captura do lead;
- consentimento é respeitado;
- webhooks são idempotentes e assinados.

---

## 14. Fase 9 — Observabilidade, backup, privacidade e operação

### Objetivo

Permitir detectar problemas, responder a incidentes e recuperar o produto.

### Observabilidade

- [ ] Integrar captura de erros frontend/backend.
- [ ] Criar logs estruturados com request ID, operação e workspace pseudonimizado.
- [ ] Criar métricas de latência, erro, captura e rejeição.
- [ ] Criar alertas para aumento de 401, 422, 429 e 500.
- [ ] Monitorar disponibilidade das rotas críticas.
- [ ] Criar endpoint de saúde sem expor dados internos.
- [ ] Configurar limpeza/scrubbing de dados pessoais.

### Backup e recuperação

- [ ] Confirmar plano e retenção de backups do Supabase.
- [ ] Definir backup de Storage.
- [ ] Testar restauração em ambiente isolado.
- [ ] Medir RPO e RTO reais.
- [ ] Documentar runbook para perda de banco, deploy quebrado e chave vazada.
- [ ] Criar rotação de chaves e inventário de segredos.

### Privacidade e conformidade

- [ ] Revisar termos e política de privacidade com orientação jurídica.
- [ ] Informar finalidade, base legal, retenção, subprocessadores e contato.
- [ ] Criar processo de solicitação, exportação e exclusão de dados.
- [ ] Documentar relação entre proprietário do workspace e titular dos leads.
- [ ] Criar registro de consentimento quando aplicável.
- [ ] Criar política de cookies/tracking para páginas públicas.

### Critérios de aceite

- um erro sintético gera evento e alerta;
- restauração foi executada com sucesso, não apenas documentada;
- logs não contêm senha, token ou payload sensível integral;
- processo de privacidade tem responsável e prazo definidos.

---

## 15. Fase 10 — Testes, beta e lançamento

### Objetivo

Validar comportamento real antes de abrir cadastro geral.

### Pirâmide de testes

#### Unitários

- normalização e validação;
- parsing de payloads;
- deduplicação;
- permissões;
- atribuição;
- transformação de campos personalizados.

#### Integração

- ações server-side com Supabase;
- migrations e RLS;
- RPCs públicas;
- autenticação;
- uploads;
- convites;
- webhooks.

#### End-to-end

- cadastro por senha;
- cadastro/login Google;
- recuperação de senha;
- criação e troca de workspace;
- convite e aceite;
- formulário, iframe e endpoint externo;
- captura e deduplicação;
- alteração de status/tags;
- importação/exportação;
- isolamento entre contas;
- uso mobile.

### Testes não funcionais

- carga do endpoint público;
- 10 mil leads por workspace;
- acessibilidade automatizada e manual;
- navegadores modernos;
- rede lenta e falhas transitórias;
- comportamento sem JavaScript nos formulários HTML compatíveis;
- segurança básica segundo OWASP.

### Beta controlado

- [ ] Selecionar de 3 a 5 workspaces reais.
- [ ] Criar canal de feedback.
- [ ] Acompanhar erros e funil de onboarding.
- [ ] Rodar beta por pelo menos um ciclo operacional completo.
- [ ] Impedir abertura pública enquanto houver P0 ou P1 crítico.

### Checklist de go-live

- [ ] domínio e HTTPS;
- [ ] OAuth e callbacks de produção;
- [ ] e-mails transacionais;
- [ ] backups e restore;
- [ ] monitoramento e alertas;
- [ ] termos e privacidade;
- [ ] suporte;
- [ ] status page ou canal de incidentes;
- [ ] rollback;
- [ ] smoke tests pós-deploy;
- [ ] responsável por responder incidentes.

---

## 16. Fase futura — Automação visual de fluxo de e-mail

> **Não implementar agora.** Esta fase começa somente após o lançamento estar estável e os eventos, consentimentos e e-mails transacionais estarem consolidados.

### Objetivo futuro

Permitir jornadas visuais multietapas por workspace, mantendo o produto simples.

### Blocos previstos

- gatilho de entrada;
- filtro/condição;
- espera por duração ou horário;
- ramificação;
- envio de e-mail;
- adicionar/remover tag;
- alterar status;
- criar atividade;
- webhook;
- finalizar fluxo.

### Eventos previstos

- lead capturado;
- formulário específico;
- UTM/campanha específica;
- tag adicionada;
- status alterado;
- e-mail entregue, aberto, clicado, respondido ou rejeitado;
- conversão registrada.

### Arquitetura esperada

- definição versionada do grafo;
- publicação separada de rascunho;
- motor assíncrono de execução;
- jobs duráveis para esperas;
- idempotência por etapa;
- log de cada execução;
- retry e dead-letter;
- cancelamento por contato ou fluxo;
- limites por workspace;
- provider de e-mail desacoplado;
- unsubscribe, suppression list e consentimento obrigatórios;
- domínio de envio e reputação por configuração adequada;
- preview e envio de teste;
- métricas por etapa.

### Decisões que devem ser tomadas antes da implementação

- provedor inicial, possivelmente Resend;
- fila e scheduler;
- modelo de cobrança/limites;
- domínio compartilhado ou domínio do cliente;
- critérios de abertura e clique considerando privacidade;
- versionamento de templates;
- tratamento de contatos que entram novamente no mesmo fluxo.

---

## 17. Backlog explicitamente fora do lançamento inicial

- editor visual de fluxo de e-mail;
- Meta Conversions API completa;
- sincronização direta de campanhas Meta/Google;
- distribuição automática de responsáveis;
- temperatura do lead;
- billing sofisticado;
- marketplace de integrações;
- aplicativo mobile nativo;
- IA generativa dentro do CRM.

Esses itens não devem atrasar segurança, confiabilidade e clareza do produto principal.

---

## 18. Ordem obrigatória de execução

```text
Fase 0  Repositório e baseline
   ↓
Fase 1  Dependências e segurança básica
   ↓
Fase 2  Ambientes e deploy
   ↓
Fase 3  Multitenancy
   ↓
Fase 4  Autenticação e convites
   ↓
Fase 5  Captura segura
   ↓
Fase 6  Dados e portabilidade
   ↓
Fase 7  UX e mobile
   ↓
Fase 8  Tracking e integrações
   ↓
Fase 9  Operação e privacidade
   ↓
Fase 10 Testes, beta e lançamento
   ↓
Fase futura Automação visual de e-mail
```

Fases podem ser desenvolvidas em paralelo somente quando não houver dependência de schema, segurança ou deploy entre elas. O gate de cada fase permanece obrigatório.

---

## 19. Formato de relatório esperado do agente

Ao concluir cada fase, o GPT Astra deve registrar:

```markdown
## Relatório da fase N

### Entregue
- ...

### Arquivos e migrations alterados
- ...

### Testes executados
- comando — resultado

### Evidências
- ...

### Riscos ou pendências
- ...

### Rollback
- ...

### Gate
- [ ] aprovado
- [ ] bloqueado
```

O agente não deve marcar a fase como concluída apenas porque o código compila. Os critérios de aceite precisam ser demonstrados.

---

## 20. Prompt inicial sugerido para o GPT Astra

```text
Leia integralmente AGENTS.md, DESIGN.md e PLANO_TECNICO_LANCAMENTO.md antes de agir.

Execute somente a primeira fase ainda não concluída do plano. Comece auditando o estado atual e apresente um resumo curto do que será alterado. Preserve dados e mudanças existentes, use migrations incrementais e nunca exponha segredos. Implemente a fase em tarefas pequenas, rode todos os testes indicados, revise o diff e entregue o relatório no formato definido pelo plano.

Não avance para a fase seguinte se algum critério de aceite falhar. Não implemente a automação visual de fluxo de e-mail; ela está explicitamente fora do escopo atual.
```

---

## 21. Decisão de lançamento

O lançamento deve ser uma decisão por evidência, não por sensação. A aplicação estará pronta quando a Fase 10 estiver aprovada, não houver P0/P1 crítico aberto e o deploy de produção puder ser rastreado, observado e revertido com segurança.
