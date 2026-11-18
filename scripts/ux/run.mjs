import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeContext, launchBrowser, openPage } from './boot.mjs'
import { computeMetrics } from './metrics.mjs'
import { PROFILES } from './profiles.mjs'
import { printSummary, renderReport } from './report.mjs'
import { installCleanup, startShowcase } from './server.mjs'
import { SURFACES, measureSurface } from './surfaces.mjs'
import { runTasks } from './task-runner.mjs'
import { TASKS } from './tasks.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const UX_DIR = resolve(REPO_ROOT, 'ux')
const BASELINE = resolve(UX_DIR, 'baselines', 'showcase.json')

const USAGE = `usage:
  node scripts/ux/run.mjs [--url <http://host:port/>] [--profile a,b] [--only tasks,surfaces,docs]
                          [--task <id,id|area.>] [--surface <id,id>] [--out <file>] [--record] [--baseline]
  node scripts/ux/run.mjs --compare <before.json> <after.json>`

function parseArgs(argv) {
  const args = { url: null, profile: null, only: null, task: null, surface: null, out: null, record: false, baseline: false, compare: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--') continue
    else if (arg === '--url') args.url = argv[++i]
    else if (arg === '--profile') args.profile = argv[++i].split(',')
    else if (arg === '--only') args.only = argv[++i].split(',')
    else if (arg === '--task') args.task = argv[++i]
    else if (arg === '--surface') args.surface = argv[++i].split(',')
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--record') args.record = true
    else if (arg === '--baseline') args.baseline = true
    else if (arg === '--compare') args.compare = [argv[++i], argv[++i]]
    else throw new Error(`unknown argument: ${arg}\n${USAGE}`)
  }
  return args
}

const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const git = command => execSync(`git ${command}`, { cwd: REPO_ROOT, encoding: 'utf8' }).trim()
const message = error => String(error.message || error).split('\n')[0].slice(0, 200)

function treeIsDirty() {
  return git('status --porcelain').split('\n').some(line => line && !line.slice(3).startsWith('ux/'))
}

// The shared docs chrome (topbar, sidebar, on-this-page rail, pager, breadcrumb, footer) repeats on
// every library page. Each distinct control in it is counted once per profile, not once per page.
function chromeOf(items) {
  const smallest = (a, b) => Math.min(a.width, a.height) - Math.min(b.width, b.height)
  return {
    count: items.length,
    small: items.filter(item => item.minDim < 24).length,
    under44: items.filter(item => item.minDim < 44).length,
    unnamed: items.filter(item => item.unnamed).length,
    iconOnly: items.filter(item => item.iconOnly).length,
    offenders: items.map(({ name, width, height, selector }) => ({ name, width, height, selector })).sort(smallest).slice(0, 10),
    unnamedList: items.filter(item => item.unnamed).slice(0, 10).map(({ selector, html }) => ({ selector, html })),
  }
}

async function auditSurfaces(browser, url, profile, result, wanted, surfaceIds) {
  const kinds = wanted.includes('surfaces') ? null : ['library']
  const surfaces = SURFACES.filter(surface => (!surfaceIds || surfaceIds.includes(surface.id)) && (!kinds || kinds.includes(surface.kind)))
  const chrome = new Map()
  for (const surface of surfaces) {
    console.log(`[ux] ${profile.id} surface ${surface.id}`)
    let context = null
    try {
      const opened = await openPage(browser, url, surface.file, profile)
      context = opened.context
      const measured = await measureSurface(opened.page, profile, surface, wanted)
      for (const item of measured.chromeItems ?? []) if (!chrome.has(item.key)) chrome.set(item.key, item)
      delete measured.chromeItems
      result.surfaces[surface.id] = measured
      for (const problem of opened.problems) result.errors.push(`surface ${surface.id}: ${problem}`)
      if (measured.docs && !measured.docs.hasDemoFrame) result.errors.push(`surface ${surface.id}: a library page with no .doc-preview or .demo-block`)
    } catch (error) {
      result.errors.push(`surface ${surface.id}: ${message(error)}`)
    } finally {
      await closeContext(context)
    }
  }
  if (wanted.includes('surfaces')) result.chrome = chromeOf([...chrome.values()])
}

// `slice` is true when the run was narrowed to some tasks or pages. A slice measures part of each
// group, so a metric it cannot compute is expected. A whole run that cannot compute a metric it was
// asked for has measured less than it should: that is an error, never a missing row.
async function measureProfile(browser, url, profile, tasks, only, surfaceIds, slice) {
  const result = { metrics: {}, counts: {}, errors: [], tasks: [], surfaces: {} }
  const wanted = profile.measures.filter(name => !only || only.includes(name))

  if (wanted.includes('tasks')) {
    result.tasks = await runTasks(browser, url, profile, tasks)
    for (const task of result.tasks) {
      if (task.ok === false) result.errors.push(`task ${task.id}: ${task.error}`)
      for (const problem of task.problems ?? []) result.errors.push(`task ${task.id}: ${problem}`)
    }
  }
  if (wanted.includes('surfaces') || wanted.includes('docs')) {
    try {
      await auditSurfaces(browser, url, profile, result, wanted, surfaceIds)
    } catch (error) {
      result.errors.push(`surfaces: ${message(error)}`)
    }
  }

  const { metrics, missing } = computeMetrics(profile, result, wanted)
  result.metrics = metrics
  if (!slice) for (const id of missing) result.errors.push(`metric ${id}: no value, though its measurement ran`)
  const audited = Object.values(result.surfaces).filter(surface => surface.text)
  result.counts = {
    surfaces: audited.length,
    docsPages: Object.values(result.surfaces).filter(surface => surface.docs).length,
    tasks: result.tasks.filter(task => task.ok === true).length,
    tasksFailed: result.tasks.filter(task => task.ok === false).length,
    tasksSkipped: result.tasks.filter(task => task.ok === null).length,
    textChars: audited.reduce((total, surface) => total + surface.text.chars, 0),
    fieldChars: audited.reduce((total, surface) => total + surface.text.fieldChars, 0),
    targets: audited.reduce((total, surface) => total + surface.targets.count, 0),
    chromeTargets: result.chrome?.count ?? 0,
  }
  return result
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.compare) {
    printSummary(readJson(args.compare[1]), readJson(args.compare[0]), 'before')
    return 0
  }

  const filing = args.record || args.baseline
  if (filing && (args.profile || args.only || args.task || args.surface || args.url)) {
    console.error('refusing to file a filtered run: --record and --baseline take no --profile, --only, --task, --surface or --url')
    return 1
  }
  if (filing && treeIsDirty()) {
    console.error('refusing to file a run from a dirty tree: commit first, then record')
    return 1
  }

  const profiles = PROFILES.filter(profile => !args.profile || args.profile.includes(profile.id))
  const wanted = args.task?.split(',')
  const tasks = TASKS.filter(task => !wanted || wanted.some(id => task.id === id || (id.endsWith('.') && task.id.startsWith(id))))
  if (!profiles.length || !tasks.length) {
    console.error('nothing to run: no profile or task matches')
    return 1
  }

  let url = args.url
  let server = null
  if (url) url = url.replace(/\/?$/, '/')
  else {
    server = await startShowcase(SURFACES.map(surface => surface.file))
    installCleanup(server.stop)
    url = server.url
    console.log(`[ux] showcase on ${url}`)
  }

  const started = Date.now()
  const browser = await launchBrowser()
  const slice = Boolean(args.only || args.task || args.surface)
  const record = { schema: 1, startedUtc: new Date().toISOString(), commit: git('rev-parse --short HEAD'), dirty: treeIsDirty(), slice, chromium: `chromium ${browser.version()}`, profiles: {} }
  try {
    for (const profile of profiles) record.profiles[profile.id] = await measureProfile(browser, url, profile, tasks, args.only, args.surface, Boolean(args.surface || args.task))
  } finally {
    await browser.close()
    server?.stop()
  }

  const baseline = existsSync(BASELINE) ? readJson(BASELINE) : null
  printSummary(record, baseline, 'baseline')
  console.log(`[ux] wall time ${((Date.now() - started) / 60000).toFixed(1)} min`)

  const json = JSON.stringify(record, null, 1) + '\n'
  if (args.out) {
    mkdirSync(dirname(resolve(args.out)), { recursive: true })
    writeFileSync(resolve(args.out), json)
    console.log(`[ux] record: ${resolve(args.out)}`)
  }
  if (filing) {
    const stamp = record.startedUtc.replace(/[-:]/g, '').replace(/\..+/, 'Z')
    const history = resolve(UX_DIR, 'history', `${stamp}-${record.commit}.json`)
    mkdirSync(dirname(history), { recursive: true })
    writeFileSync(history, json)
    console.log(`[ux] history: ${history}`)
    if (args.baseline) {
      mkdirSync(dirname(BASELINE), { recursive: true })
      writeFileSync(BASELINE, json)
      console.log(`[ux] baseline: ${BASELINE}`)
    }
    writeFileSync(resolve(UX_DIR, 'REPORT.md'), renderReport(record, args.baseline ? record : baseline))
    console.log(`[ux] report: ${resolve(UX_DIR, 'REPORT.md')}`)
  }
  return Object.values(record.profiles).some(profile => profile.errors.length) ? 1 : 0
}

main().then(code => process.exit(code), error => {
  console.error(`[ux] failed: ${message(error)}`)
  process.exit(2)
})
