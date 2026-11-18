// Audits what a library page does before its first demo. Library pages share one chrome from
// showcase/layout-plugin.js: a topbar, a header (h1, lead, install pill), then `.doc-preview`
// holding the live demos in `.demo-block`s. auditDocs is serialized into the page, so it must not
// close over anything. It runs at the top of the page, after the scroll pass has rendered it.
//
// The first demo is the first thing in a `.demo-block` that a reader can look at or use, not
// the block's frame or its words. A block's own header (`.demo-head`), its hidden code view
// (`.demo-code`) and its usage note (`.demo-usage`) are the page's explanation, so they are never
// the demo. Inside the rest, the first visible element that is one of these is the demo:
//   - a control: a button, field, select, summary, a role that acts, or a link that is not running text;
//   - a graphic: svg, canvas, img, video, iframe;
//   - a component root: an element with an `sd-` class that is not a text style (typography.css);
//   - a painted box: a block with its own background or border;
//   - a native specimen the page documents: h1 to h6, table, blockquote, hr.
// A block with none of these holds only prose, and the next block is tried. A page with no demo in
// any block is `textOnly`: it has no first demo to place, and the run counts it on its own.
export function auditDocs() {
  const clean = value => value.replace(/\s+/g, ' ').trim()
  const documentTop = el => (el ? Math.round((el.getBoundingClientRect().top + scrollY) * 10) / 10 : null)
  const NOT_PROSE = '.chat-feed, .sd-feed, [data-sd-follow], .sd-message, pre, code, textarea, [role=log], .sd-code'
  const CONTROLS = 'button, .doc-install-pill, .doc-copy-page, .doc-header-row'
  const NOT_DEMO = '.demo-head, .demo-code, .demo-usage, .doc-preview-bar, .doc-preview-tools'
  const CONTROL = 'button, input, select, textarea, summary, a[href], [role=button], [role=tab], [role=switch], [role=menuitem], [role=checkbox], [role=radio], [role=slider], [role=option], [tabindex]:not([tabindex="-1"])'
  const GRAPHIC = 'svg, canvas, img, video, picture, iframe, object'
  const SPECIMEN = 'h1, h2, h3, h4, h5, h6, table, blockquote, hr'
  const TEXT_STYLE = /^sd-(display|display-xl|faint|label|label-strong|lead|meta|muted|num|reading|subtle|title|wordmark|sr-only)$/
  const BOXES = new Set(['DIV', 'FIGURE', 'SECTION', 'ARTICLE', 'ASIDE', 'NAV', 'HEADER', 'FOOTER'])

  const h1 = document.querySelector('h1')
  const preview = document.querySelector('.doc-preview')
  const blocks = [...document.querySelectorAll('.demo-block')]
  const height = innerHeight

  function opacityOf(el) {
    let value = 1
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) value *= Number(getComputedStyle(node).opacity)
    return Number.isFinite(value) ? value : 1
  }

  function isVisible(el) {
    if (!el.getClientRects().length) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none' && opacityOf(el) >= 0.01
  }

  function paints(el) {
    const cs = getComputedStyle(el)
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') return true
    if (cs.backgroundImage !== 'none') return true
    return ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none')
  }

  // A link that sits in a sentence is prose with a link in it, not a control to look at.
  function runningLink(el) {
    if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') return false
    const host = el.closest('p, li, td, th, dd')
    if (!host) return false
    const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
    while (walk.nextNode()) if (walk.currentNode.textContent.trim() && !walk.currentNode.parentElement.closest('a')) return true
    return false
  }

  function isDemo(el) {
    if (el.closest(NOT_DEMO) || !isVisible(el)) return false
    if (el.matches(CONTROL)) return !runningLink(el)
    if (el.matches(GRAPHIC) || el.matches(SPECIMEN)) return true
    if ([...el.classList].some(name => name.startsWith('sd-') && !TEXT_STYLE.test(name))) return true
    return BOXES.has(el.tagName) && paints(el)
  }

  const candidates = blocks.length ? blocks : preview ? [preview] : []
  let block = null
  let demo = null
  for (const candidate of candidates) {
    const found = [...candidate.querySelectorAll('*')].find(isDemo)
    if (found) {
      block = candidate
      demo = found
      break
    }
  }
  const frame = candidates[0] ?? null

  // The demo's own span: from its top to the bottom of the block's content, which leaves out the
  // usage note under it. The part of that span inside the first screen is what a reader sees.
  let span = null
  if (demo) {
    const parts = [...block.children].filter(child => !child.matches(NOT_DEMO) && isVisible(child))
    const bottom = Math.max(...parts.map(child => child.getBoundingClientRect().bottom + scrollY), demo.getBoundingClientRect().bottom + scrollY)
    const top = demo.getBoundingClientRect().top + scrollY
    span = { top, height: bottom - top }
  }
  const visiblePx = span ? Math.max(0, Math.round(Math.min(span.top + span.height, height) - Math.max(span.top, 0))) : 0

  // The same blocks of 40 or more characters that auditReading counts as explanatory text, kept
  // when they sit after the h1 and before the first demo in document order. A page with no demo
  // is measured up to its first block.
  const anchor = demo || frame
  let introChars = 0
  if (h1 && anchor) {
    const owners = new Map()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const el = node.parentElement
      if (!clean(node.textContent) || !el || !isVisible(el) || el.closest('[aria-hidden="true"]') || el.closest(NOT_PROSE) || el.closest(CONTROLS)) continue
      if (!(h1.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) || h1.contains(node)) continue
      if (!(node.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
      let holder = el
      while (holder.parentElement && getComputedStyle(holder).display.startsWith('inline')) holder = holder.parentElement
      if (!owners.has(holder)) owners.set(holder, [])
      owners.get(holder).push(clean(node.textContent))
    }
    for (const texts of owners.values()) {
      const length = texts.join(' ').length
      if (length >= 40) introChars += length
    }
  }

  const firstDemoTop = demo ? Math.round(span.top * 10) / 10 : null
  const named = el => `${el.tagName.toLowerCase()}${[...el.classList].slice(0, 2).map(name => `.${name}`).join('')}`
  return {
    firstDemoTop,
    firstDemoAt: firstDemoTop === null ? null : Math.round((firstDemoTop / height) * 1000) / 1000,
    firstDemoVisiblePx: visiblePx,
    firstDemoOnScreen: Boolean(demo) && visiblePx >= Math.min(200, Math.round(span.height)),
    firstDemoIs: demo ? named(demo) : null,
    textOnly: Boolean(frame) && !demo,
    hasDemoFrame: Boolean(frame),
    firstBlockTop: documentTop(blocks[0]),
    introChars,
    pageHeight: document.scrollingElement.scrollHeight,
    pageScreens: Math.round((document.scrollingElement.scrollHeight / height) * 100) / 100,
  }
}
