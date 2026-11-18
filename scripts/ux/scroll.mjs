// Scrolling a page the way a reader does, for the surface audit and for the tasks. A library page
// skips the layout of the blocks and sections it is not near (`content-visibility: auto` in
// showcase/app.css) and counts each at a 480 px placeholder until it has rendered, so its height
// changes as it is scrolled. Anything that reads a distance on such a page, an audit or a task's
// scroll cost, has to read it after a first pass has rendered every block (`warmPage`).

import { advance, untilStable } from './boot.mjs'

const STEP_SHARE = 0.85
const RENDER_POLLS = 200

/**
 * Finds the scroller that holds the page's main content: the window when the document scrolls,
 * else the largest visible element that scrolls. A docs sidebar or a demo's own scroll area is
 * smaller, so it never wins. Runs in the page and remembers the element on window.__uxScroller.
 */
export function findScroller() {
  const root = document.scrollingElement
  let best = root.scrollHeight > innerHeight + 1 ? { el: null, area: innerWidth * innerHeight } : null
  for (const el of document.querySelectorAll('*')) {
    if (el === document.body || el === root || !el.getClientRects().length) continue
    if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue
    const box = el.getBoundingClientRect()
    if (box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) continue
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    if (!hit || !(hit === el || el.contains(hit))) continue
    const area = el.clientWidth * el.clientHeight
    if (!best || area > best.area) best = { el, area }
  }
  window.__uxScroller = best?.el ?? null
  if (!best) return null
  const scroller = best.el ?? root
  const named = best.el ? `${best.el.tagName.toLowerCase()}${best.el.id ? `#${best.el.id}` : ''}.${String(best.el.className).trim().split(/\s+/).slice(0, 2).join('.')}` : 'window'
  return { name: named, clientHeight: best.el ? scroller.clientHeight : innerHeight, scrollHeight: scroller.scrollHeight, scrollTop: best.el ? scroller.scrollTop : scrollY }
}

function scrollMain(y) {
  const el = window.__uxScroller
  if (el) el.scrollTop = y
  else scrollTo({ top: y, behavior: 'instant' })
}

export function sizeOfScroller() {
  const el = window.__uxScroller
  if (el) return { clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }
  return { clientHeight: innerHeight, scrollHeight: document.scrollingElement.scrollHeight }
}

/**
 * Visits the scroller from the top in steps that overlap, so a sticky bar never hides a band of the
 * page. The range is read again at every step, because the page can still grow as it is scrolled.
 */
export async function eachStep(page, scroller, visit) {
  if (!scroller) {
    await visit()
    return
  }
  let y = 0
  for (let guard = 0; guard < 80; guard++) {
    await page.evaluate(scrollMain, y)
    await visit()
    const { clientHeight, scrollHeight } = await page.evaluate(sizeOfScroller)
    const last = Math.max(0, scrollHeight - clientHeight)
    if (y >= last) return
    y = Math.min(last, y + Math.max(200, Math.floor(clientHeight * STEP_SHARE)))
  }
  throw new Error('the page kept growing while it was scrolled')
}

// Whether every block and section in view has laid out its contents. A block that skips its
// contents still reports its own box, so the test asks about its first child: that child is
// hidden from `checkVisibility` while the block's contents are skipped.
const unrendered = () => {
  let waiting = 0
  for (const block of document.querySelectorAll('.demo-block, .doc-section')) {
    const box = block.getBoundingClientRect()
    if (box.bottom <= 0 || box.top >= innerHeight) continue
    const child = block.firstElementChild
    if (child && !child.checkVisibility({ contentVisibilityAuto: true })) waiting += 1
  }
  return waiting
}

/**
 * Waits, in real time, until each block in view has rendered. It cannot wait on an animation frame:
 * the fake clock fakes them. A block that never renders is an error, not a shorter page.
 */
export async function untilRendered(page) {
  for (let poll = 0; poll < RENDER_POLLS; poll++) {
    if ((await page.evaluate(unrendered)) === 0) return
    await page.waitForTimeout(10)
  }
  throw new Error('a block in view did not render after it was scrolled to')
}

/**
 * A first pass scrolls the page once without moving the clock, so every block has rendered and
 * every lazy chart has been built. The page's height is then its settled height. Returns the
 * scroller with its settled size, or null when the page has none.
 */
export async function warmPage(page) {
  const first = await page.evaluate(findScroller)
  if (!first) return null
  await eachStep(page, first, async () => {
    await untilRendered(page)
    await untilStable(page, 30, 2)
  })
  await page.evaluate(scrollMain, first.scrollTop)
  await advance(page, 500)
  await untilStable(page)
  return { ...first, ...(await page.evaluate(sizeOfScroller)) }
}
