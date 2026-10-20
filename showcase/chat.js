import { mountBar, savedScrollbars } from "./viewport.js";
import { init, toast } from "../src/js/index.js";

mountBar();
init({ scrollbars: savedScrollbars() });

const feed = document.querySelector("[data-feed]");
const form = document.querySelector("[data-composer]");
const input = form.querySelector("textarea");
const chips = form.querySelector("[data-chips]");
let lastTarget = null;
let replyTo = null;

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const now = () => new Date().toTimeString().slice(0, 5);

feed.scrollTop = feed.scrollHeight;

/* Remember which message a menu or picker was opened from. */
document.addEventListener("click", (event) => {
  const message = event.target.closest(".sd-message");
  if (message) lastTarget = message;
});
document.addEventListener("sd:contextmenu", (event) => {
  lastTarget = event.detail.target;
});

/* Reply: show a chip in the composer. */
function setReply(message) {
  const author = message.querySelector(".sd-message-head b")?.textContent ?? message.previousElementSibling?.querySelector(".sd-message-head b")?.textContent ?? "message";
  const text = message.querySelector(".sd-message-text")?.textContent.trim() ?? "";
  replyTo = { author, text };
  chips.innerHTML = `<span class="sd-chip"><b>Replying to</b> ${escape(author)} <button type="button" aria-label="Cancel reply" data-cancel-reply>×</button></span>`;
  input.focus();
}
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-reply]")) setReply(event.target.closest(".sd-message"));
  if (event.target.closest("[data-menu-reply]") && lastTarget) setReply(lastTarget);
  if (event.target.closest("[data-cancel-reply]")) {
    replyTo = null;
    chips.innerHTML = "";
  }
  if (event.target.closest("[data-dismiss]")) event.target.closest(".sd-banner").remove();
  if (event.target.closest("[data-retry]")) {
    const message = event.target.closest(".sd-message");
    message.removeAttribute("data-failed");
    message.querySelector(".sd-message-status").remove();
    toast("Sent", { tone: "success" });
  }
  const tab = event.target.closest("[data-show-tab]");
  if (tab) {
    document.getElementById("shell").dataset.aside = "open";
    document.getElementById(`t-${tab.dataset.showTab}`).click();
  }
});

/* Emoji picker: add a reaction to the message it came from, or insert into the composer. */
document.querySelector("[data-emoji]").addEventListener("click", (event) => {
  const option = event.target.closest('[role="option"]');
  if (!option) return;
  const emoji = option.textContent;
  document.getElementById("emoji").hidePopover();
  const fromComposer = document.activeElement?.closest?.(".sd-composer") || !lastTarget;
  if (fromComposer) {
    input.setRangeText(emoji, input.selectionStart, input.selectionEnd, "end");
    input.focus();
    return;
  }
  let bar = lastTarget.querySelector(".sd-reactions");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "sd-reactions";
    lastTarget.querySelector(".sd-message-body").append(bar);
  }
  const existing = [...bar.querySelectorAll("[data-sd-reaction]")].find((b) => b.firstChild.textContent.trim() === emoji);
  if (existing) existing.click();
  else bar.insertAdjacentHTML("afterbegin", `<button data-sd-reaction aria-pressed="true">${emoji} <b>1</b></button>`);
});

/* Send: append a message, grouped if the last one was ours. */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const last = [...feed.querySelectorAll(".sd-message")].at(-1);
  const grouped = last && !replyTo && (last.querySelector(".sd-message-head b")?.textContent === "Jane" || ("grouped" in last.dataset && last.previousElementSibling?.querySelector?.(".sd-message-head b")?.textContent === "Jane"));
  const body = escape(text).replace(/@(\w+)/g, '<span class="sd-mention">@$1</span>');
  const reply = replyTo ? `<div class="sd-reply"><b>${escape(replyTo.author)}</b><span>${escape(replyTo.text)}</span></div>` : "";
  feed.insertAdjacentHTML(
    "beforeend",
    grouped
      ? `<article class="sd-message" data-grouped data-pending data-sd-contextmenu="msg-menu"><time>${now()}</time><div class="sd-message-body"><div class="sd-message-text">${body}</div></div></article>`
      : `<article class="sd-message" data-pending data-sd-contextmenu="msg-menu"><span class="sd-avatar" data-tone="success">JD</span><div class="sd-message-body"><header class="sd-message-head"><b>Jane</b><time>${now()}</time></header>${reply}<div class="sd-message-text">${body}</div></div></article>`,
  );
  const added = feed.lastElementChild;
  setTimeout(() => added.removeAttribute("data-pending"), 600);
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  replyTo = null;
  chips.innerHTML = "";
  feed.scrollTop = feed.scrollHeight;
});
