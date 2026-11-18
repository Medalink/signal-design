# UX scorecard

This directory tracks how easy Signal's showcase is to use and to read, as numbers that can be
compared between two commits. `scripts/ux/run.mjs` measures it by driving the real pages with
Playwright's Chromium: every library page, every example app, and the docs site that displays
them. It is a port of Whisper's UX scorecard, with the mock backend, the settings crawl and the
calls left out and the docs-site measures added. It overlaps `scripts/score.mjs` on purpose for
contrast, small text and target sizes, and leaves axe, focus, hover and snippet checks to it.

```
ux/
  README.md                this file
  REPORT.md                generated: the latest filed run against the baseline, with offender lists
  baselines/showcase.json  the accepted reference record
  history/*.json           one record per filed run, named <utc>-<sha>.json
  hillclimb/<date>-<goal>/ decision logs of improvement campaigns (decision.tsv, notes.md)
```

`ux/` is outside the package `files`, so nothing here ships in a release.

## Running it

```
pnpm ux                                  # measure, print the scorecard against the baseline
pnpm ux -- --out before.json             # also write the record to a file
pnpm ux -- --compare before.json after.json   # diff two records, no browser
pnpm ux -- --record                      # file the run in history/ and rewrite REPORT.md
pnpm ux -- --baseline                    # file it and make it the new baseline
pnpm ux -- --profile desktop --only tasks --task docs.find-search   # one piece
pnpm ux -- --only tasks --task docs.,app.chat.                      # an area, or a list of ids
pnpm ux -- --only surfaces,docs --surface lib-messages,chat         # some pages
pnpm ux -- --url http://localhost:5178/  # use a server that is already running
```

By default the tool starts `vite showcase` on a free port, fetches every page once so no measured
visit waits on a cold compile, and stops the server when it ends. `--url` measures a server that
is already running and leaves it alone. `--record` and `--baseline` refuse a dirty tree, a
filtered run and `--url`. A change under `ux/` does not make the tree dirty.

`--compare` and the summary against the baseline print every metric either side has: one only the
baseline has is `gone`, one only this run has is `new`. They also list each page whose `text.chars`
or `targets.count` differs, and each page only one side has, so a page that shrinks or disappears
is visible even when the shares improve. A run narrowed with `--only`, `--task` or `--surface`
measures part of the work, so it leaves out the `gone`, `new` and page-only lines.

### A run that measured less is an error

The exit code is 1 when the run has any error, and the summary ends with the error count and the
amount of work done. These are errors, each counted and shown with its page or task, and none
drops its page's other numbers:

- a task did not reach its goal;
- a page could not be audited, or never settled: the page kept changing for 100 polls of 40 ms
  and never stopped, or a block in view did not render after the page was scrolled to it;
- a surface or task page threw an uncaught exception or logged a console error while it was
  open (a failure the network caused is retried instead, see below);
- a library page has neither a `.doc-preview` nor a `.demo-block`;
- on a whole run, not one narrowed with `--task` or `--surface`, a metric its profile was asked to
  measure has no value. Every aggregate over nothing has no value rather than 0: no demo found,
  no `.chat-feed` (renamed or gone) and no scored text all show up here. A metric needing a mouse
  (`read.chat.hoverCoveredChars`) or a touch (`targets.under44Share`) is not expected on the other
  profile.

Numbers compare between runs on one machine. Text is laid out in the system UI font (Segoe UI on
Windows, SF Pro on macOS), so a baseline filed on one operating system is not a reference for
another.

## Two runs agree

The showcase animates and randomizes: the rain, ornaments and dust, countdowns, live feeds,
machines, charts and typing dots. Before any page script runs, every context gets:

- `reducedMotion: "reduce"`, which stops the loops and shortens the transitions;
- the time zone `UTC` and the locale `en-US`, so dates and numbers format the same on every
  machine;
- a paused fake clock (`page.clock`), fixed at 2026-01-05 09:00 UTC. `Date`, timers, animation
  frames and `performance.now()` only move when the tool moves them, by a fixed amount: one
  second after load, 300 ms after each task step, 500 ms after the scroll pass;
- a `Math.random` seeded from the document's path, so a page draws the same numbers whatever
  else the run drew, and a page that gains a call does not reshuffle another page. A document
  a task navigates to gets its own seed;
- the profile's theme in `localStorage["sd-theme"]`, the key `setTheme()` writes and the page's
  head script reads;
- `document.fonts.ready`, then a wait, with the clock still, until the page's own asynchronous
  work (images, fonts, lazy builds) has stopped changing the node count, text length and height.

A load that a network change or a refused connection broke (`scripts/transient.mjs`) is thrown
away and repeated in a new context. Two full runs of one tree produce the same record, so any
difference between a before and an after is the change. If two runs of one commit ever differ,
fix that before trusting a comparison.

No page is excluded and no region is excluded for being unstable. What the audits leave out on
purpose:

- text inside `.sd-ascii`: ASCII art is an image drawn with characters, not text to read;
- anything hidden, covered by something else, `aria-hidden`, or fully transparent (an element
  or an ancestor at opacity under 1%, such as a message's action bar before the pointer reaches
  it);
- the closed Code view of each block: it is hidden until the Preview and Code tabs flip it.

## What it measures

Three measurements feed the scorecard. Each runs per profile.

| profile | viewport | theme | measures |
| --- | --- | --- | --- |
| `desktop` | 1280x800, mouse | ink | tasks, surfaces, docs |
| `desktop-paper` | 1280x800, mouse | paper | surfaces only, because reach and the docs layout do not depend on color |
| `phone` | 390x844, touch, mobile | ink | tasks, surfaces, docs |

The phone profile is a mobile context with touch: `(pointer: coarse)` and `(hover: none)` match,
the layout viewport is 390 wide, clicks are taps, and a message's actions come from a long press.

### Tasks

`scripts/ux/tasks/` lists user goals, one file per area (docs, example apps), each as the shortest
path the UI offers today: find a page by search, reach a page through navigation, copy the first
block's HTML, reply to a message. The runner performs every step for real in a fresh browser
context and checks that the goal state was reached. A task that does not reach its goal is an
error, not a number.

For each task it records:

- `clicks`: pointer presses. A tap counts as a click.
- `hovers`: times a mouse must point at something to show a control it hides, such as a
  message's action bar. A hover is priced as a pointer step with no press.
- `holds`: presses a finger must hold until the app answers, such as the long press that opens a
  message's menu. A hold is a press plus the app's own delay.
- `keys`: keystrokes. A chord such as Ctrl K is one.
- `scrollScreens`: how far the user must scroll to bring each target into view, in heights of the
  scrolling area, summed over every scroller between the target and the page. A target inside a
  sticky sidebar costs the sidebar's own scroll but not the window's, because the sidebar stays
  in view. A pager at the end of a page costs the whole page.
- `choicesVisibleMedian`: how many controls are on screen when each step is taken. More controls
  mean a longer search for the right one.
- `modeledSeconds`: the path priced by the cost model below.

A task's page gets the same scroll pass as a surface (see Surfaces), once for the page it starts
on and again for each document a step navigates to. A library page counts a block at a 480 px
placeholder until it has rendered, so a distance read before that pass is wrong: `docs.next-page`
read 6.8 screens to the pager before the pass and reads 4.9 after it.

A task that has no path on a layout lists the profiles it runs on and is reported as skipped. A
task with no path anywhere carries a `skip` reason that the report prints. `app.chat.thread` is
skipped for that reason: `chat.html` has no threads.

The Ctrl K palette searches page titles and summaries only, so `docs.find-search` types
`overlay` to reach Overlays, the page where tooltips are documented. A search for `tooltip` finds
nothing today.

### Surfaces

A surface is a page. Every entry in `showcase/pages.js` is one, so a new page joins the scorecard
when it joins the registry: the overview, every library page and every example app. Each is
opened in a fresh context and audited for what is on screen and not covered by something else.

A library page is thousands of pixels tall, so the audit is not one screen. The tool finds the
page's main scroller: the window when the document scrolls, else the largest visible element
that scrolls (`.sd-shell-content`, `.chat-feed`), never the docs sidebar or a demo's own scroll
area. It scrolls the page once to render everything, then visits the scroller from the top in
steps of 85% of its height, so a sticky bar never hides a band, and audits each step. What an
earlier step counted is never counted again, so a sticky topbar counts once and a paragraph
counts once.

The scroll pass is needed because library pages render in pieces: `.demo-block` and
`.doc-section` use `content-visibility: auto` with a 480 px placeholder, so a page's height
changes as it is scrolled. Every height the tool reports is the height after every block has
rendered. At each step the tool waits, in real time, until each block in view has rendered
(`checkVisibility({ contentVisibilityAuto: true })` on the block's first child, because a block
that skips its contents still has a box) and fails the page if one never does. It does not wait
on an animation frame: the fake clock fakes them.

Text, weighted by character count (whitespace collapsed):

- Contrast is the WCAG 2 contrast ratio between the text color and the color behind it. The
  color behind is every ancestor's background color composited from the page down. Text over an
  image or gradient is scored from a screenshot instead: every color that fills at least 15% of
  the text's box counts as a background, and the worst ratio is kept.
- A visible text field's value, or its `::placeholder` while it is empty, is scored the same way,
  against the field's own background, weighted by its characters (WCAG 1.4.3 applies to
  placeholder text). A select's shown option counts as its value. A password's value is never
  read. `text.fieldChars` counts the characters scored this way.
- Text fails when its ratio is under 4.5, or under 3 for large text (24 px and up, or 18.66 px
  and up in bold). Text in disabled controls is left out, as WCAG leaves it out.
- Small text is under 12 px. A long line is a wrapped block averaging over 80 characters a line.
  A tight line is a wrapped block with a line height under 1.3 times its font size. Lines are
  counted from the whole block, not only the part in view.

Controls:

- Small is under 24 px on its shorter side (WCAG 2.5.8). Under 44 px is reported for touch
  profiles. A link in running text is left out, as WCAG's inline exception leaves it out: an
  inline link inside a `p`, `li`, `td`, `th` or `dd` whose block also holds text outside any
  link. A link that is the whole item, a card or a button-like link counts. A checkbox or radio
  button inside its label is measured by the label, because pressing the label presses the box.
- The shared docs chrome is the topbar, the sidebar (`.doc-sidebar`, which holds `.doc-nav`), the
  on-this-page rail (`.doc-toc-rail`), the breadcrumb, the pager (`.demo-pager`) and the footer.
  It repeats on every library page, so each distinct control in it, by tag, role, name and link,
  counts once per profile. It is reported as its own line (`targets.chrome.count`, and a table in
  the report) and added once to the shares and to `targets.unnamed`. A control that is different
  on each page, such as an on-this-page link, counts once for each distinct link.
- Unnamed means no accessible name by the accname rules: `aria-labelledby`, `aria-label`, then the
  native source. A button, link or summary is named by its content: text, a descendant image's
  `alt`, a descendant's `aria-label` or an svg's `title`. A submit, reset or button input is named
  by its `value`, or by the browser's "Submit" or "Reset" when it has none. A field is named by
  its labels, then its `title`, then its `placeholder`. A field's own text, such as a select's
  options, is never its name. Each unnamed control is listed in the report with its markup.
  Icon-only means a name but no visible text, so the user has to recognise the icon.
- Example pages carry the showcase viewport bar (`.vp-bar`, with its page menu, width switch and
  settings). Its text is part of the page. Its controls are counted apart, as `targets.bar.*`
  (count, small and unnamed), so they never hide the app's own numbers.

Fold: the height of the page's main scroller in screens, after everything has rendered. The chat
feed is left out, because its height is its history, not its layout.

### Reading

`scripts/ux/read-audit.mjs` looks at the same pages for what they ask a person to read. It counts
text anywhere on the page, not only what is in view.

Lists. A list is three or more rows with the same left edge and width, such as the sidebar
links, a grid of link cards or the items of a bulleted list. Rows below the fold count as rows.

- `repeatedLines` out of `secondLines`: a row's lines after its name. A line is repeated when
  another row in the list shows the same line, or when it contains the row's own name. This is a
  proxy: two rows whose second line happens to match would count too.
- `cutOffNames`: rows whose name line ends in an ellipsis.

Explanatory text. A block is the nearest element that is not laid out inline, and it counts when
it holds 40 or more characters outside a feed, a message, a code block or a log, and it is site
copy. Site copy is everything except the sample data a demo shows: text inside `.demo-block`,
`.doc-preview`, `.doc-example` or `.sd-message`. A block's usage note (`.demo-usage`) is the
page's own explanation, so it stays in even though it sits inside the block. On the baseline
tree, sample data is 13% of the 40+ character blocks and usage notes are 35%.

- `proseChars`: the characters in those blocks, summed over the pages that are not feeds. It
  reports without a direction: a page that documents more explains more.
- `duplicateChars`: site copy blocks shown a second time on the same page. A demo that shows the
  same sample data in two variants, such as the schedule in mono and in spectrum, is sample data
  and does not count.

Eyebrows. The owner's rule is "no eyebrow labels above headings". An eyebrow is a short label,
under 40 characters and at most 4 words, whose next text on the page belongs to a heading (`h1`
to `h6`, `role="heading"`) or to an element whose class ends in `-title`, such as
`sd-link-card-title`. The heading must start within 40 px below the label and share some of its
width, so a label beside a title on one line is not one. The label and the title must sit in the
same card, section, figure, row or link: the last line of one, such as a chart's readout or the
last row of a list, above the next one's heading does not label it. The label has the look of an
eyebrow when either signal holds: it is uppercase (computed `text-transform: uppercase`, or
written in capitals), or it is set in a smaller font than the title below it and the group that
holds both has at most four lines of text, whatever its case. Removing `text-transform` alone
does not remove an eyebrow. A label above a list of controls, a table header and a section label
that heads a list are not eyebrows: only a label directly above a heading or a card title
counts. These are left out: the breadcrumb (`nav[aria-label*=readcrumb]`, `.sd-breadcrumb`,
`.doc-crumbs`), the wordmark (`.sd-wordmark`), the showcase's own viewport bar (`.vp-bar`,
`.vp-dialog`), a label that is itself a heading (`h1` to `h6`), a label inside a demo
(`.demo-block`, `.doc-preview`, `.doc-example`) and one inside a message (`.sd-message`), such as
the domain a link card or the kind an event card shows over its title, which is information the
part carries. A link card used as site chrome, such as the home page's example cards, still
counts. Each page lists its offenders with the signal that counted them. The real ones today
are the home page's "Example app" and block-count card labels, the Related cards' group labels
and the stream scene labels.

Chat. On `chat.html` the tool also reads the conversation: its share of the window, the messages
fully in view, and, with a mouse, how much message text each message's action bar covers when
pointed at.

### Docs site

Library pages share one chrome from `showcase/layout-plugin.js`: `.doc-topbar`, `.doc-nav`,
`.doc-toc`, `.doc-h1`, `.doc-lead`, `.doc-install-pill`, `.doc-preview`, `.demo-block`,
`.doc-section` and the pager (`.demo-pager`). For each library page, measured at the top after
the scroll pass:

- The first demo is the first thing in a `.demo-block` that a reader can look at or use, not the
  block's frame or its words. The block's header (`.demo-head`), its hidden code view
  (`.demo-code`) and its usage note (`.demo-usage`) are never the demo. In the rest, the first
  visible element that is one of these is: a control (a button, field, select, summary, a role
  that acts, or a link that is not in running text); a graphic (svg, canvas, img, video,
  iframe); a component root (an element with an `sd-` class that is not a text style from
  `typography.css`); a painted box (a block with its own background or border); or a native
  specimen the page documents (`h1` to `h6`, table, blockquote, hr). A paragraph or a list of
  text moved into a block is none of these, so it does not count as demo. A heading is a
  specimen, because `lib-elements` shows headings as its first demo, so a heading moved into a
  block would count as the demo at that point and the text under it would stop counting toward
  `introChars`. A block with none of them holds only text, and the next block is tried. A page
  with no `.demo-block` falls back to `.doc-preview`.
- `firstDemoAt`: the top of that element as a share of the window height. A value over 1 means
  the page opens with no demo in view. It is `null` for a text-only page. `firstBlockTop`
  records the first block's top for the report.
- `firstDemoVisiblePx`: how much of the demo is on the first screen. The demo is the span from
  the element's top to the bottom of the block's content, which leaves out the usage note under
  it. A page shows its first demo (`firstDemoOnScreen`) when 200 px of that span, or all of it
  when it is shorter, is above the fold.
- `textOnly`: no `.demo-block` holds a demo element. `lib-rules` is one: its block is a list of
  rules. It has no first demo to place, so it is left out of `firstDemoAt` and
  `firstDemoBelowFold` and counted on its own as `docs.textOnlyPages`, which rises if another
  page loses its demo.
- `introChars`: the explanatory characters between the `h1` and the first demo: the blocks of 40
  or more characters, in document order after the `h1` and before the first demo element, so
  prose inside the block above the demo counts. It leaves out buttons, the install pill and the
  copy controls. A text-only page is measured up to its first block.
- `pageScreens`: the page height in screens, after everything has rendered.

A library page with neither `.doc-preview` nor `.demo-block` is an error.

## The cost model

`scripts/ux/model.mjs` holds every constant. Modeled seconds come from the Keystroke-Level Model
(Card, Moran and Newell). They rank one path against another. They are not a stopwatch reading,
and nobody was timed.

| step | cost |
| --- | --- |
| think before a press or a typed string | 1.35 s |
| point at a target | 1.03 + 0.096 x log2(distance / size + 0.5) s (Card, English and Burr, mouse) |
| press and release | 0.2 s |
| one keystroke | 0.28 s |
| scroll one screen | 1.0 s (our constant) |
| hold a long press | 0.45 s (the library's long-press delay) |

The pointing formula was fitted to a mouse. The phone profile uses it unchanged, so phone seconds
compare with other phone seconds, not with a real thumb.

## The headline metrics

`scripts/ux/metrics.mjs` defines them, each with a direction and, where a rule exists, a target.
`ux/REPORT.md` shows every one against the baseline. Metrics marked model depend on the cost
model's constants. The rest are read off the page. A target is set only where a rule exists: the
WCAG contrast minimum, the WCAG 24 px target size, the 12 px text floor, an accessible name for
every control, the owner's rule against eyebrows, and a first demo on the first screen.

Some numbers report without a direction, marked "none" below: the change column says `same` or
`changed`, never `better` or `worse`. A page that documents more is longer and explains more, so
a lower sum of text or height is not an improvement. Read them to see what moved, and judge it
against the page. `docs.introChars.max` keeps a direction because it counts only the text above
the first demo.

| metric | what it counts | better | target |
| --- | --- | --- | --- |
| `reach.tasks.clicks.total`, `.max` | presses across all tasks, and in the costliest | lower | |
| `reach.tasks.scrollScreens.total` | screens scrolled across all tasks, after the scroll pass | lower | |
| `reach.tasks.seconds.total` | modeled seconds across all tasks (model) | lower | |
| `reach.docs.seconds.total`, `reach.app.seconds.total` | the same for `docs.` tasks and `app.` tasks (model) | lower | |
| `docs.firstDemoAt.max`, `.median` | where the first demo starts, in window heights from the top | lower | |
| `docs.firstDemoBelowFold` | library pages with under 200 px of their first demo on the first screen | lower | 0 |
| `docs.textOnlyPages` | library pages whose demo blocks hold only text, left out of the two above | lower | |
| `docs.introChars.max` | explanatory characters above the first demo, worst page | lower | |
| `docs.introChars.median` | the same, median page | none | |
| `docs.pageScreens.median`, `.max` | library page height in screens | none | |
| `legibility.contrastFailShare`, `.contrastMin` | text under WCAG AA, field text included, and the lowest ratio | lower, higher | 0, 4.5 |
| `legibility.textOverImageShare` | text scored from pixels | lower | |
| `legibility.contrastUnknown` | text the audit could not score | lower | |
| `legibility.smallTextShare` | text under 12 px | lower | 0 |
| `legibility.distinctFontSizes`, `.distinctFontFamilies` | sizes and families in use | lower | |
| `legibility.longLineShare`, `.tightLineShare` | line length and line height | lower | |
| `legibility.truncated` | labels cut off with an ellipsis | lower | |
| `targets.smallShare`, `.under44Share` | control size, shared docs chrome counted once (the second on touch only) | lower | 0 |
| `targets.unnamed`, `.iconOnlyShare` | naming, shared docs chrome included | lower | 0 |
| `targets.chrome.count` | distinct controls in the shared docs chrome | none | |
| `targets.bar.count`, `.small`, `.unnamed` | the viewport bar's controls, counted apart | lower | |
| `fold.screens.max` | the tallest page | none | |
| `read.chat.conversationShare`, `.messagesInView` | the chat example's conversation | higher | |
| `read.chat.hoverCoveredChars` | message text the action bar covers (mouse only) | lower | |
| `lists.cutOffNames`, `.repeatedLineShare` | list rows | lower | |
| `copy.proseChars` | site copy in blocks of 40+ characters outside feeds | none | |
| `copy.duplicateChars` | site copy shown twice on a page | lower | |
| `copy.eyebrows`, `.eyebrowPages` | eyebrow labels, and the pages that have one | lower | 0 |

Change a target in `metrics.mjs` when the owner picks another.

## Improving a number

A campaign follows the same rules as a perf campaign. One change, one measurement, keep or revert.

1. Pick one metric and a stop condition. `ux/REPORT.md` lists the worst offenders for each: the
   library pages whose first demo starts lowest, the eyebrows by page, the lowest-contrast text,
   the smallest controls, the costliest tasks.
2. Write the record before the change: `pnpm ux -- --out before.json`.
3. Make one change to the UI.
4. If the change adds a shorter path, edit the task's steps under `scripts/ux/tasks/` to use it.
   A task always encodes the shortest path the UI offers.
5. Measure again to `after.json` and run `--compare before.json after.json`. Keep the change when
   the metric moved the right way and no other metric got worse without a reason. Otherwise
   revert it in full.
6. Log the attempt, kept or reverted, in `ux/hillclimb/<date>-<goal>/decision.tsv`: id,
   hypothesis, change, before, after, delta, verdict, note.
7. After the campaign, run `--baseline` on the shipped commit so the next campaign starts from the
   new numbers.

Measuring one page is faster while iterating: `pnpm ux -- --profile desktop --only surfaces,docs
--surface lib-messages`.

## Extending it

Four tables drive the tool. Each addition is one entry.

- `profiles.mjs`: a viewport, a pointer type and a theme.
- `surfaces.mjs`: built from `showcase/pages.js`. A page needs no entry. Mark a page `feed` when
  its main scroller is a message list.
- `tasks/<area>.mjs`: a goal, its steps and the check that it was reached. A `done` runs in the
  page, so it cannot use anything defined outside it.
- `metrics.mjs`: a headline number computed from a profile's result.
