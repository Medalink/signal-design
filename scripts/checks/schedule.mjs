export const page = "charts";

export default async function checkSchedule(page, where, fail) {
  const originalViewport = page.viewportSize();
  const originalTheme = await page.evaluate(() => document.documentElement.dataset.theme);
  let assertions = 0;
  let labels = 0;
  let failures = 0;
  const assert = (passed, message) => {
    assertions++;
    if (!passed) {
      failures++;
      fail(`${where} schedule`, message);
    }
  };
  const read = (el) => {
    const origin = el.closest(".sd-schedule-canvas").getBoundingClientRect();
    const rect = (node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x - origin.x, y: box.y - origin.y, width: box.width, height: box.height };
    };
    const label = el.querySelector(".sd-schedule-label");
    const row = el.closest(".sd-schedule-row");
    const track = el.closest(".sd-schedule-track");
    const board = el.closest(".sd-schedule-board");
    const style = getComputedStyle(label);
    const box = label.getBoundingClientRect();
    const trackBox = track.getBoundingClientRect();
    const boardBox = board.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(label);
    const textBoxes = [...range.getClientRects()].filter((r) => r.width && r.height);
    const textVisible = textBoxes.length > 0 && textBoxes.every((r) =>
      r.left >= box.left - 0.5 && r.right <= box.right + 0.5 &&
      r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5 &&
      r.left >= boardBox.left - 0.5 && r.right <= boardBox.right + 0.5 &&
      r.top >= boardBox.top - 0.5 && r.bottom <= boardBox.bottom + 0.5 &&
      [r.left + 0.5, (r.left + r.right) / 2, r.right - 0.5].every((x) =>
        [r.top + 0.5, (r.top + r.bottom) / 2, r.bottom - 0.5].every((y) => label.contains(document.elementFromPoint(x, y))),
      ),
    );
    return {
      bar: rect(el),
      row: rect(row),
      label: rect(label),
      text: label.textContent.trim(),
      opaque: !style.backgroundColor.includes("/") && !style.backgroundColor.startsWith("rgba("),
      textVisible,
      withinTrack: box.left >= trackBox.left - 0.5 && box.right <= trackBox.right + 0.5,
      coversBar: box.left <= el.getBoundingClientRect().left + 0.5 && box.right >= el.getBoundingClientRect().right - 0.5,
      compact: style.whiteSpace === "nowrap" && style.textOverflow === "ellipsis" && style.overflow === "hidden",
      focused: document.activeElement === el,
      focusRing: getComputedStyle(el).outlineStyle !== "none" || style.outlineStyle !== "none",
      rowRaised: getComputedStyle(row).backgroundColor !== "rgba(0, 0, 0, 0)",
      noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    };
  };
  const sameRect = (a, b) => ["x", "y", "width", "height"].every((key) => Math.abs(a[key] - b[key]) <= 0.5);

  try {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ ...originalViewport, width });
      for (const theme of ["ink", "paper"]) {
        await page.evaluate(async (value) => {
          document.documentElement.dataset.theme = value;
          await document.fonts.ready;
        }, theme);
        for (let boardIndex = 0; boardIndex < 2; boardIndex++) {
          const board = page.locator("#charts-schedule .sd-schedule").nth(boardIndex);
          const blocks = board.locator(".sd-schedule-block");
          const count = await blocks.count();
          const context = `${theme}@${width} ${boardIndex ? "spectrum" : "mono"}`;
          await board.scrollIntoViewIfNeeded();
          assert(count >= 19, `${context} contains the full roster`);

          const geometry = await board.evaluate((el) => {
            const style = getComputedStyle(el);
            const start = Number(style.getPropertyValue("--start"));
            const end = Number(style.getPropertyValue("--end"));
            const close = (a, b) => Math.abs(a - b) <= 0.5;
            const placed = [...el.querySelectorAll(".sd-schedule-block")].every((block) => {
              const track = block.closest(".sd-schedule-track").getBoundingClientRect();
              const box = block.getBoundingClientRect();
              const from = Number(block.style.getPropertyValue("--from"));
              const to = Number(block.style.getPropertyValue("--to"));
              return close(box.left - track.left, (from - start) / (end - start) * track.width) &&
                close(box.width, (to - from) / (end - start) * track.width);
            });
            const grid = el.querySelector(".sd-schedule-grid").getBoundingClientRect();
            const now = el.querySelector(".sd-schedule-now");
            const at = Number(now.style.getPropertyValue("--at"));
            const tick = [...el.querySelectorAll(".sd-schedule-axis > div > span")].find((s) => s.style.getPropertyValue("--at") === "14").getBoundingClientRect();
            const line = [...el.querySelectorAll(".sd-schedule-grid > i")].find((s) => s.style.getPropertyValue("--at") === "14").getBoundingClientRect();
            return {
              placed,
              nowAt: close(now.getBoundingClientRect().left - grid.left, (at - start) / (end - start) * grid.width),
              tickOnLine: close(tick.left + tick.width / 2 - line.left, 0.5),
              legend: el.querySelectorAll(".sd-schedule-legend > span").length === 6,
              conflict: getComputedStyle(el.querySelector('[data-state="conflict"]')).boxShadow !== "none",
            };
          });
          for (const [key, passed] of Object.entries(geometry)) assert(passed, `${context} ${key}`);

          for (let index = 0; index < count; index++) {
            const block = blocks.nth(index);
            await page.mouse.move(0, 0);
            await block.scrollIntoViewIfNeeded();
            const resting = await block.evaluate(read);
            const name = `${context} ${resting.text}`;
            labels++;
            assert(resting.compact, `${name} ellipsizes at rest`);
            assert(resting.withinTrack && resting.noPageOverflow, `${name} rests inside the track without page overflow`);
            assert((await block.ariaSnapshot()).includes(resting.text), `${name} has its full text in the accessible tree at rest`);

            await block.hover();
            await page.waitForFunction((el) => getComputedStyle(el.querySelector(".sd-schedule-label")).whiteSpace === "normal", await block.elementHandle());
            assert((await block.evaluate(read)).opaque, `${name} reveals an opaque label immediately`);
            await page.waitForFunction(
              (el) => el.closest(".sd-schedule-row").getAnimations({ subtree: true }).every((animation) => animation.playState !== "running"),
              await block.elementHandle(),
              { timeout: 2000 },
            );
            const hovered = await block.evaluate(read);
            assert(hovered.textVisible, `${name} shows all text on hover`);
            assert(sameRect(resting.bar, hovered.bar) && sameRect(resting.row, hovered.row), `${name} keeps time bar and row bounds on hover`);
            assert(hovered.withinTrack && hovered.coversBar && hovered.noPageOverflow, `${name} reveals within the track and covers its original hit region`);
            assert(hovered.rowRaised, `${name} highlights its hovered row`);

            const hit = await block.locator(".sd-schedule-label").boundingBox();
            await page.mouse.move(hit.x + hit.width / 2, hit.y + hit.height / 2);
            assert((await block.evaluate(read)).textVisible, `${name} stays revealed when the pointer enters its label`);
            await page.mouse.move(0, 0);
            await page.waitForFunction((el) => getComputedStyle(el.querySelector(".sd-schedule-label")).whiteSpace === "nowrap", await block.elementHandle());
            const collapsed = await block.evaluate(read);
            assert(sameRect(resting.label, collapsed.label), `${name} collapses after mouse-out`);

            await block.focus();
            await page.waitForFunction((el) => document.activeElement === el && getComputedStyle(el.querySelector(".sd-schedule-label")).whiteSpace === "normal", await block.elementHandle());
            const focused = await block.evaluate(read);
            assert(focused.focused && focused.textVisible, `${name} reveals all text on plain focus`);
            assert(sameRect(resting.bar, focused.bar) && sameRect(resting.row, focused.row), `${name} keeps time bar and row bounds on focus`);
            assert(focused.withinTrack && focused.noPageOverflow && focused.focusRing, `${name} keeps focus visible within the track`);
            await page.keyboard.press("Tab");
            assert(!(await block.evaluate(read)).focused, `${name} supports keyboard navigation away`);
            await page.evaluate(() => document.activeElement.blur());
            await page.waitForFunction((el) => getComputedStyle(el.querySelector(".sd-schedule-label")).whiteSpace === "nowrap", await block.elementHandle());
            assert(sameRect(resting.label, (await block.evaluate(read)).label), `${name} collapses after blur`);
          }
        }
        const themes = await page.locator("#charts-schedule .sd-schedule").evaluateAll((boards) => boards.map((board) =>
          getComputedStyle(board.querySelector('.sd-schedule-block[data-status="driving"] > .sd-schedule-label')).borderTopColor,
        ));
        assert(themes[0] !== themes[1], `${theme}@${width} spectrum recolors status`);
      }
    }
  } finally {
    await page.setViewportSize(originalViewport);
    await page.evaluate((theme) => {
      document.activeElement.blur();
      if (theme === undefined) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = theme;
    }, originalTheme);
    await page.mouse.move(0, 0);
  }
  console.log(`${failures ? "FAIL" : "ok  "} ${where} schedule ${assertions} assertions, ${labels} labels across both boards, ink/paper at 1280/375px`);
}
