# Kanaflix CRM

CRM multitenant para profissionais de marketing, com foco em captura, organização e conversão de leads.

## Arquitetura resumida

- `src/app`: páginas, layouts, ações server-side e endpoints públicos.
- `src/components`: componentes visuais compartilhados.
- `src/lib`: clientes Supabase, workspace ativo e regras de domínio.
- `supabase/migrations`: schema e políticas incrementais do PostgreSQL.
- `scripts`: verificações sintéticas de captura e isolamento.
- `public`: assets públicos da aplicação.

Cada entidade de negócio pertence a um `organization_id` (workspace). O workspace ativo é validado no banco por RLS; nenhuma consulta privada deve confiar somente em filtros do frontend.

## Requisitos

- Node.js compatível com a versão LTS usada no CI;
- projeto Supabase de desenvolvimento;
- variáveis definidas em `.env.local` a partir de `.env.example`.

## Desenvolvimento

```bash
npm ci
npm run dev
```

O preview local padrão roda em [http://localhost:3000](http://localhost:3000). Para manter o fluxo histórico do projeto, também é possível iniciar em `8081` com `npm run dev -- --port 8081`.

## Validações

```bash
npm run lint
npm run build
npm run verify:multitenancy
npm run verify:lead-capture
```

Os dois scripts de verificação sintética exigem `SUPABASE_ACCESS_TOKEN` e usam dados temporários que são removidos ao final. Nunca execute esses scripts apontando para um banco sem antes confirmar o projeto e o ambiente.

O endpoint `GET /api/health` pode ser usado por monitores e smoke tests. Ele retorna o estado da configuração básica, o commit da Vercel quando disponível e o backend do rate limit, sem retornar chaves ou dados de negócio.

A proteção anti-abuso dos formulários é opcional por formulário. Para ativá-la, configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` na Vercel e habilite a opção no editor do formulário. Sem as chaves, o formulário permanece desativado por padrão.

## Ambientes e deploy

O repositório está hospedado em `kanaflixcursos/kanaflixcrm`. A aplicação fica no diretório `kanaflix-crm/`; o projeto da Vercel deve usar esse diretório como **Root Directory**. Produção deve usar um projeto Supabase separado do desenvolvimento, com variáveis configuradas diretamente na Vercel. O endpoint público usa `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` quando configurados para aplicar rate limit compartilhado entre instâncias. Sem essas variáveis, previews e desenvolvimento usam um fallback em memória por instância; isso não deve ser considerado proteção suficiente para um beta público.

Não versionar `.env*`, `.vercel`, tokens, chaves privadas ou dados de clientes.

## Design

`DESIGN.md` é a fonte única da verdade para tipografia, cores, espaçamento, componentes, estados e responsividade. Mudanças visuais devem atualizar o código e o documento na mesma alteração.

## Segurança multitenant

Toda nova tabela de negócio precisa de `organization_id`, índice, RLS, políticas de leitura/escrita e teste negativo de isolamento. Funções `security definer` devem definir `search_path` vazio e usar nomes totalmente qualificados.
