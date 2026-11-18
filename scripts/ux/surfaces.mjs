import { ALL, HOME, LIBRARY, keyOf } from '../../showcase/pages.js'
import { auditDocs } from './docs-audit.mjs'
import { auditPage, mergeAudits } from './page-audit.mjs'
import { auditReading, hoverCover } from './read-audit.mjs'
import { eachStep, untilRendered, warmPage } from './scroll.mjs'

// A surface is a page of the showcase. Every page in showcase/pages.js is one, so a new page joins
// the scorecard when it joins the registry. A feed is a list that grows with history, so its scroll
// depth says nothing about layout and is left out of fold.
export const SURFACES = ALL.map(page => ({
  id: keyOf(page),
  file: page.file,
  title: page.title,
  kind: page === HOME ? 'home' : LIBRARY.includes(page) ? 'library' : 'example',
  feed: keyOf(page) === 'chat',
}))

async function auditAcrossScroll(page, scroller) {
  const steps = []
  await eachStep(page, scroller, async () => {
    await untilRendered(page)
    const screenshot = (await page.screenshot({ type: 'png' })).toString('base64')
    steps.push(await page.evaluate(auditPage, screenshot))
  })
  return mergeAudits(steps)
}

/**
 * One surface, already open and settled: what each wanted measurement finds. The page is scrolled
 * once first (scroll.mjs), so every height and every audit is of the page with its blocks rendered.
 * `chromeItems` are the controls of the shared docs chrome; the run counts them once per profile.
 */
export async function measureSurface(page, profile, surface, wanted) {
  const scroller = await warmPage(page)
  const result = { id: surface.id, file: surface.file, kind: surface.kind, feed: surface.feed, scroller: scroller?.name ?? null }
  if (wanted.includes('docs') && surface.kind === 'library') result.docs = await page.evaluate(auditDocs)
  if (wanted.includes('surfaces')) {
    const read = await page.evaluate(auditReading)
    if (read.conversation && !profile.touch) read.conversation.hover = await hoverCover(page)
    const { chromeItems, ...audit } = await auditAcrossScroll(page, scroller)
    Object.assign(result, audit, { read, chromeItems })
    result.fold = surface.feed ? null : { screens: scroller ? Math.round((scroller.scrollHeight / scroller.clientHeight) * 100) / 100 : 1 }
  }
  return result
}
