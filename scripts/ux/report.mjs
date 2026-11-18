import { METRICS } from './metrics.mjs'

const fmt = value => (value === null || value === undefined ? '-' : String(value))
const code = value => '`' + String(value).replaceAll('`', "'").replaceAll('|', '/') + '`'

// A number with no direction (`better: null`) is only ever the same or changed.
function marker(metric, value, reference) {
  if (reference === undefined || reference === null) return ''
  if (value === undefined) return 'gone'
  if (value === reference) return 'same'
  if (metric.better === null) return 'changed'
  return (value < reference) === (metric.better === 'lower') ? 'better' : 'worse'
}

function metTarget(metric, value) {
  if (metric.target === null || value === undefined) return ''
  return (metric.better === 'lower' ? value <= metric.target : value >= metric.target) ? 'met' : 'missed'
}

/**
 * One row per metric either side has. A metric only the reference has is `gone`, one only this
 * record has is `new`, so a run that measured less than the baseline cannot hide it. A sliced run
 * measures part of the work, so it reports a metric the other side lacks only when it has it too.
 */
function metricRows(record, reference) {
  const rows = []
  for (const [profileId, profile] of Object.entries(record.profiles)) {
    const there = reference?.profiles?.[profileId]
    for (const metric of METRICS) {
      const value = profile.metrics[metric.id]
      const was = there?.metrics?.[metric.id]
      if (value === undefined && (was === undefined || record.slice || reference.slice)) continue
      const change = value !== undefined && was === undefined && there && !reference.slice && !record.slice ? 'new' : marker(metric, value, was)
      rows.push({ profileId, metric, value, was, change, target: metTarget(metric, value) })
    }
  }
  return rows
}

const workLine = counts => `${counts.surfaces} surfaces, ${counts.docsPages} docs pages, tasks ${counts.tasks} ok / ${counts.tasksFailed} failed / ${counts.tasksSkipped} skipped, ${counts.textChars} text chars (${counts.fieldChars ?? 0} in fields), ${counts.targets} page targets and ${counts.chromeTargets ?? 0} shared chrome targets`

/**
 * The pages whose text length or control count differs from the reference, and the pages only one
 * side has. A page that shrinks reads as an improvement in most shares, so it is listed.
 */
function surfaceChanges(record, reference) {
  const lines = []
  for (const [profileId, profile] of Object.entries(record.profiles)) {
    const there = reference?.profiles?.[profileId]
    if (!there) continue
    const ids = new Set([...Object.keys(profile.surfaces), ...Object.keys(there.surfaces)])
    for (const id of ids) {
      const now = profile.surfaces[id]
      const was = there.surfaces[id]
      if (now && !was) {
        if (!reference.slice && !record.slice) lines.push(`${profileId} ${id}: new page`)
        continue
      }
      if (!now && was) {
        if (!reference.slice && !record.slice) lines.push(`${profileId} ${id}: page gone`)
        continue
      }
      if (!now.text || !was.text) continue
      const parts = []
      if (now.text.chars !== was.text.chars) parts.push(`text.chars ${was.text.chars} -> ${now.text.chars}`)
      if (now.targets.count !== was.targets.count) parts.push(`targets.count ${was.targets.count} -> ${now.targets.count}`)
      if (parts.length) lines.push(`${profileId} ${id}: ${parts.join(', ')}`)
    }
  }
  return lines
}

export function printSummary(record, reference, referenceName) {
  let current = null
  for (const row of metricRows(record, reference)) {
    if (row.profileId !== current) {
      current = row.profileId
      console.log(`\n${current}`)
      console.log(`  ${'metric'.padEnd(34)} ${'value'.padStart(9)} ${referenceName.padStart(9)} ${'change'.padEnd(7)} ${'target'.padStart(8)}`)
    }
    const target = row.metric.target === null ? '' : `${row.metric.target} ${row.target}`
    console.log(`  ${row.metric.id.padEnd(34)} ${fmt(row.value).padStart(9)} ${fmt(row.was).padStart(9)} ${row.change.padEnd(7)} ${target.padStart(8)}`)
  }
  const changed = reference ? surfaceChanges(record, reference) : []
  if (changed.length) {
    console.log(`\npages that differ from the ${referenceName}`)
    for (const line of changed) console.log(`  ${line}`)
  }
  console.log('')
  let errors = 0
  for (const [profileId, profile] of Object.entries(record.profiles)) {
    console.log(`${profileId}: ${workLine(profile.counts)}`)
    for (const error of profile.errors) console.log(`  error: ${error}`)
    errors += profile.errors.length
  }
  console.log(`errors: ${errors}`)
}

function table(lines, header, rows) {
  lines.push('', `| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`)
  for (const row of rows) lines.push(`| ${row.join(' | ')} |`)
}

const pagesOf = list => {
  const shown = list.slice(0, 3).join(', ')
  return list.length > 3 ? `${shown} and ${list.length - 3} more` : shown
}

/** The same offender found on several pages, such as a sidebar link, is one row that names the pages. */
function grouped(entries, keyOf) {
  const groups = new Map()
  for (const entry of entries) {
    const key = keyOf(entry)
    if (!groups.has(key)) groups.set(key, { ...entry, pages: [] })
    groups.get(key).pages.push(entry.id)
  }
  return [...groups.values()]
}

export function renderReport(record, baseline) {
  const lines = ['# UX scorecard', '']
  lines.push(`Generated by \`pnpm ux -- --record\` from commit ${code(record.commit)} on ${record.startedUtc}, ${record.chromium}. Do not edit by hand. [README.md](README.md) defines every number.`)
  lines.push('', baseline ? `Compared with the baseline from commit ${code(baseline.commit)}.` : 'No baseline yet.')

  const rows = metricRows(record, baseline)
  for (const [profileId, profile] of Object.entries(record.profiles)) {
    lines.push('', `## ${profileId}`)
    table(lines, ['metric', 'what it counts', 'value', 'baseline', 'change', 'target', ''], rows.filter(row => row.profileId === profileId).map(row => [
      code(row.metric.id), row.metric.title + (row.metric.kind === 'model' ? ' (model)' : ''), fmt(row.value), fmt(row.was), row.change, fmt(row.metric.target), row.target,
    ]))
    lines.push('', `Work done: ${workLine(profile.counts)}. Errors: ${profile.errors.length}.`)
    for (const error of profile.errors) lines.push(`- error: ${code(error)}`)

    if (profile.tasks.length) {
      lines.push('', `### ${profileId}: tasks, costliest first`)
      const ran = profile.tasks.filter(task => task.ok === true).sort((a, b) => b.modeledSeconds - a.modeledSeconds)
      table(lines, ['task', 'starts', 'clicks', 'hovers', 'holds', 'keys', 'screens scrolled', 'modeled s', 'controls on screen'], ran.map(task => [
        `${code(task.id)} ${task.title}`, task.start, task.clicks, task.hovers ?? 0, task.holds ?? 0, task.keys, task.scrollScreens, task.modeledSeconds, task.choicesVisibleMedian,
      ]))
      for (const task of profile.tasks.filter(task => task.ok === null)) lines.push('', `Skipped: ${code(task.id)} ${task.title}. ${task.skipReason}.`)
      for (const task of profile.tasks.filter(task => task.ok === false)) lines.push('', `Failed: ${code(task.id)}: ${code(task.error)}.`)
    }

    const audited = Object.entries(profile.surfaces).filter(([, s]) => s.text)
    const docs = Object.entries(profile.surfaces).filter(([, s]) => s.docs)
    if (docs.length) {
      lines.push('', `### ${profileId}: library pages, first demo furthest down first`)
      const worst = [...docs].sort(([, a], [, b]) => (b.docs.firstDemoAt ?? Infinity) - (a.docs.firstDemoAt ?? Infinity))
      table(lines, ['page', 'first demo at', 'px', 'demo px on first screen', 'first demo is', 'intro chars', 'page screens'], worst.slice(0, 20).map(([id, s]) => [
        id, s.docs.textOnly ? 'text only' : fmt(s.docs.firstDemoAt), fmt(s.docs.firstDemoTop), s.docs.firstDemoVisiblePx, s.docs.firstDemoIs ? code(s.docs.firstDemoIs) : '-', s.docs.introChars, s.docs.pageScreens,
      ]))
      lines.push('', `${worst.length} library pages in all; the table lists the 20 whose first demo starts furthest down, text-only pages first. "first demo at" is a share of the window height from the top of the page to the first thing in a demo block that is a control, graphic, component or specimen, never the block's header, hidden code or usage note. A page counts as showing its first demo when 200 px of it, or all of it when it is shorter, is on the first screen.`)
    }

    if (audited.length) {
      lines.push('', `### ${profileId}: surfaces`)
      table(lines, ['surface', 'text chars', 'below AA', 'lowest contrast', 'over an image', 'under 12 px', 'targets', 'under 24 px', 'under 44 px', 'icon only', 'bar controls', 'screens'], audited.map(([id, s]) => [
        id, s.text.chars, s.text.failChars, s.text.contrastMin, s.text.sampledChars, s.text.smallChars, s.targets.count, s.targets.small, s.targets.under44, s.targets.iconOnly, s.bar.count, s.fold ? s.fold.screens : 'feed',
      ]))

      const eyebrowPages = audited.filter(([, s]) => s.read.copy.eyebrows > 0).sort(([, a], [, b]) => b.read.copy.eyebrows - a.read.copy.eyebrows)
      if (eyebrowPages.length) {
        lines.push('', `### ${profileId}: eyebrow labels by page`)
        table(lines, ['page', 'eyebrows', 'first examples (label over heading, and why it counts)'], eyebrowPages.slice(0, 30).map(([id, s]) => [
          id, s.read.copy.eyebrows, s.read.copy.offenders.slice(0, 3).map(o => `${code(o.text)} over ${code(o.heading)} (${o.why})`).join(', '),
        ]))
        if (eyebrowPages.length > 30) lines.push('', `${eyebrowPages.length - 30} more pages have eyebrows; the record lists them.`)
      }

      const lowContrast = grouped(audited.flatMap(([id, s]) => s.text.offenders.map(o => ({ id, ...o }))).sort((a, b) => a.ratio - b.ratio), o => `${o.selector}|${o.text}|${o.ratio}`).slice(0, 20)
      if (lowContrast.length) {
        lines.push('', 'Lowest-contrast text:')
        table(lines, ['pages', 'ratio', 'px', 'text', 'where'], lowContrast.map(o => [pagesOf(o.pages), o.ratio, o.fontSize, code(o.text), code(o.selector)]))
      }

      const smallest = grouped(audited.flatMap(([id, s]) => s.targets.offenders.map(o => ({ id, ...o }))).sort((a, b) => Math.min(a.width, a.height) - Math.min(b.width, b.height)), o => `${o.selector}|${o.name}|${o.width}x${o.height}`).slice(0, 20)
      lines.push('', 'Smallest controls on the pages themselves:')
      table(lines, ['pages', 'size', 'name', 'where'], smallest.map(o => [pagesOf(o.pages), `${o.width}x${o.height}`, code(o.name), code(o.selector)]))

      if (profile.chrome) {
        lines.push('', `Shared docs chrome, counted once for the profile: ${profile.chrome.count} distinct controls, ${profile.chrome.small} under 24 px, ${profile.chrome.under44} under 44 px, ${profile.chrome.unnamed} unnamed, ${profile.chrome.iconOnly} icon only. Smallest:`)
        table(lines, ['size', 'name', 'where'], profile.chrome.offenders.map(o => [`${o.width}x${o.height}`, code(o.name), code(o.selector)]))
      }

      const unnamed = [
        ...audited.flatMap(([id, s]) => s.targets.unnamedList.map(o => ({ where: id, ...o }))),
        ...audited.flatMap(([id, s]) => s.bar.unnamedList.map(o => ({ where: `${id} (viewport bar)`, ...o }))),
        ...(profile.chrome?.unnamedList ?? []).map(o => ({ where: 'shared chrome', ...o })),
      ]
      lines.push('', unnamed.length ? 'Controls with no accessible name:' : 'Controls with no accessible name: none.')
      if (unnamed.length) table(lines, ['page', 'where', 'markup'], unnamed.slice(0, 30).map(o => [o.where, code(o.selector), code(o.html)]))

      const duplicates = audited.flatMap(([id, s]) => s.read.prose.offenders.filter(o => o.again).map(o => ({ id, ...o })))
      if (duplicates.length) {
        lines.push('', 'Site copy shown twice on a page:')
        table(lines, ['page', 'chars', 'text', 'where'], duplicates.slice(0, 20).map(o => [o.id, o.chars, code(o.text), code(o.selector)]))
      }

      const prose = audited.filter(([, s]) => !s.feed).sort(([, a], [, b]) => b.read.prose.chars - a.read.prose.chars).slice(0, 10)
      lines.push('', 'Most site copy, by page:')
      table(lines, ['page', 'explanatory chars', 'blocks'], prose.map(([id, s]) => [id, s.read.prose.chars, s.read.prose.blocks]))

      const chat = profile.surfaces.chat?.read?.conversation
      if (chat) {
        const hover = chat.hover ? `${chat.hover.coveredChars} characters covered over ${chat.hover.messages} messages` : 'not measured on touch'
        lines.push('', `Chat example: the conversation gets ${chat.share} of the window, ${chat.rows} messages are fully in view, and the action bar covers ${hover}.`)
      }
    }

    const changed = baseline ? surfaceChanges({ ...record, profiles: { [profileId]: profile } }, baseline) : []
    if (changed.length) {
      lines.push('', `### ${profileId}: pages that differ from the baseline`)
      for (const line of changed) lines.push(`- ${line.slice(profileId.length + 1)}`)
    }
  }
  lines.push('')
  return lines.join('\n')
}
