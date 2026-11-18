import { settle as networkSettle } from '../settle.mjs'
import { advance, closeContext, openPage, settlePage, untilStable } from './boot.mjs'
import { COST, median, round3 } from './model.mjs'
import { hover, press, pressKey, startPath, typeText } from './path.mjs'
import { isPhone } from './profiles.mjs'
import { warmPage } from './scroll.mjs'
import { measureElement } from './step-measure.mjs'

const selectorFor = (target, phone) => (typeof target === 'string' ? target : phone ? target.phone : target.desktop)

const pressOn = async (path, locator, options) => press(path, await locator.evaluate(measureElement), options)

const markDocument = page => page.evaluate(() => { window.__uxDoc = true })

/** A task document is measured after the warm pass the surfaces get: a distance on a library page is the distance once every block has rendered, not over 480 px placeholders. */
async function openDocument(page) {
  await markDocument(page)
  await warmPage(page)
}

/**
 * After a step: a fixed amount of fake time, which also runs a timer that starts a navigation, then
 * the new document's load or the real work the old one still has. A new document is warmed like the
 * first one. The next step is measured once the page has stopped changing.
 */
async function afterStep(page) {
  await advance(page, 300).catch(error => {
    if (!/context was destroyed|navigat/i.test(error.message)) throw error
  })
  await page.waitForLoadState('load')
  const sameDocument = await page.evaluate(() => window.__uxDoc === true).catch(() => false)
  if (sameDocument) {
    await untilStable(page)
    return
  }
  await networkSettle(page).catch(() => {})
  await settlePage(page)
  await openDocument(page)
}

// One entry per step kind. Each performs the step for real and returns the path it cost. A touch
// profile taps where a mouse clicks, so the touch code paths run.
const STEP_KINDS = {
  async click({ page, profile, path, locator }) {
    path = await pressOn(path, locator)
    if (profile.touch) await locator.tap({ timeout: 10000 })
    else {
      await locator.scrollIntoViewIfNeeded({ timeout: 10000 })
      const box = await locator.boundingBox()
      if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await locator.click({ timeout: 10000 })
    }
    return path
  },
  async hover({ path, locator }) {
    path = hover(path, await locator.evaluate(measureElement))
    await locator.hover({ timeout: 10000 })
    return path
  },
  async longPress({ page, path, locator }) {
    path = await pressOn(path, locator, { hold: true })
    await locator.scrollIntoViewIfNeeded()
    const box = await locator.boundingBox()
    if (!box) throw new Error('long-press target has no box')
    const touch = await page.context().newCDPSession(page)
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] })
    await advance(page, COST.HOLD * 1000 + 200)
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await touch.detach()
    return path
  },
  async type({ page, path, step }) {
    await page.keyboard.type(step.type)
    return typeText(path, step.type.length)
  },
  async key({ page, path, step }) {
    await page.keyboard.press(step.key)
    return pressKey(path)
  },
}
const TARGETED = new Set(['click', 'hover', 'longPress'])

async function walk(page, profile, task) {
  const phone = isPhone(profile)
  let path = startPath(profile.viewport)
  let steps = 0
  await openDocument(page)
  for (const step of task.steps) {
    if (step.only && step.only !== (phone ? 'phone' : 'desktop')) continue
    const kind = Object.keys(STEP_KINDS).find(name => name in step)
    if (!kind) throw new Error(`unknown step: ${Object.keys(step).join(', ')}`)
    let locator = null
    if (TARGETED.has(kind)) {
      const selector = selectorFor(step[kind], phone)
      locator = page.locator(selector).first()
      await locator.waitFor({ state: 'attached', timeout: 10000 }).catch(() => {
        throw new Error(`target not found: ${selector}`)
      })
    }
    path = await STEP_KINDS[kind]({ page, profile, path, locator, step })
    steps += 1
    await afterStep(page)
  }
  let reached = false
  for (let poll = 0; poll < 10 && !reached; poll++) {
    reached = (await page.evaluate(task.done).catch(() => false)) === true
    if (!reached) await advance(page, 100)
  }
  if (!reached) throw new Error('goal state not reached')
  return { path, steps }
}

async function runTask(browser, url, profile, task) {
  const result = { id: task.id, title: task.title, start: task.start }
  let context = null
  try {
    const opened = await openPage(browser, url, task.start, profile)
    context = opened.context
    const { path, steps } = await walk(opened.page, profile, task)
    return {
      ...result,
      ok: true,
      problems: opened.problems.slice(0, 5),
      clicks: path.clicks,
      hovers: path.hovers,
      holds: path.holds,
      keys: path.keys,
      steps,
      scrollScreens: round3(path.scrollScreens),
      fittsBits: round3(path.fittsBits),
      modeledSeconds: round3(path.seconds),
      choicesVisibleMedian: median(path.choices),
    }
  } catch (error) {
    return { ...result, ok: false, error: String(error.message || error).split('\n')[0].slice(0, 200) }
  } finally {
    await closeContext(context)
  }
}

// A task that has no path on a layout is reported as skipped, with why, never as a pass.
export async function runTasks(browser, url, profile, tasks) {
  const results = []
  for (const task of tasks) {
    if (task.skip || (task.profiles && !task.profiles.includes(profile.id))) {
      results.push({ id: task.id, title: task.title, start: task.start, ok: null, skipReason: task.skip ?? `no path on ${profile.id}` })
      continue
    }
    console.log(`[ux] ${profile.id} task ${task.id}`)
    results.push(await runTask(browser, url, profile, task))
  }
  return results
}
