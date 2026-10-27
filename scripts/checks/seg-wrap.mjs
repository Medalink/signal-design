export const page = "choices";
/** sd-seg-wrap: in a narrow container the items flow onto several rows and stay inside it; a plain sd-seg stays on one row. */
export default async function checkSegWrap(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("components-segmented-control-in-a-narrow-container");
    block.scrollIntoView();
    const seg = block.querySelector('[aria-label="Range, narrow"]');
    const items = [...seg.children];
    const box = seg.getBoundingClientRect();
    const rows = new Set(items.map((i) => Math.round(i.getBoundingClientRect().top)));
    const plain = document.createElement("div");
    plain.className = "sd-seg";
    plain.style.width = "13rem";
    plain.innerHTML = seg.innerHTML;
    block.append(plain);
    const plainRows = new Set([...plain.children].map((i) => Math.round(i.getBoundingClientRect().top)));
    const plainOverflows = plain.scrollWidth > plain.clientWidth;
    plain.remove();
    return {
      wraps: rows.size > 1,
      noOverflow: seg.scrollWidth <= seg.clientWidth,
      itemsInside: items.every((i) => i.getBoundingClientRect().right <= box.right + 0.5),
      pressedKept: seg.querySelector('[aria-pressed="true"]').textContent === "last day",
      plainOneRow: plainRows.size === 1 && plainOverflows,
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} seg wrap`, key);
}
