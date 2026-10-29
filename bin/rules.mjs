/**
 * Signal's hard rules as page checks, shared by the `signal-design check` CLI
 * and the repo's own scripts/check.mjs. Each function runs inside the page
 * (pass it to page.evaluate), so it must not use anything from this module.
 * A finding is a string that starts with its rule, "<rule>: <where>: <what>".
 * An element carries data-sd-check-ignore="<rule> …" to exempt its subtree.
 */

/** Every rule the gate checks, by the name a finding, --skip and data-sd-check-ignore use. */
export const RULES = ["corners", "shadows", "type", "overflow", "fonts", "console", "a11y"];

/** Rounded corners (corners) and blurred shadows (shadows) anywhere on the page. */
export function sweep() {
  const bad = [];
  const ignored = (el, rule) => !!el.closest(`[data-sd-check-ignore~="${rule}"]`);
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).join(".")}` : "");
  for (const el of document.querySelectorAll("body *")) {
    const skipCorners = ignored(el, "corners");
    const skipShadows = ignored(el, "shadows");
    for (const pseudo of [null, "::before", "::after"]) {
      const s = getComputedStyle(el, pseudo);
      if (pseudo && (s.content === "none" || s.content === "normal")) continue;
      const where = describe(el) + (pseudo || "");
      for (const corner of skipCorners ? [] : ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"]) {
        if (s[corner] !== "0px") bad.push(`corners: ${where}: rounded corner ${s[corner]} (Signal is square)`);
      }
      if (!skipShadows && s.boxShadow !== "none") {
        // Allowed: hairlines drawn as inset or spread-only shadows with zero blur.
        for (const part of s.boxShadow.split(/,(?![^(]*\))/)) {
          const nums = part.replace(/rgba?\([^)]*\)|#[0-9a-f]+/gi, "").match(/-?[\d.]+px/g) || [];
          const [, , blur = "0px"] = nums;
          if (parseFloat(blur) > 0) bad.push(`shadows: ${where}: blurred shadow ${part.trim()} (Signal is flat)`);
        }
      }
    }
  }
  return bad;
}

/**
 * Text uses two weights and the families Signal sets (type). The weights are
 * 400 and 500, plus 600 in the reading face. The family is whichever of
 * --sd-font-sans, --sd-font-mono and --sd-font-reading is set on the element,
 * which a data-font on a subtree can change, so each is read there.
 */
export function typeRule() {
  const found = new Set();
  const ignored = (el, rule) => !!el.closest(`[data-sd-check-ignore~="${rule}"]`);
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}` : "");
  const norm = (family) => family.replace(/["']/g, "").replace(/\s+/g, "").toLowerCase();
  const field = "input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=hidden]), textarea, select, button";
  for (const el of document.querySelectorAll("body *")) {
    if (!el.getClientRects().length || el.closest("svg, canvas")) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden") continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !el.matches(field)) continue;
    if (ignored(el, "type")) continue;
    const family = norm(s.fontFamily);
    const face = ["sans", "mono", "reading"].find((name) => norm(s.getPropertyValue(`--sd-font-${name}`)) === family);
    if (!face) found.add(`type: ${describe(el)}: font-family "${s.fontFamily.split(",")[0].replace(/["']/g, "").trim()}" (set it with font-sans or font-mono)`);
    const weight = parseInt(s.fontWeight, 10);
    if (!(weight === 400 || weight === 500 || (weight === 600 && face === "reading"))) found.add(`type: ${describe(el)}: font-weight ${s.fontWeight} (Signal uses 400 and 500)`);
  }
  return [...found];
}

/** Source Code Pro faces after loading: ["400:loaded", "600:loaded", …]. */
export async function fontFaces() {
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
  return [...document.fonts].filter((f) => f.family.includes("Source Code Pro")).map((f) => `${f.weight}:${f.status}`);
}

/** Horizontal overflow in px and the first elements sticking out. */
export function overflow() {
  const px = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (px <= 0) return { px: 0, culprits: [] };
  const culprits = [...document.querySelectorAll("body *")]
    .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    .slice(0, 5)
    .map((el) => el.outerHTML.slice(0, 90));
  return { px, culprits };
}
