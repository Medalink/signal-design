/**
 * The showcase page registry. Plain ESM with no DOM, so the browser, the vite
 * config and the Node scripts all read the same list. Every page list in the
 * repo derives from this file.
 *
 * Library pages hold the demo blocks, one component type per page. Example
 * pages are mock apps built only from library parts. Both are filed the way
 * the rail and sidebar show them: section, then group, then page.
 */

import { MOVED } from "./moved.js";

/** The overview: the hero and a card for every other page. */
export const HOME = { file: "index.html", title: "Library", summary: "Every page of the library and every example app." };

const group = (title, pages) => ({ title, pages });

/**
 * The library's rail sections, in order. Each section's sidebar files its
 * pages under text groups. `label` is the short rail name and `icon` the
 * `#i-<icon>` symbol in layout-plugin.js. A page's file is `lib-<id>.html`;
 * it loads `pages/<id>.js` when that file exists.
 */
const library = [
  {
    id: "foundations", title: "Foundations", label: "Basics", icon: "tokens",
    groups: [
      group("Design", [
        { id: "rules", title: "Rules", summary: "The hard rules and the principles every part follows." },
        { id: "color", title: "Color", summary: "Semantic roles, signals, greys and themes, read live from the current theme." },
        { id: "type", title: "Type", summary: "The type scale, tracking, weights, fonts and text styles." },
        { id: "layout", title: "Layout", summary: "Spacing, motion, panel widths, page layout and visibility helpers." },
        { id: "icons", title: "Icons", summary: "Square-stroke icons sized to the text beside them, and the icon set." },
      ]),
      group("Plain HTML", [
        { id: "elements", title: "Elements", summary: "Plain HTML with no classes: headings, text, lists, tables and form controls." },
      ]),
    ],
  },
  {
    id: "components", title: "Components", label: "Parts", icon: "inputs",
    groups: [
      group("Forms", [
        { id: "buttons", title: "Buttons", summary: "Primary, ghost and link buttons in every size, with icons and states." },
        { id: "fields", title: "Fields", summary: "Labels, hints, inputs, selects, switches and a dropzone." },
        { id: "choices", title: "Choices", summary: "Option cards and segmented controls, wrapped in narrow containers." },
        { id: "pickers", title: "Combobox and tags", summary: "Combobox, tags, number input and steps." },
      ]),
      group("Navigation", [
        { id: "nav-bars", title: "Bars and tabs", summary: "Top bar, side navigation, tabs, pagination and status bar." },
        { id: "menus", title: "Menus", summary: "Menus and popovers anchored to their trigger, with keyboard focus." },
        { id: "overlays", title: "Overlays", summary: "Dialogs, sheets and drawers opened with an attribute." },
        { id: "command", title: "Command palette", summary: "A command palette and keyboard shortcuts." },
      ]),
      group("Status", [
        { id: "badges", title: "Badges", summary: "Markers, badges, chips and pills, each taking a tone." },
        { id: "avatars", title: "Avatars", summary: "Avatars in every size with presence, status and counts." },
        { id: "feedback", title: "Feedback", summary: "Callouts, notes, progress, skeletons, checks, empty states and toasts." },
        { id: "level", title: "Level meter", summary: "A live level from one custom property." },
      ]),
      group("Data", [
        { id: "stats", title: "Stats and tables", summary: "Stats, numbers, tables and key-value lists." },
        { id: "rows", title: "Rows", summary: "Rows that show an outcome and expand for detail." },
        { id: "living-tables", title: "Living tables", summary: "Tables whose rows arrive, change and leave while you read them." },
        { id: "charts", title: "Charts", summary: "Live time series, chart types, square CSS charts, sparklines and diffs." },
        { id: "timeline", title: "Timeline", summary: "Ranges over one time axis." },
        { id: "schedule", title: "Schedule", summary: "An hour roster of status blocks in mono or spectrum." },
        { id: "flow", title: "Flow", summary: "A pipeline of stages and jobs on a dot grid, in mono or spectrum." },
      ]),
    ],
  },
  {
    id: "patterns", title: "Patterns", label: "Patterns", icon: "shell",
    groups: [
      group("Conversation", [
        { id: "messages", title: "Messages", summary: "Messages with names, edges, replies, selection and narrow columns." },
        { id: "feed", title: "Feed", summary: "A message feed with day breaks and a jump back to the present." },
        { id: "composer", title: "Composer", summary: "The composer, its add menu and the emoji picker." },
        { id: "people", title: "People", summary: "Conversation items, presence, counts and the roster." },
        { id: "attachments", title: "Blocks and links", summary: "Banners, files, polls, tiles and link cards inside a conversation." },
      ]),
      group("App shell", [
        { id: "window", title: "Window and bars", summary: "The full shell, the desktop title bar and the header bar." },
        { id: "rail", title: "Rail", summary: "A compact rail of places with tiles, unread marks and counts." },
        { id: "sidebar", title: "Sidebar", summary: "Sidebar heads and a sidebar you can resize." },
      ]),
      group("Effects", [
        { id: "rain", title: "Rain", summary: "The digital rain backdrop, and a job that speeds it up." },
        { id: "ornaments", title: "Ornaments", summary: "Corner ornaments, border glow, art ornaments and edge dust." },
        { id: "surfaces", title: "Shimmer and scrollbars", summary: "The hover shimmer and the scrollbar styles." },
        { id: "ascii", title: "ASCII", summary: "Animated ASCII art in greys, still until the work behind it is running." },
      ]),
    ],
  },
  {
    id: "scripting", title: "Scripting", label: "JS", icon: "code",
    groups: [
      group("Setup", [
        { id: "setup", title: "Setup", summary: "init(), the data-sd attributes it wires, and copy feedback." },
        { id: "owned", title: "Framework state", summary: "Leaving state to React, Vue or Svelte: one writer per state." },
      ]),
      group("Mounts", [
        { id: "countdown", title: "Countdown", summary: "A countdown you can pause and resume." },
        { id: "live-feed", title: "Live feed", summary: "Keyboard navigation through a live feed." },
      ]),
    ],
  },
];

/** Every library page in sidebar order. Each also learns its section, group and file, so a group lists the same objects. */
export const LIBRARY = library.flatMap((section) =>
  section.groups.flatMap((g) => g.pages.map((page) => Object.assign(page, { section, group: g, file: `lib-${page.id}.html` }))),
);

/** The example apps: whole pages built only from library parts, with no library chrome. */
const examples = {
  id: "examples", title: "Examples", label: "Examples", icon: "pages",
  groups: [
    group("HTML apps", [
      { file: "shell.html", title: "App shell", summary: "Watcher's Containers screen: tiles, container groups whose rows open to details and actions, a confirm before Remove, a live status bar." },
      { file: "chat.html", title: "Chat", summary: "A group channel in the full app frame: group rail, resizable channel sidebar, feed with a poll and replies, members by role." },
      { file: "form.html", title: "Form", summary: "AI settings: connected servers, a found server, command-line agents and an add-a-server form that validates on blur and counts its errors." },
      { file: "landing.html", title: "Landing", summary: "A one-screen download page: a hero, four points and a download block." },
      { file: "charts.html", title: "Charts", summary: "Watcher's Stats screen: range, tiles, CPU and memory plots with a limit line, a per-container table and database facts." },
      { file: "stream.html", title: "Stream", summary: "A Twitch overlay package: starting soon, in game, BRB and ending scenes with live alerts, ready for OBS." },
    ]),
    group("React apps", [
      { file: "react.html", title: "React", summary: "Every React binding on one page with no init(): buttons, fields, overlays, menus, tabs, tables and toasts." },
      { file: "react-shell.html", title: "React app shell", summary: "The Signal App Shell as React components: rail sections, sidebar panels, drawer and details panel owned by React state." },
      { file: "react-editor.html", title: "React editor", summary: "The parts a document editor is built from, as React components: toolbar, manuscript, marks, document tree, combobox, command palette and choice controls." },
    ]),
  ],
};
export const EXAMPLES = examples.groups.flatMap((g) => g.pages);

/** The rail: the library's sections, then the examples. */
export const SECTIONS = [...library, examples];

/** Every page, overview first. */
export const ALL = [HOME, ...LIBRARY, ...EXAMPLES];

/** A short name for a page that is unique across all three lists: "index", "lib-buttons", "charts". */
export const keyOf = (page) => page.file.replace(/\.html$/, "");

export const byId = (id) => LIBRARY.find((p) => p.id === id);
export const byFile = (file) => LIBRARY.find((p) => p.file === file);
/** The page that stamped itself `<html data-page="key">`. GitHub Pages also serves a page without its .html, so the URL cannot name it. */
export const byKey = (key) => ALL.find((p) => keyOf(p) === key);

/** The pages before and after this one, across groups and sections. */
export function neighbors(page) {
  const at = LIBRARY.indexOf(page);
  return { prev: LIBRARY[at - 1] ?? null, next: LIBRARY[at + 1] ?? null };
}

/**
 * The page an old link points to: a section or block of the old single page
 * (`index.html#components-buttons`) or of the old section pages
 * (`lib-components.html#components-overlays`), or a page id (`#buttons`).
 */
export function pageOfHash(hash) {
  const id = hash.replace(/^#/, "");
  return byId(MOVED[id] ?? id) ?? null;
}
