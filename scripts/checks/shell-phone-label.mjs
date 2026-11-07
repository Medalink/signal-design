export const page = "window";

/** A shell with a rail and a main area but no sidebar, laid over the page. */
const BARE = `
  <div class="sd-shell" data-test-bare style="position: fixed; inset: 0; z-index: 99999">
    <header class="sd-shell-topbar"><span class="sd-shell-topbar-label">Stats</span></header>
    <nav class="sd-rail" aria-label="Pages"><div class="sd-rail-list"></div></nav>
    <main class="sd-shell-main" data-test-main><div class="sd-shell-header" data-test-header>
      <div class="sd-shell-crumbs" data-test-crumbs><ol class="sd-breadcrumb"><li><span aria-current="page">Stats</span></li></ol></div>
      <div class="sd-shell-header-end"><button class="sd-btn sd-btn-sm" type="button">Export</button></div>
    </div></main>
  </div>`;

const probe = (page) =>
  page.evaluate((markup) => {
    const shown = (el) => el && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0;
    // The article breadcrumb is the one place the page name shows on a library page.
    const library = {
      crumbs: shown(document.querySelector(".doc-article .doc-crumbs")),
    };
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
    const header = host.querySelector("[data-test-header]");
    const end = header.querySelector(".sd-shell-header-end").getBoundingClientRect();
    const out = {
      library,
      viewport: window.innerWidth,
      bareCrumbs: shown(host.querySelector("[data-test-crumbs]")),
      bareBridge: getComputedStyle(header, "::before").display,
      actionsAtEnd: Math.round(end.right) === Math.round(header.getBoundingClientRect().right),
    };
    host.remove();
    return out;
  }, BARE);

/** On a phone the page name appears once: on the doc breadcrumb above the article, which never hides. */
export default async function checkShellPhoneLabel(page, where, fail) {
  const desktop = await probe(page);
  if (!desktop.bareCrumbs) fail(`${where} shell phone label`, "desktop hides the crumb bar");
  if (!desktop.library.crumbs) fail(`${where} shell phone label`, "desktop hides the doc breadcrumb");

  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const phone = await context.newPage();
    await phone.goto(page.url(), { waitUntil: "load" });
    await phone.evaluate(() => document.fonts.ready);
    const got = await probe(phone);
    if (!got.library.crumbs) fail(`${where} shell phone label`, `library page shows no doc breadcrumb on a phone`);
    if (got.bareCrumbs || got.bareBridge !== "none") fail(`${where} shell phone label`, `top bar label and crumb chip both show (${got.bareCrumbs}, bridge ${got.bareBridge})`);
    if (!got.actionsAtEnd) fail(`${where} shell phone label`, "header actions do not sit at the end once the chip is hidden");
  } finally {
    await context.close();
  }
}
