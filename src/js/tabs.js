/**
 * Tabs with roving focus.
 *
 *   <div class="sd-tabs" role="tablist">
 *     <button role="tab" aria-selected="true" aria-controls="p1">Overview</button>
 *     <button role="tab" aria-controls="p2">Checks</button>
 *   </div>
 *   <div class="sd-tabpanel" role="tabpanel" id="p1">…</div>
 *   <div class="sd-tabpanel" role="tabpanel" id="p2" hidden>…</div>
 */
function tabsOf(tab) {
  return [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
}

export function selectTab(tab) {
  for (const t of tabsOf(tab)) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    if (panel) panel.hidden = !on;
  }
  tab.dispatchEvent(new CustomEvent("sd:tab", { bubbles: true, detail: { tab } }));
}

export function onTabClick(event) {
  const tab = event.target.closest('[role="tab"]');
  if (tab) selectTab(tab);
}

/** A tab the keyboard passes over. */
const skipped = (tab) => tab.disabled || tab.getAttribute("aria-disabled") === "true";

export function onTabKeydown(event) {
  const tab = event.target.closest('[role="tab"]');
  if (!tab) return;
  const list = tabsOf(tab);
  const i = list.indexOf(tab);
  const steps = { ArrowRight: 1, ArrowLeft: -1 };
  // A vertical tablist also moves on Up and Down; Left and Right keep working there for existing pages.
  if (tab.closest('[role="tablist"]').getAttribute("aria-orientation") === "vertical") Object.assign(steps, { ArrowDown: 1, ArrowUp: -1 });
  const step = steps[event.key];
  if (step === undefined && event.key !== "Home" && event.key !== "End") return;
  event.preventDefault();
  const enabled = list.filter((t) => !skipped(t));
  let next;
  if (event.key === "Home") next = enabled[0];
  else if (event.key === "End") next = enabled[enabled.length - 1];
  else {
    for (let n = 1; n <= list.length && !next; n++) {
      const candidate = list[(((i + step * n) % list.length) + list.length) % list.length];
      if (!skipped(candidate)) next = candidate;
    }
  }
  if (!next) return;
  next.focus();
  selectTab(next);
}

/** Give unselected tabs tabindex=-1 so Tab lands on the selected one. */
export function initTabs(root = document) {
  for (const list of root.querySelectorAll('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
    if (selected) selectTab(selected);
  }
}
