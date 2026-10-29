export const page = "window";

/** A shell with a rail and a main area but no sidebar, laid over the page. */
const BARE = `
  <div class="sd-shell" data-test-bare style="position: fixed; inset: 0; z-index: 99999">
    <header class="sd-shell-topbar"><span class="sd-shell-topbar-label">Stats</span></header>
    <nav class="sd-rail" aria-label="Pages"><div class="sd-rail-list"></div></nav>
    <main class="sd-shell-main" data-test-main></main>
  </div>`;

const probe = (page) =>
  page.evaluate((markup) => {
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
    const main = host.querySelector("[data-test-main]").getBoundingClientRect();
    const out = { viewport: window.innerWidth, mainWidth: Math.round(main.width), mainLeft: Math.round(main.left) };
    host.remove();
    return out;
  }, BARE);

/** A shell with no sidebar gives its main area the rest of the row on a desktop and the whole width on a phone. */
export default async function checkShellNoSidebar(page, where, fail) {
  const desktop = await probe(page);
  if (desktop.mainLeft < 90 || desktop.mainWidth + desktop.mainLeft !== desktop.viewport) fail(`${where} shell no sidebar`, `desktop bare shell main ${desktop.mainLeft}+${desktop.mainWidth} of ${desktop.viewport}`);

  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const phone = await context.newPage();
    await phone.goto(page.url(), { waitUntil: "load" });
    await phone.evaluate(() => document.fonts.ready);
    const got = await probe(phone);
    if (got.mainWidth !== got.viewport || got.mainLeft !== 0) fail(`${where} shell no sidebar`, `a shell with no sidebar gives main ${got.mainWidth}px at ${got.mainLeft} of ${got.viewport}px`);
  } finally {
    await context.close();
  }
}
