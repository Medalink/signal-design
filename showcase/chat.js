import { mountBar, savedScrollbars } from "./viewport.js";
import { init, toast } from "../src/js/index.js";
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
let lastTarget = null;
let forComposer = false;
let replyTo = null;

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const now = () => new Date().toTimeString().slice(0, 5);
const author = (message) => {
  for (let m = message; m; m = m.previousElementSibling) {
    const b = m.querySelector?.(".sd-message-author");
    if (b) return { name: b.textContent, who: m.style.getPropertyValue("--who") };
  }
  return { name: "message", who: "" };
};

feed.scrollTop = feed.scrollHeight;

/* Jump to present: shown while the feed is scrolled away from the newest message. */
function syncJump() {
  const away = feed.scrollHeight - feed.scrollTop - feed.clientHeight > Math.max(120, feed.clientHeight / 5);
  if (away === !jump.hidden) return;
  jump.hidden = !away;
  if (away) jump.setAttribute("data-new", "");
}
feed.addEventListener("scroll", syncJump, { passive: true });
jump.addEventListener("click", () => feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" }));
jump.addEventListener("animationend", () => jump.removeAttribute("data-new"));

/* Remember which message a menu or picker was opened from, and hold its hover while the menu is open. */
document.addEventListener("click", (event) => {
  const message = event.target.closest(".sd-message");
  if (message) lastTarget = message;
  const opener = event.target.closest('[popovertarget="emoji"]');
  if (opener) forComposer = opener.hasAttribute("data-composer-emoji");
});
document.addEventListener("sd:contextmenu", (event) => {
  lastTarget = event.detail.target;
});
for (const id of ["msg-menu", "emoji"]) {
  document.getElementById(id).addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    const target = id === "emoji" && forComposer ? null : lastTarget;
    target?.toggleAttribute("data-hover", open);
    target?.querySelector(`[popovertarget="${id}"]`)?.setAttribute("aria-expanded", String(open));
  });
}

/* Reply: a bar across the top of the composer, and aria-current on the message. */
function setReply(message) {
  document.querySelector('.sd-message[aria-current="true"]')?.removeAttribute("aria-current");
  const { name, who } = author(message);
  const text = message.querySelector(".sd-message-text")?.childNodes;
  const quote = [...(text ?? [])].filter((n) => !n.classList?.contains("sd-message-author") && !n.classList?.contains("sd-message-meta")).map((n) => n.textContent).join("").trim();
  replyTo = { name, who, text: quote };
  message.setAttribute("aria-current", "true");
  form.querySelector(".sd-composer-reply")?.remove();
  form.insertAdjacentHTML("afterbegin", `<div class="sd-composer-reply">${icon("undo")}<span>Replying to <b style="--who:${who}">${escape(name)}</b> · ${escape(quote)}</span><button type="button" class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" aria-label="Cancel reply" data-sd-tip="Cancel reply" data-cancel-reply>${icon("close")}</button></div>`);
  input.focus();
}
function clearReply() {
  replyTo = null;
  form.querySelector(".sd-composer-reply")?.remove();
  document.querySelector('.sd-message[aria-current="true"]')?.removeAttribute("aria-current");
}

/* Reactions from the action bar's quick emoji or the picker. */
function react(message, emoji) {
  let bar = message.querySelector(".sd-reactions");
  if (!bar) {
    message.querySelector(".sd-message-body").insertAdjacentHTML("beforeend", `<div class="sd-reactions"><button class="sd-reactions-add" aria-label="Add reaction" data-sd-tip="Add reaction" popovertarget="emoji">${icon("plus")}</button></div>`);
    bar = message.querySelector(".sd-reactions");
  }
  const existing = [...bar.querySelectorAll("[data-sd-reaction]")].find((b) => b.querySelector("span").textContent === emoji);
  if (existing) return existing.click();
  bar.querySelector(".sd-reactions-add").insertAdjacentHTML("beforebegin", `<button data-sd-reaction aria-pressed="true" data-new><span>${escape(emoji)}</span><b>1</b></button>`);
}

document.addEventListener("click", (event) => {
  const quick = event.target.closest(".sd-message-actions [data-emoji]");
  if (quick) react(quick.closest(".sd-message"), quick.textContent);
  if (event.target.closest("[data-reply]")) setReply(event.target.closest(".sd-message"));
  if (event.target.closest("[data-menu-reply]") && lastTarget) {
    document.getElementById("msg-menu").hidePopover();
    setReply(lastTarget);
  }
  if (event.target.closest("[data-cancel-reply]")) clearReply();
  if (event.target.closest("[data-retry]")) {
    const message = event.target.closest(".sd-message");
    message.removeAttribute("data-failed");
    message.querySelector(".sd-message-status").remove();
    toast("Sent", { tone: "success" });
  }
  const head = event.target.closest("[data-roster-toggle]");
  if (head) {
    const open = head.getAttribute("aria-expanded") !== "true";
    head.setAttribute("aria-expanded", String(open));
    head.closest(".sd-roster-group").querySelector("ul").hidden = !open;
  }
});

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
document.addEventListener("sd:reaction", (event) => {
  const chip = event.target;
  if (chip.querySelector("b")?.textContent === "0") chip.remove();
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

/* Send: append a message, grouped if the last one was ours within five minutes. */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const last = [...feed.querySelectorAll(".sd-message")].at(-1);
  const grouped = last && !replyTo && author(last).name === "Dana";
  const body = escape(text).replace(/@(\w+)/g, '<span class="sd-mention">@$1</span>');
  const ref = replyTo ? `<span class="sd-message-ref-mark">${icon("undo")}</span><button class="sd-message-ref"><b style="--who:${replyTo.who}">${escape(replyTo.name)}</b><span>${escape(replyTo.text)}</span></button>` : "";
  const actions = feed.querySelector(".sd-message-actions").outerHTML;
  feed.insertAdjacentHTML(
    "beforeend",
    grouped
      ? `<article class="sd-message" data-own data-grouped data-pending data-new data-sd-contextmenu="msg-menu" title="${now()}" style="--who: var(--sd-success)"><div class="sd-message-body"><div class="sd-message-text">${body}</div></div>${actions}</article>`
      : `<article class="sd-message" data-own${replyTo ? " data-reply" : ""} data-pending data-new data-sd-contextmenu="msg-menu" style="--who: var(--sd-success)">${ref}<time class="sd-message-time">${now()}</time><div class="sd-message-body"><div class="sd-message-text"><b class="sd-message-author">Dana</b>${body}</div></div>${actions}</article>`,
  );
  const added = feed.lastElementChild;
  added.addEventListener("animationend", () => added.removeAttribute("data-new"), { once: true });
  setTimeout(() => added.removeAttribute("data-pending"), 600);
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  clearReply();
  feed.scrollTop = feed.scrollHeight;
});
