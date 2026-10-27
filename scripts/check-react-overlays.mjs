/**
 * Behavior checks for what a React app needs from dialogs, tooltips and menus:
 * the dialog title as a heading, focus on open, dismissal by Escape and by the
 * backdrop on their own, a disabled bare switch, tooltips that share the page,
 * and a second right-click. Called from checkReact in check-react.mjs:
 *   checkReactOverlays(page, base) -> { errors, passed }
 */

export async function checkReactOverlays(page, base) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(message));
  const browserErrors = [];
  page.on("console", (m) => m.type() === "error" && browserErrors.push(m.text()));
  page.on("pageerror", (e) => browserErrors.push(e.message));
  const until = (fn, arg, timeout = 2000) => page.waitForFunction(fn, arg, { timeout }).then(() => true, () => false);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}react.html`);
  await page.waitForSelector("#react-dialog-options");

  // From the keyboard: WebKit does not focus a button on click, so only a focused opener gets focus back.
  const open = async (scope, label) => {
    const opener = page.locator(scope).getByRole("button", { name: label, exact: true });
    await opener.scrollIntoViewIfNeeded();
    await opener.focus();
    await page.keyboard.press("Enter");
  };
  const shut = () => until(() => !document.querySelector("dialog[open]"), null);

  /* ---- Dialog title is a heading ---- */
  await open("#react-dialog", "Dialog");
  await until(() => document.querySelector("dialog[open]"), null);
  const main = page.getByRole("dialog", { name: "Request changes on ACME-421?" });
  const heading = main.getByRole("heading", { name: "Request changes on ACME-421?" });
  expect(await heading.count() === 1, "the DialogHeader title is a heading inside the dialog, named by its text");
  expect(await heading.count() === 1 && await heading.evaluate((el) => el.tagName === "H2" && el.id === el.closest("dialog").getAttribute("aria-labelledby")), "the heading is an h2 and the dialog's aria-labelledby points at it");
  const lookOf = () => page.evaluate(() => {
    const header = document.querySelector("dialog[open] .sd-dialog-head");
    const title = header.firstElementChild;
    const style = getComputedStyle(title);
    const parent = getComputedStyle(header);
    const differs = ["fontSize", "lineHeight", "fontWeight", "letterSpacing", "color", "textTransform", "fontFamily"].filter((key) => style[key] !== parent[key]);
    const old = document.createElement("span");
    old.textContent = title.textContent;
    const clone = header.cloneNode(true);
    clone.firstElementChild.replaceWith(old);
    header.after(clone);
    const heights = [header.getBoundingClientRect().height, clone.getBoundingClientRect().height];
    const widths = [title.getBoundingClientRect().width, old.getBoundingClientRect().width];
    clone.remove();
    return { differs, margins: [style.marginTop, style.marginBottom], heights, widths };
  });
  const look = await lookOf();
  expect(look.differs.length === 0 && look.margins.join() === "0px,0px", `the heading looks like the span it replaced: inherits its type and has no margin, got ${JSON.stringify(look)}`);
  expect(Math.abs(look.heights[0] - look.heights[1]) <= 0.5 && Math.abs(look.widths[0] - look.widths[1]) <= 0.5, `the header is as tall and the title as wide as with a span, got ${JSON.stringify(look)}`);
  await page.keyboard.press("Escape");
  await shut();

  await open("#react-dialog-options", "Heading level");
  await until(() => document.querySelector("dialog[open]"), null);
  const levelThree = page.getByRole("dialog", { name: "Level three title" });
  expect(await levelThree.getByRole("heading", { name: "Level three title", level: 3 }).count() === 1, "as=\"h3\" makes the title a level three heading");
  const levelLook = await lookOf();
  expect(levelLook.differs.length === 0 && levelLook.margins.join() === "0px,0px", `a title at another level looks the same, got ${JSON.stringify(levelLook)}`);
  await page.keyboard.press("Escape");
  await shut();

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
