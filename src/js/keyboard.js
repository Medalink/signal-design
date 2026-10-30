/**
 * The on-screen keyboard. iOS (Safari and WKWebView) and Android Chrome keep
 * the page's layout height when the keyboard opens and slide the page up
 * under it instead, so a full-height app loses its header off the top and its
 * composer floats in the middle of the screen. While the keyboard covers part
 * of the page, this sets data-sd-keyboard on <html>, with --sd-view-height
 * (the part still in view) and --sd-view-top (how far the page slid). The
 * shell fits that part and moves with it, so the header stays and the dock
 * sits on the keyboard. Pinch zoom is left alone.
 *
 * init() calls it. It writes only those three things on <html>, so a
 * framework app can call it on its own.
 */
let started = false;

/* Less than this is a browser toolbar showing or hiding, not a keyboard. */
const KEYBOARD = 80;

export function initKeyboard() {
  const view = typeof window === "undefined" ? null : window.visualViewport;
  if (started || !view) return;
  started = true;
  const root = document.documentElement;
  const fit = () => {
    if (view.scale > 1.01 || root.clientHeight - view.height < KEYBOARD) {
      if (!("sdKeyboard" in root.dataset)) return;
      delete root.dataset.sdKeyboard;
      root.style.removeProperty("--sd-view-height");
      root.style.removeProperty("--sd-view-top");
      return;
    }
    root.style.setProperty("--sd-view-height", `${view.height}px`);
    root.style.setProperty("--sd-view-top", `${view.pageTop}px`);
    root.dataset.sdKeyboard = "";
  };
  view.addEventListener("resize", fit);
  view.addEventListener("scroll", fit);
  fit();
}
