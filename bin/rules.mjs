/**
 * Signal's hard rules as page checks, shared by the `signal-design check` CLI
 * and the repo's own scripts/check.mjs. Each function runs inside the page
 * (pass it to page.evaluate).
 */

/** Rounded corners, blurred shadows and CSS gradients (as an image or as a mask) anywhere on the page. */
export function sweep() {
  const bad = [];
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).join(".")}` : "");
  for (const el of document.querySelectorAll("body *")) {
    for (const pseudo of [null, "::before", "::after"]) {
      const s = getComputedStyle(el, pseudo);
      if (pseudo && (s.content === "none" || s.content === "normal")) continue;
      const where = describe(el) + (pseudo || "");
      for (const corner of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"]) {
        if (s[corner] !== "0px") bad.push(`${where}: rounded corner ${s[corner]} (Signal is square)`);
      }
      if (s.boxShadow !== "none") {
        // Allowed: hairlines drawn as inset or spread-only shadows with zero blur.
        for (const part of s.boxShadow.split(/,(?![^(]*\))/)) {
          const nums = part.replace(/rgba?\([^)]*\)|#[0-9a-f]+/gi, "").match(/-?[\d.]+px/g) || [];
          const [, , blur = "0px"] = nums;
          if (parseFloat(blur) > 0) bad.push(`${where}: blurred shadow ${part.trim()} (Signal is flat)`);
        }
      }
      // CSS gradients only: an SVG image may mention gradients inside its url().
      if (/(^|[\s,])(repeating-)?(linear|radial|conic)-gradient\(/.test(s.backgroundImage.replace(/url\([^)]*\)/g, ""))) {
        bad.push(`${where}: CSS gradient (Signal is flat)`);
      }
      // A gradient mask is a gradient: it fades the element out. The one
      // exception is the stream scene's fade layer, which is composited over
      // video in an overlay and is not interface chrome.
      const mask = `${s.maskImage} ${s.webkitMaskImage}`.replace(/url\([^)]*\)/g, "");
      if (/(^|[\s,])(repeating-)?(linear|radial|conic)-gradient\(/.test(mask) && !el.closest(".sd-scene-fade")) {
        bad.push(`${where}: CSS gradient mask (Signal is flat)`);
      }
    }
  }
  return bad;
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
