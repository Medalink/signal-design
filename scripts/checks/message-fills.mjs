export const page = "messages";
/** Message fills: mention and current rows read against both panes in every theme, differ from each other, and keep 4.5:1 for their secondary text. */
export default async function checkMessageFills(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("conversation-message-edges-and-selection");
    block.scrollIntoView();
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const rgba = (css) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const over = (top, base) => {
      const a = top[3] / 255;
      return base.map((v, i) => (i < 3 ? top[i] * a + v * (1 - a) : 255));
    };
    const linear = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    const ratio = (x, y) => (Math.max(lum(x), lum(y)) + 0.05) / (Math.min(lum(x), lum(y)) + 0.05);
    const out = {};
    const pane = document.createElement("div");
    block.append(pane);
    for (const theme of ["ink", "graphite", "paper"]) {
      pane.setAttribute("data-theme", theme);
      for (const token of ["canvas", "surface"]) {
        pane.style.background = `var(--sd-${token})`;
        const base = rgba(getComputedStyle(pane).backgroundColor);
        const fill = (attrs) => {
          const m = document.createElement("article");
          m.className = "sd-message";
          for (const [k, v] of Object.entries(attrs)) m.setAttribute(k, v);
          m.innerHTML = '<div class="sd-message-body"><span class="sd-message-edited">edited</span><div class="sd-message-status">Not sent</div></div>';
          pane.append(m);
          const s = getComputedStyle(m);
          const fillColor = over(rgba(s.backgroundColor), base);
          const res = {
            fill: fillColor,
            faint: over(rgba(getComputedStyle(m.querySelector(".sd-message-edited")).color), fillColor),
            status: over(rgba(getComputedStyle(m.querySelector(".sd-message-status")).color), fillColor),
          };
          m.remove();
          return res;
        };
        const mention = fill({ "data-mention": "" });
        const current = fill({ "aria-current": "true" });
        const failedCurrent = fill({ "data-failed": "", "aria-current": "true" });
        const failedMention = fill({ "data-failed": "", "data-mention": "" });
        const key = `${theme}/${token}`;
        out[`${key} failed text on current`] = ratio(failedCurrent.status, failedCurrent.fill) >= 4.5;
        out[`${key} failed text on mention`] = ratio(failedMention.status, failedMention.fill) >= 4.5;
        out[`${key} mention vs pane`] = ratio(mention.fill, base) >= 1.1;
        out[`${key} current vs pane`] = ratio(current.fill, base) >= 1.15;
        out[`${key} current vs mention`] = ratio(current.fill, mention.fill) >= 1.04;
        out[`${key} text on mention`] = ratio(mention.faint, mention.fill) >= 4.5;
        out[`${key} text on current`] = ratio(current.faint, current.fill) >= 4.5;
      }
    }
    pane.remove();
    return out;
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} message fills`, key);
}
