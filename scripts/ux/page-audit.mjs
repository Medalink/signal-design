// Audits what is on screen: text and its contrast, control sizes and names. auditPage is
// serialized into the page, so it must not close over anything. It takes a PNG of the viewport so
// text over an image or gradient can be scored from the painted pixels.
//
// Departures from Whisper's audit, which looks at one screen: a library page is thousands of
// pixels tall, so the runner calls this once per scroll step. What an earlier step already
// counted is kept in window.__uxSeen and never counted again, so a sticky bar counts once and a
// paragraph counts once. A text node's wrapped lines come from all of its client rects, not the
// ones in view, so a paragraph half on screen is still judged by its whole shape. Characters are
// counted after collapsing whitespace, because the docs pages are written with indented source.
//
// A text field's value, or its placeholder while it is empty, is text too: it is scored like a text
// node, weighted by its characters, against the field's own background. The shared docs chrome
// (topbar, sidebar, on-this-page rail, pager, breadcrumb, footer) is returned as `chromeItems` and
// left out of the page's own control counts: the run counts each distinct chrome control once per
// profile, not once per page.
export async function auditPage(screenshotBase64) {
  const INTERACTIVE = 'button, a[href], input, select, textarea, summary, [role=button], [role=tab], [role=switch], [role=menuitem], [role=checkbox], [role=radio], [role=slider], [role=option], [tabindex]:not([tabindex="-1"])'
  const BAR = '.vp-bar, .vp-dialog'
  const CHROME = '.doc-topbar, .doc-sidebar, .doc-toc-rail, .demo-pager, .doc-crumbs, .doc-footer'
  const viewport = { w: innerWidth, h: innerHeight }
  const seen = (window.__uxSeen ||= { text: new WeakSet(), targets: new WeakSet(), truncated: new WeakSet(), fields: new WeakSet() })
  const clean = value => value.replace(/\s+/g, ' ').trim()
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx2d = canvas.getContext('2d', { willReadFrequently: true })
  const colorCache = new Map()

  function resolveColor(str) {
    if (!str) return null
    if (colorCache.has(str)) return colorCache.get(str)
    let out = null
    const legacy = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(str)
    if (legacy) {
      const alpha = legacy[4] === undefined ? 1 : legacy[4].endsWith('%') ? parseFloat(legacy[4]) / 100 : Number(legacy[4])
      out = { r: Number(legacy[1]), g: Number(legacy[2]), b: Number(legacy[3]), a: alpha }
    } else {
      ctx2d.clearRect(0, 0, 1, 1)
      ctx2d.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx2d.fillStyle = str
      ctx2d.fillRect(0, 0, 1, 1)
      const d = ctx2d.getImageData(0, 0, 1, 1).data
      out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }
    }
    if (out.a === 0) out = null
    colorCache.set(str, out)
    return out
  }

  function linearize(channel) {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }

  function relLum(c) {
    return 0.2126 * linearize(c.r) + 0.7152 * linearize(c.g) + 0.0722 * linearize(c.b)
  }

  function contrastRatio(fg, bg) {
    const l1 = relLum(fg)
    const l2 = relLum(bg)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }

  function blend(top, bottom) {
    const a = top.a + bottom.a * (1 - top.a)
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
      a,
    }
  }

  const pageBackground = resolveColor(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }
  const backgroundCache = new Map()
  function effectiveBackground(el) {
    if (!el) return { color: pageBackground, unclear: false }
    if (backgroundCache.has(el)) return backgroundCache.get(el)
    const below = effectiveBackground(el.parentElement)
    const cs = getComputedStyle(el)
    const bg = resolveColor(cs.backgroundColor)
    let color = below.color
    let unclear = below.unclear
    if (bg) {
      color = blend(bg, color)
      if (bg.a >= 1) unclear = false
    }
    if (cs.backgroundImage && cs.backgroundImage !== 'none') unclear = true
    const result = { color, unclear }
    backgroundCache.set(el, result)
    return result
  }

  const bytes = Uint8Array.from(atob(screenshotBase64), ch => ch.charCodeAt(0))
  const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
  const shot = document.createElement('canvas')
  shot.width = bitmap.width
  shot.height = bitmap.height
  const shotCtx = shot.getContext('2d', { willReadFrequently: true })
  shotCtx.drawImage(bitmap, 0, 0)
  const shotScale = bitmap.width / innerWidth

  function paintedBackgrounds(rect, fg) {
    const x = Math.max(0, Math.floor(rect.left * shotScale))
    const y = Math.max(0, Math.floor(rect.top * shotScale))
    const w = Math.min(shot.width - x, Math.ceil(rect.width * shotScale))
    const h = Math.min(shot.height - y, Math.ceil(rect.height * shotScale))
    if (w < 1 || h < 1) return []
    const data = shotCtx.getImageData(x, y, w, h).data
    const buckets = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
      let bucket = buckets.get(key)
      if (!bucket) buckets.set(key, bucket = { n: 0, r: 0, g: 0, b: 0 })
      bucket.n += 1
      bucket.r += data[i]
      bucket.g += data[i + 1]
      bucket.b += data[i + 2]
    }
    const total = data.length / 4
    const painted = [...buckets.values()]
      .map(bucket => ({ share: bucket.n / total, r: bucket.r / bucket.n, g: bucket.g / bucket.n, b: bucket.b / bucket.n, a: 1 }))
      .sort((a, b) => b.share - a.share)
    const clusters = painted.filter(cluster => Math.hypot(cluster.r - fg.r, cluster.g - fg.g, cluster.b - fg.b) > 48)
    const major = clusters.filter(cluster => cluster.share >= 0.15)
    if (major.length) return major
    return (clusters.length ? clusters : painted).slice(0, 1)
  }

  function onTop(el, x, y) {
    const hit = document.elementFromPoint(x, y)
    return Boolean(hit && (hit === el || el.contains(hit) || hit.contains(el)))
  }

  // An element is as opaque as its own opacity times every ancestor's. A fully transparent one,
  // such as a message's action bar before the pointer reaches it, is not on screen.
  const opacityCache = new Map()
  function opacityOf(el) {
    if (!el || el.nodeType !== 1) return 1
    if (opacityCache.has(el)) return opacityCache.get(el)
    const own = Number(getComputedStyle(el).opacity)
    const value = (Number.isFinite(own) ? own : 1) * opacityOf(el.parentElement)
    opacityCache.set(el, value)
    return value
  }

  function isVisible(el) {
    if (!el.getClientRects().length) return false
    if (el.tagName !== 'SUMMARY') {
      const details = el.closest('details')
      if (details && !details.open) return false
    }
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none' && opacityOf(el) >= 0.01
  }

  function inViewport(rect) {
    return rect.bottom > 0 && rect.top < viewport.h && rect.right > 0 && rect.left < viewport.w
  }

  function isDisabled(el) {
    return Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true')
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
      if (node.className && typeof node.className === 'string') {
        part += '.' + node.className.trim().split(/\s+/).slice(0, 2).join('.')
      }
      parts.unshift(part)
      node = node.parentElement
    }
    return parts.join(' > ')
  }

  // What a press can land on. Pressing a checkbox's or radio's wrapping label presses the box, so
  // WCAG 2.5.8 counts the label as the target
  // (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Other fields keep their
  // own box: a label around a text field or a slider focuses it, and that is not the press the
  // field needs. The box can stick out of its label, so the target is both.
  function pressBox(el) {
    const own = el.getBoundingClientRect()
    const label = el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio') ? el.closest('label') : null
    if (!label) return own
    const around = label.getBoundingClientRect()
    const left = Math.min(own.left, around.left)
    const top = Math.min(own.top, around.top)
    return { width: Math.max(own.right, around.right) - left, height: Math.max(own.bottom, around.bottom) - top }
  }

  // The accessible name, by the accname rules (https://www.w3.org/TR/accname-1.2/ and HTML-AAM):
  // aria-labelledby, aria-label, then the native source for the element, then its title. A button,
  // link or summary is named by its content: text, a descendant image's alt, a descendant's
  // aria-label or an svg's title. A submit, reset or button input is named by its value (the browser's
  // own "Submit" or "Reset" when it has none). A field is named by its labels, then its placeholder;
  // its own text, such as a select's options or a textarea's initial text, is never its name.
  const NAMED_BY_AUTHOR = new Set(['slider', 'textbox', 'combobox', 'listbox', 'spinbutton', 'searchbox', 'progressbar', 'scrollbar'])

  function contentName(root) {
    const parts = []
    const visit = node => {
      if (node.nodeType === 3) {
        parts.push(node.textContent)
        return
      }
      if (node.nodeType !== 1) return
      if (node !== root) {
        const cs = getComputedStyle(node)
        if (node.getAttribute('aria-hidden') === 'true' || cs.display === 'none' || cs.visibility === 'hidden') return
        const label = node.getAttribute('aria-label')
        if (label) {
          parts.push(label)
          return
        }
        if (node.tagName === 'IMG') {
          parts.push(node.getAttribute('alt') || '')
          return
        }
        if (node.tagName.toLowerCase() === 'svg') {
          parts.push(node.querySelector(':scope > title')?.textContent || '')
          return
        }
      }
      for (const child of node.childNodes) visit(child)
    }
    visit(root)
    return clean(parts.join(' '))
  }

  function labelText(el) {
    const parts = []
    for (const label of el.labels || []) {
      const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (!el.contains(node) && !node.parentElement.closest('[aria-hidden="true"]')) parts.push(node.textContent)
      }
    }
    return clean(parts.join(' '))
  }

  function accessibleName(el) {
    const labelledby = el.getAttribute('aria-labelledby')
    if (labelledby) {
      const text = clean(labelledby.split(/\s+/).map(id => { const ref = document.getElementById(id); return ref ? contentName(ref) : '' }).join(' '))
      if (text) return text
    }
    const aria = clean(el.getAttribute('aria-label') || '')
    if (aria) return aria
    const tag = el.tagName
    if (tag === 'INPUT' && ['submit', 'reset', 'button'].includes(el.type)) {
      return clean(el.getAttribute('value') || '') || ({ submit: 'Submit', reset: 'Reset' }[el.type] ?? '') || el.getAttribute('title') || ''
    }
    if (tag === 'INPUT' && el.type === 'image') return clean(el.getAttribute('alt') || '') || el.getAttribute('title') || ''
    const labels = labelText(el)
    if (labels) return labels
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return el.getAttribute('title') || el.getAttribute('placeholder') || ''
    if (!NAMED_BY_AUTHOR.has(el.getAttribute('role'))) {
      const content = contentName(el)
      if (content) return content
    }
    return el.getAttribute('title') || ''
  }

  const text = {
    chars: 0,
    failChars: 0,
    sampledChars: 0,
    unknownChars: 0,
    smallChars: 0,
    longLineChars: 0,
    tightLineChars: 0,
    wrappedChars: 0,
    contrastMin: Infinity,
    fontSizes: {},
    fontFamilies: new Set(),
    fontWeights: {},
    textColors: new Set(),
    truncated: 0,
    brokenWords: 0,
    brokenList: [],
    fieldChars: 0,
    offenders: [],
  }

  // Words of a wrapped text node that the line break cut in the middle. A word is a run of
  // characters between spaces. A line may end after a hyphen, dash or slash, so a break there is not
  // a split, and neither is one after any other punctuation (a pipe, a slash, `=`, `?` inside code);
  // a break between two letters or digits, or between a letter and the comma after it, is (a column
  // too narrow for the word, `overflow-wrap: anywhere`). Each word is a Range, and its client rects
  // say which lines it was laid on. A word cut twice still counts once. A run longer than
  // LONGEST_WORD is a token (a hash, an id, a name with no spaces) that no column is meant to hold,
  // so breaking it is the fix, not the defect. Run only on nodes that already wrap, so a page pays
  // for the few that do.
  const LONGEST_WORD = 30
  const ALNUM = /[\p{L}\p{N}]/u
  function brokenWordsIn(node, el) {
    const raw = node.textContent
    const range = document.createRange()
    const found = []
    for (const match of raw.matchAll(/\S+/g)) {
      const word = match[0]
      if (word.length < 2 || word.length > LONGEST_WORD) continue
      const start = match.index
      range.setStart(node, start)
      range.setEnd(node, start + word.length)
      const rects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0)
      if (rects.length < 2 || !rects.some(r => Math.abs(r.top - rects[0].top) > rects[0].height / 2)) continue
      let cutAt = -1
      let before = null
      for (let k = 0; k < word.length; k++) {
        range.setStart(node, start + k)
        range.setEnd(node, start + k + 1)
        const rect = range.getClientRects()[0]
        if (!rect || rect.width === 0) continue
        if (before && rect.top - before.top > before.height / 2 && ALNUM.test(word[k - 1])) {
          cutAt = k
          break
        }
        before = rect
      }
      if (cutAt > 0) found.push({ word: word.slice(0, 40), cutAfter: word.slice(0, cutAt).slice(-12), selector: selectorFor(el) })
    }
    return found
  }

  // Counts `chars` characters of text in the style `cs` and scores their contrast against what is
  // behind `el`, sampled from the screenshot over `rect` when that is an image or gradient.
  // `shown` names the text in the offender list.
  function record(el, cs, chars, fg, textAlpha, rect, shown) {
    const fontSize = parseFloat(cs.fontSize)
    const weight = Number(cs.fontWeight) || 400
    const family = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim()
    text.chars += chars
    text.smallChars += fontSize < 12 ? chars : 0
    const sizeKey = (Math.round(fontSize * 10) / 10).toFixed(1)
    text.fontSizes[sizeKey] = (text.fontSizes[sizeKey] || 0) + chars
    if (family) text.fontFamilies.add(family)
    text.fontWeights[weight] = (text.fontWeights[weight] || 0) + chars
    if (!fg) return
    text.textColors.add(`${fg.r},${fg.g},${fg.b}`)
    const bgResult = effectiveBackground(el)
    let backgrounds = [bgResult.color]
    if (bgResult.unclear) {
      backgrounds = paintedBackgrounds(rect, fg)
      text.sampledChars += chars
    }
    if (!backgrounds.length) {
      text.unknownChars += chars
      return
    }
    const composed = { r: fg.r, g: fg.g, b: fg.b, a: textAlpha }
    const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700)
    const threshold = large ? 3.0 : 4.5
    const ratio = Math.min(...backgrounds.map(bg => contrastRatio(blend(composed, bg), bg)))
    text.contrastMin = Math.min(text.contrastMin, ratio)
    if (ratio < threshold) {
      text.failChars += chars
      text.offenders.push({
        text: shown.slice(0, 40),
        ratio: Math.round(ratio * 100) / 100,
        fontSize: Math.round(fontSize * 10) / 10,
        selector: selectorFor(el),
      })
    }
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const raw = node.textContent
    if (!raw.trim() || seen.text.has(node)) continue
    const el = node.parentElement
    if (!el || !isVisible(el)) continue
    if (el.tagName === 'TEXTAREA') continue
    if (el.closest('[aria-hidden="true"], .sd-ascii')) continue
    if (el.closest(':disabled') || el.closest('[aria-disabled="true"]')) continue
    if (el.closest('label')?.control?.disabled) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const allRects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0)
    const rects = allRects.filter(inViewport)
    if (!rects.length) continue
    const shown = rects.find(r => onTop(el, r.left + r.width / 2, r.top + r.height / 2))
    if (!shown) continue
    seen.text.add(node)
    const cs = getComputedStyle(el)
    const fontSize = parseFloat(cs.fontSize)
    const lineHeightRaw = parseFloat(cs.lineHeight)
    const lhRatio = Number.isFinite(lineHeightRaw) && fontSize > 0 ? Math.round((lineHeightRaw / fontSize) * 100) / 100 : 0
    const fg = resolveColor(cs.color)
    const chars = clean(raw).length
    if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth && !seen.truncated.has(el)) {
      seen.truncated.add(el)
      text.truncated += 1
    }
    const lineCount = new Set(allRects.map(r => Math.round(r.top))).size
    if (lineCount >= 2) {
      text.wrappedChars += chars
      if (chars / lineCount > 80) text.longLineChars += chars
      if (lhRatio > 0 && lhRatio < 1.3) text.tightLineChars += chars
      const broken = brokenWordsIn(node, el)
      text.brokenWords += broken.length
      text.brokenList.push(...broken)
    }
    record(el, cs, chars, fg, (fg ? fg.a : 1) * opacityOf(el), shown, clean(raw))
  }

  // A field's value, or its placeholder while it is empty. A password's value is never read.
  const TEXT_INPUTS = new Set(['text', 'search', 'email', 'url', 'tel', 'number', 'password', 'date', 'time', 'datetime-local', 'month', 'week'])
  for (const el of document.querySelectorAll('input, textarea, select')) {
    if (seen.fields.has(el) || !isVisible(el) || isDisabled(el) || el.closest('[aria-hidden="true"]')) continue
    const rect = el.getBoundingClientRect()
    if (!inViewport(rect) || rect.width < 2 || rect.height < 2) continue
    if (!onTop(el, rect.left + rect.width / 2, rect.top + rect.height / 2)) continue
    let value
    if (el.tagName === 'SELECT') value = el.multiple || el.size > 1 ? null : el.selectedOptions[0]?.textContent
    else if (el.tagName === 'TEXTAREA') value = el.value
    else value = TEXT_INPUTS.has(el.type) ? el.value : null
    if (value === null || value === undefined) continue
    seen.fields.add(el)
    const cs = getComputedStyle(el)
    value = clean(value)
    if (value) {
      if (el.type === 'password') continue
      const fg = resolveColor(cs.color)
      text.fieldChars += value.length
      record(el, cs, value.length, fg, (fg ? fg.a : 1) * opacityOf(el), rect, value)
      continue
    }
    const placeholder = clean(el.getAttribute('placeholder') || '')
    if (!placeholder) continue
    const hint = getComputedStyle(el, '::placeholder')
    const fg = resolveColor(hint.color)
    const hintOpacity = Number(hint.opacity)
    text.fieldChars += placeholder.length
    record(el, cs, placeholder.length, fg, (fg ? fg.a : 1) * (Number.isFinite(hintOpacity) ? hintOpacity : 1) * opacityOf(el), rect, `placeholder: ${placeholder}`)
  }
  text.offenders.sort((a, b) => a.ratio - b.ratio)

  // A link inside a sentence, list item or table cell is sized by the line it sits in: WCAG 2.5.8's
  // inline exception. A link is inline running text when it is displayed inline and its block holds
  // other text outside any link.
  function inRunningText(el) {
    if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') return false
    const host = el.closest('p, li, td, th, dd')
    if (!host) return false
    const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
    while (walk.nextNode()) {
      const node = walk.currentNode
      if (node.textContent.trim() && !node.parentElement.closest('a')) return true
    }
    return false
  }

  const emptyTargets = () => ({ count: 0, small: 0, under44: 0, unnamed: 0, iconOnly: 0, offenders: [], unnamedList: [] })
  const targets = emptyTargets()
  const barTargets = emptyTargets()
  const chromeItems = []
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    if (seen.targets.has(el) || !isVisible(el) || isDisabled(el)) continue
    const rect = el.getBoundingClientRect()
    if (!inViewport(rect) || rect.width < 2 || rect.height < 2) continue
    if (!onTop(el, rect.left + rect.width / 2, rect.top + rect.height / 2)) continue
    if (inRunningText(el)) continue
    seen.targets.add(el)
    const name = accessibleName(el)
    const ownText = clean(el.innerText || '')
    const box = pressBox(el)
    const minDim = Math.round(Math.min(box.width, box.height) * 10) / 10
    const field = el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
    const iconOnly = Boolean(name && !ownText && !field)
    const offender = { name: name.slice(0, 40), width: Math.round(box.width), height: Math.round(box.height), selector: selectorFor(el) }
    if (!el.closest(BAR) && el.closest(CHROME)) {
      chromeItems.push({ ...offender, key: `${el.tagName}|${el.getAttribute('role') || ''}|${name}|${el.getAttribute('href') || ''}`, minDim, unnamed: !name, iconOnly, html: name ? '' : el.outerHTML.replace(/\s+/g, ' ').slice(0, 100) })
      continue
    }
    const into = el.closest(BAR) ? barTargets : targets
    into.count += 1
    if (minDim < 24) into.small += 1
    if (minDim < 44) into.under44 += 1
    if (!name) {
      into.unnamed += 1
      into.unnamedList.push({ selector: offender.selector, html: el.outerHTML.replace(/\s+/g, ' ').slice(0, 100) })
    }
    if (iconOnly) into.iconOnly += 1
    into.offenders.push(offender)
  }
  for (const into of [targets, barTargets]) {
    into.offenders.sort((a, b) => Math.min(a.width, a.height) - Math.min(b.width, b.height))
    into.offenders = into.offenders.slice(0, 10)
  }

  return {
    text: {
      chars: text.chars,
      failChars: text.failChars,
      sampledChars: text.sampledChars,
      unknownChars: text.unknownChars,
      smallChars: text.smallChars,
      wrappedChars: text.wrappedChars,
      longLineChars: text.longLineChars,
      tightLineChars: text.tightLineChars,
      contrastMin: Number.isFinite(text.contrastMin) ? text.contrastMin : null,
      truncated: text.truncated,
      brokenWords: text.brokenWords,
      brokenList: text.brokenList.slice(0, 10),
      fieldChars: text.fieldChars,
      textColors: [...text.textColors],
      fontSizes: text.fontSizes,
      fontFamilies: [...text.fontFamilies],
      fontWeights: text.fontWeights,
      offenders: text.offenders.slice(0, 10),
    },
    targets,
    bar: barTargets,
    chromeItems,
  }
}

const addMaps = (into, from) => {
  for (const [key, value] of Object.entries(from)) into[key] = (into[key] || 0) + value
  return into
}

const sorted = map => Object.fromEntries(Object.entries(map).sort(([a], [b]) => Number(a) - Number(b)))

function mergeTargets(steps) {
  const sum = pick => steps.reduce((total, step) => total + pick(step), 0)
  return {
    count: sum(t => t.count),
    small: sum(t => t.small),
    under44: sum(t => t.under44),
    unnamed: sum(t => t.unnamed),
    iconOnly: sum(t => t.iconOnly),
    offenders: steps.flatMap(t => t.offenders).sort((a, b) => Math.min(a.width, a.height) - Math.min(b.width, b.height)).slice(0, 10),
    unnamedList: steps.flatMap(t => t.unnamedList).slice(0, 10),
  }
}

/** One audit per surface from the audits of its scroll steps. */
export function mergeAudits(steps) {
  const sum = pick => steps.reduce((total, step) => total + pick(step.text), 0)
  const contrast = steps.map(step => step.text.contrastMin).filter(value => value !== null)
  const chars = sum(t => t.chars)
  const unknownChars = sum(t => t.unknownChars)
  return {
    text: {
      chars,
      knownChars: chars - unknownChars,
      failChars: sum(t => t.failChars),
      sampledChars: sum(t => t.sampledChars),
      unknownChars,
      smallChars: sum(t => t.smallChars),
      wrappedChars: sum(t => t.wrappedChars),
      longLineChars: sum(t => t.longLineChars),
      tightLineChars: sum(t => t.tightLineChars),
      contrastMin: contrast.length ? Math.round(Math.min(...contrast) * 100) / 100 : 0,
      truncated: sum(t => t.truncated),
      brokenWords: sum(t => t.brokenWords),
      brokenList: steps.flatMap(step => step.text.brokenList).slice(0, 10),
      fieldChars: sum(t => t.fieldChars),
      textColors: new Set(steps.flatMap(step => step.text.textColors)).size,
      fontSizes: sorted(steps.reduce((all, step) => addMaps(all, step.text.fontSizes), {})),
      fontFamilies: [...new Set(steps.flatMap(step => step.text.fontFamilies))].sort(),
      fontWeights: sorted(steps.reduce((all, step) => addMaps(all, step.text.fontWeights), {})),
      offenders: steps.flatMap(step => step.text.offenders).sort((a, b) => a.ratio - b.ratio).slice(0, 10),
    },
    targets: mergeTargets(steps.map(step => step.targets)),
    bar: mergeTargets(steps.map(step => step.bar)),
    chromeItems: steps.flatMap(step => step.chromeItems),
  }
}
