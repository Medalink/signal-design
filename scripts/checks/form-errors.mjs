export const page = "fields";
/** A failed submit lands on the first bad field with its label and the banner in view; each error is tied to its control; a field is checked when left. */
export default async function checkFormErrors(page, where, fail) {
  // Its own context: the library page's context does not open pages.
  const context = await page.context().browser().newContext({ viewport: page.viewportSize() ?? { width: 1280, height: 800 } });
  try {
    const tab = await context.newPage();
    await tab.goto(new URL("form.html", page.url()).href, { waitUntil: "load" });
    await tab.waitForSelector("#command-form");
    const banner = "#command-form [data-form-error]";
    const inView = (selector) => tab.evaluate((sel) => {
      const box = document.querySelector(sel).getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight && box.height > 0;
    }, selector);
    const state = () => tab.evaluate(() => {
      const banner = document.querySelector("#command-form [data-form-error]");
      const trust = document.getElementById("cmd-trust");
      const described = document.getElementById(trust.getAttribute("aria-describedby") ?? "");
      return {
        banner: banner.hidden ? "" : banner.textContent,
        tone: banner.dataset.tone,
        trustDescribedByError: described?.classList.contains("sd-field-error") && getComputedStyle(described).display !== "none",
        focused: document.activeElement?.id || document.activeElement?.name,
      };
    });

    // Leaving a field with a bad value checks it without a submit; an address is checked as a URL, and Detect says why it cannot run.
    await tab.fill("#srv-address", "localhost:11434");
    await tab.focus("#cmd-args");
    const address = await tab.evaluate(() => {
      const field = document.getElementById("srv-address");
      const detect = document.querySelector("[data-detect]");
      return {
        invalid: field.getAttribute("aria-invalid"),
        shown: getComputedStyle(document.getElementById("srv-address-error")).display !== "none",
        text: document.getElementById("srv-address-error").textContent,
        describedBy: field.getAttribute("aria-describedby"),
        detectOff: detect.getAttribute("aria-disabled"),
        reason: document.getElementById(detect.getAttribute("aria-describedby")).textContent,
      };
    });
    if (address.invalid !== "true" || address.describedBy !== "srv-address-error") fail(`${where} form errors`, `an address without http:// is not flagged on blur (invalid ${address.invalid}, describedby ${address.describedBy})`);
    if (address.text !== "Use a full address, like http://localhost:11434." || !address.shown) fail(`${where} form errors`, `the address error is "${address.text}" (shown: ${address.shown})`);
    if (address.detectOff !== "true" || !address.reason.includes("valid")) fail(`${where} form errors`, `Detect with a bad address is aria-disabled=${address.detectOff} with the reason "${address.reason}"`);
    await tab.fill("#srv-address", "http://localhost:11434");
    const fixed = await tab.evaluate(() => ({ invalid: document.getElementById("srv-address").hasAttribute("aria-invalid"), describedBy: document.getElementById("srv-address").getAttribute("aria-describedby"), detectOff: document.querySelector("[data-detect]").getAttribute("aria-disabled") }));
    if (fixed.invalid || fixed.detectOff !== "false") fail(`${where} form errors`, "a good address does not clear its error and enable Detect");
    if (fixed.describedBy !== null) fail(`${where} form errors`, `a fixed address still points at "${fixed.describedBy}"`);
    const connectOff = await tab.evaluate(() => ({ off: document.querySelector("[data-connect]").getAttribute("aria-disabled"), reason: document.getElementById("srv-reason").textContent }));
    if (connectOff.off !== "true" || !connectOff.reason.includes("Connect")) fail(`${where} form errors`, `Connect before a server is detected is aria-disabled=${connectOff.off} with the reason "${connectOff.reason}"`);

    // Submit with three problems: the program, the model name and the trust box.
    // The model name was typed and never left, so the click must survive the error that appears when it loses focus.
    await tab.fill("#cmd-model", "bad name");
    await tab.evaluate(() => scrollTo(0, 0));
    await tab.click('#command-form button[type="submit"]');
    const bad = await tab.evaluate(() => document.querySelector('#command-form [aria-invalid="true"]').closest(".sd-field").querySelector(".sd-field-label").id ||= "first-bad-label");
    const first = await state();
    if (first.banner !== "3 fields need fixing.") fail(`${where} form errors`, `banner says "${first.banner}", want "3 fields need fixing."`);
    if (first.tone !== "danger") fail(`${where} form errors`, `banner tone is ${first.tone}, want danger`);
    if (first.focused !== "cmd-program") fail(`${where} form errors`, `focus went to ${first.focused}, want the first bad field cmd-program`);
    if (!await inView(`#${bad}`)) fail(`${where} form errors`, "the first bad field's label is outside the viewport after a failed submit");
    if (!await inView(banner)) fail(`${where} form errors`, "the error banner is outside the viewport after a failed submit");
    const model = await tab.evaluate(() => ({ text: document.getElementById("cmd-model-error").textContent, describedBy: document.getElementById("cmd-model").getAttribute("aria-describedby") }));
    if (model.text !== "A model name has no spaces." || model.describedBy !== "cmd-model-error") fail(`${where} form errors`, `the model error is "${model.text}" and the field describes itself by "${model.describedBy}"`);
    if (!first.trustDescribedByError) fail(`${where} form errors`, "the trust checkbox's aria-describedby does not reach a written error");

    // Only the last field is bad: the banner still shows with it.
    await tab.fill("#cmd-program", "local-agent");
    await tab.fill("#cmd-model", "small-instruct");
    if (await tab.getAttribute("#cmd-model", "aria-describedby") !== null) fail(`${where} form errors`, "a fixed field still points at its error");
    await tab.click('#command-form button[type="submit"]');
    const last = await state();
    if (last.banner !== "1 field needs fixing." || last.focused !== "cmd-trust") fail(`${where} form errors`, `with only the trust box bad: banner "${last.banner}", focus ${last.focused}`);
    if (!await inView(banner) || !await inView("#cmd-trust-error")) fail(`${where} form errors`, "with only the trust box bad, the banner and its error are not both in view");
    if (!last.trustDescribedByError) fail(`${where} form errors`, "the trust error is not reachable from the checkbox");

    // Fixing the last field clears the banner.
    await tab.check("#cmd-trust");
    if ((await state()).banner) fail(`${where} form errors`, "the banner stays after the last field is fixed");

    // A valid submit adds the command to the connected list and empties the form.
    await tab.click('#command-form button[type="submit"]');
    await tab.waitForSelector('[data-connected] [aria-label="Test local-agent"]', { timeout: 2000 });
    if (await tab.inputValue("#cmd-program")) fail(`${where} form errors`, "the form keeps its values after a command is added");
  } finally {
    await context.close();
  }
}
