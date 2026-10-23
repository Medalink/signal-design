export const page = "conversation";

/** Message edges: --edge for the author, state edges over it in a fixed order, the grey own edge (no fill) and the selected fill. */
export default async function checkMessageStates(page, where, fail) {
  const got = await page.evaluate(() => {
    const block = document.getElementById("conversation-message-edges-and-selection");
    block.scrollIntoView();
    const resolve = (prop, value) => {
      const probe = document.createElement("i");
      probe.style.setProperty(prop, value);
      block.append(probe);
      const v = getComputedStyle(probe).getPropertyValue(prop);
      probe.remove();
      return v;
    };
    const color = (token) => resolve("color", `var(${token})`);
    const make = (attrs) => {
      const m = document.createElement("article");
      m.className = "sd-message";
      for (const [k, v] of Object.entries(attrs)) k.startsWith("--") ? m.style.setProperty(k, v) : m.setAttribute(k, v);
      block.append(m);
      const s = getComputedStyle(m);
      const out = { edge: s.borderInlineStartColor, fill: s.backgroundColor };
      m.remove();
      return out;
    };
    const role = { "--edge": "var(--sd-extra)" };
    return {
      author: make(role).edge === color("--sd-extra"),
      plain: make({}).edge === "rgba(0, 0, 0, 0)",
      mention: make({ ...role, "data-mention": "" }).edge === color("--sd-fg"),
      selected: make({ ...role, "data-mention": "", "data-selected": "" }).edge === color("--sd-accent"),
      current: make({ ...role, "data-selected": "", "aria-current": "true" }).edge === color("--sd-fg-subtle"),
      failed: make({ ...role, "data-selected": "", "aria-current": "true", "data-failed": "" }).edge === color("--sd-danger"),
      currentFalse: make({ ...role, "aria-current": "false" }).edge === color("--sd-extra"),
      ownEdge: make({ ...role, "data-own": "" }).edge === color("--sd-line-strong"),
      ownNoFill: make({ "data-own": "" }).fill === "rgba(0, 0, 0, 0)",
      ownMention: make({ "data-own": "", "data-mention": "" }).edge === color("--sd-fg"),
      ownSelected: make({ "data-own": "", "data-selected": "" }).edge === color("--sd-accent"),
      selectedFill: make({ "data-own": "", "data-selected": "" }).fill === color("--sd-raised"),
    };
  });
  for (const [key, passed] of Object.entries(got)) if (!passed) fail(`${where} message states`, key);
}
