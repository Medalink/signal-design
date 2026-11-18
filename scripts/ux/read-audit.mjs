// Audits how a screen reads: what its lists tell you per row, how much explanatory text it
// carries, whether it labels a heading with an eyebrow, and, on a chat, how much of the
// window the conversation gets. auditReading is serialized into the page, so it must not close
// over anything. It runs once per surface at the scroll position the page opens at, and counts
// text anywhere on the page, not only what is in view: explanatory text below the fold is still
// text a reader meets.
export function auditReading() {
  const ROW = 'button, a[href], li, [role=button], [role=option], [role=listitem], [role=tab], [role=treeitem]'
  const FEED = '.chat-feed, .sd-feed, [data-sd-follow]'
  const NOT_PROSE = `${FEED}, .sd-message, pre, code, textarea, [role=log], .sd-code`
  const HEADING = 'h1, h2, h3, h4, h5, h6, [role=heading]'
  const viewport = { w: innerWidth, h: innerHeight }
  const clean = value => value.replace(/\s+/g, ' ').trim()

  function isVisible(el) {
    if (!el.getClientRects().length) return false
    if (el.tagName !== 'SUMMARY') {
      const details = el.closest('details')
      if (details && !details.open) return false
    }
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none'
  }
  function inViewport(rect) {
    return rect.bottom > 0 && rect.top < viewport.h && rect.right > 0 && rect.left < viewport.w
  }
  function onTop(el, rect) {
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return Boolean(hit && (hit === el || el.contains(hit) || hit.contains(el)))
  }
  function selectorFor(el) {
    const parts = []
    let node = el
    for (let depth = 0; node && depth < 3 && node.nodeType === 1; depth++) {
      let part = node.tagName.toLowerCase()
      if (node.id) {
        parts.unshift(`${part}#${node.id}`)
        break
      }
      if (node.className && typeof node.className === 'string') part += '.' + node.className.trim().split(/\s+/).slice(0, 2).join('.')
      parts.unshift(part)
      node = node.parentElement
    }
    return parts.join(' > ')
  }

  function textPieces(root, belowFold = false) {
    const pieces = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const el = node.parentElement
      if (!clean(node.textContent) || !el || !isVisible(el) || el.closest('[aria-hidden="true"], .sd-ascii')) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const rects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0)
      const rect = rects.find(inViewport) || (belowFold ? rects[0] : null)
      if (!rect || (inViewport(rect) && !onTop(el, rect))) continue
      pieces.push({ el, text: clean(node.textContent), rect })
    }
    return pieces
  }

  const feed = [...document.querySelectorAll('.chat-feed')].find(el => isVisible(el) && onTop(el, el.getBoundingClientRect()))
  let conversation = null
  if (feed) {
    const box = feed.getBoundingClientRect()
    const width = Math.min(box.right, viewport.w) - Math.max(box.left, 0)
    const height = Math.min(box.bottom, viewport.h) - Math.max(box.top, 0)
    const rows = [...feed.querySelectorAll('.sd-message')].filter(row => {
      const r = row.getBoundingClientRect()
      return r.height > 0 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1
    })
    conversation = {
      share: Math.round((width * height) / (viewport.w * viewport.h) * 1000) / 1000,
      rows: rows.length,
      chars: textPieces(feed).reduce((total, piece) => total + piece.text.length, 0),
    }
  }

  const groups = new Map()
  for (const el of document.querySelectorAll(ROW)) {
    if (!isVisible(el) || el.closest(FEED)) continue
    const rect = el.getBoundingClientRect()
    if (rect.width < 120 || rect.height < 20 || rect.height > 140 || rect.left < 0 || rect.right > viewport.w + 1 || rect.bottom <= 0) continue
    if (inViewport(rect) && !onTop(el, rect)) continue
    const key = `${Math.round(rect.left / 2)}|${Math.round(rect.width / 2)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ el, rect })
  }
  const lists = { rows: 0, rowsInView: 0, firstRowAt: null, secondLines: 0, repeatedLines: 0, cutOffNames: 0, offenders: [] }
  for (const members of groups.values()) {
    const rows = members.filter(row => !members.some(other => other !== row && other.el.contains(row.el)))
    if (rows.length < 3) continue
    const read = rows.map(row => {
      const lines = []
      for (const piece of textPieces(row.el, true).sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)) {
        const middle = piece.rect.top + piece.rect.height / 2
        const line = lines.find(known => middle >= known.top && middle <= known.bottom)
        if (line) {
          line.pieces.push(piece)
          line.top = Math.min(line.top, piece.rect.top)
          line.bottom = Math.max(line.bottom, piece.rect.bottom)
        } else {
          lines.push({ top: piece.rect.top, bottom: piece.rect.bottom, pieces: [piece] })
        }
      }
      return { row, lines: lines.map(line => ({ text: line.pieces.map(piece => piece.text).join(' '), pieces: line.pieces })) }
    }).filter(entry => entry.lines.length)
    const seconds = new Map()
    for (const entry of read) for (const line of entry.lines.slice(1)) seconds.set(line.text, (seconds.get(line.text) || 0) + 1)
    for (const entry of read) {
      lists.rows += 1
      const at = Math.round(entry.row.rect.top / viewport.h * 1000) / 1000
      if (entry.row.rect.top >= 0 && entry.row.rect.bottom <= viewport.h) lists.rowsInView += 1
      if (lists.firstRowAt === null || at < lists.firstRowAt) lists.firstRowAt = at
      const name = entry.lines[0]
      const cutOff = name.pieces.some(piece => {
        for (let node = piece.el; node && entry.row.el.contains(node); node = node.parentElement) {
          if (getComputedStyle(node).textOverflow === 'ellipsis' && node.scrollWidth > node.clientWidth) return true
        }
        return false
      })
      if (cutOff) {
        lists.cutOffNames += 1
        lists.offenders.push({ why: 'name cut off', text: name.text.slice(0, 40), selector: selectorFor(entry.row.el) })
      }
      const ownName = name.pieces[0].text
      for (const line of entry.lines.slice(1)) {
        lists.secondLines += 1
        const repeats = seconds.get(line.text) > 1 ? 'same line on another row' : ownName.length >= 3 && line.text.includes(ownName) ? 'repeats the name' : null
        if (!repeats) continue
        lists.repeatedLines += 1
        lists.offenders.push({ why: repeats, text: line.text.slice(0, 40), selector: selectorFor(entry.row.el) })
      }
    }
  }
  lists.offenders = lists.offenders.slice(0, 12)

  // The site's own copy is everything but the text a demo shows as sample data: the labels, rows
  // and sentences inside a `.demo-block`, `.doc-preview` or `.doc-example`, and a message's text.
  // A block's usage note (`.demo-usage`) is the page's own explanation, so it stays in.
  const NOT_COPY = '.demo-block, .doc-preview, .doc-example, .sd-message'
  const isSiteCopy = el => !el.closest(NOT_COPY) || Boolean(el.closest('.demo-usage'))

  const blocks = new Map()
  for (const piece of textPieces(document.body, true)) {
    if (piece.el.closest(NOT_PROSE) || !isSiteCopy(piece.el)) continue
    let block = piece.el
    while (block.parentElement && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement
    if (!blocks.has(block)) blocks.set(block, [])
    blocks.get(block).push(piece.text)
  }
  const prose = { chars: 0, blocks: 0, duplicateChars: 0, offenders: [] }
  const seen = new Map()
  for (const [block, texts] of blocks) {
    const text = texts.join(' ')
    if (text.length < 40) continue
    prose.chars += text.length
    prose.blocks += 1
    const times = (seen.get(text) || 0) + 1
    seen.set(text, times)
    if (times > 1) prose.duplicateChars += text.length
    prose.offenders.push({ chars: text.length, text: text.slice(0, 60), selector: selectorFor(block), again: times > 1 })
  }
  prose.offenders.sort((a, b) => Number(b.again) - Number(a.again) || b.chars - a.chars)
  prose.offenders = prose.offenders.slice(0, 8)

  // An eyebrow is a short label that sits directly above a heading or a card title: the next text
  // on the page after it belongs to a heading or a `*-title` element, starts within 40 px below it,
  // and shares some of its width. It has the look of one when it is uppercase (computed
  // `text-transform`, or written in capitals) or when it is set smaller than the title below it,
  // whatever its case: taking off `text-transform` does not remove it. A label above a list of
  // controls, or beside a title on the same line, is not one. The owner's rule is about the site's
  // own copy, so labels inside a demo, and inside a message (a link card's domain, an event card's
  // kind), are left out. So are the breadcrumb, the wordmark, the showcase's own viewport bar, and
  // a label that is itself a heading.
  const NOT_EYEBROW = 'nav[aria-label*="readcrumb"], .sd-breadcrumb, .sd-breadcrumbs, .doc-crumbs, .sd-wordmark, .vp-bar, .vp-dialog'
  const TITLE_CLASS = /(^|-)title$/
  const isTitle = el => el.matches(HEADING) || [...el.classList].some(name => TITLE_CLASS.test(name))
  const holderOf = el => el.closest('figure, article, section, li, tr, details, dialog, aside, header, footer, form, [role=listitem], [role=option], [role=row], [role=treeitem], button, a[href]')
  const commonAncestor = (a, b) => {
    let node = a
    while (node && !node.contains(b)) node = node.parentElement
    return node || document.body
  }
  const textLeaves = root => [...root.querySelectorAll('*')].filter(node => !node.children.length && clean(node.textContent)).length
  const isUpper = (el, label) => getComputedStyle(el).textTransform === 'uppercase' || (/[A-Z]{2}/.test(label) && label === label.toUpperCase())
  const all = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const lastTextOf = el => {
    const inner = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let last = null
    while (inner.nextNode()) if (clean(inner.currentNode.textContent)) last = inner.currentNode
    return last
  }
  const eyebrows = []
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('pre, code, script, style, svg, kbd, option, [aria-hidden="true"]') || el.closest(NOT_COPY) || el.closest(NOT_EYEBROW) || el.closest(HEADING) || !isVisible(el)) continue
    if ([...el.children].some(child => child.tagName.toLowerCase() !== 'svg' && clean(child.textContent))) continue
    const label = clean(el.textContent)
    if (label.length < 2 || label.length > 40 || label.split(' ').length > 4) continue
    const last = lastTextOf(el)
    if (!last) continue
    all.currentNode = last
    let next = null
    while (all.nextNode()) {
      const node = all.currentNode
      const holder = node.parentElement
      if (clean(node.textContent) && holder && isVisible(holder) && !holder.closest('[aria-hidden="true"]')) {
        next = holder
        break
      }
    }
    if (!next) continue
    let title = null
    for (let node = next, depth = 0; node && depth < 4; node = node.parentElement, depth++) {
      if (isTitle(node)) {
        title = node
        break
      }
    }
    if (!title || title === el || el.contains(title) || title.contains(el)) continue
    const above = el.getBoundingClientRect()
    const below = title.getBoundingClientRect()
    const gap = below.top - above.bottom
    const shared = Math.min(above.right, below.right) - Math.max(above.left, below.left)
    if (gap < -2 || gap > 40 || shared < 4) continue
    // A label labels the title in its own card, section, row or figure. The last line of one
    // (a chart's readout, the last row of a list) above the next one's heading does not.
    if (holderOf(el) !== holderOf(title)) continue
    // Set smaller than the title, the signal that does not depend on case, counts only in a
    // compact group: the card or header that holds the label and the title holds at most four
    // lines of text, so a label that merely precedes a title among many steps or rows is not one.
    const smaller = parseFloat(getComputedStyle(el).fontSize) < parseFloat(getComputedStyle(title).fontSize) && textLeaves(commonAncestor(el, title)) <= 4
    if (!isUpper(el, label) && !smaller) continue
    eyebrows.push({ text: label, heading: clean(title.textContent).slice(0, 40), selector: selectorFor(el), why: isUpper(el, label) ? (smaller ? 'uppercase, smaller' : 'uppercase') : 'smaller' })
  }

  return { conversation, lists, prose, copy: { eyebrows: eyebrows.length, offenders: eyebrows.slice(0, 12) } }
}

/**
 * With a mouse, pointing at a message shows its action bar. This points at each message in view
 * and counts the message text the bar then covers. Returns null when no bar ever showed.
 */
export async function hoverCover(page) {
  const indexes = await page.evaluate(() => {
    const feed = document.querySelector('.chat-feed')
    if (!feed) return []
    const box = feed.getBoundingClientRect()
    return [...feed.querySelectorAll('.sd-message')].map((row, index) => ({ row, index })).filter(({ row }) => {
      const r = row.getBoundingClientRect()
      return r.height > 0 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1
    }).map(({ index }) => index)
  })
  let messages = 0
  let coveredChars = 0
  for (const index of indexes) {
    await page.locator('.chat-feed .sd-message').nth(index).hover({ timeout: 5000 }).catch(() => {})
    let covered = null
    for (let poll = 0; poll < 20 && covered === null; poll++) {
      await page.waitForTimeout(50)
      covered = await page.evaluate(at => {
        const row = document.querySelectorAll('.chat-feed .sd-message')[at]
        const bar = row?.querySelector('.sd-message-actions')
        if (!bar || Number(getComputedStyle(bar).opacity) < 0.99) return null
        const b = bar.getBoundingClientRect()
        let chars = 0
        const walker = document.createTreeWalker(document.querySelector('.chat-feed'), NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
          const node = walker.currentNode
          if (!node.textContent.trim() || bar.contains(node)) continue
          for (let i = 0; i < node.textContent.length; i++) {
            if (!node.textContent[i].trim()) continue
            const range = document.createRange()
            range.setStart(node, i)
            range.setEnd(node, i + 1)
            const r = range.getBoundingClientRect()
            const x = r.left + r.width / 2
            const y = r.top + r.height / 2
            if (r.width > 0 && x > b.left && x < b.right && y > b.top && y < b.bottom && bar.contains(document.elementFromPoint(x, y))) chars += 1
          }
        }
        return chars
      }, index)
    }
    if (covered === null) continue
    messages += 1
    coveredChars += covered
  }
  await page.mouse.move(0, 0)
  await page.waitForTimeout(150)
  return messages ? { messages, coveredChars } : null
}
