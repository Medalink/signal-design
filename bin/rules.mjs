/**
 * Signal's hard rules as page checks, shared by the `signal-design check` CLI
 * and the repo's own scripts/check.mjs. Each function runs inside the page
 * (pass it to page.evaluate), so it must not use anything from this module.
 * A finding is a string that starts with its rule, "<rule>: <where>: <what>".
 * An element carries data-sd-check-ignore="<rule> …" to exempt its subtree.
 */

/** Every rule the gate checks, by the name a finding, --skip and data-sd-check-ignore use. */
export const RULES = ["corners", "shadows", "type", "color", "nav-color", "primary", "label", "overflow", "fonts", "console", "a11y"];

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
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.getAttribute("class")?.trim() ? `.${el.getAttribute("class").trim().split(/\s+/).slice(0, 3).join(".")}` : "");
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

/**
 * No hard-coded colors (color). A color that comes from a token changes with
 * the theme, so the page is read in ink and in paper, and a color that is the
 * same in both, and is not the value of any --sd-* token in ink, in paper or
 * in the theme the page is in, was written by hand. A hex copied from a token
 * passes: the rule cannot tell it from the token.
 * Tints of a token pass (alpha is ignored), and so does a person's own color
 * (--who, --edge). Every element that carries data-theme flips with <html>, so
 * an app themed on its body or root is read too. The themes are put back when
 * the function returns. Transitions are off while it reads, and the restored
 * styles are computed before they come back, so the flip starts none;
 * animations are left running, since stopping them restarts them.
 */
export function colorRule() {
  const found = new Map();
  const html = document.documentElement;
  const ignored = (el, rule) => !!el.closest(`[data-sd-check-ignore~="${rule}"]`);
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.getAttribute("class")?.trim() ? `.${el.getAttribute("class").trim().split(/\s+/).slice(0, 3).join(".")}` : "");

  // "r,g,b" of any CSS color, alpha dropped, by painting it on a canvas (that reads hex, oklch() and color-mix() alike).
  const ctx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  const paint = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#010203";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
  };
  const unset = ([r, g, b, a]) => r === 1 && g === 2 && b === 3 && a === 255;
  const memo = new Map();
  const rgb = (value) => {
    value = value.trim();
    if (!value) return "";
    if (!memo.has(value)) {
      const plain = paint(value);
      let key = "";
      if (plain[3] !== 0 && !unset(plain)) {
        // Painting the color with its alpha set to 1 keeps the channels exact; a translucent paint rounds them.
        const opaque = paint(`rgb(from ${value} r g b / 1)`);
        const [r, g, b] = unset(opaque) ? plain : opaque;
        key = `${r},${g},${b}`;
      }
      memo.set(value, key);
    }
    return memo.get(value);
  };

  // Every element that sets a theme, <html> first: an app may set it on its
  // body or its root instead, and a part of the page may set its own.
  const holders = [...new Set([html, ...document.querySelectorAll("[data-theme]")])];
  // The tokens are the --sd-* custom properties a theme holder has. Its
  // computed style lists them whatever origin the stylesheet came from.
  const tokens = new Set();
  const collect = () => {
    for (const holder of holders) {
      const s = getComputedStyle(holder);
      for (const name of s) if (name.startsWith("--sd-")) tokens.add(rgb(s.getPropertyValue(name)));
    }
    tokens.delete("");
  };
  // A token's value in the theme the page is in counts, and in ink and paper:
  // a script that painted a token's color inline (the ornament glints)
  // repaints on sd:theme, which this flip does not send. Graphite's values
  // count only on a page in graphite, or #1a1a1a written by hand would pass.
  collect();
  if (!tokens.size) return [];

  const properties = [
    ["color", "color", null],
    ["background-color", "backgroundColor", null],
    ["border-top-color", "borderTopColor", "borderTopWidth"],
    ["border-right-color", "borderRightColor", "borderRightWidth"],
    ["border-bottom-color", "borderBottomColor", "borderBottomWidth"],
    ["border-left-color", "borderLeftColor", "borderLeftWidth"],
    ["outline-color", "outlineColor", "outlineWidth"],
  ];
  const shown = [html, ...document.querySelectorAll("body, body *")].filter(
    (el) => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden" && !ignored(el, "color"),
  );
  const index = new Map(shown.map((el, i) => [el, i]));
  const read = () =>
    shown.map((el) => {
      const s = getComputedStyle(el);
      return properties.map(([, key, width]) => (width && !(parseFloat(s[width]) > 0 && (key !== "outlineColor" || s.outlineStyle !== "none")) ? "" : s[key]));
    });

  const was = holders.map((el) => el.getAttribute("data-theme"));
  const quiet = document.createElement("style");
  quiet.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.append(quiet);
  let ink, paper, user;
  try {
    for (const theme of ["ink", "paper"]) {
      for (const holder of holders) holder.setAttribute("data-theme", theme);
      collect();
      if (theme === "ink") {
        ink = read();
        user = shown.map((el) => {
          const s = getComputedStyle(el);
          return [rgb(s.getPropertyValue("--who")), rgb(s.getPropertyValue("--edge"))];
        });
      } else paper = read();
    }
  } finally {
    holders.forEach((holder, i) => (was[i] == null ? holder.removeAttribute("data-theme") : holder.setAttribute("data-theme", was[i])));
    // Compute the restored styles while transitions are still off, so none starts when the style goes.
    read();
    quiet.remove();
  }

  shown.forEach((el, i) =>
    properties.forEach(([name], j) => {
      const value = ink[i][j];
      if (!value || value !== paper[i][j]) return;
      const key = rgb(value);
      if (!key || tokens.has(key) || user[i].includes(key)) return;
      // Text color is inherited: report the element that set it, not everything under it.
      const parent = index.get(el.parentElement);
      if (name === "color" && parent !== undefined && ink[parent][j] === value && paper[parent][j] === value) return;
      const label = `${describe(el)} ${name}`;
      if (!found.has(label)) found.set(label, `color: ${describe(el)}: ${name} ${value} is the same in every theme (use a --sd-* token)`);
    }),
  );
  return [...found.values()];
}

/**
 * Navigation and headings stay grey (nav-color). Their text color is never a
 * signal role: accent, success, danger, warning, pending or extra, read on the
 * element so a themed subtree counts. Status is allowed to be colored, so
 * anything in a data-tone, a badge, a count, a dot or a status is left alone,
 * and so is a person's own color (--who).
 */
export function navColorRule() {
  const found = new Map();
  const ignored = (el, rule) => !!el.closest(`[data-sd-check-ignore~="${rule}"]`);
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.getAttribute("class")?.trim() ? `.${el.getAttribute("class").trim().split(/\s+/).slice(0, 3).join(".")}` : "");
  // "r,g,b" of any CSS color, alpha dropped, by painting it on a canvas.
  const ctx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  const paint = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#010203";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
  };
  const unset = ([r, g, b, a]) => r === 1 && g === 2 && b === 3 && a === 255;
  const memo = new Map();
  const rgb = (value) => {
    value = value.trim();
    if (!value) return "";
    if (!memo.has(value)) {
      const plain = paint(value);
      let key = "";
      if (plain[3] !== 0 && !unset(plain)) {
        const opaque = paint(`rgb(from ${value} r g b / 1)`);
        const [r, g, b] = unset(opaque) ? plain : opaque;
        key = `${r},${g},${b}`;
      }
      memo.set(value, key);
    }
    return memo.get(value);
  };
  const roles = ["accent", "success", "danger", "warning", "pending", "extra"];
  const nav = ["h1", "h2", "h3", "h4", "h5", "h6", "nav a", ".sd-sidebar-link", ".sd-rail-item", "[role=tab]", ".sd-breadcrumb a"];
  for (const el of document.querySelectorAll([...nav, ...nav.map((selector) => `${selector} svg`)].join(", "))) {
    if (!el.getClientRects().length || el.closest('[data-tone], [class*="sd-badge"], .sd-count, .sd-dot, .sd-status') || ignored(el, "nav-color")) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden") continue;
    const color = rgb(s.color);
    if (!color || color === rgb(s.getPropertyValue("--who"))) continue;
    const role = roles.find((name) => rgb(s.getPropertyValue(`--sd-${name}`)) === color);
    if (role) found.set(`${describe(el)} ${role}`, `nav-color: ${describe(el)}: color ${s.color} is the ${role} role (navigation and headings stay grey)`);
  }
  return [...found.values()];
}

/**
 * One primary button per view (primary). A view is the page, or the open
 * dialog or popover a button is in, so a confirm dialog may have its own.
 * A finding names the view and its buttons.
 */
export function primaryRule() {
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.getAttribute("class")?.trim() ? `.${el.getAttribute("class").trim().split(/\s+/).slice(0, 3).join(".")}` : "");
  const views = new Map();
  for (const el of document.querySelectorAll(".sd-btn-primary")) {
    if (!el.getClientRects().length || getComputedStyle(el).visibility === "hidden" || el.closest('[data-sd-check-ignore~="primary"]')) continue;
    let view = null;
    try {
      view = el.closest("dialog[open], [popover]:popover-open");
    } catch {
      view = el.closest("dialog[open]");
    }
    if (!views.has(view)) views.set(view, []);
    views.get(view).push(el);
  }
  const text = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30);
  return [...views]
    .filter(([, buttons]) => buttons.length > 1)
    .map(([view, buttons]) => `primary: ${view ? describe(view) : "the page"} has ${buttons.length} primary buttons (one per view): ${buttons.map((b) => `${describe(b)} "${text(b)}"`).join(", ")}`);
}

/**
 * A placeholder is not a label (label). A text field with a placeholder needs
 * a name that stays once the user types: a <label>, aria-label,
 * aria-labelledby or title. axe takes the placeholder as a name; WCAG 3.3.2
 * does not, because it disappears.
 */
export function labelRule() {
  const found = [];
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.getAttribute("class")?.trim() ? `.${el.getAttribute("class").trim().split(/\s+/).slice(0, 3).join(".")}` : "");
  const named = (el, attribute) => !!el.getAttribute(attribute)?.trim();
  const fields = "input:not([type=checkbox],[type=radio],[type=hidden],[type=button],[type=submit],[type=reset],[type=image],[type=range],[type=color],[type=file]), textarea";
  for (const el of document.querySelectorAll(fields)) {
    if (!el.placeholder?.trim() || !el.getClientRects().length || getComputedStyle(el).visibility === "hidden") continue;
    if (el.labels?.length || named(el, "aria-label") || named(el, "aria-labelledby") || named(el, "title") || el.closest('[data-sd-check-ignore~="label"]')) continue;
    found.push(`label: ${describe(el)}: the placeholder "${el.placeholder.trim().slice(0, 30)}" is the only name (add a label, aria-label or aria-labelledby; a placeholder disappears when you type)`);
  }
  return found;
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
