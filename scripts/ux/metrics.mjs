import { median, round3 } from './model.mjs'

// An aggregate over nothing has no value. It is never 0 or 0 screens, which would read as the best
// possible page: a metric with no value is an error in a run that was meant to measure it.
const okTasks = result => result.tasks.filter(task => task.ok === true)
const areaTasks = (result, prefix) => okTasks(result).filter(task => task.id.startsWith(prefix))
const sum = (items, pick) => (items.length ? round3(items.reduce((total, item) => total + pick(item), 0)) : undefined)
const max = (items, pick) => (items.length ? round3(Math.max(...items.map(pick))) : undefined)
const middle = values => (values.length ? round3(median(values)) : undefined)
const surfaces = result => Object.values(result.surfaces)
const audited = result => surfaces(result).filter(surface => surface.text)
const libraryDocs = result => surfaces(result).filter(surface => surface.docs)
const withDemo = result => libraryDocs(result).filter(surface => surface.docs.firstDemoAt !== null)

function share(result, part, whole) {
  const total = sum(audited(result), whole)
  return total ? round3(sum(audited(result), part) / total) : undefined
}

// Controls of the page and of the shared docs chrome, which the run counts once per profile.
const chrome = (result, key) => result.chrome?.[key] ?? 0
function controlShare(result, key) {
  const total = (sum(audited(result), s => s.targets.count) ?? 0) + chrome(result, 'count')
  return total ? round3(((sum(audited(result), s => s.targets[key]) ?? 0) + chrome(result, key)) / total) : undefined
}

const chat = result => result.surfaces.chat?.read?.conversation
const distinct = (result, pick) => new Set(audited(result).flatMap(pick)).size

/**
 * The headline numbers. `needs` names the measurement a metric reads, so a profile that skips that
 * measurement has no value for it. `kind: 'model'` marks a number that depends on the cost model's
 * constants; `measured` numbers are read off the page. A target is set only where a rule exists:
 * WCAG 2.2 AA contrast and target size, the 12 px floor on text, accessible names, the owner's
 * rule against eyebrow labels, and a first demo that starts inside the first screen.
 *
 * `better: null` marks a number that reports without a direction. How much a page explains, how
 * long a page is and how tall the tallest page is are not better or worse as they fall: a page
 * that documents more is longer. The change column stays empty for them. `touchOnly` and
 * `mouseOnly` name the pointer a metric needs.
 */
export const METRICS = [
  { id: 'reach.tasks.clicks.total', title: 'Clicks across all tasks', unit: 'clicks', better: 'lower', target: null, kind: 'measured', needs: 'tasks',
    compute: r => sum(okTasks(r), task => task.clicks) },
  { id: 'reach.tasks.clicks.max', title: 'Clicks for the costliest task', unit: 'clicks', better: 'lower', target: null, kind: 'measured', needs: 'tasks',
    compute: r => max(okTasks(r), task => task.clicks) },
  { id: 'reach.tasks.scrollScreens.total', title: 'Screens scrolled across all tasks', unit: 'screens', better: 'lower', target: null, kind: 'measured', needs: 'tasks',
    compute: r => sum(okTasks(r), task => task.scrollScreens) },
  { id: 'reach.tasks.seconds.total', title: 'Seconds across all tasks', unit: 's', better: 'lower', target: null, kind: 'model', needs: 'tasks',
    compute: r => sum(okTasks(r), task => task.modeledSeconds) },
  { id: 'reach.docs.seconds.total', title: 'Seconds across docs tasks', unit: 's', better: 'lower', target: null, kind: 'model', needs: 'tasks',
    compute: r => sum(areaTasks(r, 'docs.'), task => task.modeledSeconds) },
  { id: 'reach.app.seconds.total', title: 'Seconds across example app tasks', unit: 's', better: 'lower', target: null, kind: 'model', needs: 'tasks',
    compute: r => sum(areaTasks(r, 'app.'), task => task.modeledSeconds) },
  { id: 'docs.firstDemoAt.max', title: 'Where the first demo starts, worst page, in screens from the top', unit: 'screens', better: 'lower', target: null, kind: 'measured', needs: 'docs',
    compute: r => max(withDemo(r), s => s.docs.firstDemoAt) },
  { id: 'docs.firstDemoAt.median', title: 'Where the first demo starts, median page, in screens from the top', unit: 'screens', better: 'lower', target: null, kind: 'measured', needs: 'docs',
    compute: r => middle(withDemo(r).map(s => s.docs.firstDemoAt)) },
  { id: 'docs.firstDemoBelowFold', title: 'Library pages with under 200 px of their first demo on the first screen', unit: 'pages', better: 'lower', target: 0, kind: 'measured', needs: 'docs',
    compute: r => (withDemo(r).length ? withDemo(r).filter(s => !s.docs.firstDemoOnScreen).length : undefined) },
  { id: 'docs.textOnlyPages', title: 'Library pages whose demo blocks hold only text', unit: 'pages', better: 'lower', target: null, kind: 'measured', needs: 'docs',
    compute: r => (libraryDocs(r).length ? libraryDocs(r).filter(s => s.docs.textOnly).length : undefined) },
  { id: 'docs.introChars.median', title: 'Explanatory text before the first demo, median page', unit: 'chars', better: null, target: null, kind: 'measured', needs: 'docs',
    compute: r => middle(libraryDocs(r).map(s => s.docs.introChars)) },
  { id: 'docs.introChars.max', title: 'Explanatory text before the first demo, worst page', unit: 'chars', better: 'lower', target: null, kind: 'measured', needs: 'docs',
    compute: r => max(libraryDocs(r), s => s.docs.introChars) },
  { id: 'docs.pageScreens.median', title: 'Library page height in screens, median', unit: 'screens', better: null, target: null, kind: 'measured', needs: 'docs',
    compute: r => middle(libraryDocs(r).map(s => s.docs.pageScreens)) },
  { id: 'docs.pageScreens.max', title: 'Library page height in screens, tallest', unit: 'screens', better: null, target: null, kind: 'measured', needs: 'docs',
    compute: r => max(libraryDocs(r), s => s.docs.pageScreens) },
  { id: 'legibility.contrastFailShare', title: 'Text below WCAG AA contrast, field text included', unit: 'share', better: 'lower', target: 0, kind: 'measured', needs: 'surfaces',
    compute: r => share(r, s => s.text.failChars, s => s.text.knownChars) },
  { id: 'legibility.contrastMin', title: 'Lowest text contrast', unit: 'ratio', better: 'higher', target: 4.5, kind: 'measured', needs: 'surfaces',
    compute: r => {
      const ratios = audited(r).filter(s => s.text.knownChars).map(s => s.text.contrastMin)
      return ratios.length ? round3(Math.min(...ratios)) : undefined
    } },
  { id: 'legibility.textOverImageShare', title: 'Text over an image or gradient', unit: 'share', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => share(r, s => s.text.sampledChars, s => s.text.chars) },
  { id: 'legibility.contrastUnknown', title: 'Text whose contrast could not be read', unit: 'chars', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.text.unknownChars) },
  { id: 'legibility.smallTextShare', title: 'Text under 12 px', unit: 'share', better: 'lower', target: 0, kind: 'measured', needs: 'surfaces',
    compute: r => share(r, s => s.text.smallChars, s => s.text.chars) },
  { id: 'legibility.distinctFontSizes', title: 'Font sizes in use', unit: 'count', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => distinct(r, s => Object.keys(s.text.fontSizes)) },
  { id: 'legibility.distinctFontFamilies', title: 'Font families in use', unit: 'count', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => distinct(r, s => s.text.fontFamilies) },
  { id: 'legibility.longLineShare', title: 'Wrapped text over 80 characters a line', unit: 'share', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => share(r, s => s.text.longLineChars, s => s.text.wrappedChars) },
  { id: 'legibility.tightLineShare', title: 'Wrapped text under 1.3 line height', unit: 'share', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => share(r, s => s.text.tightLineChars, s => s.text.wrappedChars) },
  { id: 'legibility.truncated', title: 'Labels cut off with an ellipsis', unit: 'count', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.text.truncated) },
  { id: 'legibility.brokenWords', title: 'Words split across two lines in the middle', unit: 'count', better: 'lower', target: 0, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.text.brokenWords) },
  { id: 'targets.smallShare', title: 'Controls under 24 px, shared docs chrome counted once', unit: 'share', better: 'lower', target: 0, kind: 'measured', needs: 'surfaces',
    compute: r => controlShare(r, 'small') },
  { id: 'targets.under44Share', title: 'Controls under 44 px, shared docs chrome counted once', unit: 'share', better: 'lower', target: null, kind: 'measured', needs: 'surfaces', touchOnly: true,
    compute: r => controlShare(r, 'under44') },
  { id: 'targets.unnamed', title: 'Controls with no accessible name, shared docs chrome included', unit: 'count', better: 'lower', target: 0, kind: 'measured', needs: 'surfaces',
    compute: r => {
      const pages = sum(audited(r), s => s.targets.unnamed)
      return pages === undefined ? undefined : pages + chrome(r, 'unnamed')
    } },
  { id: 'targets.iconOnlyShare', title: 'Controls that show only an icon, shared docs chrome counted once', unit: 'share', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => controlShare(r, 'iconOnly') },
  { id: 'targets.chrome.count', title: 'Distinct controls in the shared docs chrome, counted once', unit: 'count', better: null, target: null, kind: 'measured', needs: 'surfaces',
    compute: r => r.chrome?.count },
  { id: 'targets.bar.count', title: 'Controls in the showcase viewport bar, counted apart from the page', unit: 'count', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.bar.count) },
  { id: 'targets.bar.small', title: 'Viewport bar controls under 24 px', unit: 'count', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.bar.small) },
  { id: 'targets.bar.unnamed', title: 'Viewport bar controls with no accessible name', unit: 'count', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.bar.unnamed) },
  { id: 'fold.screens.max', title: 'Tallest page, in screens', unit: 'screens', better: null, target: null, kind: 'measured', needs: 'surfaces',
    compute: r => max(audited(r).filter(s => s.fold), s => s.fold.screens) },
  { id: 'read.chat.conversationShare', title: 'Share of the window the chat example gives its conversation', unit: 'share', better: 'higher', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => chat(r)?.share },
  { id: 'read.chat.messagesInView', title: 'Messages fully in view in the chat example', unit: 'count', better: 'higher', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => chat(r)?.rows },
  { id: 'read.chat.hoverCoveredChars', title: 'Message text the action bar covers, per message pointed at', unit: 'chars', better: 'lower', target: null, kind: 'measured', needs: 'surfaces', mouseOnly: true,
    compute: r => (chat(r)?.hover ? round3(chat(r).hover.coveredChars / chat(r).hover.messages) : undefined) },
  { id: 'lists.cutOffNames', title: 'List rows whose name is cut off', unit: 'count', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.read.lists.cutOffNames) },
  { id: 'lists.repeatedLineShare', title: 'Second lines in lists that repeat another row or their own row name', unit: 'share', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => {
      const lines = sum(audited(r), s => s.read.lists.secondLines)
      return lines ? round3(sum(audited(r), s => s.read.lists.repeatedLines) / lines) : undefined
    } },
  { id: 'copy.proseChars', title: 'Site copy in blocks of 40+ characters, outside feeds and demo sample data', unit: 'chars', better: null, target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r).filter(s => !s.feed), s => s.read.prose.chars) },
  { id: 'copy.duplicateChars', title: 'Site copy shown twice on one page', unit: 'chars', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.read.prose.duplicateChars) },
  { id: 'copy.eyebrows', title: 'Short labels directly above a heading or card title', unit: 'count', better: 'lower', target: 0, kind: 'measured', needs: 'surfaces',
    compute: r => sum(audited(r), s => s.read.copy.eyebrows) },
  { id: 'copy.eyebrowPages', title: 'Pages with an eyebrow label', unit: 'pages', better: 'lower', target: null, kind: 'measured', needs: 'surfaces',
    compute: r => (audited(r).length ? audited(r).filter(s => s.read.copy.eyebrows > 0).length : undefined) },
]

const usable = value => value !== undefined && Number.isFinite(value)

/**
 * The metrics a profile can compute from `result`, and the ids of the ones it was asked to measure
 * (`measured` names the groups it ran) that came out with no value. A metric can lose its value
 * because the page it reads was renamed or dropped, so the caller counts `missing` as errors.
 */
export function computeMetrics(profile, result, measured) {
  const metrics = {}
  const missing = []
  for (const metric of METRICS) {
    if (!measured.includes(metric.needs)) continue
    if (metric.touchOnly && !profile.touch) continue
    if (metric.mouseOnly && profile.touch) continue
    const value = metric.compute(result)
    if (usable(value)) metrics[metric.id] = value
    else missing.push(metric.id)
  }
  return { metrics, missing }
}
