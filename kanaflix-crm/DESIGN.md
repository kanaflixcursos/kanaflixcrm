# Kanaflix CRM — Especificação completa de design e layout

> Fonte única da verdade visual do Kanaflix CRM.
>
> Este documento descreve o sistema com precisão suficiente para reproduzir o mesmo layout em outro projeto, mesmo que a nova aplicação tenha entidades, rotas e textos diferentes. Quando o código e este arquivo divergirem, a divergência deve ser corrigida e documentada aqui.

---

## 1. Resultado visual esperado

O produto deve parecer uma ferramenta profissional, calma, espaçosa e direta. A interface não tenta impressionar com excesso de decoração; ela transmite qualidade por alinhamento, ritmo, tipografia, proporção e consistência.

Características fundamentais:

- Fundo geral cinza-claro, nunca branco puro.
- Cards brancos com borda suave, raio generoso e sombra quase imperceptível.
- Google Sans Flex em toda a interface.
- Margens externas confortáveis e conteúdo que não ocupa mais largura do que precisa.
- Sidebar fixa no desktop e barra superior discreta.
- Uma única cor de marca dinâmica por workspace.
- Títulos grandes, com peso médio e tracking negativo.
- Ícones lineares Lucide, pequenos e consistentes.
- Animações funcionais e curtas; nada “pulando” no hover.
- Hierarquia obtida por espaço, tamanho e contraste — não por empilhar cards.

### Princípios inegociáveis

1. Espaço em branco é parte do componente.
2. Cada página tem apenas uma ação primária.
3. A ação primária pertence ao header da página, nunca à navbar global.
4. O botão de voltar pertence ao pequeno contexto acima do título.
5. Um card existe para agrupar uma unidade de informação, formulário ou decisão.
6. Campos e painéis não devem esticar sem necessidade.
7. Hover altera cor ou superfície; nunca posição, escala ou elevação.
8. A cor da marca indica ação, seleção e identidade; não vira fundo dominante da aplicação.

---

## 2. Stack visual de referência

Para obter o resultado mais fiel, usar:

| Tecnologia | Referência atual | Função |
| --- | ---: | --- |
| Next.js | 16.2 | App Router e renderização |
| React | 19.2 | Componentes |
| Tailwind CSS | 4.x | Estilos utilitários e tokens semânticos |
| Google Sans Flex Variable | 5.3 | Tipografia única |
| Lucide React | 1.27 | Ícones |
| Framer Motion | 12.42 | Transições discretas |

Dependências visuais essenciais:

```json
{
  "@fontsource-variable/google-sans-flex": "^5.3.0",
  "framer-motion": "^12.42.2",
  "lucide-react": "^1.27.0",
  "tailwindcss": "^4"
}
```

Importar a fonte no layout raiz:

```tsx
import "@fontsource-variable/google-sans-flex/full.css";
```

### Assets

| Asset | Uso | Regra |
| --- | --- | --- |
| `/logo-kanaflix-crm.png` | Sidebar, mobile e autenticação | Logo horizontal preto; não aplicar filtros ou recolorir |
| `/auth-abstract.jpg` | Painel visual do login | `object-cover`, opacidade `70%`, overlay escuro vertical |

Logo no desktop: `166 × 26px`. Logo no mobile: `150 × 24px`. Logo no card de autenticação: `155 × 24px`.

---

## 3. Tokens de cor

Nunca inserir hexadecimal diretamente em componentes comuns. Componentes devem consumir tokens semânticos.

### Tema claro

| Token | Valor | Uso |
| --- | --- | --- |
| `background` | `#F4F4F3` | Fundo da aplicação |
| `foreground` | `#171716` | Texto principal |
| `surface` | `#FFFFFF` | Cards, inputs, sidebar e topbar |
| `surface-muted` | `#ECECEA` | Apoio, filtros, vazios e seleção suave |
| `muted-foreground` | `#6A6A67` | Texto secundário |
| `border` | `#E0E0DD` | Bordas e divisores |
| `brand` | `#FE6731` por padrão | Ação e identidade dinâmica |
| `brand-hover` | 86% `brand` + 14% preto | Hover primário |
| `brand-soft` | 12% `brand` + `surface` | Seleção e destaque suave |
| `brand-foreground` | contraste calculado | Conteúdo sobre `brand` |
| `success` | `#18794E` | Sucesso, ganho, convertido |
| `warning` | `#A76000` | Atenção e acompanhamento |
| `danger` | `#BF2C2C` | Erro, descarte e exclusão |

### Tema escuro por preferência do sistema

| Token | Valor |
| --- | --- |
| `background` | `#171716` |
| `foreground` | `#F6F6F2` |
| `surface` | `#222220` |
| `surface-muted` | `#2B2B28` |
| `muted-foreground` | `#AAA9A2` |
| `border` | `#393936` |
| `brand-soft` | 18% `brand` + `surface` |
| `success` | `#66D19E` |
| `warning` | `#FFB65E` |
| `danger` | `#FF8D8D` |

### CSS canônico

```css
@import "tailwindcss";

:root {
  --background: #f4f4f3;
  --foreground: #171716;
  --surface: #ffffff;
  --surface-muted: #ececea;
  --muted-foreground: #6a6a67;
  --border: #e0e0dd;
  --brand: #fe6731;
  --brand-hover: color-mix(in srgb, var(--brand) 86%, black);
  --brand-soft: color-mix(in srgb, var(--brand) 12%, var(--surface));
  --brand-foreground: #ffffff;
  --success: #18794e;
  --warning: #a76000;
  --danger: #bf2c2c;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-soft: var(--brand-soft);
  --color-brand-foreground: var(--brand-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --font-sans: "Google Sans Flex Variable", ui-sans-serif, system-ui, sans-serif;
}

* { border-color: var(--border); }
html { background: var(--background); }

body {
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font-family: "Google Sans Flex Variable", ui-sans-serif, system-ui, sans-serif;
  font-variation-settings: "wght" 400, "opsz" 14, "GRAD" 0, "ROND" 40;
}

button, a, input, textarea, select { outline-offset: 3px; }

button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--brand) 45%, transparent);
}

::selection {
  background: var(--brand-soft);
  color: var(--foreground);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #171716;
    --foreground: #f6f6f2;
    --surface: #222220;
    --surface-muted: #2b2b28;
    --muted-foreground: #aaa9a2;
    --border: #393936;
    --brand-soft: color-mix(in srgb, var(--brand) 18%, var(--surface));
    --success: #66d19e;
    --warning: #ffb65e;
    --danger: #ff8d8d;
  }
}
```

---

## 4. Cor dinâmica por workspace

A cor global antes do login é `#FE6731`. Após identificar o workspace ativo, aplicar `organizations.brand_color` antes de renderizar a interface autenticada.

Regras:

- Formato aceito: `#[0-9A-F]{6}`.
- Normalizar para caixa alta.
- Atualizar `--brand` e `--brand-foreground` juntos.
- Nunca compartilhar cor entre workspaces.
- Formulários públicos herdam a cor do workspace publicador.
- Login sempre usa o laranja global, não a última cor armazenada pelo usuário.

Contraste do conteúdo sobre a marca:

```ts
function getContrastColor(hex: string) {
  const rgb = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = rgb.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.48 ? "#171716" : "#FFFFFF";
}
```

Paleta sugerida no seletor: `#FE6731`, `#276EF1`, `#0D8F69`, `#7B47E8`, `#D04770`.

---

## 5. Tipografia

Fonte única: **Google Sans Flex Variable**.

Configuração do corpo:

```css
font-family: "Google Sans Flex Variable", ui-sans-serif, system-ui, sans-serif;
font-variation-settings: "wght" 400, "opsz" 14, "GRAD" 0, "ROND" 40;
```

### Escala

| Elemento | Classes | Resultado |
| --- | --- | --- |
| Hero/login | `text-4xl sm:text-5xl font-medium leading-[1.05] tracking-[-0.05em]` | 36/48px, compacto |
| Título de página | `text-4xl sm:text-5xl font-medium tracking-[-0.04em]` | 36/48px |
| Título interno de auth | `text-3xl font-medium tracking-[-0.04em]` | 30px |
| Métrica grande | `text-3xl` ou `text-4xl font-medium tracking-[-0.04em]` | 30/36px |
| Título de seção | `text-lg font-medium` | 18px |
| Título de card | `text-base font-medium` | 16px |
| Corpo introdutório | `text-base sm:text-lg leading-7 text-muted-foreground` | 16/18px |
| Corpo padrão | `text-sm` | 14px |
| Texto auxiliar | `text-sm text-muted-foreground` | 14px |
| Metadado | `text-xs text-muted-foreground` | 12px |
| Eyebrow | `text-sm font-medium text-brand` | 14px |

Regras:

- Peso normal para corpo; `font-medium` para títulos, labels e ações.
- Não usar `font-bold` como padrão.
- Não usar caixa alta em títulos ou botões.
- Caixa alta é permitida apenas em metadados técnicos pequenos, com `tracking-wide`.
- Descrições extensas usam `leading-6` ou `leading-7`.
- Textos longos de header ficam entre `max-w-xl` e `max-w-2xl`.

---

## 6. Espaçamento, raios, bordas e sombra

Escala base: múltiplos de `4px`.

### Ritmo principal

| Situação | Valor/classe |
| --- | --- |
| Padding da página | `px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14` |
| Header → conteúdo | `mt-10` |
| Entre grandes blocos | `gap-6` ou `space-y-6` |
| Entre campos | `gap-5` |
| Entre label e campo | `space-y-2` |
| Padding de card | `p-6 sm:p-8` |
| Padding de card compacto | `p-4`, `p-5` ou `p-6` |
| Padding de linha | `px-5 py-5 sm:px-6` |
| Separação de ações de formulário | `mt-8 border-t border-border pt-6` |

### Raios

| Uso | Classe | Aproximação |
| --- | --- | ---: |
| Card principal | `rounded-3xl` | 24px |
| Input, botão, superfície interna | `rounded-2xl` | 16px |
| Botão/controle compacto | `rounded-xl` | 12px |
| Badge | `rounded-full` | cápsula |
| Moldura de autenticação | `rounded-[2rem]` | 32px |

### Elevação

- Cards: `shadow-sm`.
- Dropdown flutuante: `shadow-lg`, somente por estar acima do conteúdo.
- Topbar: sem sombra; usar borda inferior e backdrop blur.
- Nunca adicionar sombra no hover.
- Bordas comuns: `border border-border` com 1px.

---

## 7. Breakpoints e responsividade

Usar os breakpoints padrão do Tailwind:

| Prefixo | Largura | Comportamento principal |
| --- | ---: | --- |
| base | `< 640px` | Uma coluna, padding 20px, CTAs largos quando necessário |
| `sm` | `≥ 640px` | Padding 32px, formulários podem ter duas colunas |
| `lg` | `≥ 1024px` | Sidebar fixa de 288px; conteúdo recebe `pl-72` |
| `xl` | `≥ 1280px` | Grades assimétricas e colunas auxiliares |

Regras:

- Mobile começa em uma coluna.
- Um CTA de header não deve ficar comprimido ao lado do título; abaixo de `sm`, desce para uma nova linha.
- Campos de duas colunas usam `sm:grid-cols-2`; campos importantes podem usar `sm:col-span-2`.
- Grades com sidebar interna só surgem em `xl`.
- Tabelas complexas devem virar linhas empilhadas, não criar scroll horizontal como primeira escolha.
- A sidebar principal fica oculta abaixo de `lg`; o logo aparece na topbar mobile.

---

## 8. Shell autenticado

### Estrutura

```text
AppShell
├── Sidebar fixa (desktop, 288px)
│   ├── Logo
│   ├── Workspace switcher
│   ├── Navegação principal
│   └── Configurações + suporte
└── Main (lg:pl-72)
    ├── Topbar sticky (80px)
    └── Conteúdo da rota com transição
```

### Sidebar

Classes canônicas:

```tsx
<aside className="hidden h-dvh w-72 flex-col border-r border-border bg-surface px-5 py-7 lg:fixed lg:inset-y-0 lg:left-0 lg:flex" />
```

Especificações:

- Largura: `w-72` = 288px.
- Altura: viewport completo (`h-dvh`).
- Logo com margem inferior de `48px`: `mb-12 px-3`.
- Workspace switcher com margem inferior de `28px`: `mb-7`.
- Itens de navegação: `h-11`, `rounded-2xl`, `px-3.5`, `gap-3`, `text-sm`.
- Ícones: 19px, `strokeWidth={1.9}`.
- Espaço vertical entre itens: `space-y-1.5`.
- Item ativo: `bg-brand-soft font-medium text-foreground`.
- Item inativo: `text-muted-foreground hover:bg-surface-muted hover:text-foreground`.
- Configurações fica no rodapé da sidebar, depois de divisor superior.

Ordem de referência:

1. Visão geral
2. Hoje
3. Leads
4. Empresas
5. Oportunidades
6. Atividades
7. Formulários
8. Automações
9. Relatórios
10. Configurações no rodapé

### Workspace switcher

- Container lateral: `px-2`.
- Botão: `rounded-2xl bg-surface-muted px-3 py-2.5`.
- Ícone em quadrado `size-9 rounded-xl bg-brand-soft text-brand`.
- Nome em `text-sm font-medium`, subtítulo em `text-xs text-muted-foreground`.
- Dropdown: `rounded-2xl border bg-surface p-2 shadow-lg`.
- Lista limitada a `max-h-52 overflow-auto`.

### Topbar

```tsx
<header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-surface/95 px-5 backdrop-blur sm:px-8 lg:px-12" />
```

- Altura fixa: 80px.
- Fundo: `surface` com 95% de opacidade e blur.
- Desktop: busca à esquerda, ações globais à direita.
- Mobile: logo à esquerda, ações globais à direita.
- Busca: `h-11 max-w-sm rounded-2xl bg-surface-muted`, lupa à esquerda.
- Ações globais: notificações e sair.
- **Não colocar voltar ou CTA de página na topbar.**

---

## 9. Containers de página

Todas as páginas autenticadas começam com:

```tsx
<div className="mx-auto px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14" />
```

Escolher apenas uma das larguras:

| Tipo de página | Largura |
| --- | --- |
| Dashboard, listagem, relatório, detalhes | `max-w-7xl` |
| Configuração, builder, edição média | `max-w-4xl` |
| Formulário simples de criação | `max-w-3xl` |
| Formulário público | `max-w-2xl` |
| Card de autenticação | `max-w-md` |

Não usar `w-full` sem `max-w-*` para formulários de leitura linear.

### Grades recorrentes

```text
Detalhe padrão:        320px | conteúdo flexível
Detalhe de lead:       340px | conteúdo flexível
Form config:           conteúdo flexível | 360px
Automação:             conteúdo flexível | mínimo 420px
Dashboard:             1.45fr | 0.8fr
Atividades:            conteúdo flexível | 320px, limitado a max-w-5xl
```

Classes de referência:

```tsx
xl:grid-cols-[320px_minmax(0,1fr)]
xl:grid-cols-[340px_minmax(0,1fr)]
xl:grid-cols-[minmax(0,1fr)_360px]
xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.75fr)]
xl:grid-cols-[1.45fr_0.8fr]
```

---

## 10. Header de página

O header padrão é composto por:

1. Ícone contextual opcional em `brand-soft`.
2. Eyebrow com botão de voltar.
3. Título.
4. Descrição curta.
5. Uma ação primária à direita, quando existir.

### Eyebrow canônico

```tsx
<div className="flex items-center gap-2 text-sm font-medium text-brand">
  <button
    type="button"
    aria-label="Voltar"
    title="Voltar"
    className="grid size-8 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
  >
    <ArrowLeft size={17} strokeWidth={1.9} />
  </button>
  <span>Contexto da página</span>
</div>
```

- O voltar fica **antes** do texto menor.
- Não usar avatar com inicial ao lado de títulos de detalhe.
- Status pode ficar ao lado do eyebrow, com `flex flex-wrap items-center gap-3`.

### Header com ação

```tsx
<header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
  <div>
    <PageEyebrow>Contexto</PageEyebrow>
    <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Título da página</h1>
    <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Descrição curta e útil.</p>
  </div>
  <PrimaryButton>Ação principal</PrimaryButton>
</header>
```

### Header com ícone superior

Usado em builders e configurações:

```tsx
<div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
  <Icon size={22} />
</div>
<PageEyebrow className="mt-6">Contexto</PageEyebrow>
```

### Regras

- Divisor inferior: `border-b border-border pb-8`.
- Título começa `mt-3` após o eyebrow.
- Descrição começa `mt-3` ou `mt-4`.
- CTA: `h-12`, `shrink-0`.
- Em detalhe, “Editar” é secundário; a ação operacional é primária.
- Não duplicar ação no header, topbar e corpo.

---

## 11. Ícones

Biblioteca exclusiva: `lucide-react`.

| Contexto | Tamanho |
| --- | ---: |
| Navegação | 19px |
| Botão | 17–19px |
| Card/seção | 20–22px |
| Metadado | 14–17px |
| Empty state | 22–24px |

Usar `strokeWidth={1.9}` quando o ícone aceitar configuração explícita. Ícones decorativos recebem `aria-hidden="true"`. Botões somente com ícone sempre recebem `aria-label`.

Não misturar ícones sólidos, emojis, Font Awesome ou SVGs aleatórios.

---

## 12. Botões e ações

### Primário

```tsx
className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
```

### Secundário

```tsx
className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-60"
```

### Utilitário compacto

```tsx
className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition-colors hover:bg-surface-muted"
```

### Apenas ícone

```tsx
className="grid size-11 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
```

### Destrutivo

```tsx
className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-danger/35 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"
```

Regras:

- Altura primária: 48px.
- Altura utilitária: 44px.
- Texto: 14px medium.
- Ícone antes do label.
- Estado pendente troca o ícone por `LoaderCircle animate-spin`.
- Hover não usa `translate`, `scale`, bounce ou nova sombra.
- Disabled usa opacidade entre 35% e 60%, conforme contexto.

---

## 13. Campos e formulários

### Campo de uma linha

```tsx
<label className="block space-y-2">
  <span className="text-sm font-medium">Rótulo</span>
  <input className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
</label>
```

### Textarea

```tsx
className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
```

### Select

```tsx
className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm"
```

Selects nativos devem usar um chevron global:

```css
select:not([multiple]) {
  appearance: none;
  -webkit-appearance: none;
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1rem 1rem;
  padding-right: 2.75rem;
}
```

O ícone nunca pode ficar encostado na borda.

### Composição

- Grade: `grid gap-5 sm:grid-cols-2`.
- Campo largo: `sm:col-span-2`.
- Formulário: `rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8`.
- Builders longos podem ser divididos em vários cards com `space-y-6`.
- Ações ficam após `mt-8 border-t border-border pt-6`.
- Labels são sempre visíveis; placeholder não substitui label.
- Valores de exemplo ficam em placeholders, não pré-preenchidos.
- Erro geral: `rounded-2xl bg-brand-soft px-4 py-3 text-sm`.
- Sucesso: `text-sm text-success` ou painel suave quando precisar destaque.
- Validar no cliente para feedback e no servidor para segurança.

### Formulários estreitos

Não criar duas colunas dentro de painéis com menos de aproximadamente 480px. O painel “Nova automação”, por exemplo, usa campos empilhados e coluna externa mínima de 420px.

---

## 14. Cards e superfícies

### Card principal

```tsx
className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8"
```

### Card sem padding externo, para lista

```tsx
className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
```

Cabeçalho interno:

```tsx
className="border-b border-border p-5 sm:p-6"
```

### Card compacto

```tsx
className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
```

### Superfície auxiliar sem aparência de card

```tsx
className="rounded-2xl bg-surface-muted px-5 py-4"
```

Usar para atualização rápida, aviso e resumo leve. Não adicionar borda e sombra quando a superfície muted já cria separação suficiente.

### Regras de composição

- Evitar card dentro de card.
- Preferir `divide-y divide-border` para itens recorrentes.
- Um agrupamento puramente editorial pode ficar direto no fundo da página.
- Bordas coloridas só comunicam estado: `brand`, `warning` ou `danger`.

---

## 15. Listas, métricas, kanban e detalhes

### Métrica

```tsx
<article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
  <p className="text-sm text-muted-foreground">Rótulo</p>
  <p className="mt-4 text-4xl font-medium tracking-[-0.04em]">42</p>
  <p className="mt-2 text-sm text-muted-foreground">Descrição</p>
</article>
```

Dashboard: `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`.

### Lista

- Container com borda, fundo surface e `rounded-3xl`.
- Conteúdo com `divide-y divide-border`.
- Linha: `px-5 py-5 sm:px-6`.
- Linha navegável inteira vira link.
- Hover: `hover:bg-surface-muted/60`.
- Nome principal: `text-sm font-medium`.
- Metadado: `mt-1 text-xs` ou `text-sm text-muted-foreground`.

### Kanban

- Coluna: `min-h-80 rounded-3xl border border-border bg-surface-muted/55 p-4`.
- Cards internos são menores e visualmente contidos.
- Colunas usam largura suficiente para leitura; não comprimir texto para exibir mais colunas.

### Detalhe

- Header sem avatar automático por inicial.
- Coluna lateral de 320–340px para dados estáveis.
- Conteúdo flexível para histórico, oportunidades e timeline.
- Informações são agrupadas em cards independentes, alinhados por `gap-6`.

### Gráfico simples

- Barra base: `h-2 overflow-hidden rounded-full bg-surface-muted`.
- Preenchimento: `h-full rounded-full bg-brand`.
- Gráficos seguem a cor dinâmica do workspace.

---

## 16. Badges e estados

Badge base:

```tsx
className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
```

| Estado | Estilo |
| --- | --- |
| Novo/ativo | `bg-brand-soft text-brand` |
| Neutro/em análise | `bg-surface-muted text-foreground` |
| Qualificado/convertido | `bg-success/10 text-success` |
| Acompanhamento/atenção | `bg-warning/10 text-warning` |
| Descartado/erro | `bg-danger/10 text-danger` |

Estados nunca dependem somente da cor; sempre exibem label textual.

### Estado vazio

Composição:

1. Área central com altura mínima entre 224 e 288px.
2. Ícone de 22–24px em `text-muted-foreground` ou dentro de `brand-soft`.
3. Título `text-base` ou `text-lg font-medium`.
4. Explicação `mt-2 max-w-md text-sm leading-6 text-muted-foreground`.
5. CTA textual ou botão em `mt-5/6`.

### Loading

- Usar `LoaderCircle animate-spin` de 16–18px.
- Manter o label com verbo no gerúndio: “Salvando”, “Enviando”.
- Não cobrir toda a tela quando somente um card está carregando.

---

## 17. Abas

Usar abas apenas quando uma entidade tem áreas claramente distintas, como resumo operacional e configurações técnicas.

```tsx
<nav className="mt-6 flex gap-2 border-b border-border">
  <a className="relative inline-flex h-12 items-center gap-2 px-3 text-sm font-medium">
    Aba
    <span className="absolute inset-x-2 bottom-[-1px] h-0.5 rounded-full bg-brand" />
  </a>
</nav>
```

- Ativa: `text-foreground` + indicador inferior de 2px.
- Inativa: `text-muted-foreground hover:text-foreground`.
- Estado da aba deve existir na URL.
- Configurações destrutivas ficam na aba técnica, não no resumo.

---

## 18. Imagens e upload

- Não oferecer campo de URL de imagem ao usuário final.
- Formatos: JPG, PNG e WebP.
- Limite: 5MB.
- Recomendar imagem 1:1.
- Preview externo: `size-24 rounded-3xl border bg-surface-muted p-[10px]`.
- Imagem interna: `size-full rounded-2xl object-cover`.
- O respiro de 10px é obrigatório para logos e avatares não encostarem nas bordas.
- Upload usa botão secundário de 44px e estado “Enviando”.

---

## 19. Autenticação

Layout externo:

```tsx
<main className="min-h-screen bg-background p-5 sm:p-8">
  <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-surface sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.1fr_0.9fr]">
    {/* painel visual */}
    {/* formulário */}
  </div>
</main>
```

### Painel visual

- Fundo escuro baseado em `foreground`.
- Imagem `auth-abstract.jpg` em cover e 70% de opacidade.
- Overlay: `from-foreground/35 via-foreground/75 to-foreground`.
- Padding: `p-7 sm:p-10 lg:p-14`.
- Logo em pequeno fundo branco `rounded-xl px-3 py-2`.
- Ícone de 48px em fundo brand.
- Título de 36/48px, line-height 1.05, tracking -0.05em.

### Formulário

- Centralizado em `p-6 sm:p-10 lg:p-14`.
- Card `w-full max-w-md rounded-3xl border bg-surface p-6 shadow-sm sm:p-8`.
- Toggle login/cadastro em `rounded-2xl bg-surface-muted p-1`.
- A cor é sempre o laranja global até o workspace ser carregado.

---

## 20. Formulários públicos e iframe

### Página pública

- Container `max-w-2xl`.
- Um único card `rounded-3xl border bg-surface p-6 shadow-sm sm:p-8`.
- Fundo geral `background`.
- Cor herdada do workspace publicador.
- Nome, e-mail e telefone são obrigatórios.
- Campos adicionais são opcionais por padrão e, quando preenchidos, podem virar observações do lead.

### Iframe

- Fundo de `html` e `body` transparente quando `.public-form-embed` existir.
- Não renderizar sidebar, topbar ou rodapé.
- Manter apenas o box do formulário.
- O snippet deve usar `border:0; background:transparent`.

### Builder

- Campos obrigatórios fixos não podem ser removidos.
- Campos de lista usam uma linha por opção, nunca texto separado por vírgulas.
- Ações de adicionar/remover opção são explícitas.
- Redirecionamento aceita URL completa `http://` ou `https://`.
- Integrações exibem link, iframe, endpoint, helper e payload em blocos copiáveis.

---

## 21. Movimento

Framer Motion é usado somente para transições discretas.

### Troca de rota

```tsx
<motion.div
  key={pathname}
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {children}
</motion.div>
```

### Hero

```tsx
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.45, ease: "easeOut" }}
```

Regras:

- Respeitar `useReducedMotion`/`prefers-reduced-motion`.
- Sem Lottie.
- Sem imagem ou animação decorativa no header autenticado.
- Sem hover com deslocamento ou escala.
- Rotação é permitida para loading e chevron de dropdown.

---

## 22. Acessibilidade

- Idioma raiz: `pt-BR`.
- Foco visível de 3px com 45% da cor de marca.
- Todo campo tem `label` real.
- Placeholder é exemplo, não label.
- Botão somente com ícone tem `aria-label`.
- Ícone decorativo tem `aria-hidden="true"`.
- Usar `header`, `nav`, `main`, `section`, `article`, `form`, `label` e `time` quando aplicável.
- Status tem texto além da cor.
- `brand-foreground` é calculado; não assumir branco.
- Disabled não pode depender apenas da mudança de cursor.
- Elementos clicáveis têm alvo ideal de 44px ou mais.
- Confirmações destrutivas são explícitas.

---

## 23. Multitenancy percebido na interface

Mesmo em outro projeto, se houver tenancy, o layout deve deixar o contexto atual evidente sem repetir o nome em todo card.

- O workspace ativo aparece no switcher da sidebar.
- Cor, logo, formulários, contatos, relatórios e configurações pertencem ao workspace atual.
- Ao trocar workspace, navegar para a home e carregar tema/dados do novo contexto juntos.
- Não exibir dados antigos enquanto a nova cor já foi aplicada, nem o contrário.
- Ações e mensagens podem usar “workspace atual” ou “cliente atual” no eyebrow/descrição.
- Configurações pessoais e configurações do workspace são páginas distintas.

---

## 24. Padrões por tipo de página

### Dashboard

1. Hero sem card, com eyebrow, título, descrição e CTA.
2. Grade de quatro métricas.
3. Grade assimétrica `1.45fr / 0.8fr` para conteúdo principal e acompanhamento.

### Listagem

1. Header com CTA.
2. Métricas opcionais.
3. Filtros em superfície/card separado.
4. Lista em card sem padding externo.
5. Empty state dentro do mesmo container.

### Detalhe

1. Header com status e ações.
2. Ação rápida em `surface-muted`, sem virar card pesado.
3. Grade lateral de 320–340px.
4. Timeline ou conteúdo principal à direita.

### Criação/edição

1. Container `max-w-3xl` ou `max-w-4xl`.
2. Header com ícone opcional.
3. Formulário após `mt-10`.
4. Um card para formulário curto; vários cards para builder longo.

### Configurações

1. Container geral pode ser `max-w-7xl`, mas o header e formulários ficam em `max-w-3xl/4xl`.
2. Cards têm o mesmo padding `p-6 sm:p-8`.
3. Área destrutiva é separada e usa borda danger suave.

### Automações

1. Container `max-w-7xl`.
2. Grade em `xl`: lista flexível + formulário mínimo de 420px.
3. Formulário com inputs em uma coluna para evitar compressão.

---

## 25. Regras de conteúdo

- Títulos são curtos e orientados à tarefa.
- Descrição de header responde “o que faço aqui?” em uma frase.
- Botões começam com verbo: Criar, Salvar, Editar, Publicar, Atualizar.
- Erros explicam o que deve ser corrigido.
- Estados vazios dizem por que está vazio e apresentam próximo passo.
- Evitar jargão de CRM quando uma palavra comum resolve.
- No produto atual, usar “Lead” na interface; `contacts` pode continuar como nome técnico.

---

## 26. Proibições

Não usar:

- Gradiente decorativo em header autenticado.
- Imagem de fundo no header autenticado.
- Lottie.
- Avatar automático com a inicial ao lado do título.
- Ação principal na topbar.
- Botão de voltar na topbar.
- Cards envolvendo todo e qualquer texto.
- Formulário full-width sem necessidade.
- Hexadecimal hardcoded em componente autenticado.
- Ícones de bibliotecas diferentes.
- Hover com translate, scale, bounce ou nova sombra.
- Dropdown com seta colada à borda.
- Campo de URL para upload de logo/avatar.
- Opções de select digitadas em texto separado por vírgulas.

---

## 27. Checklist de reprodução fiel

### Fundação

- [ ] Google Sans Flex Variable carregada globalmente.
- [ ] Tokens claro/escuro iguais aos definidos aqui.
- [ ] Cor brand dinâmica e foreground por contraste.
- [ ] Fundo geral `#F4F4F3` no tema claro.
- [ ] Lucide como biblioteca única de ícones.

### Shell

- [ ] Sidebar fixa de 288px em `lg`.
- [ ] Conteúdo com `lg:pl-72`.
- [ ] Topbar sticky de 80px.
- [ ] Busca no desktop e logo no mobile.
- [ ] Nenhum CTA ou botão de voltar na topbar.

### Página

- [ ] Container escolhido entre `max-w-7xl`, `4xl`, `3xl` ou `2xl`.
- [ ] Padding responsivo `5/8/12` e vertical `10/12/14`.
- [ ] Header com eyebrow + voltar, título e descrição.
- [ ] Uma única ação primária.
- [ ] Divisor inferior com `pb-8`.
- [ ] Conteúdo começando em `mt-10`.

### Componentes

- [ ] Cards `rounded-3xl`, borda suave e `shadow-sm`.
- [ ] Inputs/botões `rounded-2xl` e 44–48px de altura.
- [ ] Padding interno consistente `p-6 sm:p-8`.
- [ ] Select com `pr-11` e chevron a 16px da borda.
- [ ] Ícones entre 17 e 22px.
- [ ] Estados vazio, erro, loading e destrutivo implementados.

### Interação

- [ ] Hover muda apenas cor/superfície.
- [ ] Foco visível de 3px.
- [ ] Animação de rota: 200ms, opacity + y 6px.
- [ ] Reduced motion respeitado.
- [ ] Contraste sobre brand calculado.

### Responsividade

- [ ] Uma coluna no mobile.
- [ ] CTAs não comprimem títulos.
- [ ] Grades auxiliares aparecem somente em `xl`.
- [ ] Formulários estreitos não forçam duas colunas.
- [ ] Layout funcional nos temas claro e escuro.

---

## 28. Governança

- Este arquivo prevalece sobre decisões visuais isoladas.
- Uma exceção deve ser rara, justificada e documentada.
- Uma regra recorrente nova deve entrar aqui antes de ser copiada para outras telas.
- Mudanças em cor, tipografia, raio, espaçamento ou shell exigem atualização simultânea deste documento e dos tokens/componentes base.
- Antes de aprovar uma nova página, executar o checklist da seção 27.

---

## 29. Resumo rápido para outro agente ou gerador

> Crie uma aplicação SaaS clean com Google Sans Flex, fundo cinza-claro `#F4F4F3`, superfícies brancas, texto quase preto `#171716`, bordas `#E0E0DD` e uma cor de marca dinâmica. Use sidebar fixa de 288px no desktop, topbar sticky de 80px e páginas em containers `max-w-7xl/4xl/3xl` com padding responsivo confortável. Headers têm botão de voltar ao lado do eyebrow pequeno, título de 36–48px com tracking negativo, descrição curta e apenas um CTA à direita. Cards usam raio de 24px, borda suave, sombra mínima e padding de 24–32px. Inputs e botões têm raio de 16px e altura de 48px. Use somente ícones Lucide, animações curtas de opacity/y com Framer Motion e hovers apenas por cor. Nunca use gradiente, imagem ou Lottie em headers autenticados, nem embrulhe todo conteúdo em cards.
