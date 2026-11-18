// Runs in the page against one element. Self-contained: it is serialized into page.evaluate.
// Reports where the element is, how far the scrollers around it must move to show it, in screens
// of each scroller, and how many controls compete for attention on screen at that moment.
// The window is a scroller too: a library page is a long document, and a control near its end
// costs the scrolling to get there. A fixed or sticky element never scrolls out of view.
export function measureElement(el) {
  const INTERACTIVE = 'button, a[href], input, select, textarea, summary, [role=button], [role=tab], [role=switch], [role=menuitem], [role=checkbox], [role=radio], [role=slider], [role=option], [tabindex]:not([tabindex="-1"])'
  const rect = el.getBoundingClientRect()
  let top = rect.top
  let bottom = rect.bottom
  let scrollDistance = 0
  let scrollScreens = 0

  function bring(areaTop, areaBottom, size) {
    let moved = 0
    if (bottom > areaBottom) moved = bottom - areaBottom
    else if (top < areaTop) moved = top - areaTop
    top -= moved
    bottom -= moved
    scrollDistance += Math.abs(moved)
    if (size > 0) scrollScreens += Math.abs(moved) / size
  }

  // Every scroller between the element and the document costs its own scroll, even inside a
  // sticky sidebar. A fixed or sticky ancestor stays in the window, so only the window's own
  // scroll is skipped once one sits between the element and the document.
  const isPinned = node => ['fixed', 'sticky'].includes(getComputedStyle(node).position)
  let windowHolds = isPinned(el)
  for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n)
    if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) {
      const box = n.getBoundingClientRect()
      bring(Math.max(box.top, 0), Math.min(box.bottom, innerHeight), n.clientHeight)
    }
    if (isPinned(n)) windowHolds = true
  }
  if (!windowHolds) bring(0, innerHeight, innerHeight)

  let choicesVisible = 0
  for (const node of document.querySelectorAll(INTERACTIVE)) {
    if (node.disabled || node.getAttribute('aria-disabled') === 'true') continue
    const r = node.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    if (hit && (hit === node || node.contains(hit) || hit.contains(node))) choicesVisible += 1
  }

  return {
    x: rect.left + rect.width / 2,
    y: (top + bottom) / 2,
    size: Math.min(rect.width, rect.height),
    scrollDistance,
    scrollScreens,
    choicesVisible,
  }
}
