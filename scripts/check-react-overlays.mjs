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

  /* ---- Focus on open ---- */
  // Each dialog has a button before the field, so the field is not what the browser would focus first.
  const focusOn = (selector) => until((sel) => document.querySelector(sel) === document.activeElement, selector);
  const said = (selector) => page.evaluate((sel) => document.activeElement?.matches(sel) ? sel : `${document.activeElement?.tagName} ${document.activeElement?.textContent}`, selector);
  const reopens = async (opener, field, what) => {
    await open("#react-dialog-options", opener);
    expect(await focusOn(field), `${what} has focus when the dialog opens, got ${await said(field)}`);
    await page.keyboard.press("Escape");
    await shut();
    expect(await until((name) => document.activeElement?.textContent === name, opener), `closing returns focus to ${opener}`);
  };

  await reopens("Autofocus field", 'dialog[aria-label="Autofocus field"] input', "an Input with autoFocus, not the first field,");
  await open("#react-dialog-options", "Autofocus field");
  expect(await focusOn('dialog[aria-label="Autofocus field"] input'), "an Input with autoFocus has focus again when the dialog opens a second time");
  await page.keyboard.press("Escape");
  await shut();

  const native = 'dialog[aria-label="Autofocus native field"]';
  await reopens("Autofocus native field", `${native} input`, "a native input with autoFocus in a dialog that unmounts on close");
  expect(await until((sel) => document.querySelector(sel).children.length === 0, native), "the children unmount once the dialog has faded out");
  await open("#react-dialog-options", "Autofocus native field");
  expect(await focusOn(`${native} input`), "a native input with autoFocus has focus when the dialog mounts it again");
  await page.keyboard.press("Escape");
  await shut();

  const marked = 'dialog[aria-label="Autofocus marked"]';
  await reopens("Autofocus marked", `${marked} [data-autofocus]`, "the data-autofocus button, not the first button,");
  await open("#react-dialog-options", "Autofocus marked");
  expect(await focusOn(`${marked} [data-autofocus]`), "the data-autofocus button has focus when the dialog opens a second time");
  await page.keyboard.press("Escape");
  await shut();

  const mounted = 'dialog[aria-label="Mounted open"]';
  await open("#react-dialog-options", "Mount open");
  expect(await focusOn(`${mounted} input`), `a native input with autoFocus has focus in a dialog that mounts already open, got ${await said(`${mounted} input`)}`);
  expect(await page.evaluate((sel) => document.querySelector(sel).open, mounted), "a dialog that mounts already open is open");
  await page.keyboard.press("Escape");
  await shut();
  expect(await until((sel) => document.querySelector(sel) === null, mounted), "closing a dialog that was mounted open lets its owner unmount it");

  /* ---- Escape and the backdrop on their own ---- */
  // Each way of switching them, and what each one leaves open. A dialog that refuses is pressed twice, because a
  // browser may close a dialog on a second Escape that nothing has answered.
  const pause = (ms) => page.waitForTimeout(ms);
  for (const [name, escape, backdrop] of [
    ["Escape only", true, false],
    ["Backdrop only", false, true],
    ["Neither", false, false],
    ["Static with Escape", true, false],
    ["Static with backdrop", false, true],
  ]) {
    const sel = `dialog[aria-label="${name}"]`;
    const isOpen = () => page.evaluate((s) => document.querySelector(s).open, sel);
    const opened = async () => {
      await open("#react-dialog-options", name);
      return until((s) => document.querySelector(s).open, sel);
    };
    expect(await opened(), `${name} opens`);
    await page.keyboard.press("Escape");
    if (escape) expect(await until((s) => !document.querySelector(s).open, sel), `${name}: Escape closes it`);
    else {
      await pause(250);
      expect(await isOpen(), `${name}: Escape leaves it open`);
      await page.keyboard.press("Escape");
      await pause(250);
      expect(await isOpen(), `${name}: a second Escape leaves it open`);
    }
    if (!await isOpen()) await opened();
    await page.mouse.click(4, 4);
    if (backdrop) expect(await until((s) => !document.querySelector(s).open, sel), `${name}: a click on the backdrop closes it`);
    else {
      await pause(250);
      const stayed = await isOpen();
      expect(stayed, `${name}: a click on the backdrop leaves it open`);
      if (stayed) {
        await page.locator(sel).getByRole("button", { name: "Done" }).click();
        expect(await until((s) => !document.querySelector(s).open, sel), `${name}: its own button still closes it`);
      }
    }
    await shut();
  }

  /* ---- Tooltips share the page ---- */
  // Real mouse moves: a tooltip answers pointer events, and delays are what is under test.
  const group = page.locator("#react-tooltip-group");
  const trigger = (name) => group.getByRole("button", { name, exact: true });
  const tipsNow = () => page.evaluate(() => [...document.querySelectorAll("body > [role=tooltip]")].map((tip) => tip.textContent));
  const hoverOn = async (target) => {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  };
  const away = () => page.mouse.move(2, 2);
  const shows = (text, timeout) => until((t) => [...document.querySelectorAll("body > [role=tooltip]")].some((tip) => tip.textContent === t), text, timeout);
  const gone = (timeout = 3000) => until(() => !document.querySelector("body > [role=tooltip]"), null, timeout);
  // Leave, let any tip go, and wait out the warm window, so the next hover starts cold.
  const cold = async () => {
    await away();
    await gone();
    await pause(450);
  };
  await trigger("First").scrollIntoViewIfNeeded();
  await cold();

  await hoverOn(trigger("First"));
  await pause(250);
  expect((await tipsNow()).length === 0, "a hover from cold waits for the delay");
  expect(await shows("First tip", 2500), "a hover from cold shows its tip once the delay is up");

  await hoverOn(trigger("Second"));
  expect(await shows("Second tip", 300), "moving from an open tip to another trigger shows that trigger's tip at once, past its 600ms delay");
  expect((await tipsNow()).join() === "Second tip", `only one tip is open, got ${JSON.stringify(await tipsNow())}`);

  await away();
  await hoverOn(trigger("First"));
  expect(await shows("First tip", 300), "a different trigger reached right after a tip closes shows at once");
  await away();
  await pause(50);
  await hoverOn(trigger("First"));
  await pause(250);
  expect((await tipsNow()).length === 0, "the trigger a tip just closed on waits its delay again");

  await cold();
  await hoverOn(trigger("Second"));
  await pause(250);
  expect((await tipsNow()).length === 0, "after the warm window a hover waits for the delay again");

  // Escape forgets the warm window: the next trigger is cold. (Passes without it too; it guards the reset.)
  await cold();
  await trigger("First").focus();
  expect(await shows("First tip", 450), "keyboard focus shows the tip without the delay");
  await page.keyboard.press("Escape");
  expect(await gone(), "Escape hides the tip");
  await hoverOn(trigger("Second"));
  await pause(250);
  expect((await tipsNow()).length === 0, "after Escape the next trigger waits its delay");
  await trigger("First").blur();

  // At delay 0 too: a tip opened by focus gives way to the one the pointer opens, even in another demo.
  await cold();
  await trigger("Instant").focus();
  expect(await shows("No delay", 450), "focus shows a tip with no delay");
  await hoverOn(page.locator("#react-tooltip").getByRole("button", { name: "Hover or focus me" }));
  expect(await until(() => {
    const now = [...document.querySelectorAll("body > [role=tooltip]")].map((tip) => tip.textContent);
    return now.length === 1 && now[0] === "Approve (a)";
  }, null, 1000), `a tip opened by hover replaces the one opened by focus, got ${JSON.stringify(await tipsNow())}`);
  await cold();
  await trigger("Instant").blur();

  // closeDelay: the tip lingers, can be reached, and is kept by coming back.
  const linger = trigger("Linger");
  await hoverOn(linger);
  expect(await shows("Stays a moment", 2500), "a tip with a closeDelay shows after its delay");
  await away();
  const left = Date.now();
  await pause(150);
  expect((await tipsNow()).length === 1, "a tip with a closeDelay stays when the pointer leaves");
  expect(await gone(2000) && Date.now() - left >= 350, `the tip goes once its closeDelay is up, after ${Date.now() - left}ms`);
  await hoverOn(linger);
  expect(await shows("Stays a moment", 2500), "the tip shows again");
  await away();
  await pause(150);
  await hoverOn(linger);
  await pause(600);
  expect((await tipsNow()).length === 1, "coming back to the trigger inside the closeDelay keeps the tip");
  const tipBox = await page.locator("body > [role=tooltip]").first().boundingBox({ timeout: 500 }).catch(() => null);
  if (tipBox) await page.mouse.move(tipBox.x + tipBox.width / 2, tipBox.y + tipBox.height / 2);
  await pause(700);
  expect((await tipsNow()).length === 1, "the pointer can rest on a lingering tip without closing it");
  expect(await page.evaluate(() => {
    const el = document.querySelector("body > [role=tooltip]");
    return el !== null && el.hasAttribute("data-hoverable") && getComputedStyle(el).pointerEvents === "auto";
  }), "a lingering tip takes the pointer");
  await away();
  expect(await gone(2000), "leaving the tip closes it after the closeDelay");

  // Without a closeDelay a tip goes at once and cannot be hovered, as before.
  await cold();
  await hoverOn(trigger("Instant"));
  expect(await shows("No delay", 450), "a tip with no delay shows at once");
  expect(await page.evaluate(() => {
    const el = document.querySelector("body > [role=tooltip]");
    return el !== null && !el.hasAttribute("data-hoverable") && getComputedStyle(el).pointerEvents === "none";
  }), "a tip with no closeDelay does not take the pointer");
  await away();
  expect(await gone(300), "a tip with no closeDelay goes as soon as the pointer leaves");

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
