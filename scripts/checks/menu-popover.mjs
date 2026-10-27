export const page = "menus";

/** A menu popover opens under its trigger, focuses its first item and moves with the arrow keys. */
export default async function checkMenuPopover(page, where, fail) {
  await page.click('[popovertarget="row-menu"]');
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menuitem", null, { timeout: 1000 }).catch(() => {});
  const pos = await page.evaluate(() => {
    const p = document.getElementById("row-menu");
    const t = document.querySelector('[popovertarget="row-menu"]').getBoundingClientRect();
    const r = p.getBoundingClientRect();
    return { open: p.matches(":popover-open"), gap: Math.round(r.top - t.bottom), focused: document.activeElement?.getAttribute("role") };
  });
  if (!pos.open) fail(where, "popover did not open");
  if (pos.gap < 0 || pos.gap > 12) fail(where, `popover not anchored (gap ${pos.gap})`);
  if (pos.focused !== "menuitem") fail(where, `menu did not focus first item (${pos.focused})`);
  await page.keyboard.press("ArrowDown");
  const second = await page.evaluate(() => document.activeElement?.textContent.trim());
  if (!second?.startsWith("Copy link")) fail(where, `ArrowDown landed on "${second}"`);
  await page.keyboard.press("Escape");
}
