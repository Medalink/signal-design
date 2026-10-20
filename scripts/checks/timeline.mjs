export const page = "charts";
/** sd-timeline bars, grid, now line, axis and mark all share one percentage scale. */
export default async function checkTimeline(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("charts-timeline");
    block.scrollIntoView();
    const timelines = [...block.querySelectorAll(".sd-timeline")];
    const close = (a, b) => Math.abs(a - b) <= 1.5;
    const bars = [];
    for (const timeline of timelines) {
      for (const row of timeline.querySelectorAll(".sd-timeline-row")) {
        const track = row.querySelector(".sd-timeline-track").getBoundingClientRect();
        const bar = row.querySelector(".sd-timeline-bar");
        const box = bar.getBoundingClientRect();
        const from = Number(bar.style.getPropertyValue("--from"));
        const to = Number(bar.style.getPropertyValue("--to"));
        bars.push({
          left: close(box.left - track.left, (from / 100) * track.width),
          width: close(box.width, ((to - from) / 100) * track.width),
          inside: box.left >= track.left - 0.5 && box.right <= track.right + 0.5,
        });
      }
    }
    const plot = timelines[0].querySelector(".sd-timeline-plot").getBoundingClientRect();
    const now = timelines[0].querySelector(".sd-timeline-now").getBoundingClientRect();
    const axis = timelines[0].querySelector(".sd-timeline-axis").getBoundingClientRect();
    const lastTick = timelines[0].querySelector(".sd-timeline-axis > span:last-child").getBoundingClientRect();
    const mark = timelines[1].querySelector(".sd-timeline-mark");
    const markPlot = timelines[1].querySelector(".sd-timeline-plot").getBoundingClientRect();
    const ticks = [...mark.querySelectorAll("i")].map((i) => i.getBoundingClientRect());
    const markLabel = mark.querySelector("b").getBoundingClientRect();
    return {
      barsPlaced: bars.every((b) => b.left && b.width && b.inside),
      barsCount: bars.length === 9,
      nowAtEnd: close(now.left - plot.left, plot.width),
      axisAligned: close(axis.left - plot.left, 0) && close(axis.width - plot.width, 0),
      lastTickInside: lastTick.right <= axis.right + 0.5,
      markTicks: close(ticks[0].left - markPlot.left, 0.25 * markPlot.width) && close(ticks[1].left - markPlot.left, 0.5 * markPlot.width),
      markLabelCentered: close(markLabel.left + markLabel.width / 2 - markPlot.left, 0.375 * markPlot.width),
      noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} timeline`, key);
}
