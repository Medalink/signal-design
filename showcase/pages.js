/**
 * The showcase page registry. Plain ESM with no DOM, so the browser, the vite
 * config and the Node scripts all read the same list. Every page list in the
 * repo derives from this file.
 *
 * Library pages hold the demo sections (one section per page). Example pages
 * are mock apps built only from library parts.
 */

/** The overview: the hero and a card for every other page. */
export const HOME = { file: "index.html", title: "Library", summary: "Every page of the library and every example app." };

/**
 * `sections` are the ids of the `.demo-section`s a page holds, in order. `icon`
 * names the `#i-<icon>` rail symbol in layout-plugin.js. A page loads
 * `pages/<id>.js`; `script: false` says it has none.
 */
export const LIBRARY = [
  { id: "tokens", file: "lib-tokens.html", title: "Tokens", label: "Tokens", sections: ["tokens"], icon: "tokens", summary: "Roles, signals, greys, type and motion, read live from the current theme." },
  { id: "elements", file: "lib-elements.html", title: "Elements", label: "Elements", sections: ["elements"], icon: "elements", summary: "Plain HTML with no classes: headings, text, lists, tables and form controls." },
  { id: "components", file: "lib-components.html", title: "Components", label: "Parts", sections: ["components"], icon: "components", summary: "Buttons, fields, rows, status, navigation and overlays, each with copyable HTML." },
  { id: "conversation", file: "lib-conversation.html", title: "Conversation", label: "Chat", sections: ["conversation"], icon: "conversation", summary: "Messages, composer, reactions, banners, files and link cards for anything with people." },
  { id: "inputs-more", file: "lib-inputs-more.html", title: "Inputs, search and data", label: "Inputs", sections: ["inputs-more"], icon: "inputs", summary: "Combobox, tags, number, steps, command palette, shortcuts, sparklines and diffs." },
  { id: "charts", file: "lib-charts.html", title: "Charts", label: "Charts", sections: ["charts"], icon: "charts", summary: "Live time series, generic chart types and square CSS charts on the chart tokens." },
  { id: "effects", file: "lib-effects.html", title: "Effects", label: "Effects", sections: ["effects"], icon: "effects", summary: "Backdrops, ornaments and motion, each switched on with an attribute." },
  { id: "js", file: "lib-js.html", title: "JS", label: "JS", sections: ["js"], icon: "code", summary: "The optional script: init, attributes, hotkeys, live feeds and framework-owned state." },
];

export const EXAMPLES = [
  { file: "shell.html", title: "App shell", summary: "A console in the Signal App Shell: rail, sidebar, live feed, palette and details panel." },
  { file: "chat.html", title: "Chat", summary: "A team chat with mentions, reactions, polls, a context menu and an emoji picker." },
  { file: "form.html", title: "Form", summary: "A three step workspace form with validation, a live price and a dropzone." },
  { file: "landing.html", title: "Landing", summary: "A marketing page with a hero, rain backdrop, pricing and an FAQ." },
  { file: "charts.html", title: "Charts", summary: "Live bandwidth and latency charts with scale modes and the full chart gallery." },
  { file: "stream.html", title: "Stream", summary: "A Twitch overlay package: starting soon, in game, BRB and ending scenes with live alerts, ready for OBS." },
];

/** Every page, overview first. */
export const ALL = [HOME, ...LIBRARY, ...EXAMPLES];

/** A short name for a page that is unique across all three lists: "index", "lib-tokens", "charts". */
export const keyOf = (page) => page.file.replace(/\.html$/, "");

/** The module the overview or a library page loads, or null for a page with `script: false`. */
export const scriptOf = (page) => (page.script === false ? null : page === HOME ? "pages/home.js" : `pages/${page.id}.js`);

export const byId = (id) => LIBRARY.find((p) => p.id === id);
export const byFile = (file) => LIBRARY.find((p) => p.file === file);
/** The page that stamped itself `<html data-page="key">`. GitHub Pages also serves a page without its .html, so the URL cannot name it. */
export const byKey = (key) => ALL.find((p) => keyOf(p) === key);

/** Where a section lives. */
export const pageOfSection = (sectionId) => LIBRARY.find((p) => p.sections.includes(sectionId));

/**
 * The page an old single-page link points to: `#tokens`, `#components-buttons`.
 * Block ids start with their section id plus a dash; the longest section id wins.
 */
export function pageOfHash(hash) {
  const id = hash.replace(/^#/, "");
  let best = null;
  for (const page of LIBRARY) {
    for (const section of page.sections) {
      if ((id === section || id.startsWith(`${section}-`)) && (!best || section.length > best.section.length)) best = { page, section };
    }
  }
  return best?.page ?? null;
}
