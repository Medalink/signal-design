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
        {
          id: "buttons", title: "Buttons", summary: "Primary, ghost and link buttons in every size, with icons and states.",
          doc: {
            intro: "Every action a view offers, from the one solid primary down to a quiet link, with tones, sizes, icons and a busy state.",
            when: [
              "A view has one clear action: the primary is that action and appears once.",
              "Rows and toolbars of secondary actions: ghost and link buttons keep them quiet.",
              "A destructive or costly step: a danger tone states the cost before the click.",
            ],
            notWhen: [
              "Single-select choices: a segmented control or option cards do that (see Choices).",
              "Navigation between pages: a link reads as navigation, a button reads as an action.",
            ],
            usage: '&lt;button class="sd-btn sd-btn-primary"&gt;Approve&lt;/button&gt;\n&lt;button class="sd-btn"&gt;Save for later&lt;/button&gt;\n&lt;button class="sd-btn sd-btn-ghost"&gt;Cancel&lt;/button&gt;',
            install: {
              cmd: "pnpm add github:Medalink/signal-design",
              note: 'Then <code>@import "signal-design"</code> after Tailwind, or link <code>dist/signal.css</code> with its fonts; pin a tag or commit for reproducible builds.',
            },
            examples: [
              {
                title: "Busy state",
                html: '<button class="sd-btn sd-btn-primary" aria-busy="true">Merging</button>\n<button class="sd-btn" aria-busy="true">Syncing</button>\n<button class="sd-btn" disabled>Disabled</button>',
              },
              {
                title: "Destructive confirmation",
                html: '<button class="sd-btn" data-tone="danger">Delete branch</button>\n<button class="sd-btn sd-btn-ghost">Keep it</button>',
              },
              {
                title: "Sizes",
                html: '<button class="sd-btn sd-btn-sm">Small</button>\n<button class="sd-btn">Default</button>\n<button class="sd-btn sd-btn-lg">Large</button>',
              },
            ],
            responsive: [
              "Sizes are fixed, not fluid: the three sizes hold 26, 34 and 44 px of height at every viewport, and a long label wraps the row, not the button.",
              "A row of buttons wraps: <code>sd-actions</code> is a wrapping flex row, so toolbars fold onto more lines on narrow screens.",
              "Hover styles apply on touch too (there is no fine-pointer gate), so never put information only in hover; the press nudge gives touch its feedback.",
            ],
            notes: [
              "Pick a button for an action; a segmented control or option cards for a choice, a link for navigation.",
              "One <code>sd-btn-primary</code> per view: it is the view's main action, and ghost or link buttons carry the rest.",
              "Meaning comes from <code>data-tone</code>, never a color class; a danger tone states the cost of a destructive step before the click.",
              "While work runs, keep the button enabled with <code>aria-busy=\"true\"</code> instead of <code>disabled</code>, so it stays reachable and announced.",
            ],
            api: [
              { name: "sd-btn", type: "class", desc: "The button base: a raised fill that lifts on hover." },
              { name: "sd-btn-primary", type: "class", desc: "Solid foreground fill. One per view." },
              { name: "sd-btn-ghost", type: "class", desc: "Transparent until hover, for toolbars and quiet actions." },
              { name: "sd-btn-link", type: "class", desc: "A button that looks like a link." },
              { name: "sd-btn-sm, sd-btn-lg", type: "class", desc: "Smaller and larger sizes; sd-btn-icon is square for an icon only." },
              { name: "sd-btn-block", type: "class", desc: "Takes the full width of its column, for stacked forms." },
              { name: "sd-btn-group", type: "class", desc: "Joins buttons into one control with role=\"group\"." },
              { name: "data-tone", type: "attribute", def: "unset", desc: "success, danger, warning, pending or accent, on plain and primary buttons." },
              { name: "aria-busy", type: "ARIA", def: "false", desc: "Shows work in flight without disabling the button." },
              { name: "sd-kbd", type: "class", desc: "A key look for any element, inside a button or beside it." },
            ],
            keyboard: [
              ["Enter", "Activates the focused button."],
              ["Space", "Activates the focused button."],
            ],
            a11y: [
              "An icon-only button needs an aria-label; there is no text to fall back on.",
              "Keep aria-busy instead of disabled while work runs, so the button stays reachable and announced.",
              "A kbd hint inside a button is read with its label; put the key last.",
            ],
            motion: [
              "Hover and press transitions run 120-200ms.",
              "prefers-reduced-motion stops the transitions; the state change stays visible.",
            ],
            related: ["choices", "menus", "overlays"],
          },
        },
        {
          id: "fields", title: "Fields", summary: "Labels, hints, inputs, selects, switches and a dropzone.",
          doc: {
            intro: "One field is a label, a control and its hint or error, read in that order by assistive tech and styled by the library.",
            when: [
              "Any form: settings, creation dialogs, filters and importers.",
              "A value needs a format: the hint states it, the error restates it after a failed blur.",
              "Files must come from the user: the dropzone labels a real file input.",
            ],
            notWhen: [
              "A choice between options shown all at once: option cards and radios do that (see Choices).",
              "Picking many values with search: a combobox does that (see Combobox and tags).",
            ],
            usage: '&lt;div class="sd-field"&gt;\n  &lt;label class="sd-field-label" for="name"&gt;Name&lt;/label&gt;\n  &lt;input id="name" aria-describedby="name-hint"&gt;\n  &lt;p class="sd-field-hint" id="name-hint"&gt;Shown on your profile.&lt;/p&gt;\n&lt;/div&gt;',
            api: [
              { name: "sd-form", type: "class", desc: "The form grid; sd-form-row puts fields side by side." },
              { name: "sd-field", type: "class", desc: "One field: label, control, hint and error in a column." },
              { name: "sd-field-label", type: "class", desc: "The visible label. Point its for at the control." },
              { name: "sd-field-hint, sd-field-error", type: "class", desc: "Helper text under the control; the error shows when the field is invalid." },
              { name: "sd-field-aside", type: "class", desc: "A marker in the label, such as optional." },
              { name: "data-invalid, aria-invalid", type: "attribute", desc: "Shows the error text and reddens the label." },
              { name: "sd-input-group, sd-addon", type: "class", desc: "Joins a prefix or a button to an input." },
              { name: "sd-control-sm, sd-control-lg", type: "class", desc: "Smaller and larger controls, matching the button sizes." },
              { name: "sd-dropzone", type: "class", desc: "A label wrapping a file input, with a drag state." },
            ],
            keyboard: [
              ["Tab", "Moves between controls in DOM order; keep the label before its control."],
              ["Enter", "Submits the form, unless it moves to the next line in a textarea."],
            ],
            a11y: [
              "Every field is named by visible text: a placeholder is a hint, not a label.",
              "Point aria-describedby at the hint and error so they are read with the field.",
              "Mark invalid fields with aria-invalid as well as data-invalid, so the state is announced.",
            ],
            motion: [
              "Focus and invalid states change without animation.",
              "The dropzone drag state is a background change, safe under prefers-reduced-motion.",
            ],
            related: ["choices", "pickers", "elements"],
          },
        },
        { id: "choices", title: "Choices", summary: "Option cards and segmented controls, wrapped in narrow containers." },
        { id: "pickers", title: "Combobox and tags", summary: "Combobox, tags, number input and steps." },
      ]),
      group("Navigation", [
        { id: "nav-bars", title: "Bars and tabs", summary: "Top bar, side navigation, tabs, pagination and status bar." },
        {
          id: "menus", title: "Menus", summary: "Menus and popovers anchored to their trigger, with keyboard focus.",
          doc: {
            intro: "A native popover positioned next to its trigger: a menu of actions, or a small panel of facts.",
            when: [
              "Row actions that would crowd the row: one more button opens the rest.",
              "A choice of a few commands with shortcuts: the menu shows the keys.",
              "A short explanation belongs next to its term: a padded popover holds it.",
            ],
            notWhen: [
              "Search over many commands: the command palette does that (see Command palette).",
              "A decision that needs space or a form: a dialog does that (see Overlays).",
            ],
            usage: '&lt;button popovertarget="row-menu" aria-haspopup="menu"&gt;More&lt;/button&gt;\n&lt;div popover id="row-menu" class="sd-popover"&gt;\n  &lt;div class="sd-menu" role="menu" aria-label="Item actions"&gt;\n    &lt;button role="menuitem"&gt;Open&lt;/button&gt;\n    &lt;button role="menuitem" data-tone="danger"&gt;Delete&lt;/button&gt;\n  &lt;/div&gt;\n&lt;/div&gt;',
            api: [
              { name: "popovertarget", type: "attribute", desc: "The native attribute. The JS places the panel at the trigger and keeps aria-expanded in sync." },
              { name: "sd-popover", type: "class", desc: "The panel; sd-popover-pad gives it inner padding for prose." },
              { name: "data-sd-side", type: "attribute", def: "bottom", desc: "Preferred placement, such as top; the panel still flips at the edge." },
              { name: "data-sd-align", type: "attribute", def: "start", desc: "end aligns the panel with the trigger's far edge." },
              { name: "sd-menu", type: "class", desc: "The menu inside a popover, with role=\"menu\" or role=\"listbox\"." },
              { name: "role=\"menuitem\"", type: "ARIA", desc: "One command; menuitemradio and menuitemcheckbox carry aria-checked." },
              { name: "sd-menu-label", type: "class", desc: "A group heading inside the menu." },
              { name: "sd-menu-sep", type: "class", desc: "A separator between groups, an hr." },
              { name: "sd-menu-hint", type: "class", desc: "Faint trailing text for a shortcut." },
              { name: "sd-menu-item", type: "class", desc: "A link styled as a menu item." },
            ],
            keyboard: [
              ["↓ / ↑", "Moves between items, wrapping at the ends."],
              ["Home / End", "Jumps to the first or last item."],
              ["A-Z", "Types ahead to the next item that starts with those letters."],
              ["Esc", "Closes the menu and returns focus to the trigger."],
            ],
            a11y: [
              "Set aria-haspopup on the trigger; the JS keeps aria-expanded current.",
              "Give every menu an aria-label; the trigger's name alone does not describe the menu.",
              "Disabled items keep role=\"menuitem\" with aria-disabled, so they stay findable.",
            ],
            motion: [
              "The panel opens in about 150ms with a small move and fade.",
              "prefers-reduced-motion removes the move; the panel still appears and closes.",
            ],
            related: ["overlays", "command", "buttons"],
          },
        },
        { id: "overlays", title: "Overlays", summary: "Dialogs, sheets and drawers opened with an attribute." },
        { id: "command", title: "Command palette", summary: "A command palette and keyboard shortcuts." },
      ]),
      group("Status", [
        { id: "badges", title: "Badges", summary: "Markers, badges, chips and pills, each taking a tone." },
        { id: "avatars", title: "Avatars", summary: "Avatars in every size with presence, status and counts." },
        {
          id: "feedback", title: "Feedback", summary: "Callouts, notes, progress, skeletons, checks, empty states and toasts.",
          doc: {
            intro: "What the system tells the user while it works and after it finishes, from an inline note to a toast.",
            when: [
              "Something changed under the user: a note states it and offers the next step.",
              "Work has a length: progress shows the amount, or runs indeterminate when it has none.",
              "A list or screen has nothing to show yet: an empty state says what will appear here.",
            ],
            notWhen: [
              "A standing state on a row or item: a badge or status does that (see Badges).",
              "A result the user must not miss: a dialog holds the decision (see Overlays).",
            ],
            usage: '&lt;div class="sd-callout" data-tone="danger"&gt;\n  &lt;p class="sd-callout-title"&gt;High risk&lt;/p&gt;\n  &lt;p&gt;Expires in 45 min. Review before approving.&lt;/p&gt;\n&lt;/div&gt;\n&lt;button data-sd-toast="Saved"&gt;Save&lt;/button&gt;',
            api: [
              { name: "sd-note", type: "class", desc: "An inline line of text that takes a tone and can hold a button." },
              { name: "sd-callout, sd-callout-title", type: "class", desc: "A boxed note with a titled edge in its tone." },
              { name: "toast(text, { tone })", type: "function", desc: "Shows a short result at the edge; data-sd-toast does it from a click." },
              { name: "sd-progress", type: "class", desc: "A bar driven by --value, or data-state=\"indeterminate\" when the amount is unknown." },
              { name: "sd-progress-label", type: "class", desc: "The row above a bar: name and value at the ends." },
              { name: "sd-cells", type: "class", desc: "A row of small squares, i elements with data-on." },
              { name: "sd-skeleton, sd-skeleton-text", type: "class", desc: "A loading placeholder; keep it aria-hidden." },
              { name: "sd-checks", type: "class", desc: "A result list; each li takes a tone." },
              { name: "sd-empty, sd-empty-title", type: "class", desc: "An empty state with its ornament and a next action." },
            ],
            a11y: [
              "Give every progress bar role=\"progressbar\" with aria-label, and aria-valuenow when the value is known.",
              "A toast is announced as it appears; keep its text short enough to hear in one breath.",
              "Skeletons are decoration: aria-hidden, with the real wait described nearby.",
            ],
            motion: [
              "An indeterminate progress bar loops; everything else runs once.",
              "prefers-reduced-motion stops the loop and the skeleton shimmer; the state stays readable.",
            ],
            related: ["badges", "overlays", "setup"],
          },
        },
        { id: "level", title: "Level meter", summary: "A live level from one custom property." },
      ]),
      group("Data", [
        {
          id: "stats", title: "Stats and tables", summary: "Stats, numbers, tables and key-value lists.",
          doc: {
            intro: "Numbers and their facts: a stat for one figure, a table for many rows, a key-value list for one record.",
            when: [
              "A dashboard leads with a few figures: stats carry them, deltas say which way they moved.",
              "Comparable rows with columns: a table, sortable when the user needs an order.",
              "One record's details beside its content: a key-value list, plain when keys get long.",
            ],
            notWhen: [
              "Values over time: a chart shows the shape (see Charts).",
              "Rows that arrive and leave while you watch: a living table does that (see Living tables).",
            ],
            usage: '&lt;div class="sd-stat"&gt;\n  &lt;span class="sd-stat-value"&gt;260&lt;small&gt;ms&lt;/small&gt;&lt;/span&gt;\n  &lt;span class="sd-stat-label"&gt;Checkout p95&lt;/span&gt;\n  &lt;span class="sd-stat-delta" data-tone="success"&gt;−150ms&lt;/span&gt;\n&lt;/div&gt;',
            api: [
              { name: "sd-stat", type: "class", desc: "An inline stat: value over label, with an optional delta." },
              { name: "sd-stat-value, sd-stat-label", type: "class", desc: "The figure, with small for units, and its name." },
              { name: "sd-stat-delta", type: "class", desc: "The change since before, taking a tone." },
              { name: "sd-stat-box", type: "class", desc: "The boxed stat, with -sm, sd-stat-sub and sd-stat-end." },
              { name: "sd-table", type: "class", desc: "The table, in an sd-table-wrap; -hover and -compact vary it." },
              { name: "th[data-sort]", type: "attribute", desc: "A sortable header; the JS sets aria-sort." },
              { name: "sd-num", type: "class", desc: "Tabular numbers on numeric cells, so digits line up." },
              { name: "sd-kv", type: "class", desc: "A key-value list; sd-kv-plain is sentence case and truncates long keys." },
            ],
            a11y: [
              "Mark the sorting column with aria-sort; the JS keeps it current as the order changes.",
              "A th needs scope or a table layout a screen reader can infer; keep the first row a header row.",
              "Units belong in the value text, so 260 ms is read as one figure.",
            ],
            motion: [
              "Hover states on rows and headers run 120-200ms.",
              "prefers-reduced-motion keeps the hover change without the transition.",
            ],
            related: ["charts", "rows", "living-tables"],
          },
        },
        { id: "rows", title: "Rows", summary: "Rows that show an outcome and expand for detail." },
        { id: "living-tables", title: "Living tables", summary: "Tables whose rows arrive, change and leave while you read them." },
        { id: "charts", title: "Charts", summary: "Live time series, chart types, square CSS charts, sparklines and diffs." },
        { id: "timeline", title: "Timeline", summary: "Ranges over one time axis." },
        { id: "schedule", title: "Schedule", summary: "An hour roster of status blocks in mono or spectrum." },
        { id: "flow", title: "Flow", summary: "A pipeline of stages and jobs on a dot grid, and its checklist, in mono or spectrum." },
        { id: "machine", title: "Machine", summary: "A live state machine from one JSON spec: stations, wires and tokens that travel, wait, fold and land." },
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
        { id: "art", title: "Art", summary: "Pixel pieces in the theme's ink, mascots, scenes and circuit ornaments, drawn from attributes." },
        { id: "ascii", title: "ASCII", summary: "Animated ASCII art in greys, still until the work behind it is running." },
      ]),
    ],
  },
  {
    id: "scripting", title: "Scripting", label: "JS", icon: "code",
    groups: [
      group("Setup", [
        {
          id: "setup", title: "Setup", summary: "init(), the data-sd attributes it wires, and copy feedback.",
          doc: {
            intro: "One import and one call: init() reads data-sd attributes and writes ARIA and data-* state that the CSS styles.",
            when: [
              "Plain HTML or server-rendered pages: attributes alone give dialogs, menus, tabs and tooltips.",
              "Markup that arrives after load: every listener is delegated, so no re-init is needed.",
              "Theme switching with a remembered choice, and copy buttons with feedback.",
            ],
            notWhen: [
              "A framework already renders the state: leave out that piece's data-sd attribute and set ARIA yourself (see Framework state).",
              "Heavy parts: living tables, countdowns and feeds mount explicitly, init() does not run them.",
            ],
            usage: 'import { init } from "signal-design/js";\n\ninit(); // once, after the DOM exists',
            api: [
              { name: "init()", type: "function", desc: "Wires every data-sd attribute once, after the DOM exists." },
              { name: "toast(text, { tone })", type: "function", desc: "Shows a toast; data-sd-toast does it from a click." },
              { name: "hotkeys({ key: fn })", type: "function", desc: "A map of shortcuts, including sequences; returns the off function." },
              { name: "setTheme(name)", type: "function", desc: "ink, graphite, paper or auto; remembers the choice." },
              { name: "data-sd-open, data-sd-close", type: "attribute", desc: "Opens a dialog as modal, closes the nearest one." },
              { name: "data-sd-toggle", type: "attribute", desc: "Opens and closes an .sd-expand, keeping aria-expanded in sync." },
              { name: "data-sd-seg", type: "attribute", desc: "A single-select button group; fires change." },
              { name: "data-sd-key", type: "attribute", desc: "Clicks the element when the key is pressed, unless the user is typing." },
              { name: "data-sd-tip", type: "attribute", desc: "A tooltip on hover and focus." },
              { name: "data-sd-copy", type: "attribute", desc: "Copies the target pre's text and toasts the result." },
              { name: "data-sd-theme, data-sd-theme-cycle", type: "attribute", desc: "Sets or steps the theme from a click." },
              { name: "mountFeed, mountCountdown, mountLivingTable", type: "function", desc: "The heavy mounts; call them yourself on teardown with dispose()." },
            ],
            keyboard: [
              ["Shift T", "Steps to the next theme, from data-sd-theme-cycle or the key itself."],
              ["Esc", "Closes the top dialog, popover or tooltip."],
            ],
            a11y: [
              "The JS writes ARIA; it never reads classes back, so tests and frameworks can set the same attributes.",
              "Shortcuts ignore keys typed into a field, except Ctrl or Cmd combinations.",
              "Toasts and copy feedback are announced; the failure toast names the fallback.",
            ],
            motion: [
              "Dialogs, popovers and menus move in 120-200ms.",
              "prefers-reduced-motion removes the movement; everything still opens and closes.",
            ],
            related: ["owned", "overlays", "command"],
          },
        },
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
      { file: "ship.html", title: "Flow", summary: "Continuous flow as a live machine: agents ship to main, rings fold and judge, failures queue agent runs. Swap in any machine or edit its spec." },
      { file: "charts.html", title: "Charts", summary: "Watcher's Stats screen: range, tiles, CPU and memory plots with a limit line, a per-container table and database facts." },
      { file: "stream.html", title: "Stream", summary: "A Twitch overlay package: starting soon, in game, BRB and ending scenes with live alerts, ready for OBS." },
      { file: "stream-setup.html", title: "Stream setup", summary: "Builds the OBS source URLs for each Stream scene and layer." },
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
