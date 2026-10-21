export const page = "charts";
/** sd-schedule: blocks, grid and now line share one hour scale; hover and the two chart themes work. */
export default async function checkSchedule(page, where, fail) {
  await page.evaluate(() => {
    document.getElementById("charts-schedule").scrollIntoView();
  });
  const got = await page.evaluate(() => {
    const blockEl = document.getElementById("charts-schedule");
    const schedules = [...blockEl.querySelectorAll(".sd-schedule")];
    const close = (a, b) => Math.abs(a - b) <= 1.5;
    const mono = schedules[0];

    // Every block sits where its --from/--to hours say, inside its track.
    // Blocks narrower than the padding floor clamp; compare those by center.
    const placed = [];
    const offenders = [];
    for (const row of mono.querySelectorAll(".sd-schedule-row")) {
      const track = row.querySelector(".sd-schedule-track").getBoundingClientRect();
      for (const el of row.querySelectorAll(".sd-schedule-block")) {
        const box = el.getBoundingClientRect();
        const from = Number(el.style.getPropertyValue("--from"));
        const to = Number(el.style.getPropertyValue("--to"));
        const expLeft = ((from - 6) / 16) * track.width;
        const expWidth = ((to - from) / 16) * track.width;
        const actCenter = box.left + box.width / 2 - track.left;
        const expCenter = expLeft + expWidth / 2;
        // Narrow blocks clamp to the padding floor and grow rightward, so
        // compare those by their anchored left edge; wider ones by center.
        const ok = (expWidth < 14 ? close(box.left - track.left, expLeft) : close(actCenter, expCenter))
          && (expWidth < 14 || close(box.width, expWidth))
          && box.left >= track.left - 0.5 && box.right <= track.right + 0.5;
        if (!ok) offenders.push(`${el.textContent.slice(0, 24)}: exp ${expLeft.toFixed(1)}+${expWidth.toFixed(1)}, act ${box.left - track.left}+${box.width}`);
        placed.push(ok);
      }
    }

    // The now line crosses the plot area at its hour: label column + gap + fraction of the plot.
    const grid = mono.querySelector(".sd-schedule-grid").getBoundingClientRect();
    const now = mono.querySelector(".sd-schedule-now").getBoundingClientRect();
    const nowAt = close(now.left - grid.left, ((14.33 - 6) / 16) * grid.width);

    // The 14:00 tick sits on the 14:00 grid line.
    const tick = [...mono.querySelectorAll(".sd-schedule-axis > div > span")].find((s) => s.style.getPropertyValue("--at") === "14").getBoundingClientRect();
    const line = [...mono.querySelectorAll(".sd-schedule-grid > i")].find((i) => i.style.getPropertyValue("--at") === "14").getBoundingClientRect();
    const tickOnLine = close((tick.left + tick.width / 2) - line.left, 0.5);

    return {
      blocksPlaced: placed.length > 15 && !offenders.length,
      blocksOffenders: offenders.join(" | "),
      nowAt,
      tickOnLine,
      legendItems: mono.querySelectorAll(".sd-schedule-legend > span").length === 6,
      conflictTinted: getComputedStyle(mono.querySelector('[data-state="conflict"]')).boxShadow !== "none",
    };
  });

  // Hover checks need a real pointer move; the locator scrolls the row into view itself.
  // The row's background transitions, so wait for it to land rather than read mid-flight.
  const row = page.locator("#charts-schedule .sd-schedule-row").nth(2);
  await row.hover();
  await page
    .waitForFunction(
      () => getComputedStyle(document.querySelectorAll("#charts-schedule .sd-schedule-row")[2]).backgroundColor !== "rgba(0, 0, 0, 0)",
      null,
      { timeout: 2000 },
    )
    .catch(() => {});
  const hover = { rowRaised: await row.evaluate((el) => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)") };

  // Spectrum recolors the same status: the first driving block of each board differs.
  const themes = await page.evaluate(() => {
    const driving = [...document.querySelectorAll("#charts-schedule .sd-schedule")].map(
      (board) => getComputedStyle(board.querySelector(".sd-schedule-block[data-status='driving']")).borderTopColor,
    );
    return { spectrumRecolors: driving[0] !== driving[1] };
  });

  const overflow = await page.evaluate(() => ({
    noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  }));

  for (const [key, passed] of Object.entries({ ...got, ...hover, ...themes, ...overflow })) {
    if (typeof passed !== "boolean") continue;
    if (!passed) fail(`${where} schedule`, key === "blocksPlaced" ? `blocksPlaced (${got.blocksOffenders})` : key);
  }
}
