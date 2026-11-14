export const page = "messages";
/** Message layout: the time centers on the author's line, a grouped row has no time, every row keeps one rhythm, names take --who (extra without it), mixed 30% toward --sd-fg, and the action bar stays in the tab order while hidden, shows for a hovering pointer, keyboard focus and an expanded button, and not after a press. */
export default async function checkMessageLayout(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("conversation-messages");
    block.scrollIntoView();
    const rows = [...block.querySelectorAll(".sd-message")];
    const first = rows[0];
    const center = (r) => r.top + r.height / 2;
    const time = first.querySelector(".sd-message-time").getBoundingClientRect();
    const name = first.querySelector(".sd-message-author").getClientRects()[0];
    const grouped = rows.find((m) => m.hasAttribute("data-grouped"));
    const actions = first.querySelector(".sd-message-actions");
    const mixed = (parent, who) => {
      const probe = document.createElement("i");
      probe.style.color = `color-mix(in srgb, ${who} 70%, var(--sd-fg))`;
      parent.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    const extra = mixed(block, "var(--sd-extra)");
    const bare = document.createElement("article");
    bare.className = "sd-message";
    bare.innerHTML = '<div class="sd-message-body"><div class="sd-message-text"><b class="sd-message-author">Ana</b>hi <span class="sd-mention">@Leo</span></div></div>';
    block.append(bare);
    const fallback = getComputedStyle(bare.querySelector(".sd-message-author")).color === extra && getComputedStyle(bare.querySelector(".sd-mention")).color === extra;
    const single = bare.getBoundingClientRect().height;
    bare.remove();
    const styles = getComputedStyle(actions);
    return {
      timeCentered: Math.abs(center(time) - center(name)) <= 1,
      timeInColumn: time.right <= first.querySelector(".sd-message-body").getBoundingClientRect().left,
      groupedNoTime: !grouped.querySelector(".sd-message-time") || getComputedStyle(grouped.querySelector(".sd-message-time")).display === "none",
      oneLineRow: Math.abs(single - 32) <= 0.5,
      whoColor: getComputedStyle(first.querySelector(".sd-message-author")).color === mixed(first, "var(--who)"),
      whoFallback: fallback,
      actionsHidden: styles.opacity === "0" && styles.display !== "none" && styles.visibility !== "hidden",
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} message layout`, key);

  // Focus inside the row reveals the bar. The reveal is a 120ms transition,
  // and a headless engine advances it only on a rendered frame, so a wall-clock
  // wait alone can read the start value. Drive frames until the transition has
  // run its course, then assert the end state.
  const shown = await page.evaluate(async () => {
    const actions = document.querySelector("#conversation-messages .sd-message-actions");
    actions.querySelector("button").focus();
    for (const end = performance.now() + 2000; actions.getAnimations().length && performance.now() < end;) {
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 20)));
    }
    const opacity = getComputedStyle(actions).opacity;
    document.activeElement.blur();
    return opacity === "1";
  });
  if (!shown) fail(`${where} message layout`, "actionsOnFocus");

  const row = page.locator("#conversation-messages .sd-message").first();
  const actionsOpacity = () => row.locator(".sd-message-actions").evaluate((el) => getComputedStyle(el).opacity);
  const settled = (opacity) => page.waitForFunction(
    ([selector, wanted]) => getComputedStyle(document.querySelector(selector)).opacity === wanted,
    ["#conversation-messages .sd-message-actions", opacity],
    { timeout: 2000 },
  );

  // A press inside the row does not reveal the bar: the pressed button keeps focus, the pointer leaves.
  const reaction = row.locator("[data-sd-reaction]").first();
  await reaction.scrollIntoViewIfNeeded();
  const box = await reaction.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(300);
  const pressedAway = await actionsOpacity();
  await page.mouse.up();
  await page.evaluate(() => document.activeElement?.blur());
  if (pressedAway !== "0") fail(`${where} message layout`, "actionsOnPress");

  // A pointer that hovers shows it.
  await row.hover();
  await settled("1").catch(() => fail(`${where} message layout`, "actionsOnHover"));
  await page.mouse.move(2, 2);
  await settled("0").catch(() => fail(`${where} message layout`, "actionsOnLeave"));

  // An expanded button holds it open after the pointer leaves.
  await row.locator(".sd-message-actions > button").last().evaluate((el) => el.setAttribute("aria-expanded", "true"));
  await page.waitForTimeout(300);
  const held = await actionsOpacity();
  await row.locator(".sd-message-actions > button").last().evaluate((el) => el.removeAttribute("aria-expanded"));
  if (held !== "1") fail(`${where} message layout`, "actionsWhileExpanded");
}
