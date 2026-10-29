export const page = "nav-bars";

/** Markup the checks drop into the page and take out again. */
const SAMPLE = `
  <ol class="sd-breadcrumb" data-test-crumbs>
    <li><a href="/" aria-label="Home">H</a></li>
    <li><span>Projects</span></li>
    <li><span aria-current="page">All items</span></li>
  </ol>
  <button class="sd-btn" data-test-btn>Approve <kbd>a</kbd></button>
  <p data-test-prose>Press <kbd>j</kbd> to move.</p>
  <div class="sd-statusbar" data-test-status>
    <span data-test-hint><kbd>N</kbd> next</span>
    <span class="sd-statusbar-end" data-test-end>v1.0</span>
  </div>
  <div data-test-row-box style="width:300px">
    <article class="sd-row"><div class="sd-row-body"><p class="sd-row-title" data-test-title>Stop double charges when a payment retries and the card is declined twice</p></div></article>
  </div>`;

/** Run `probe` in a page with the sample markup added to its body. */
const probe = (page) =>
  page.evaluate((sample) => {
    const host = document.createElement("div");
    host.innerHTML = sample;
    document.body.append(host);
    const q = (s) => host.querySelector(s);
    const shown = (el) => getComputedStyle(el).display !== "none";
    const lineHeight = parseFloat(getComputedStyle(q("[data-test-title]")).lineHeight);
    const out = {
      crumbs: [...q("[data-test-crumbs]").children].filter(shown).map((li) => li.textContent.trim()),
      chevron: getComputedStyle(q("[data-test-crumbs] li:last-child"), "::before").display,
      buttonKbd: shown(q("[data-test-btn] kbd")),
      proseKbd: shown(q("[data-test-prose] kbd")),
      statusHint: shown(q("[data-test-hint]")),
      statusEnd: shown(q("[data-test-end]")),
      titleLines: Math.round(q("[data-test-title]").getBoundingClientRect().height / lineHeight),
      coarse: matchMedia("(pointer: coarse)").matches,
    };
    host.remove();
    return out;
  }, SAMPLE);

/** On a phone the breadcrumb keeps only its current crumb, a row title wraps to two lines, and key hints go on a touch screen; at desktop width and with a mouse nothing changes. */
export default async function checkPhoneChrome(page, where, fail) {
  const desktop = await probe(page);
  if (desktop.crumbs.length !== 3) fail(`${where} phone chrome`, `desktop breadcrumb shows ${desktop.crumbs.length} crumbs`);
  if (!desktop.buttonKbd || !desktop.statusHint) fail(`${where} phone chrome`, "desktop hides a key hint");
  if (desktop.titleLines !== 1) fail(`${where} phone chrome`, `desktop row title takes ${desktop.titleLines} lines`);

  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const phone = await context.newPage();
    await phone.goto(page.url(), { waitUntil: "load" });
    await phone.evaluate(() => document.fonts.ready);
    const got = await probe(phone);
    if (got.crumbs.join() !== "All items") fail(`${where} phone chrome`, `phone breadcrumb shows ${JSON.stringify(got.crumbs)}`);
    if (got.chevron !== "none") fail(`${where} phone chrome`, "phone breadcrumb keeps a chevron");
    if (got.titleLines !== 2) fail(`${where} phone chrome`, `phone row title takes ${got.titleLines} lines`);
    if (!got.coarse) fail(`${where} phone chrome`, "touch context does not report a coarse pointer");
    if (got.buttonKbd || got.statusHint) fail(`${where} phone chrome`, "touch screen still shows a key hint");
    if (!got.proseKbd || !got.statusEnd) fail(`${where} phone chrome`, "touch screen hides a kbd in a sentence or the status end");
  } finally {
    await context.close();
  }
}
