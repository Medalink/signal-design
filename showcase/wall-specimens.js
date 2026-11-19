/**
 * The home page's specimens: for each library page, one small part that works
 * where it stands. Everything is real Signal markup. Where a part is long, the
 * markup is cut out of the page's own block in ai/components.json (`pick`),
 * so it stays in step with the library; the rest is written here from the
 * same classes. Runs in Node, at page-render time, and returns HTML strings.
 *
 * A specimen shares the home page with 43 others, so every id it holds is
 * prefixed with its page (`ns`), links inside it go to its page, and none of
 * it carries a primary button (the home page has one) or a hotkey (Ctrl K is
 * the topbar's).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ICONS } from "../src/js/icons.js";

const blocks = JSON.parse(readFileSync(resolve(import.meta.dirname, "../ai/components.json"), "utf8"));
const list = Array.isArray(blocks) ? blocks : blocks.components;
const block = (id) => {
  const found = list.find((b) => b.id === id);
  if (!found) throw new Error(`wall specimens: no block "${id}" in ai/components.json`);
  return found.html;
};

/** The element that starts where `open` matches, through its balanced closing tag. */
function element(html, open) {
  const start = open.exec(html);
  if (!start) throw new Error(`wall specimens: nothing matches ${open}`);
  const tag = /^<([a-z0-9-]+)/.exec(start[0])[1];
  const tags = new RegExp(`<(/?)${tag}(?=[\\s>/])`, "g");
  tags.lastIndex = start.index + 1;
  let depth = 1;
  for (let m = tags.exec(html); m; m = tags.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (!depth) return html.slice(start.index, html.indexOf(">", m.index) + 1);
  }
  throw new Error(`wall specimens: ${open} never closes`);
}
const pick = (id, open) => element(block(id), open);

const REFS = /(?<![\w-])(id|for|aria-controls|aria-labelledby|aria-describedby|popovertarget|data-sd-open)="([^"]+)"/g;
/** Give every id a specimen holds, and every reference to one, its page's prefix; point anchors at the page. */
function ns(html, id) {
  return html
    .replace(REFS, (_, attribute, value) => `${attribute}="${value.split(/\s+/).map((token) => `hs-${id}-${token}`).join(" ")}"`)
    .replace(/data-sd-copy="#([^"]+)"/g, `data-sd-copy="#hs-${id}-$1"`)
    .replace(/ data-sd-key="[^"]*"/g, "")
    .replace(/href="#[^"]*"/g, `href="./lib-${id}.html"`);
}

const icon = (name) => `<svg class="sd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

/**
 * The roster page's board, cut to fit a tile: four drivers, only the blocks long enough to
 * hold their label, each labelled by its shipment alone. The page keeps the full roster.
 */
function shortSchedule(figure) {
  let out = figure;
  let search = 0;
  for (let kept = 0; ; ) {
    const next = out.indexOf('<div class="sd-schedule-row"', search);
    if (next < 0) break;
    const row = element(out.slice(next), /^<div class="sd-schedule-row"/);
    if (++kept > 4) out = out.slice(0, next) + out.slice(next + row.length);
    else search = next + row.length;
  }
  return out
    .replace(/<span class="sd-schedule-block"[^>]*--from: ([\d.]+); --to: ([\d.]+)[^>]*>[\s\S]*?<\/span><\/span>/g, (block, from, to) =>
      to - from < 3 ? "" : block.replace(/(<span class="sd-schedule-label">)([^<]*)/, (_, open, text) => open + text.split(/ [·→]/)[0]),
    );
}

const SPECIMENS = {
  /* ---- Foundations ---- */
  rules: () => `<ul class="sd-checks">
  <li data-tone="success">Square corners everywhere</li>
  <li data-tone="success">Tone separates regions, not lines</li>
  <li data-tone="success">Color marks status and selection</li>
  <li data-tone="success">Tokens, never hex values</li>
  <li data-tone="success">Weights 400 and 500 only</li>
  <li data-tone="pending">Motion runs 120 to 200 ms</li>
</ul>`,

  color: () => `<div class="wall-swatches">
  ${["accent", "success", "danger", "warning", "pending", "extra"].map((tone) => `<span class="wall-swatch"><i style="background: var(--sd-${tone})"></i>${tone}</span>`).join("")}
</div>
<span class="sd-seg sd-seg-sm" role="group" aria-label="Theme">${["ink", "graphite", "paper"].map((t) => `<button type="button" data-sd-theme="${t}" aria-pressed="false">${t}</button>`).join("")}</span>`,

  type: () => `<div class="wall-type">
  <span style="font-size: var(--text-3xl); line-height: 1.1">Aa</span>
  <span style="font-size: var(--text-xl)">Page title</span>
  <span style="font-size: var(--text-base)">Body text at 16px</span>
  <span class="sd-muted" style="font-size: var(--text-sm)">Meta and hints at 15px</span>
  <code style="font-size: var(--text-sm)">font-mono · Source Code Pro</code>
</div>`,

  layout: () => `<dl class="sd-kv">
  <dt>Base unit</dt><dd>4px</dd>
  <dt>Column</dt><dd>720px <code>max-w-column</code></dd>
  <dt>Narrow</dt><dd>560px <code>max-w-narrow</code></dd>
  <dt>Wide</dt><dd>1024px <code>max-w-wide</code></dd>
  <dt>Motion</dt><dd>120 to 200ms</dd>
</dl>`,

  icons: () => `<div class="wall-icons">${["search", "check", "bell", "calendar", "chart", "bookmark", "bolt", "book"].map((name) => `<span class="sd-icon-text" style="font-size: var(--text-sm)">${icon(name)}${name}</span>`).join("")}</div>`,

  elements: () => `<div class="grid gap-3">
  <label>Name <input value="Jane Doe"></label>
  <label>Plan <select><option>Team</option><option>Business</option></select></label>
  <details><summary>What is this?</summary><p>No classes on any of it: the base layer styles plain elements.</p></details>
</div>`,

  /* ---- Forms ---- */
  buttons: () => `<div class="sd-actions">
  <button class="sd-btn">Save for later</button>
  <button class="sd-btn" data-tone="danger">Reject</button>
  <button class="sd-btn sd-btn-ghost">Cancel</button>
  <button class="sd-btn" aria-busy="true">Syncing</button>
  <button class="sd-btn sd-btn-link" data-sd-toast="Reset to defaults">Reset</button>
</div>`,

  fields: () => `<form class="sd-form" onsubmit="return false" novalidate>
  <div class="sd-field">
    <label class="sd-field-label" for="name">Name</label>
    <input id="name" placeholder="Jane Doe" aria-describedby="name-hint">
    <p class="sd-field-hint" id="name-hint">Shown on your profile.</p>
  </div>
  <div class="sd-field" data-invalid>
    <label class="sd-field-label" for="mail">Email</label>
    <input id="mail" type="email" value="jane@acme" aria-invalid="true" aria-describedby="mail-error">
    <p class="sd-field-error" id="mail-error">Enter an address like jane@acme.example.</p>
  </div>
  <label class="sd-switch-row"><input type="checkbox" role="switch" checked> Notify me</label>
</form>`,

  choices: () => `<div class="grid gap-3">
  <div class="sd-options" role="radiogroup" aria-label="Theme">
    <label class="sd-option"><input type="radio" name="theme" checked><span class="sd-option-title">Ink</span><span class="sd-option-desc">Near-black. The default.</span></label>
    <label class="sd-option"><input type="radio" name="theme"><span class="sd-option-title">Paper</span><span class="sd-option-desc">White, for daylight.</span></label>
  </div>
  <div class="sd-seg" role="radiogroup" aria-label="Billing cycle">
    <label><input type="radio" name="cycle" checked> Monthly</label><label><input type="radio" name="cycle"> Yearly</label>
  </div>
</div>`,

  pickers: () => `<div class="grid gap-3">
  ${pick("inputs-more-combobox-tags-number-and-steps", /<div class="sd-field">\s*<label class="sd-field-label" for="demo-combo"/)}
  ${pick("inputs-more-combobox-tags-number-and-steps", /<div class="sd-field">\s*<label class="sd-field-label" for="demo-number"/)}
</div>`,

  /* ---- Navigation ---- */
  "nav-bars": () => pick("components-navigation", /<div>\s*<div class="sd-tabs" role="tablist"/),

  menus: () => `<div class="sd-actions">
  <button class="sd-btn" popovertarget="menu" aria-haspopup="menu" aria-expanded="false">Save for later</button>
  <button class="sd-btn" popovertarget="info" aria-expanded="false">Popover panel</button>
</div>
<div popover id="menu" class="sd-popover">
  <div class="sd-menu" role="menu" aria-label="Remind me">
    <div class="sd-menu-label" role="presentation">Remind me</div>
    <button role="menuitem"><kbd>1</kbd> later today</button>
    <button role="menuitem"><kbd>2</kbd> tomorrow 09:00</button>
    <button role="menuitem"><kbd>3</kbd> Monday</button>
  </div>
</div>
<div popover id="info" class="sd-popover sd-popover-pad"><p class="sd-muted">A popover holds a small panel of facts next to its trigger.</p></div>`,

  overlays: () => `<div class="sd-actions">
  <button class="sd-btn" data-sd-open="dialog">Dialog</button>
  <button class="sd-btn" data-sd-open="sheet">Sheet</button>
  <button class="sd-btn" data-sd-tip="Tooltips show on hover and focus">Tooltip</button>
</div>
<dialog class="sd-dialog" id="dialog" aria-labelledby="dialog-h">
  <header class="sd-dialog-head"><span id="dialog-h">Request changes?</span><button class="sd-btn sd-btn-icon sd-btn-sm sd-btn-ghost" data-sd-close aria-label="Close">×</button></header>
  <div class="sd-dialog-body"><p>A dialog opens from an attribute and closes on Esc.</p></div>
</dialog>
<dialog class="sd-sheet" id="sheet" aria-labelledby="sheet-h">
  <header class="sd-dialog-head"><span id="sheet-h">Details</span><button class="sd-btn sd-btn-icon sd-btn-sm sd-btn-ghost" data-sd-close aria-label="Close">×</button></header>
  <div class="sd-dialog-body"><p>A sheet slides in from the edge.</p></div>
</dialog>`,

  command: () => `<div class="sd-actions"><button class="sd-btn" data-sd-open="palette">Open palette</button></div>
<dialog class="sd-command" id="palette" aria-label="Search" data-sd-palette>
  <input type="search" placeholder="Search pages and actions" aria-label="Search">
  <div class="sd-menu" role="listbox" aria-label="Results">
    <div class="sd-menu-label" role="presentation">Pages</div>
    <a role="option" href="./chat.html">Chat <span class="sd-menu-hint">page</span></a>
    <a role="option" href="./shell.html">App shell <span class="sd-menu-hint">page</span></a>
    <div class="sd-menu-label" role="presentation">Actions</div>
    <button type="button" role="option" data-sd-theme-cycle>Next theme <span class="sd-menu-hint">Shift T</span></button>
    <button type="button" role="option" data-sd-toast="Copied link">Copy link</button>
  </div>
  <p class="sd-command-foot">↑↓ move · ↵ open · Esc close</p>
</dialog>`,

  /* ---- Status ---- */
  badges: () => `<div class="grid gap-3">
  <div class="sd-cluster">
    <span class="sd-badge" data-tone="danger">Risk</span><span class="sd-badge" data-tone="warning">Costly</span><span class="sd-badge" data-tone="success">Passed</span><span class="sd-badge" data-tone="pending">Waiting</span><span class="sd-badge">Plain</span>
  </div>
  <div class="sd-cluster" style="--gap: 18px">
    <span class="sd-cluster" style="--gap: 6px"><span class="sd-dot" data-tone="danger"></span> irreversible</span>
    <span class="sd-cluster" style="--gap: 6px"><span class="sd-dot" data-tone="pending" data-shape="dashed"></span> unproven</span>
    <span class="sd-cluster" style="--gap: 6px"><span class="sd-dot" data-shape="hollow"></span> routine</span>
  </div>
</div>`,

  avatars: () => `<div class="sd-cluster" style="--gap: 16px">
  <span class="sd-avatar sd-avatar-sm" data-tone="success">JD</span>
  <span class="sd-avatar" data-tone="extra" data-status="online">AL</span>
  <span class="sd-avatar sd-avatar-lg" data-tone="warning" data-status="away">SK</span>
  <span class="sd-avatar-stack"><span class="sd-avatar" data-tone="success">JD</span><span class="sd-avatar" data-tone="extra">AL</span><span class="sd-avatar" data-tone="accent">TP</span></span>
  <span class="sd-status" data-tone="success">live</span>
  <span>Saved <span class="sd-count">3</span></span>
</div>`,

  feedback: () => `<div class="grid gap-3">
  <div class="sd-note" data-tone="pending">◷ This item changed after you opened it.</div>
  <div class="sd-callout" data-tone="success"><p class="sd-callout-title">All checks passed</p><p>214 tests ran in 41 seconds.</p></div>
  <div class="sd-progress" role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="64" style="--value: 64"></div>
  <div class="sd-actions"><button class="sd-btn sd-btn-sm" data-sd-toast="Saved">Show a toast</button></div>
</div>`,

  level: () => `<div class="grid gap-3">
  <span class="sd-level" data-tone="success" role="meter" aria-label="Level" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.6" style="--level: 0.6" data-wall-level><i></i><i></i><i></i></span>
  <label class="sd-field-label" for="level">Level</label>
  <input id="level" type="range" min="0" max="100" value="60" data-wall-level-input>
</div>`,

  /* ---- Data ---- */
  stats: () => `<div class="grid gap-4">
  <div class="grid gap-4 grid-cols-3">
    <div class="sd-stat"><span class="sd-stat-value">32</span><span class="sd-stat-label">Open</span></div>
    <div class="sd-stat"><span class="sd-stat-value">260<small>ms</small></span><span class="sd-stat-label">Checkout p95</span><span class="sd-stat-delta" data-tone="success">−150ms</span></div>
    <div class="sd-stat"><span class="sd-stat-value">6</span><span class="sd-stat-label">High risk</span><span class="sd-stat-delta" data-tone="danger">+2 today</span></div>
  </div>
  <div class="sd-table-wrap"><table class="sd-table sd-table-compact">
    <thead><tr><th data-sort="text">Service</th><th data-sort="number" class="sd-num">p95 ms</th></tr></thead>
    <tbody><tr><td>checkout</td><td class="sd-num">260</td></tr><tr><td>search</td><td class="sd-num">118</td></tr><tr><td>billing</td><td class="sd-num">410</td></tr></tbody>
  </table></div>
</div>`,

  rows: () => `<div class="grid gap-1">
  <article class="sd-row"><span class="sd-dot" data-shape="hollow"></span><div class="sd-row-body"><p class="sd-row-title">Triage 9 new tickets</p><p class="sd-meta"><span>Support</span><span>07:57</span></p></div></article>
  <article class="sd-row" data-tone="danger" data-edge><span class="sd-dot"></span><div class="sd-row-body"><p class="sd-row-title">Stop double charges</p><p class="sd-meta"><span>Billing</span><span data-tone="danger">risk</span></p></div><div class="sd-row-end"><button class="sd-btn sd-btn-sm" data-tone="danger">Review</button></div></article>
  <article class="sd-row" aria-current="true"><span class="sd-dot" data-tone="warning"></span><div class="sd-row-body"><p class="sd-row-title">Rotate the signing key</p><p class="sd-meta"><span>Platform</span><span>07:51</span></p></div></article>
</div>`,

  "living-tables": () => {
    const group = (id, title, rows) => `<tbody data-id="${id}">
        <tr class="sd-living-table-group"><th scope="rowgroup" colspan="3"><button type="button" disabled aria-expanded="true">${title} <span class="sd-living-table-count" aria-hidden="true">${rows.length}</span></button></th></tr>
        ${rows.map(([item, badge, tone, owner]) => `<tr><th scope="row">${item}</th><td><span class="sd-badge"${tone ? ` data-tone="${tone}"` : ""}>${badge}</span></td><td>${owner}</td></tr>`).join("")}
      </tbody>`;
    return `<div class="sd-living-table" data-sd-living-table id="table">
  <div class="sd-table-wrap" id="table-content">
    <table class="sd-table">
      <caption>Component work</caption>
      <thead><tr><th scope="col">Work item</th><th scope="col" data-fold="2">Status</th><th scope="col" data-fold="1">Owner</th></tr></thead>
      ${group("review", "In review", [["Button focus rings", "Review", "pending", "Mira"], ["Keyboard shortcuts", "Review", "pending", "Jon"]])}
      ${group("progress", "In progress", [["Chart labels", "Active", "accent", "Ada"]])}
      ${group("shipped", "Shipped", [["Paper theme", "Done", "success", "Ravi"]])}
    </table>
  </div>
  <div data-sd-living-resize hidden role="separator" aria-label="Resize component work table" aria-orientation="vertical" aria-controls="table-content"></div>
</div>`;
  },

  charts: () => pick("charts-small-plots", /<div class="sd-plot" data-series="down"/),

  timeline: () => element(block("charts-timeline"), /<figure class="sd-timeline"/),
  schedule: () => shortSchedule(element(block("charts-schedule"), /<figure class="sd-schedule"/)),
  flow: () => element(block("charts-flow"), /<figure class="sd-flow"/),

  machine: () => `<figure class="sd-machine" id="board" aria-labelledby="board-h">
  <div class="sd-machine-head"><span class="sd-label sd-label-strong" id="board-h">Deploy queue</span><span class="sd-machine-clock">sped up<i></i></span></div>
  <div class="sd-machine-board"></div>
</figure>`,

  /* ---- Conversation ---- */
  messages: () => `<div class="wall-feed">
  <article class="sd-message" style="--who: var(--sd-extra)"><time class="sd-message-time" datetime="09:42">09:42</time><div class="sd-message-body"><div class="sd-message-text"><b class="sd-message-author">Alex</b><span class="sd-message-tag">Lead</span>Names take the person's color and the text follows on the same line.</div><div class="sd-reactions"><button data-sd-reaction aria-pressed="true"><span>👍</span><b>3</b></button><button data-sd-reaction aria-pressed="false"><span>👀</span><b>1</b></button></div></div></article>
  <article class="sd-message" data-grouped style="--who: var(--sd-extra)"><div class="sd-message-body"><div class="sd-message-text">A second message from the same author groups under the first.</div></div></article>
  <article class="sd-message" data-own style="--who: var(--sd-success)"><time class="sd-message-time" datetime="09:44">09:44</time><div class="sd-message-body"><div class="sd-message-text"><b class="sd-message-author">You</b>Your own messages carry the own marker.</div></div></article>
</div>`,

  feed: () => `<div class="wall-feed">
  <div class="sd-divider sd-feed-day">Today</div>
  <article class="sd-message" style="--who: var(--sd-warning)"><time class="sd-message-time" datetime="16:02">16:02</time><div class="sd-message-body"><div class="sd-message-text"><b class="sd-message-author">Sam</b>The day line sticks to the top of the scroller.</div></div></article>
  <div class="sd-event"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" aria-hidden="true"><path d="M2 8h8M7 5l3 3-3 3M10.5 2.5h3v11h-3"/></svg><span><b>Mina</b> joined<time>16:05</time></span></div>
  <article class="sd-message" style="--who: var(--sd-accent)"><time class="sd-message-time" datetime="16:09">16:09</time><div class="sd-message-body"><div class="sd-message-text"><b class="sd-message-author">Mina</b>Scroll up and a bar offers the way back to now.</div></div></article>
</div>`,

  composer: () => `<div class="sd-shell-dock wall-dock">${element(block("conversation-composer"), /<form class="sd-composer"/).replace(" · A message opens with its author in their name color.", " · On it.")}</div>`,

  people: () => `<div class="wall-list">
  <div class="sd-item-group">Online <span>2</span></div>
  <button type="button" class="sd-item" aria-current="true"><span class="sd-avatar" data-tone="extra" data-status="online">AL</span><span class="sd-item-body"><span class="sd-item-title">Alex</span><span class="sd-item-sub">Reviewing the spec</span></span><span class="sd-item-end">2m</span></button>
  <button type="button" class="sd-item" data-unread><span class="sd-avatar" data-tone="warning" data-status="away">SK</span><span class="sd-item-body"><span class="sd-item-title">Sam</span><span class="sd-item-sub">Can you look at this?</span></span><span class="sd-item-end"><span class="sd-badge-count" data-tone="danger">2</span></span></button>
</div>`,

  attachments: () => `<div class="grid gap-3">
  <div class="sd-banner" data-tone="pending" role="status"><b>Update ready</b> Version 1.4 installs on restart.</div>
  <div class="sd-file"><span class="sd-file-type">pdf</span><span class="sd-file-body"><span class="sd-file-name">onboarding.pdf</span><span class="sd-file-meta">2.4 MB</span></span><button class="sd-btn sd-btn-sm">Open</button></div>
  <div class="sd-file"><span class="sd-file-type">zip</span><span class="sd-file-body"><span class="sd-file-name">assets.zip</span><span class="sd-file-meta">Uploading · 64%</span></span><div class="sd-progress" style="--value: 64"></div></div>
</div>`,

  /* ---- App shell ---- */
  window: () => element(block("effects-title-bar-and-header-bar"), /<div class="sd-titlebar"/),

  rail: () => `<div class="wall-rail">${element(block("effects-compact-rail-of-places"), /<nav class="sd-rail"/)}</div>`,

  sidebar: () => `<div class="wall-sidebar">${element(block("effects-resizable-sidebar"), /<div class="sd-sidebar"/)}<p class="wall-sidebar-main sd-subtle">Drag the edge to resize.</p></div>`,

  /* ---- Effects ---- */
  rain: () => `<div class="wall-rain"><canvas class="sd-rain" data-sd-rain data-sd-rain-style="squares" aria-hidden="true"></canvas></div>`,

  ornaments: () => `<div class="wall-ornament" data-sd-ornaments="tr lattice" data-sd-ornaments-seed="4"><p class="sd-muted">Faint art in a corner, behind the content.</p></div>`,

  surfaces: () => `<div class="sd-cluster" style="--gap: 12px">
  <nav class="sd-nav" aria-label="Hover demo"><a href="#">Overview</a><a href="#">Activity</a><a href="#">Settings</a></nav>
  <button class="sd-btn">Hover me</button>
</div>`,

  art: () => `<div class="wall-art">
  ${["router", "server", "chip", "globe", "terminal", "shield"].map((name) => `<span class="sd-art" data-sd-art="${name}" data-tone="success" role="img" aria-label="${name}"></span>`).join("")}
  <button class="sd-mascot" type="button" data-sd-mascot="iris" data-mood="idle" aria-label="IRIS, idle. Press to say hello."></button>
</div>`,

  ascii: () => `<div class="wall-ascii"><div class="sd-ascii" style="--sd-ascii-size: 11px; --cols: 40; --rows: 18" data-wall-ascii data-at="1.4" role="img" aria-label="Spinning torus"></div></div>`,

  /* ---- Scripting ---- */
  setup: () => `<div class="sd-code">
  <div class="sd-code-head">app.js <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#code">Copy</button></div>
  <pre id="code" tabindex="0"><code>import { init } from "signal-design/js";

init();</code></pre>
</div>`,

  owned: () => `<div class="grid gap-3" data-wall-owned>
  <div class="sd-cluster" style="--gap: 12px">
    <div class="sd-seg sd-seg-inline" role="group" aria-label="View"><button type="button" data-value="list" aria-pressed="true">list</button><button type="button" data-value="board" aria-pressed="false">board</button></div>
    <button class="sd-btn sd-btn-sm" type="button" aria-expanded="false" aria-controls="details" data-wall-owned-toggle>Details</button>
  </div>
  <div class="sd-expand" id="details"><div><p class="sd-note">Shown because the script set <code>data-open</code> and <code>aria-expanded</code>.</p></div></div>
</div>`,

  predict: () => `<div class="grid gap-3">
  <div class="sd-cluster" style="--gap: 12px">
    <button class="sd-btn" type="button" data-sd-predict data-wall-predict>Move toward me</button>
    <a class="sd-btn sd-btn-ghost" href="./lib-buttons.html" data-sd-prefetch>Prefetched link</a>
  </div>
  <p class="sd-meta" role="status"><span data-wall-predict-out>Waiting for the pointer</span></p>
</div>`,

  countdown: () => `<div class="sd-stack" id="count" data-sd-countdown data-state="paused" data-wall-countdown>
  <p class="sd-note" data-tone="pending">Next step in <span data-sd-countdown-value>5</span>s.</p>
  <div class="sd-progress" role="progressbar" aria-label="Elapsed countdown time" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="--value: 0"></div>
  <div class="sd-actions"><button class="sd-btn sd-btn-sm" type="button" data-wall-count="run">Resume</button><button class="sd-btn sd-btn-sm" type="button" data-wall-count="stop">Pause</button></div>
</div>`,

  "live-feed": () => `<div class="grid gap-2">
  <div class="sd-actions"><button class="sd-btn sd-btn-sm" type="button" data-wall-feed="insert">Insert row</button><span class="sd-pill" role="status" data-wall-feed-above>0 above</span></div>
  <div class="sd-stack wall-feed" id="feed" data-sd-feed tabindex="0" role="region" aria-label="Activity feed">
    <article class="sd-row" data-id="activity-3" data-order="3"><div class="sd-row-body"><p class="sd-row-title">Build completed</p></div></article>
    <article class="sd-row" data-id="activity-2" data-order="2" aria-current="true"><div class="sd-row-body"><p class="sd-row-title">Export finished</p></div></article>
    <article class="sd-row" data-id="activity-1" data-order="1"><div class="sd-row-body"><p class="sd-row-title">Sync started</p></div></article>
  </div>
  <p class="sd-field-hint">Focus the feed, then <kbd>j</kbd> and <kbd>k</kbd> move.</p>
</div>`,
};

/** Columns a tile takes at four across; the rest take one. Parts that draw on a wide axis take the row. */
export const WIDTH = { timeline: 2, schedule: 4, flow: 4, machine: 2, messages: 2, composer: 2, layout: 2, stats: 2 };

export const specimen = (page) => {
  const make = SPECIMENS[page.id];
  if (!make) throw new Error(`wall specimens: no specimen for "${page.id}"`);
  return ns(make(), page.id);
};
