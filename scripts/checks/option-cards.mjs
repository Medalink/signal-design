/** Option cards select by click and arrow keys, show focus, and keep one button pressed. */
export default async function checkOptionCards(page, where, fail) {
  const ring = (selector) => page.evaluate((s) => getComputedStyle(document.querySelector(s), "::before").opacity, selector);
  const card = (value) => `.sd-option:has(> input[value="${value}"])`;
  await page.locator(card("paper")).scrollIntoViewIfNeeded();
  await page.click(card("paper"));
  await page.waitForTimeout(250);
  const clicked = (await ring(card("paper"))) === "1" && (await ring(card("ink"))) === "0";
  await page.focus('#components-fields button[type="submit"]');
  for (let i = 0; i < 12 && !(await page.evaluate(() => document.activeElement?.name === "demo-option-theme")); i++) await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => getComputedStyle(document.activeElement.parentElement).outlineStyle === "solid");
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(250);
  const keyed = (await page.evaluate((s) => document.querySelector(s).querySelector("input").checked, card("graphite"))) && (await ring(card("graphite"))) === "1";
  const noise = page.locator('[aria-labelledby="demo-option-noise-label"]');
  await noise.locator("button", { hasText: "Strong" }).click();
  const pressed = await noise.evaluate((g) => [...g.children].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent.trim()));
  const disabled = await noise.evaluate((g) => getComputedStyle(g.querySelector(":disabled")).opacity === "0.5");
  await page.click(card("ink"));
  const got = { clicked, focus, keyed, pressed: pressed.length === 1 && pressed[0].startsWith("Strong"), disabled };
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} option cards`, key);
}
