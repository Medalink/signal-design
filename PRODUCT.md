# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Signal is the owner's house design system. Its primary users are the owner and
the AI agents that build UI for the owner's own products: Whisper, Publighter
and Watcher. Outside developers may install it (MIT, public on GitHub), but
they are not the design target; decisions serve the owner's apps first.

Two readers matter equally: a person browsing the showcase to pick a part, and
an agent reading `AGENTS.md`, `llms-full.txt` and `ai/components.json` to copy
real markup instead of inventing it.

## Product Purpose

Give every one of the owner's apps one consistent visual language without
re-deciding it per app: CSS components (`sd-` classes) on Tailwind CSS v4 or a
prebuilt stylesheet, a small dependency-free JS module wired through
attributes, optional Chart.js charts, ASCII art, OBS stream overlays and typed
React 19 components. Success is an app that looks and behaves like Signal
because it was built from Signal's parts, and passes `signal-design check`.

## Positioning

The aesthetic is the point: flat, square and monochrome, with color reserved
for meaning (status and selection). Neighboring kits (shadcn, Radix Themes,
Tailwind UI) are rounded, shadowed and colorful by default; Signal is the
opposite by rule, and the rules are enforced, not suggested.

## Operating Context

- Consumer apps run in browsers and in Tauri webviews (WebView2, WKWebView,
  WebKitGTK); `examples/tauri/` is the reference desktop app.
- Installed from GitHub (`github:Medalink/signal-design`, pinned by tag), not
  npm. Releases bump minor, not major, unless the owner asks.
- The showcase (`pnpm dev`, `showcase/`) is the catalog: one library page per
  component type, filed by `showcase/pages.js`, plus example apps (shell, chat,
  charts, form, landing, stream, React editor).
- Agents work from `AGENTS.md` (the contract), `llms-full.txt`,
  `ai/components.json`, `ai/tokens.json`, a Cursor rule, a Claude Code plugin
  skill and VS Code completion data. These are generated from the showcase by
  `pnpm build:ai`.
- Quality gates: `signal-design check` (rounded corners, blurred shadows,
  font weights and families, overflow at 1280/768/375px, font loading, console errors, axe
  WCAG 2.2 AA with `--a11y`; each finding names its rule, and `--skip` or
  `data-sd-check-ignore` sets one aside), `scripts/check.mjs` behavior checks
  in Chromium and WebKit, and `scripts/score.mjs` (`docs/scorecard.md`).
- Parallel pull requests, usually one component each; `CONTRIBUTING.md` sets
  the rules that keep them from conflicting.

## Capabilities and Constraints

- The hard rules in `AGENTS.md` are binding: square corners; flat (no blurred
  shadow, glow or glass); color only through status and selection roles
  (`accent`, `success`, `danger`, `warning`, `pending`, `extra`); tokens, never
  hard-coded values; two text weights; transitions of 120–200ms; style
  keyed on ARIA and `data-*` state; one writer per state.
- Themes: `ink` (default), `graphite`, `paper`, `auto`. Fonts: system (SF Pro /
  Segoe UI) by default, Leon Sans and Source Code Pro selectable; Source Code
  Pro for code and numbers; Literata only for long-form prose.
- Labels Signal's JS writes are English by default and translatable through
  `setLabels`.
- Must keep working without a framework; React is optional and owns its own
  state when used.

## Brand Commitments

- Name: Signal (package `signal-design`, class prefix `sd-`).
- Voice in docs and UI: plain, short, factual sentences; no taglines, helper
  text or marketing words.
- The flat, square, monochrome identity is fixed and not open to redesign
  without the owner's explicit ask.

## Evidence on Hand

- Full component catalog in `showcase/` and `ai/components.json`.
- `docs/scorecard.md`: 100 of 100 showcase items clean at last generation.
- No public adoption numbers, testimonials or third-party users are recorded;
  do not invent any.

## Product Principles

1. The owner's apps come first; a part earns its place by serving Whisper,
   Publighter or Watcher, not a hypothetical adopter.
2. The look is the product: never trade the flat, square, mono language for
   convention or a trend.
3. Color carries meaning or it is absent.
4. Agents are first-class users: every part ships copyable markup and a check
   that proves it, so agents follow the system instead of improvising.
5. Framework-free first, frameworks welcome, one writer per state.

## Accessibility & Inclusion

WCAG 2.2 AA contrast in every theme, keyboard behavior wired by the JS, visible
focus, `prefers-reduced-motion` honored, and axe audits through
`signal-design check --a11y`.
