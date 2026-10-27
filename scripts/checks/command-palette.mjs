export const page = "command";

/** Ctrl K opens the page's own palette, typing filters it, and "?" opens the shortcuts sheet. */
export default async function checkCommandPalette(page, where, fail) {
  // Click clear of the page chrome first, so the keys go to the page.
  await page.locator(".demo-intro h1").click();
  await page.keyboard.press("Control+k");
  if (!(await page.evaluate(() => document.getElementById("demo-palette").open))) fail(where, "palette did not open");
  await page.keyboard.type("form");
  const shown = await page.evaluate(() => [...document.querySelectorAll('#demo-palette [role="option"]:not([hidden])')].map((o) => o.textContent.trim()));
  if (shown.length !== 1 || !shown[0].startsWith("Form")) fail(where, `palette filter showed ${shown.join(" | ")}`);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Shift+Slash");
  if (!(await page.evaluate(() => document.getElementById("demo-shortcuts").open))) fail(where, "? did not open shortcuts");
  await page.keyboard.press("Escape");
}
