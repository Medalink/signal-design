/**
 * toast("Approved #21", { tone: "success" })
 * toast("Archived", { action: { label: "Undo", onClick: undo } })
 *
 * Returns a function that dismisses the toast. Messages are set as text,
 * never parsed as HTML; pass a Node to render markup you built yourself.
 */
let region;

/** The open modal dialog, if any. Where `:modal` is not a selector (WKWebView before Safari 16.4) any open dialog stands in. */
function modal() {
  let open;
  try {
    open = document.querySelectorAll("dialog:modal");
  } catch {
    open = document.querySelectorAll("dialog[open]");
  }
  return open[open.length - 1];
}

function toaster() {
  if (!region?.isConnected) {
    region = document.createElement("div");
    region.className = "sd-toaster";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
  }
  // A modal paints above the page and makes it inert, so toasts raised while it is open live inside it.
  const host = modal() ?? document.body;
  if (region.parentNode !== host) {
    host.append(region);
    if (host !== document.body) {
      host.addEventListener("close", () => region.parentNode === host && document.body.append(region), { once: true });
    }
  }
  return region;
}

export function toast(message, { tone, timeout = 2400, action } = {}) {
  const el = document.createElement("div");
  el.className = "sd-toast";
  if (tone) el.dataset.tone = tone;
  el.append(message instanceof Node ? message : document.createTextNode(String(message)));

  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    if (el.dataset.leaving !== undefined) return;
    el.dataset.leaving = "";
    setTimeout(() => el.remove(), 160);
  };

  if (action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sd-btn sd-btn-sm sd-btn-ghost";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      action.onClick?.();
      dismiss();
    });
    el.append(btn);
  }

  toaster().append(el);
  if (timeout > 0) {
    // The pointer or keyboard focus on the toast holds it on screen; it counts down only when neither is.
    let hovered = false;
    let focused = false;
    const settle = () => {
      clearTimeout(timer);
      if (!hovered && !focused) timer = setTimeout(dismiss, timeout);
    };
    settle();
    el.addEventListener("pointerenter", () => ((hovered = true), settle()));
    el.addEventListener("pointerleave", () => ((hovered = false), settle()));
    el.addEventListener("focusin", () => ((focused = true), settle()));
    el.addEventListener("focusout", () => ((focused = false), settle()));
  }
  return dismiss;
}

/** <button data-sd-toast="Saved" data-tone="success"> */
export function onToastClick(event) {
  const trigger = event.target.closest("[data-sd-toast]");
  if (trigger) toast(trigger.dataset.sdToast, { tone: trigger.dataset.sdToastTone });
}
