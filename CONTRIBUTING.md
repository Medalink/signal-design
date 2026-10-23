# Contributing to Signal

`AGENTS.md` is the contract for building with Signal. This file is for
changing Signal itself. Most of it exists so that parallel pull requests,
usually one component each, merge without conflicts.

## Files a pull request does not edit

| File | Instead |
|---|---|
| `CHANGELOG.md` | Add `changes/<branch-name>.md` with a `### Added` / `Changed` / `Fixed` / `Removed` heading and bullets. See `changes/README.md`. |
| `ai/components.json`, `ai/tokens.json`, `llms-full.txt`, `vscode/html-data.json`, `vscode/css-data.json` | Nothing. The `ai-files` workflow rebuilds them on `main` after every merge and commits them as `github-actions[bot]`. |

CI fails a pull request that changes any of them. You can still run
`pnpm build:ai` locally to look at the output; drop it before you commit with
`git checkout origin/main -- ai vscode llms-full.txt`. A `release/*` branch is
exempt so it can fold the fragments into `CHANGELOG.md`.

## Where new things go

- **Behavior checks:** a new file, `scripts/checks/<component>.mjs`, with
  `export default async function checkThing(page, where, fail)` and
  `export const page = "<id>"`, the id of the library page (from
  `showcase/pages.js`) that holds the component's block. `scripts/check.mjs`
  runs every file in that folder on its page, once per engine (Chromium and
  WebKit) at 1280px in ink, and fails when `page` is missing or unknown. Do not
  add a function or a call to `check.mjs`. A check that needs its own page
  (like `check-sidebar-resize.mjs`) is its own module too.
- **Showcase:** the showcase is one page per section, listed in
  `showcase/pages.js` (the only list of pages; the rail, the nav palette, the
  overview cards, the vite inputs and the check scripts all read it). A new
  component gets its own `<div class="demo-block">` in the section on its
  page, placed next to the closest related block, not at the end of the
  section. The end of a section is where every other pull request adds its
  block too. Do not add page chrome to a page file: the rail, sidebar and
  palette come from `showcase/layout.html` and the registry.
- **Adding a library page:** an entry in `LIBRARY` in `showcase/pages.js`
  (`id`, `file`, `title`, `label`, `sections`, `icon`, `summary`); the content
  in `showcase/lib-<id>.html` (only the `<body>`, with a `.demo-section` whose
  id is listed in `sections`); the script in `showcase/pages/<id>.js`, which
  calls `mountLibrary()` first; and the rail symbol `#i-<icon>` in `ICONS` in
  `showcase/layout-plugin.js`. Nothing else lists pages. `scripts/check.mjs`
  fails when the file, the script, the icon or a section is missing. A new
  example app is an entry in `EXAMPLES` and a page of its own that carries
  `data-page="<key>"` on `<html>` and calls `mountBar()` from its script.
- **`AGENTS.md` and `README.md` tables:** a new component family gets its own
  row next to related rows. When it belongs in a shared row (Status, Chat and
  feeds), add it at the end of that row, and expect a one-line conflict if
  another open pull request edits the same row.
- One component per pull request. A second component that does not depend on
  the first gets its own branch from `main`.

## Merging

- Merge with a merge commit, not squash or rebase. Merge commits keep the
  ancestry, so an updated branch that already contains another pull request
  still merges cleanly after that pull request lands.
- Merge green pull requests promptly, oldest first. A pull request that waits
  while others land is the one that conflicts.
- When several open pull requests conflict, resolve them as a chain instead of
  one by one against `main`: merge `main` into the oldest branch, then merge
  that result into the next branch, and so on. Push each result to its own
  branch (a fast-forward, no force push), then merge them in the same order.
  Each step is then conflict-free.
- `git config rerere.enabled true` makes git reuse a conflict resolution it
  has already seen.

## Writing checks that do not flake

CI runners are slower and busier than a laptop, and WebKit more so. A check
that sleeps a fixed time and then asserts passes locally and fails there.

- Wait for the condition you are about to assert, with a generous timeout,
  then assert it: `page.waitForFunction(() => cond, null, { timeout: 2000 })`,
  or a polling loop inside `page.evaluate`. Never `waitForTimeout` before a
  positive assertion.
- A fixed wait is fine only for a negative assertion ("nothing moved after
  dispose"), where a slow runner can make it pass but never fail.
- For transitions, wait for `element.getAnimations({ subtree: true })` to
  finish rather than for their duration.

## Develop

```bash
pnpm install
pnpm dev                                        # showcase at http://localhost:5178
pnpm build:css
node scripts/check.mjs http://localhost:5178/   # hard rules and behavior, Chromium and WebKit
node scripts/check.mjs http://localhost:5178/ --engine webkit --only chat,behaviors   # one engine, some pages
pnpm a11y                                       # axe-core audit
node scripts/check-showcase-build.mjs           # production build under /signal-design/, every page
node scripts/changelog.mjs --check              # changelog fragments
```

## Releasing

1. On a `release/<version>` branch, run `node scripts/changelog.mjs`. It moves
   every fragment under `## Unreleased` in `CHANGELOG.md` and deletes them.
2. Rename `## Unreleased` to `## <version> (<date>)`, add an empty
   `## Unreleased` above it, and bump `version` in `package.json`.
3. Merge, wait for the `ai-files` commit on `main` (it stamps the new
   version), then tag that commit `v<version>`.

## Coding agents and Agent Traffic Control

This repository coordinates issue work with Agent Traffic Control (ATC). If you or your agent are about to work on an issue:

1. Run `npx github:ashhart/ATC check <issue>`. Start only when it says `free` or `yours`.
2. Claim it with `npx github:ashhart/ATC claim <issue>`, or open a draft pull request early with `Fixes #<issue>` in the description.
3. Run `npx github:ashhart/ATC overlap` before opening or updating a pull request, and coordinate if it reports a conflict.

Agents follow [the ATC contributor skill](skills/atc/SKILL.md). Coordination comments contain typed `/atc` commands only.
