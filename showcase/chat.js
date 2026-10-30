import { mountBar, savedScrollbars } from "./viewport.js";
import { init, toast, hotkeys, getLabel } from "../src/js/index.js";
import { icon } from "../src/js/icons.js";

mountBar();
/* Each <i data-ic="name"> in the markup becomes the icon of that name, keeping its classes. */
for (const slot of document.querySelectorAll("[data-ic]")) {
  slot.insertAdjacentHTML("afterend", icon(slot.dataset.ic));
  slot.nextElementSibling.classList.add(...slot.classList);
  slot.remove();
}
init({ scrollbars: savedScrollbars() });

const feed = document.querySelector("[data-feed]");
const jump = document.querySelector("[data-jump]");
const form = document.querySelector("[data-composer]");
const input = form.querySelector("textarea");
const typingLine = document.querySelector(".sd-composer-status");
const menu = document.getElementById("msg-menu");
const pins = document.querySelector("[data-pins]");
const pinsButton = document.querySelector('[popovertarget="pinned"]');
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
/* The action bar every message carries, copied onto new ones. */
const ACTIONS = feed.querySelector(".sd-message-actions").outerHTML;
const PEOPLE = { Dana: "var(--sd-success)", Ines: "var(--sd-extra)", Hugo: "var(--sd-accent)", Rosa: "var(--sd-warning)", Mara: "var(--sd-pending)" };
const ME = "Dana";
let lastTarget = null;
let hovered = null;
let forComposer = false;
let replyTo = null;
let ids = 0;

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const now = () => new Date().toTimeString().slice(0, 5);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rich = (text) => escape(text).replace(/@(\w+)/g, (_, name) => `<span class="sd-mention"${PEOPLE[name] ? ` style="--who: ${PEOPLE[name]}"` : ""}>@${name}</span>`);
const idOf = (message) => (message.id ||= `m-${++ids}`);
/* Run fn when el's own animation ends, not one of its children's. */
const after = (el, fn) => el.addEventListener("animationend", function done(event) {
  if (event.target !== el) return;
  el.removeEventListener("animationend", done);
  fn();
});
const author = (message) => {
  for (let m = message; m; m = m.previousElementSibling) {
    const b = m.querySelector?.(".sd-message-author");
    if (b) return { name: b.textContent, who: m.style.getPropertyValue("--who").trim() };
  }
  return { name: "message", who: "" };
};
/* The words of a message, without its author, tags or meta. */
const textOf = (message) => [...(message.querySelector(".sd-message-text")?.childNodes ?? [])]
  .filter((n) => !n.classList?.contains("sd-message-author") && !n.classList?.contains("sd-message-meta") && !n.classList?.contains("sd-message-tag"))
  .map((n) => n.textContent).join("").trim();

/* ---- Rows --------------------------------------------------------------- */

/* Append a message, grouped under the last one when it is the same author's. */
function post({ name, text, own = false, ref = null }) {
  const last = feed.lastElementChild;
  const grouped = !ref && last?.matches(".sd-message") && author(last).name === name;
  const quote = ref
    ? `<span class="sd-message-ref-mark">${icon("reply")}</span><button class="sd-message-ref" data-to="${idOf(ref.message)}"><b style="--who: ${ref.who}">${escape(ref.name)}</b><span>${escape(ref.text)}</span></button>`
    : "";
  const attrs = ["data-new", own && "data-own", own && "data-pending", grouped && "data-grouped", ref && "data-reply"].filter(Boolean).join(" ");
  feed.insertAdjacentHTML(
    "beforeend",
    `<article class="sd-message" ${attrs} data-sd-contextmenu="msg-menu"${grouped ? ` title="${now()}"` : ""} style="--who: ${PEOPLE[name]}">${quote}${grouped ? "" : `<time class="sd-message-time">${now()}</time>`}<div class="sd-message-body"><div class="sd-message-text">${grouped ? "" : `<b class="sd-message-author">${escape(name)}</b>`}${rich(text)}</div></div>${ACTIONS}</article>`,
  );
  const added = feed.lastElementChild;
  after(added, () => added.removeAttribute("data-new"));
  return added;
}

/* Bring a message to the middle of the feed and flash it. */
function show(message) {
  message.scrollIntoView({ block: "center", behavior: reduced.matches ? "auto" : "smooth" });
  message.removeAttribute("data-flash");
  void message.offsetWidth;
  message.setAttribute("data-flash", "");
  after(message, () => message.removeAttribute("data-flash"));
}

/* A reaction from someone else: a new chip, or one more on an existing one. */
function theyReact(message, emoji) {
  const bar = reactions(message);
  const chip = [...bar.querySelectorAll("[data-sd-reaction]")].find((b) => b.querySelector("span").textContent === emoji);
  if (chip) {
    const count = chip.querySelector("b");
    count.textContent = String(Number(count.textContent) + 1);
    chip.setAttribute("data-new", "");
    after(chip, () => chip.removeAttribute("data-new"));
    return;
  }
  bar.querySelector(".sd-reactions-add").insertAdjacentHTML("beforebegin", `<button data-sd-reaction aria-pressed="false" data-new><span>${escape(emoji)}</span><b>1</b></button>`);
}
function reactions(message) {
  let bar = message.querySelector(".sd-reactions");
  if (!bar) {
    message.querySelector(".sd-message-body").insertAdjacentHTML("beforeend", `<div class="sd-reactions"><button class="sd-reactions-add" aria-label="Add reaction" data-sd-tip="Add reaction" popovertarget="emoji">${icon("plus")}</button></div>`);
    bar = message.querySelector(".sd-reactions");
  }
  return bar;
}
/* The viewer's own reaction from the action bar or the picker: toggles theirs. */
function react(message, emoji) {
  const bar = reactions(message);
  const existing = [...bar.querySelectorAll("[data-sd-reaction]")].find((b) => b.querySelector("span").textContent === emoji);
  if (existing) return existing.click();
  bar.querySelector(".sd-reactions-add").insertAdjacentHTML("beforebegin", `<button data-sd-reaction aria-pressed="true" data-new><span>${escape(emoji)}</span><b>1</b></button>`);
}
document.addEventListener("sd:reaction", (event) => {
  const chip = event.target;
  if (chip.querySelector("b")?.textContent === "0") chip.remove();
});

/* ---- The others: typing, then a message ----------------------------------- */

/* While the reader is scrolled up, the jump bar counts what arrived below. */
const jumpText = jump.querySelector("span");
const idleText = jumpText.textContent;
let unseen = 0;
new MutationObserver(() => {
  if (!jump.hidden) return;
  unseen = 0;
  jumpText.textContent = idleText;
}).observe(jump, { attributes: true, attributeFilter: ["hidden"] });

function typing(name) {
  typingLine.innerHTML = name ? `<span class="sd-typing"><i><b></b></i><span><b style="--who: ${PEOPLE[name]}">${name}</b> is typing</span></span>` : "";
}
async function arrive(name, text, { lead = 600, type = 2200 } = {}) {
  await wait(lead);
  typing(name);
  await wait(type);
  typing(null);
  const away = !jump.hidden;
  const message = post({ name, text });
  if (away) jumpText.textContent = ++unseen === 1 ? "1 new message" : `${unseen} new messages`;
  return message;
}

/* Rosa is typing when the page opens. The room answers the viewer's first two
   messages: Rosa finishes and Mara replies, then Hugo reacts. Then it goes quiet,
   and until the viewer sends, nothing moves on its own. */
const answers = [
  async () => {
    await arrive("Rosa", "Seedlings are hardening off on the porch, so Saturday works for me.", { lead: 0, type: 1200 });
    await arrive("Mara", "Great, see you there. I will bring the trowels.", { lead: 700, type: 2200 });
  },
  (mine) => wait(1400).then(() => mine.isConnected && theyReact(mine, "👍")),
];

/* ---- Reply, edit, pin, delete ------------------------------------------- */

function setReply(message) {
  if (message.hasAttribute("data-editing")) return;
  document.querySelector('.sd-message[aria-current="true"]')?.removeAttribute("aria-current");
  const { name, who } = author(message);
  const text = textOf(message);
  replyTo = { message, name, who, text };
  message.setAttribute("aria-current", "true");
  form.querySelector(".sd-composer-reply")?.remove();
  form.insertAdjacentHTML("afterbegin", `<div class="sd-composer-reply">${icon("reply")}<span>Replying to <b style="--who: ${who}">${escape(name)}</b> · ${escape(text)}</span><button type="button" class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" aria-label="Cancel reply" data-sd-tip="Cancel reply (Esc)" data-cancel-reply>${icon("close")}</button></div>`);
  input.focus();
}
function clearReply() {
  replyTo = null;
  form.querySelector(".sd-composer-reply")?.remove();
  document.querySelector('.sd-message[aria-current="true"]')?.removeAttribute("aria-current");
}

/* Edit in place: the name on its own line, the text in a field, Enter saves and Escape puts it back. */
function edit(message) {
  if (message.hasAttribute("data-editing") || !message.hasAttribute("data-own")) return;
  if (replyTo?.message === message) clearReply();
  const text = message.querySelector(".sd-message-text");
  const name = text.querySelector(".sd-message-author");
  message.setAttribute("data-editing", "");
  text.hidden = true;
  text.insertAdjacentHTML(
    "afterend",
    `${name ? `<header class="sd-message-head"><b>${escape(name.textContent)}</b><span>Editing</span></header>` : ""}<div class="sd-message-edit"><textarea rows="1" data-sd-autogrow aria-label="Edit message"></textarea><div class="sd-message-edit-hint"><span><button type="button" data-edit="cancel">Esc</button> cancel</span><span><button type="button" data-edit="save">Enter</button> save</span></div></div>`,
  );
  const box = message.querySelector(".sd-message-edit textarea");
  box.value = textOf(message);
  box.dispatchEvent(new Event("input", { bubbles: true }));
  box.focus();
  box.setSelectionRange(box.value.length, box.value.length);
  const done = (save) => {
    const value = box.value.trim();
    if (save && value && value !== textOf(message)) {
      text.innerHTML = `${name ? name.outerHTML : ""}${rich(value)}<span class="sd-message-meta"><span>edited</span></span>`;
    }
    message.querySelector(".sd-message-head")?.remove();
    message.querySelector(".sd-message-edit").remove();
    message.removeAttribute("data-editing");
    text.hidden = false;
    input.focus();
  };
  box.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); done(false); }
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); done(true); }
  });
  message.querySelector(".sd-message-edit-hint").addEventListener("click", (event) => {
    const which = event.target.closest("[data-edit]")?.dataset.edit;
    if (which) done(which === "save");
  });
}

function pinCount() {
  const n = pins.children.length;
  pinsButton.querySelector(".sd-badge-count").textContent = String(n);
  pinsButton.setAttribute("aria-label", `Pinned, ${n}`);
}
/* Pin: a row in the pinned list and a tag on the message. Pin again to unpin. */
const pinned = (message) => pins.querySelector(`[data-to="${idOf(message)}"]`);
function pin(message) {
  const id = idOf(message);
  if (pinned(message)) {
    message.querySelector(".sd-message-tag[data-pin]")?.remove();
    pinned(message).remove();
    pinCount();
    toast("Unpinned");
    return;
  }
  const text = message.querySelector(".sd-message-text");
  const html = `<span class="sd-message-tag" data-pin>${icon("pin")}Pinned</span>`;
  const name = text.querySelector(".sd-message-author");
  if (name) name.insertAdjacentHTML("afterend", html);
  else text.insertAdjacentHTML("afterbegin", html);
  const { name: who } = author(message);
  pins.insertAdjacentHTML("afterbegin", `<a class="sd-item" href="#${id}" data-to="${id}">${icon("pin")}<span class="sd-item-body"><span class="sd-item-title">${escape(textOf(message))}</span><span class="sd-item-sub">${escape(who)} · today</span></span></a>`);
  pinCount();
  toast("Pinned");
}

/* Delete folds the row out, with Undo. The next row of its group takes over its time and name. */
function remove(message) {
  const next = message.nextElementSibling;
  const promote = !message.hasAttribute("data-grouped") && next?.matches(".sd-message[data-grouped]") ? next : null;
  if (replyTo?.message === message) clearReply();
  if (lastTarget === message) lastTarget = null;
  message.style.maxHeight = `${message.offsetHeight}px`;
  message.setAttribute("data-leaving", "");
  after(message, () => {
    if (promote) {
      promote.removeAttribute("data-grouped");
      promote.insertAdjacentHTML("afterbegin", `<time class="sd-message-time">${promote.title || now()}</time>`);
      promote.querySelector(".sd-message-text").insertAdjacentHTML("afterbegin", message.querySelector(".sd-message-author").outerHTML);
    }
    message.remove();
    message.removeAttribute("data-leaving");
    message.style.maxHeight = "";
    pins.querySelector(`[data-to="${message.id}"]`)?.remove();
    pinCount();
  });
  toast("Message deleted", {
    timeout: 5000,
    action: {
      label: "Undo",
      onClick() {
        if (promote) {
          promote.setAttribute("data-grouped", "");
          promote.querySelector(":scope > .sd-message-time")?.remove();
          promote.querySelector(".sd-message-text > .sd-message-author")?.remove();
        }
        if (next?.isConnected) next.before(message);
        else feed.append(message);
        message.querySelector(".sd-message-tag[data-pin]")?.remove();
        message.setAttribute("data-new", "");
        after(message, () => message.removeAttribute("data-new"));
      },
    },
  });
}

/* ---- Pointer and keys --------------------------------------------------- */

/* Remember which message a menu or picker was opened from, and hold its hover while it is open. */
document.addEventListener("click", (event) => {
  const message = event.target.closest(".sd-message");
  if (message) lastTarget = message;
  const opener = event.target.closest('[popovertarget="emoji"]');
  if (opener) forComposer = opener.hasAttribute("data-composer-emoji");
});
/* The context menu opens before sd:contextmenu names its row, so take the row on the
   way in: from the right-click, or from the press a touch screen's long press starts with. */
for (const type of ["contextmenu", "pointerdown"]) {
  document.addEventListener(type, (event) => {
    lastTarget = event.target.closest(".sd-message") ?? lastTarget;
  }, true);
}
document.addEventListener("keydown", (event) => {
  if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) lastTarget = event.target.closest?.(".sd-message") ?? lastTarget;
}, true);
feed.addEventListener("pointerover", (event) => {
  hovered = event.target.closest(".sd-message");
});
feed.addEventListener("pointerleave", () => {
  hovered = null;
});
for (const id of ["msg-menu", "emoji"]) {
  document.getElementById(id).addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    const target = id === "emoji" && forComposer ? null : lastTarget;
    target?.toggleAttribute("data-hover", open);
    target?.querySelector(`[popovertarget="${id}"]`)?.setAttribute("aria-expanded", String(open));
  });
}
/* The menu fits the message it opened on: Edit and Delete for your own, Pin or Unpin. */
menu.addEventListener("beforetoggle", (event) => {
  if (event.newState !== "open" || !lastTarget) return;
  const own = lastTarget.hasAttribute("data-own");
  for (const item of menu.querySelectorAll("[data-own-only]")) item.hidden = !own;
  menu.querySelector('[data-menu="pin"] > span').textContent = pinned(lastTarget) ? "Unpin" : "Pin";
});

function openPicker(message) {
  lastTarget = message;
  forComposer = false;
  message.querySelector('.sd-message-actions [popovertarget="emoji"]').click();
}
async function copy(message) {
  try {
    await navigator.clipboard.writeText(textOf(message));
    toast(getLabel("copy.done"));
  } catch {
    toast(getLabel("copy.failed"), { tone: "warning" });
  }
}
const ACTS = { reply: setReply, react: openPicker, edit, copy, pin, delete: remove };

document.addEventListener("click", (event) => {
  const quick = event.target.closest(".sd-message-actions [data-emoji]");
  if (quick) react(quick.closest(".sd-message"), quick.textContent);
  /* The action bar's Reply, not a message that is itself a reply (also data-reply). */
  if (event.target.closest(".sd-message-actions [data-reply]")) setReply(event.target.closest(".sd-message"));
  const item = event.target.closest("#msg-menu [data-menu]");
  if (item && lastTarget) {
    menu.hidePopover();
    ACTS[item.dataset.menu](lastTarget);
  }
  if (event.target.closest("[data-cancel-reply]")) {
    clearReply();
    input.focus();
  }
  const to = event.target.closest("[data-to]");
  if (to) {
    event.preventDefault();
    document.getElementById("pinned").hidePopover();
    const message = document.getElementById(to.dataset.to);
    if (message) show(message);
  }
  if (event.target.closest("[data-retry]")) {
    const message = event.target.closest(".sd-message");
    message.removeAttribute("data-failed");
    message.querySelector(".sd-message-status").remove();
    message.setAttribute("data-pending", "");
    setTimeout(() => message.removeAttribute("data-pending"), 700);
    input.focus();
  }
  const head = event.target.closest("[data-roster-toggle]");
  if (head) {
    const open = head.getAttribute("aria-expanded") !== "true";
    head.setAttribute("aria-expanded", String(open));
    head.closest(".sd-roster-group").querySelector("ul").hidden = !open;
  }
});

/* R, E, C and P act on the message under the pointer or with focus, or the one whose menu is open. */
const target = () => (menu.matches(":popover-open") ? lastTarget : document.activeElement?.closest?.("[data-feed] .sd-message") || hovered);
const act = (name) => () => {
  const message = target();
  if (!message?.isConnected) return;
  if (menu.matches(":popover-open")) menu.hidePopover();
  ACTS[name](message);
};
hotkeys({ r: act("reply"), e: act("react"), c: act("copy"), p: act("pin") });

/* In the composer: Escape drops the reply, Up on an empty box edits your last message. */
input.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || !document.getElementById("mentions").hidden) return;
  if (event.key === "Escape" && replyTo) {
    event.preventDefault();
    clearReply();
  }
  if (event.key === "ArrowUp" && !input.value) {
    const mine = [...feed.querySelectorAll(".sd-message[data-own]:not([data-failed], [data-leaving])")].at(-1);
    if (!mine) return;
    event.preventDefault();
    edit(mine);
  }
});

/* ---- Members, emoji ----------------------------------------------------- */

/* Member search: rows that do not match are hidden, and a role with no match goes with them. */
const members = document.querySelector("[data-roster-search]");
members.addEventListener("input", () => {
  const q = members.value.trim().toLowerCase();
  for (const group of document.querySelectorAll(".sd-roster-group")) {
    let shown = 0;
    for (const row of group.querySelectorAll("li")) {
      row.hidden = !row.querySelector(".sd-roster-name").textContent.toLowerCase().includes(q);
      if (!row.hidden) shown++;
    }
    group.hidden = shown === 0;
  }
});

/* Emoji picker: categories, search, the name under the pointer, and the pick. */
const picker = document.getElementById("emoji");
const scroll = picker.querySelector("[data-emoji]");
const foot = picker.querySelector("[data-emoji-foot]");
const search = picker.querySelector("[data-emoji-search]");
picker.addEventListener("pointerover", (event) => {
  const option = event.target.closest(".sd-emoji-grid > button");
  if (!option) return;
  foot.children[0].textContent = option.textContent;
  foot.children[1].textContent = option.getAttribute("aria-label");
  foot.children[2].textContent = "";
});
picker.addEventListener("click", (event) => {
  const cat = event.target.closest("[data-emoji-cat]");
  if (cat) {
    for (const b of picker.querySelectorAll("[data-emoji-cat]")) b.setAttribute("aria-pressed", String(b === cat));
    scroll.scrollTo({ top: document.getElementById(`emoji-${cat.dataset.emojiCat}`).offsetTop - scroll.offsetTop });
    return;
  }
  const option = event.target.closest(".sd-emoji-grid > button");
  if (!option) return;
  const emoji = option.textContent;
  picker.hidePopover();
  if (forComposer) {
    input.setRangeText(emoji, input.selectionStart, input.selectionEnd, "end");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  } else if (lastTarget) react(lastTarget, emoji);
});
search.addEventListener("input", () => {
  const q = search.value.trim();
  for (const b of picker.querySelectorAll(".sd-emoji-grid > button")) b.hidden = q !== "" && !b.textContent.includes(q);
});

/* ---- Send --------------------------------------------------------------- */

/* Your own message always lands in view, even from far up the feed. */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const mine = post({ name: ME, text, own: true, ref: replyTo });
  setTimeout(() => mine.removeAttribute("data-pending"), 600);
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  clearReply();
  feed.scrollTop = feed.scrollHeight;
  answers.shift()?.(mine);
});
