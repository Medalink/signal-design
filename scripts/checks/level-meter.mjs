export const page = "level";

/** A level meter lights the bars at or under --level and holds still between values. */
export default async function checkLevelMeter(page, where, fail) {
  const got = await page.evaluate(async () => {
    const meter = document.getElementById("demo-level");
    meter.scrollIntoView();
    const bars = [...meter.children];
    const lit = async (level) => {
      meter.style.setProperty("--level", level);
      // Let the 120ms fades finish: a fixed sleep raced them on a busy CI runner.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await Promise.all(meter.getAnimations({ subtree: true }).map((a) => a.finished));
      return bars.filter((b) => getComputedStyle(b, "::before").opacity === "1").length;
    };
    const counts = [await lit(0), await lit(0.55), await lit(1)];
    const heights = bars.map((b) => b.getBoundingClientRect().height);
    meter.style.setProperty("--level", "0.6");
    return {
      counts: counts.join(),
      steps: counts.join() === "0,3,5",
      rising: heights.every((h, i) => i === 0 || h > heights[i - 1]) && Math.abs(heights[4] - meter.clientHeight) <= 1,
      still: bars.every((b) => getComputedStyle(b, "::before").animationName === "none"),
    };
  });
  const { counts, ...checks } = got;
  for (const [key, passed] of Object.entries(checks)) if (!passed) fail(`${where} level meter`, `${key} (lit ${counts}, want 0,3,5)`);
}
