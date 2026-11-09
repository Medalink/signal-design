export const page = "messages";

/** A hovered menu item keeps its label: the shimmer clips a gradient to the glyphs, so the hover fill must not wipe it (fix-menu-sweep-label). */
export default async function checkMenuSweepLabel(page, where, fail) {
  // Open it the way a reader does: a bare showPopover() leaves the fixed panel at its static position, off-screen where WebKit cannot scroll to it.
  await page.locator('[data-sd-contextmenu="demo-msg-menu"]').first().click({ button: "right" });
  if (!(await page.evaluate(() => document.getElementById("demo-msg-menu").matches(":popover-open")))) {
    fail(where, "the message context menu did not open");
    return;
  }
  const items = "#demo-msg-menu [role='menuitem']";
  for (const [index, name] of [[1, "Copy text"], [2, "Delete"]]) {
    await page.hover(`${items}:nth-of-type(${index + 1})`);
    const read = await page.evaluate((i) => {
      const item = document.querySelectorAll("#demo-msg-menu [role='menuitem']")[i];
      const cs = getComputedStyle(item);
      return { text: item.textContent.trim(), fill: cs.webkitTextFillColor, image: cs.backgroundImage, clip: cs.webkitBackgroundClip || cs.backgroundClip };
    }, index);
    if (read.fill === "rgba(0, 0, 0, 0)" && read.image === "none") {
      fail(where, `"${name}" hovered invisible: text-fill transparent with no clipped gradient`);
    }
  }
  await page.keyboard.press("Escape");
}
