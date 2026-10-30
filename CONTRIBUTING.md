# Contributing to Signal

`AGENTS.md` is the contract for building with Signal. This file is for
changing Signal itself. A change ships with `ship`, straight to `main`, and
no pull request opens. Most of this file exists so that parallel changes,
usually one component each, land without conflicts.

## How a change ships

1. Commit the change with its fragment in `changes/` (below).
2. Run `ship`. It reads the flow from roster, runs the gate on what the change
   touches, and pushes to `main`. `.github/` changes wait for the owner's
   approval.
3. A change to what consumers install (`package.json` or a path its `files`
   field lists) gets a release. Once `ai-files` has finished on the pushed
   commit, the flow folds the fragments into `CHANGELOG.md`, bumps the patch
   version, regenerates the AI files, ships `Release v<version>` and tags it.
   `release.yml` builds the GitHub release from the tag. A docs-only change
   makes no release.

For a minor or major version, change `version` in `package.json` in your
change. The flow releases that version as it is. No release branch is made.

## Files a change does not edit

| File | Instead |
|---|---|
| `CHANGELOG.md` | Add `changes/<name>.md` with a `### Added` / `Changed` / `Fixed` / `Removed` heading and bullets. See `changes/README.md`. |
| `ai/components.json`, `ai/tokens.json`, `llms-full.txt`, `vscode/html-data.json`, `vscode/css-data.json` | Nothing. The `ai-files` workflow rebuilds them on `main` after every push and commits them as `github-actions[bot]`. |

You can still run `pnpm build:ai` locally to look at the output; drop it before
you commit with `git checkout origin/main -- ai vscode llms-full.txt`. Only the
release commit changes `CHANGELOG.md` and these files.

## Where new things go

- **Behavior checks:** a new file, `scripts/checks/<component>.mjs`, with
  `export default async function checkThing(page, where, fail)` and
  `export const page = "<id>"`, the id of the library page (from
  `showcase/pages.js`) that holds the component's block. `scripts/check.mjs`
  runs every file in that folder on its page, once per engine (Chromium and
  WebKit) at 1280px in ink, and fails when `page` is missing or unknown. Do not
  add a function or a call to `check.mjs`. A check that needs its own page
  (like `check-sidebar-resize.mjs`) is its own module too.
- **Rules of `signal-design check`:** the rule is a function in
  `bin/rules.mjs`, and its sample goes in `samples` in `e2e/check.mjs`: a page
  with markup that breaks the rule and markup that keeps it, every element
  with an id, and the ids the CLI must name. The e2e runs the real CLI on it.
- **Showcase:** the showcase is one page per component type, filed as rail
  section, then sidebar group, then page in `showcase/pages.js` (the only list
  of pages; the rail, the sidebar, the nav palette, the overview cards, the
  vite inputs and the check scripts all read it). A new component that fits an
  existing page gets its own `<div class="demo-block">` there, placed next to
  the closest related block, not at the end of the page. The end is where
  every other change adds its block too. Do not add page chrome to a
  page file: the rail, sidebar, page title, pager and palette come from
  `showcase/layout.html`, `showcase/layout-plugin.js` and the registry.
- **Adding a library page:** an entry (`id`, `title`, `summary`) in its group
  in `showcase/pages.js`; the content in `showcase/lib-<id>.html` (only the
  `<body>`: an optional `<header class="demo-intro">`, then the blocks, each
  with an explicit `id`); and, only if the page runs demo code, a script in
  `showcase/pages/<id>.js` that calls `mountLibrary()` first. Without one
  the page loads `showcase/mount.js`. A new rail section also needs its
  symbol `#i-<icon>` in `ICONS` in `showcase/layout-plugin.js`. Nothing else
  lists pages. `scripts/check.mjs` fails when the file, the script or the
  icon is missing. A new example app is an entry in a group of `examples` and
  a page of its own that carries `data-page="<key>"` on `<html>` and calls
  `mountBar()` from its script.
- **`AGENTS.md` and `README.md` tables:** a new component family gets its own
  row next to related rows. When it belongs in a shared row (Status, Chat and
  feeds), add it at the end of that row, and expect a one-line conflict if
  another change edits the same row.

## Landing

- `ship` rebases onto `main` and pushes, so history stays linear. Land small
  changes often: a change that waits is the one that conflicts.
- One component per change. A second component that does not depend on the
  first is its own commit and its own `ship`.
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
pnpm score -- --md docs/scorecard.md            # score and rank every block and page (see the scorecard)
node scripts/check-showcase-build.mjs           # production build under /signal-design/, every page
node e2e/check.mjs                              # the check CLI on a sample page per rule (after build:css)
node scripts/changelog.mjs --check              # changelog fragments
```

## Releasing

The flow releases; nobody runs these steps by hand. For each change to the
package it takes the newest `main` after `ai-files` has finished and runs
`node scripts/changelog.mjs`, which moves every fragment under `## Unreleased`
in `CHANGELOG.md` and deletes them. When no fragment came with the changes, it
lists their commit subjects instead. It renames `## Unreleased` to
`## <version> (<date>)`, adds an empty `## Unreleased` above it, sets `version`
in `package.json` and runs `pnpm build:ai` so the AI files carry it. It ships
that as `Release v<version>`, then tags the shipped commit `v<version>`.

The version is `package.json`'s own when it has no tag yet, so a change that sets
a new minor or major version releases it. Otherwise the patch number goes up by
one. Changes that land while a release runs go out in the next release.

## Coding agents and Agent Traffic Control

This repository coordinates issue work with Agent Traffic Control (ATC). If you or your agent are about to work on an issue:

1. Run `npx github:ashhart/ATC check <issue>`. Start only when it says `free` or `yours`.
2. Claim it with `npx github:ashhart/ATC claim <issue>`, or open a draft pull request early with `Fixes #<issue>` in the description.
3. Run `npx github:ashhart/ATC overlap` before opening or updating a pull request, and coordinate if it reports a conflict.

Agents follow [the ATC contributor skill](skills/atc/SKILL.md). Coordination comments contain typed `/atc` commands only.
