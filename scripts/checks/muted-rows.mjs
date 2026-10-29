export const page = "sidebar";
/**
 * A muted sidebar link and a muted item avatar step back by color, not opacity:
 * their text stays at 4.5:1 or better in every theme, and a muted link is still
 * quieter than a normal one. Hover and the current link read at full strength.
 */
export default async function checkMutedRows(page, where, fail) {
  const results = await page.evaluate(async () => {
    const block = document.getElementById("effects-muted-sidebar-rows");
    block.scrollIntoView();
    const root = document.documentElement;
    const was = root.getAttribute("data-theme");
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    // Any computed color syntax to 0-1 sRGB channels.
    const rgb = (css) => {
      if (Array.isArray(css)) return css;
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = "#000";
      probe.fillStyle = css;
      probe.fillRect(0, 0, 1, 1);
      return [...probe.getImageData(0, 0, 1, 1).data].slice(0, 3).map((v) => v / 255);
    };
    const luminance = ([r, g, b]) => {
      const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const ratio = (a, b) => {
      const [hi, lo] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    // The first painted background behind an element.
    const backdrop = (el) => {
      for (let node = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (!/^rgba\(.*, 0\)$|^transparent$/.test(bg)) return bg;
      }
      return "#fff";
    };
    const settled = async (el) => {
      await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
    };
    const normal = block.querySelector(".sd-sidebar-link:not([aria-current]):not([data-muted])");
    const muted = block.querySelector(".sd-sidebar-link[data-muted]");
    const avatar = block.querySelector(".sd-item[data-muted] .sd-avatar");
    const out = [];
    for (const theme of ["ink", "graphite", "paper"]) {
      root.setAttribute("data-theme", theme);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await settled(block);
      // Text color as painted: an element's opacity mixes it into what is behind.
      const text = (el) => {
        const back = rgb(backdrop(el));
        const alpha = Number(getComputedStyle(el.closest(".sd-sidebar-link, .sd-avatar") ?? el).opacity);
        return rgb(getComputedStyle(el).color).map((v, i) => v * alpha + back[i] * (1 - alpha));
      };
      const bg = backdrop(muted);
      const row = {
        theme,
        opacity: getComputedStyle(muted).opacity,
        linkText: ratio(text(muted), bg),
        linkIcon: ratio(text(muted.querySelector("svg")), bg),
        normalText: ratio(text(normal), backdrop(normal)),
        avatarFilter: getComputedStyle(avatar).filter,
        avatar: ratio(text(avatar), getComputedStyle(avatar).backgroundColor),
      };
      // Hover and current bring the link back to full strength.
      muted.setAttribute("aria-current", "page");
      await new Promise((resolve) => setTimeout(resolve, 250));
      await settled(block);
      row.currentText = ratio(text(muted), backdrop(muted));
      muted.removeAttribute("aria-current");
      out.push(row);
    }
    if (was === null) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", was);
    return out;
  });
  for (const row of results) {
    const at = `${where} muted rows (${row.theme})`;
    if (row.opacity !== "1") fail(at, `muted link uses opacity ${row.opacity}, not color`);
    if (row.linkText < 4.5) fail(at, `muted link text is ${row.linkText.toFixed(2)}:1, needs 4.5`);
    if (row.linkIcon < 4.5) fail(at, `muted link icon is ${row.linkIcon.toFixed(2)}:1, needs 4.5`);
    if (row.linkText >= row.normalText - 0.3) fail(at, `muted link (${row.linkText.toFixed(2)}:1) is not quieter than a normal one (${row.normalText.toFixed(2)}:1)`);
    if (row.avatarFilter !== "none") fail(at, `muted avatar uses filter ${row.avatarFilter}, which hides its real colors`);
    if (row.avatar < 4.5) fail(at, `muted avatar initials are ${row.avatar.toFixed(2)}:1, needs 4.5`);
    if (row.currentText < 4.5) fail(at, `a muted link that is current reads ${row.currentText.toFixed(2)}:1, needs 4.5`);
  }
  // Hover: the muted link returns to full strength under the pointer.
  const hovered = await (async () => {
    const link = page.locator("#effects-muted-sidebar-rows .sd-sidebar-link[data-muted]");
    await link.hover();
    await page.waitForFunction(
      () => {
        const el = document.querySelector("#effects-muted-sidebar-rows .sd-sidebar-link[data-muted]");
        return el.getAnimations().every((a) => a.playState !== "running");
      },
      null,
      { timeout: 2000 },
    );
    return link.evaluate((el) => ({
      color: getComputedStyle(el).color,
      full: getComputedStyle(document.querySelector("#effects-muted-sidebar-rows .sd-sidebar-link[aria-current]")).color,
    }));
  })();
  if (hovered.color !== hovered.full) fail(`${where} muted rows`, `hovered muted link is ${hovered.color}, not full strength ${hovered.full}`);
  await page.mouse.move(0, 0);
}
