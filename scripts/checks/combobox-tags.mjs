export const page = "pickers";

/** The combobox filters and picks from the keyboard, tags add and remove, and the number input stops at its max. */
export default async function checkComboboxTags(page, where, fail) {
  await page.locator("#demo-combo").click();
  await page.keyboard.type("lis");
  await page.keyboard.press("Enter");
  if ((await page.locator("#demo-combo").inputValue()) !== "Lisbon") fail(where, `combobox picked ${await page.locator("#demo-combo").inputValue()}`);
  await page.locator("#demo-tags").click();
  await page.keyboard.type("ux");
  await page.keyboard.press("Enter");
  let tags = await page.evaluate(() => [...document.querySelectorAll("[data-sd-tags] .sd-chip")].map((c) => c.dataset.value).join(","));
  if (!tags.endsWith("design,ux")) fail(where, `tags after add: ${tags}`);
  await page.keyboard.press("Backspace");
  tags = await page.evaluate(() => [...document.querySelectorAll("[data-sd-tags] .sd-chip")].map((c) => c.dataset.value).join(","));
  if (tags !== "design") fail(where, `tags after backspace: ${tags}`);
  const plus = page.locator('.demo-section [data-step="1"]');
  for (let i = 0; i < 8; i++) await plus.click({ force: true });
  const n = await page.locator("#demo-number").inputValue();
  const plusDisabled = await plus.isDisabled();
  if (n !== "9" || !plusDisabled) fail(where, `number ${n}, plus disabled ${plusDisabled}`);
}
