/**
 * Behavior for conversation pieces. Everything is delegated, so rows added
 * later work without setup.
 *
 * Reactions   <button data-sd-reaction aria-pressed="false">👍 <b>2</b></button>
 *             toggles aria-pressed and the count; fires "sd:reaction".
 * Poll        <div class="sd-poll" data-sd-poll [data-multiple]> <button class="sd-poll-option">…
 *             marks the choice; fires "change" with detail.selected (indexes).
 * Autogrow    <textarea data-sd-autogrow> grows with its content.
 * Enter       <textarea data-sd-enter-submit> Enter submits the form, Shift+Enter adds a line.
 * Suggest     <textarea data-sd-suggest="mentions" data-sd-trigger="@">
 *             <div class="sd-suggest" id="mentions" hidden><div class="sd-menu" role="listbox">
 *               <button role="option" data-value="alex">Alex</button>…
 *             Typing the trigger shows options filtered by what follows it;
 *             arrows move, Enter or Tab inserts, Escape closes.
 * Context     <div data-sd-contextmenu="row-menu"> opens <div popover id="row-menu" class="sd-popover">
 *             at the pointer on right-click (or Shift+F10 / the menu key), and
 *             on a touch screen where a long press lifts.
 * Follow      <div class="…" data-sd-follow>…rows…</div> <div class="sd-feed-jump" hidden>…<button>…
 *             keeps the newest row in view while the reader is at the bottom:
 *             rows arriving, images loading, the scroller shrinking under a
 *             growing composer. Scrolled away, it holds still and shows the
 *             jump bar placed right after it; the bar's button goes back down.
 *             Wired by init(); call init() again for a feed added later.
 */

/* ---- Reactions and polls ------------------------------------------------ */

export function onConversationClick(event) {
  const reaction = event.target.closest("[data-sd-reaction]");
  if (reaction) {
    const on = reaction.getAttribute("aria-pressed") !== "true";
    reaction.setAttribute("aria-pressed", String(on));
    const count = reaction.querySelector("b");
    if (count) count.textContent = String(Math.max(0, Number(count.textContent || 0) + (on ? 1 : -1)));
    reaction.dispatchEvent(new CustomEvent("sd:reaction", { bubbles: true, detail: { on } }));
    return;
  }

  const option = event.target.closest("[data-sd-poll] .sd-poll-option");
  if (option) {
    const poll = option.closest("[data-sd-poll]");
    const options = [...poll.querySelectorAll(".sd-poll-option")];
    const multiple = "multiple" in poll.dataset;
    const on = option.getAttribute("aria-pressed") !== "true";
    for (const o of options) {
      if (o === option) o.setAttribute("aria-pressed", String(on));
      else if (!multiple) o.setAttribute("aria-pressed", "false");
    }
    const selected = options.flatMap((o, i) => (o.getAttribute("aria-pressed") === "true" ? [i] : []));
    poll.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { selected } }));
  }
}

/* ---- Composer ----------------------------------------------------------- */

function grow(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight + (textarea.offsetHeight - textarea.clientHeight)}px`;
}

function suggestState(textarea) {
  const list = document.getElementById(textarea.dataset.sdSuggest);
  if (!list) return null;
  const triggers = textarea.dataset.sdTrigger || "@";
  const before = textarea.value.slice(0, textarea.selectionStart);
  const match = before.match(new RegExp(`(^|\\s)([${triggers.replace(/[\]\\^-]/g, "\\$&")}])([^\\s]*)$`));
  return { list, match, options: [...list.querySelectorAll('[role="option"]')] };
}

function showSuggestions(textarea) {
  const state = suggestState(textarea);
  if (!state) return;
  const { list, match, options } = state;
  if (!match) {
    list.hidden = true;
    return;
  }
  const query = match[3].toLowerCase();
  let first = null;
  for (const o of options) {
    const text = `${o.dataset.value || ""} ${o.textContent}`.toLowerCase();
    o.hidden = !text.includes(query);
    delete o.dataset.active;
    if (!o.hidden && !first) first = o;
  }
  if (first) first.dataset.active = "";
  list.hidden = !first;
}

function insertSuggestion(textarea, option) {
  const state = suggestState(textarea);
  if (!state?.match) return;
  const { match } = state;
  const start = textarea.selectionStart - match[2].length - match[3].length;
  const value = `${match[2]}${option.dataset.value || option.textContent.trim()} `;
  textarea.setRangeText(value, start, textarea.selectionStart, "end");
  state.list.hidden = true;
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

export function onConversationInput(event) {
  const textarea = event.target;
  if (!(textarea instanceof HTMLTextAreaElement)) return;
  if ("sdAutogrow" in textarea.dataset) grow(textarea);
  if (textarea.dataset.sdSuggest) showSuggestions(textarea);
}

export function onConversationKeydown(event) {
  const textarea = event.target;
  if (!(textarea instanceof HTMLTextAreaElement)) return;

  const list = textarea.dataset.sdSuggest && document.getElementById(textarea.dataset.sdSuggest);
  if (list && !list.hidden) {
    const visible = [...list.querySelectorAll('[role="option"]:not([hidden])')];
    const i = visible.findIndex((o) => "active" in o.dataset);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = visible[(i + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length];
      for (const o of visible) delete o.dataset.active;
      next.dataset.active = "";
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertSuggestion(textarea, visible[Math.max(0, i)]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      list.hidden = true;
      return;
    }
  }

  if (event.key === "Enter" && !event.shiftKey && !event.isComposing && "sdEnterSubmit" in textarea.dataset) {
    event.preventDefault();
    textarea.form?.requestSubmit();
  }
}

export function onSuggestClick(event) {
  const option = event.target.closest('.sd-suggest [role="option"]');
  if (!option) return;
  const list = option.closest(".sd-suggest");
  const textarea = document.querySelector(`[data-sd-suggest="${list.id}"]`);
  if (textarea) insertSuggestion(textarea, option);
}

/* ---- Context menu ------------------------------------------------------- */

function openContextMenu(target, x, y) {
  const menu = document.getElementById(target.dataset.sdContextmenu);
  if (!menu) return;
  if (menu.matches(":popover-open")) menu.hidePopover();
  menu.showPopover();
  const r = menu.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  menu.style.left = `${Math.min(x, vw - r.width - 8)}px`;
  menu.style.top = `${Math.min(y, vh - r.height - 8)}px`;
  menu.querySelector('[role^="menuitem"], [role="option"]')?.focus();
  menu.dispatchEvent(new CustomEvent("sd:contextmenu", { bubbles: true, detail: { target } }));
}

export function onContextMenu(event) {
  const target = event.target.closest?.("[data-sd-contextmenu]");
  if (!target) return;
  event.preventDefault();
  /* Android's long press sends contextmenu too; the held press opens the menu on the lift. */
  if (held?.target === target) return;
  openContextMenu(target, event.clientX, event.clientY);
}

/*
 * Long press: on a touch screen, holding a [data-sd-contextmenu] row opens its
 * menu where the finger lifts. iOS sends no contextmenu for a long press, and
 * a menu opened under a held finger closes again on the lift. Past the hold
 * the row carries data-sd-held, so it lights before the menu shows. A press
 * that starts on a control inside the row stays that control's.
 */
const HOLD = 450;
const SLOP = 10;
const CONTROLS = "button, a[href], input, textarea, select, [contenteditable]";
let held = null;

function release() {
  if (!held) return;
  clearTimeout(held.timer);
  held.target.removeAttribute("data-sd-held");
  held = null;
}

export function onPressDown(event) {
  release();
  if (event.pointerType !== "touch" || !event.isPrimary) return;
  const target = event.target.closest?.("[data-sd-contextmenu]");
  if (!target || target.contains(event.target.closest(CONTROLS))) return;
  const press = { target, x: event.clientX, y: event.clientY, ready: false };
  press.timer = setTimeout(() => {
    press.ready = true;
    target.setAttribute("data-sd-held", "");
  }, HOLD);
  held = press;
}

export function onPressMove(event) {
  if (held && Math.hypot(event.clientX - held.x, event.clientY - held.y) > SLOP) release();
}

/* iOS turns a lift into mouse events and a click after the menu shows, and
   those dismiss it; cancelling the lift's touchend keeps them from coming. */
let lifted = false;
export function onPressTouchEnd(event) {
  if (!lifted && !held?.ready) return;
  lifted = false;
  event.preventDefault();
}

export function onPressUp(event) {
  if (!held || event.type === "pointercancel" || !held.ready) return release();
  const { target, x, y } = held;
  release();
  lifted = true;
  /* The click that follows the lift can come after the menu shows, on its
     first item. Until the next press starts, a pointer's click is the long
     press's; a key's click (detail 0) still works the menu. */
  const swallow = (click) => {
    if (!click.detail) return;
    click.preventDefault();
    click.stopPropagation();
  };
  addEventListener("click", swallow, true);
  addEventListener("pointerdown", () => removeEventListener("click", swallow, true), { capture: true, once: true });
  setTimeout(() => openContextMenu(target, x, y));
}

export function onContextMenuKey(event) {
  if (!(event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey))) return;
  const target = event.target.closest?.("[data-sd-contextmenu]");
  if (!target) return;
  event.preventDefault();
  const r = target.getBoundingClientRect();
  openContextMenu(target, r.left + 12, r.top + r.height / 2);
}

/* ---- Follow ------------------------------------------------------------- */

const followed = new WeakSet();
/* Within this many pixels of the bottom still counts as at the bottom. */
const AT_END = 8;

function follow(feed) {
  if (followed.has(feed)) return;
  followed.add(feed);
  const next = feed.nextElementSibling;
  const jump = next?.classList.contains("sd-feed-jump") ? next : null;
  const gap = () => feed.scrollHeight - feed.scrollTop - feed.clientHeight;
  let pinned = true;
  let frame = 0;
  /* scrollTop when last seen, to catch code that scrolled up before its scroll event. */
  let top = 0;

  function sync() {
    top = feed.scrollTop;
    if (!jump) return;
    const away = gap() > Math.max(120, feed.clientHeight / 5);
    if (away === !jump.hidden) return;
    jump.hidden = !away;
    if (away) jump.setAttribute("data-new", "");
  }
  function settle() {
    if (frame) return sync();
    if (pinned && feed.scrollTop < top - AT_END && gap() > AT_END) pinned = false;
    if (pinned) feed.scrollTop = feed.scrollHeight;
    sync();
  }
  /* Down to the newest row over 200ms, aiming at the bottom as it moves. */
  function toEnd() {
    pinned = true;
    cancelAnimationFrame(frame);
    frame = 0;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return settle();
    const start = feed.scrollTop;
    const began = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - began) / 200);
      feed.scrollTop = start + (feed.scrollHeight - feed.clientHeight - start) * (1 - (1 - t) ** 3);
      frame = t < 1 ? requestAnimationFrame(step) : 0;
      if (!frame) settle();
    };
    frame = requestAnimationFrame(step);
  }

  feed.addEventListener("scroll", () => {
    if (!frame) pinned = gap() <= AT_END;
    sync();
  }, { passive: true });
  /* The reader takes over: stop the ride down and keep wherever they are. */
  for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
    feed.addEventListener(type, () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
      pinned = gap() <= AT_END;
    }, { passive: true });
  }
  jump?.querySelector("button")?.addEventListener("click", toEnd);
  jump?.addEventListener("animationend", () => jump.removeAttribute("data-new"));

  const sizes = new ResizeObserver(settle);
  sizes.observe(feed);
  for (const row of feed.children) sizes.observe(row);
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) if (node.parentElement === feed) sizes.observe(node);
    }
    settle();
  }).observe(feed, { childList: true, subtree: true });
  settle();
}

export function initConversation(root = document) {
  for (const t of root.querySelectorAll("textarea[data-sd-autogrow]")) grow(t);
  for (const feed of root.querySelectorAll("[data-sd-follow]")) follow(feed);
}
