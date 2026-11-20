export const page = "composer";

/** A hovered or active suggest row keeps its label: the shimmer clips a gradient to the glyphs, so the row's fill must not wipe it (fix-suggest-sweep-label). */
export default async function checkSuggestSweepLabel(page, where, fail) {
  // The commands list sits open on the page; the mentions list opens when the
  // field holds an @.
  const targets = [
    ["#demo-commands [role='option'][data-value='shrug']", "/shrug"],
    ["#demo-commands [role='option'][data-value='poll']", "/poll"],
  ];
  const mentions = page.locator("#demo-mentions");
  await page.fill("#conversation-composer textarea[aria-label='Message']", "@");
  if (await mentions.isVisible()) {
    targets.push(["#demo-mentions [role='option'][data-value='Alex']", "Alex"]);
  }
  for (const [selector, name] of targets) {
    await page.hover(selector);
    // The sweep keeps playing after the pointer leaves, so read while the
    // row still matches the hover state.
    const read = await page.evaluate((sel) => {
      const item = document.querySelector(sel);
      const cs = getComputedStyle(item);
      return { text: item.textContent.trim(), fill: cs.webkitTextFillColor, image: cs.backgroundImage, clip: cs.webkitBackgroundClip || cs.backgroundClip };
    }, selector);
    if (read.fill === "rgba(0, 0, 0, 0)" && read.image === "none") {
      fail(where, `"${name}" hovered invisible: text-fill transparent with no clipped gradient`);
    }
  }
}
