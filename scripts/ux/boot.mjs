// Shared page boot for every ux measure. The showcase animates and randomizes, so each context is
// made deterministic before any page script runs: reduced motion, UTC and en-US, a paused fake
// clock, a Math.random seeded from the page's path, and the profile's theme in storage. The clock
// only moves when this file moves it (`advance`), by a fixed amount, so two runs of one tree reach
// the same state.

import { chromium } from 'playwright'
import { gotoSettled, track } from '../settle.mjs'
import { transient, watchTransient } from '../transient.mjs'

const EPOCH = new Date('2026-01-05T09:00:00Z')
const PAUSED_AT = new Date(EPOCH.getTime() + 1000)
const LOAD_MS = 1000
const STEP_MS = 100
const SETTLE_POLLS = 100

export async function launchBrowser() {
  return chromium.launch({ headless: true })
}

/** Moves the fake clock a fixed amount in small steps, yielding to real time between them so promises and fetches that the page's timers wait on can finish. */
export async function advance(page, ms) {
  for (let done = 0; done < ms; done += STEP_MS) {
    await page.clock.runFor(Math.min(STEP_MS, ms - done))
    await page.waitForTimeout(15)
  }
}

const fingerprint = page => page.evaluate(() => {
  const se = document.scrollingElement
  const pending = [...document.images].filter(image => !image.complete).length
  return `${document.querySelectorAll('*').length}:${document.body.innerText.length}:${se.scrollHeight}:${document.fonts.status}:${pending}`
})

/**
 * Waits, without moving the clock, until real asynchronous work (images, fonts, lazy builds) has
 * stopped changing the page. A page that never stops is an error: measuring it mid-change would
 * give a different number on every run.
 */
export async function untilStable(page, pollMs = 40, quietPolls = 3) {
  let last = await fingerprint(page)
  let same = 0
  for (let polls = 0; same < quietPolls; polls++) {
    if (polls >= SETTLE_POLLS) throw new Error(`the page kept changing for ${SETTLE_POLLS} polls of ${pollMs} ms and never settled`)
    await page.waitForTimeout(pollMs)
    const now = await fingerprint(page)
    same = now === last ? same + 1 : 0
    last = now
  }
}

/** The page's own first moments: a fixed amount of fake time, then whatever real work is left. */
export async function settlePage(page) {
  await page.evaluate(() => document.fonts.ready)
  await advance(page, LOAD_MS)
  await untilStable(page)
}

function contextOptions(profile) {
  return {
    viewport: profile.viewport,
    hasTouch: profile.touch,
    isMobile: profile.touch,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: profile.theme === 'paper' ? 'light' : 'dark',
    timezoneId: 'UTC',
    locale: 'en-US',
    permissions: ['clipboard-read', 'clipboard-write'],
  }
}

// The seed comes from the document's own path, so a page draws the same numbers whatever else the
// run has drawn, and a page that gains a call to Math.random does not reshuffle any other page.
async function seed(page, theme) {
  await page.addInitScript(themeName => {
    let state = 0x5f3759df
    for (const char of location.pathname) state = (Math.imul(state ^ char.charCodeAt(0), 0x01000193) >>> 0)
    Math.random = () => {
      state = (state * 1664525 + 1013904223) >>> 0
      return state / 0x100000000
    }
    try {
      if (window.localStorage.getItem('sd-theme') === null) window.localStorage.setItem('sd-theme', themeName)
    } catch {}
  }, theme)
  await page.clock.install({ time: EPOCH })
  await page.clock.pauseAt(PAUSED_AT)
}

const message = error => String(error.message || error).split('\n')[0].slice(0, 200)

/**
 * What the page itself reported while it was open: an uncaught exception or a console error. A
 * failure the network caused (scripts/transient.mjs) is left to the retry in openPage. `list`
 * holds each distinct message once.
 */
function watchProblems(page) {
  const list = []
  const add = text => {
    const line = `${String(text).split('\n')[0].slice(0, 160)}`
    if (!transient.test(line) && !list.includes(line)) list.push(line)
  }
  const onError = error => add(`page error: ${error.message ?? error}`)
  const onConsole = entry => {
    if (entry.type() === 'error') add(`console error: ${entry.text()}`)
  }
  page.on('pageerror', onError)
  page.on('console', onConsole)
  return {
    list,
    stop() {
      page.off('pageerror', onError)
      page.off('console', onConsole)
    },
  }
}

/**
 * A fresh context on one page of the showcase, settled. A load that a network change or a refused
 * connection broke (scripts/transient.mjs) is thrown away and tried again in a new context, since
 * a half-loaded page would measure differently from a whole one. `problems` lists what the page
 * reported while it was open, including the pages a task navigates to, and keeps filling.
 */
export async function openPage(browser, baseUrl, file, profile, attempts = 3) {
  let lastError = null
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const context = await browser.newContext(contextOptions(profile))
    const page = await context.newPage()
    const watch = watchTransient(page)
    const reported = watchProblems(page)
    try {
      track(page)
      await seed(page, profile.theme)
      await gotoSettled(page, baseUrl + file)
      await settlePage(page)
      if (!watch.met.length) return { context, page, watch, problems: reported.list }
      lastError = new Error(`load broken by ${watch.met[0]}`)
    } catch (error) {
      lastError = watch.met.length ? new Error(`load broken by ${watch.met[0]}`) : error
      if (!watch.met.length) {
        watch.stop()
        reported.stop()
        await closeContext(context)
        throw error
      }
    }
    watch.stop()
    reported.stop()
    await closeContext(context)
  }
  throw new Error(message(lastError))
}

export async function closeContext(context) {
  if (!context) return
  await context.close().catch(() => {})
}
