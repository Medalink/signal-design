export const page = "fields";
/** A failed submit lands on the first bad field with its label and the banner in view; each error is tied to its control; a field is checked when left. */
export default async function checkFormErrors(page, where, fail) {
  // Its own context: the library page's context does not open pages.
  const context = await page.context().browser().newContext({ viewport: page.viewportSize() ?? { width: 1280, height: 800 } });
  try {
    const tab = await context.newPage();
    await tab.goto(new URL("form.html", page.url()).href, { waitUntil: "load" });
    await tab.waitForSelector("[data-form]");
    const inView = (selector) => tab.evaluate((sel) => {
      const box = document.querySelector(sel).getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight && box.height > 0;
    }, selector);
    const state = () => tab.evaluate(() => {
      const banner = document.querySelector("[data-form-error]");
      const terms = document.querySelector('[name="terms"]');
      const described = document.getElementById(terms.getAttribute("aria-describedby") ?? "");
      return {
        banner: banner.hidden ? "" : banner.textContent,
        tone: banner.dataset.tone,
        termsDescribedByError: described?.classList.contains("sd-field-error") && getComputedStyle(described).display !== "none",
        focused: document.activeElement?.id || document.activeElement?.name,
      };
    });

    // Leaving a field with a bad value checks it without a submit.
    await tab.fill("#ws-name", "ab");
    await tab.focus("#ws-url");
    const left = await tab.evaluate(() => {
      const name = document.getElementById("ws-name");
      const error = document.getElementById("ws-name-error");
      return { invalid: name.getAttribute("aria-invalid"), shown: getComputedStyle(error).display !== "none", text: error.textContent, describedBy: name.getAttribute("aria-describedby") };
    });
    if (left.invalid !== "true" || !left.shown) fail(`${where} form errors`, "a field left with a short name does not show its error");
    if (left.text !== "Use at least 3 characters." || left.describedBy !== "ws-name-error") fail(`${where} form errors`, `the short-name error is "${left.text}" and the field describes itself by "${left.describedBy}"`);
    await tab.fill("#ws-name", "ACME Design");
    if (await tab.getAttribute("#ws-name", "aria-describedby") !== "ws-name-hint") fail(`${where} form errors`, "a fixed field still points at its error instead of its hint");

    // Submit with three problems: name is fixed, so address, seats and terms.
    await tab.fill("#ws-url", "");
    await tab.fill("#ws-seats", "99");
    await tab.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await tab.click('button[type="submit"]');
    const bad = await tab.evaluate(() => document.querySelector('[aria-invalid="true"]').closest(".sd-field").querySelector(".sd-field-label").id ||= "first-bad-label");
    const first = await state();
    if (first.banner !== "3 fields need fixing.") fail(`${where} form errors`, `banner says "${first.banner}", want "3 fields need fixing."`);
    if (first.tone !== "danger") fail(`${where} form errors`, `banner tone is ${first.tone}, want danger`);
    if (first.focused !== "ws-url") fail(`${where} form errors`, `focus went to ${first.focused}, want the first bad field ws-url`);
    if (!await inView(`#${bad}`)) fail(`${where} form errors`, "the first bad field's label is outside the viewport after a failed submit");
    if (!await inView("[data-form-error]")) fail(`${where} form errors`, "the error banner is outside the viewport after a failed submit");
    if (!first.termsDescribedByError) fail(`${where} form errors`, "the terms checkbox's aria-describedby does not reach a written error");

    // Only the last field is bad: the banner still shows with it.
    await tab.fill("#ws-url", "acme");
    await tab.fill("#ws-seats", "5");
    await tab.click('button[type="submit"]');
    const last = await state();
    if (last.banner !== "1 field needs fixing." || last.focused !== "terms") fail(`${where} form errors`, `with only the terms bad: banner "${last.banner}", focus ${last.focused}`);
    if (!await inView("[data-form-error]") || !await inView("#ws-terms-error")) fail(`${where} form errors`, "with only the terms bad, the banner and the terms error are not both in view");
    if (!last.termsDescribedByError) fail(`${where} form errors`, "the terms error is not reachable from the checkbox");

    // Fixing the last field clears the banner.
    await tab.check('[name="terms"]');
    if ((await state()).banner) fail(`${where} form errors`, "the banner stays after the last field is fixed");
  } finally {
    await context.close();
  }
}
