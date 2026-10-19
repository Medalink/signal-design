---
name: signal-design
description: Build or change UI with the Signal design library (signal-design) - flat, square, monochrome CSS components (sd- classes) on Tailwind v4 or plain CSS, attribute-driven JS, optional Chart.js charts. Use when a project depends on signal-design, imports "signal-design" CSS or "signal-design/js", uses sd- classes or data-sd- attributes, or the user asks for Signal-styled pages, app shells, forms, dashboards or charts.
---

# Building UI with Signal

Signal has a strict look: square corners, flat surfaces, color only for status,
tokens instead of values, two faces. Generic UI habits (rounded cards, shadows,
gradients, colored nav, custom dropdowns) break it. Work from the library's own
parts and check the result.

## 1. Load the contract

Read `AGENTS.md` from the library first. Find it at, in order:
- `node_modules/signal-design/AGENTS.md` (installed in the project), or
- `${CLAUDE_PLUGIN_ROOT}/AGENTS.md` (this plugin's copy).

It covers install (GitHub only, not npm), the seven hard rules, themes, which
part to use for which need, and the accessibility duties.

## 2. Copy real markup, don't invent it

For each part you need, look it up in `ai/components.json` (same two locations)
and adapt its `html`:

```bash
node -e "const c=require('./node_modules/signal-design/ai/components.json').components; for (const x of c) if (/dialog|shell/i.test(x.title)) console.log(x.title, '|', x.classes.join(' '))"
```

Each entry has `title`, `classes`, `attributes`, `html`, `js` (what `init()`
must wire) and sometimes `script` (a JS snippet). `llms-full.txt` has the same
content as one text file. Token values per theme, with contrast ratios, are in
`ai/tokens.json`; in code always use the variables (`var(--sd-fg-muted)`,
`text-fg-muted`), never the values.

## 3. Wire behavior

If the markup has any `data-sd-*` attribute, call `init()` once from
`signal-design/js`. Charts need `chart.js` and `createChart` from
`signal-design/charts`. State is attributes (`aria-pressed`, `aria-expanded`,
`aria-current`, `data-tone`, `data-open`); set those from app code instead of
adding classes.

## 4. Check before you call it done

Run the checker against the running page(s):

```bash
npx signal-design check http://localhost:5173/ --a11y
```

Fix every failure it reports: rounded corners, blurred shadows, gradients,
horizontal overflow at 1280/768/375px, fonts not loaded, console errors, and
accessibility violations. If Playwright or axe-core is missing, install them
as dev dependencies (`pnpm add -D playwright axe-core && npx playwright install chromium`).

## Quick don'ts

- No `rounded-*`, `shadow-*` (blurred), `bg-gradient-*`, hex colors or new fonts.
- No color on navigation, headings or decorative icons.
- No custom modal, tooltip, tabs, dropdown or sidebar layout: use `<dialog class="sd-dialog">`,
  `data-sd-tip`, `role="tab"`, `<select>`/`sd-combobox`, and `sd-shell`.
- Icon-only buttons need `aria-label`; each page needs one `<h1>` and a `.sd-skip` link.
