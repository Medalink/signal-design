/**
 * The overview's markup, built at serve and build time from the page registry:
 * the intro, the live composition, the example previews, the index of every
 * page and the files for AI agents. Every part is real Signal markup (copied
 * from ai/components.json); pages/home.js makes it work. Nothing here is a
 * picture of a component.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { icon } from "../src/js/icons.js";
import { EXAMPLES, LIBRARY, SECTIONS, byId } from "./pages.js";
import { themeSeg } from "./settings.js";
import { CHANNELS, SPACES, UPTIME_CELLS, feedHtml, history, plotSvg, uptimeHtml, uptimeStates } from "./home-data.js";
import { homeWall } from "./home-wall.js";

const dir = import.meta.dirname;
const REPO = "https://github.com/Medalink/signal-design";
const INSTALL = "pnpm add github:Medalink/signal-design";

/** A link to a library page by id; a typo fails the build instead of shipping a dead link. */
const doc = (id, label = byId(id)?.title) => {
  const page = byId(id);
  if (!page) throw new Error(`home: no library page "${id}"`);
  return `<a href="./${page.file}">${label}</a>`;
};
const ic = icon;

/** The intro: one literal heading, one sentence of facts, the install command and the one primary button. */
export function homeIntro() {
  return `  <header class="home-intro">
    <div class="home-intro-copy">
      <h1 id="home-h">Signal Design</h1>
      <p>Square, monochrome-first UI components driven by ARIA and data attributes. Built for Tailwind v4, plain HTML, and Tauri.</p>
    </div>
    <div class="home-intro-act">
      <div class="home-install"><code id="home-install-cmd">${INSTALL}</code><button class="home-install-copy" type="button" data-sd-copy="#home-install-cmd" aria-label="Copy install command"><svg aria-hidden="true"><use href="#i-copy"/></svg></button></div>
      <a class="sd-btn sd-btn-primary" href="./lib-setup.html">Get started</a>
    </div>
  </header>`;
}

const head = (id, title, rest = "") =>
  `<div class="home-cell-head"><h2 id="${id}">${title}</h2>${rest}</div>`;

function sidebar() {
  const channel = (c, i) =>
    `<button class="sd-sidebar-link" type="button" data-channel="${c.id}"${i ? "" : ' aria-current="true"'}>${ic("hash")} ${c.id}${c.unread ? ` <span class="sd-badge-count" data-tone="danger">${c.unread}</span>` : ""}</button>`;
  return `    <div class="sd-sidebar" id="home-channels" aria-label="Channels">
      <div class="sd-sidebar-panel">
        <div class="sd-sidebar-head"><span class="sd-sidebar-title" data-space-name>${SPACES[0].name}</span></div>
        <nav class="sd-sidebar-body" aria-label="Channels">
          <div class="sd-item-group">Channels</div>
          ${CHANNELS.map(channel).join("\n          ")}
        </nav>
        <div class="sd-sidebar-foot home-account">
          <span class="sd-avatar" data-status="online" data-tone="success">PR</span>
          <span class="home-account-who"><b>Priya</b><span class="sd-subtle">Online</span></span>
        </div>
      </div>
    </div>`;
}

function rail() {
  const tile = (s, i) =>
    `<button class="sd-rail-tile" type="button" data-space="${s.id}" data-name="${s.name}" aria-label="${s.name}" data-sd-tip="${s.name}" data-sd-tip-side="right"${i ? "" : ' aria-current="true"'}>${s.initials}</button>`;
  return `    <nav class="sd-rail" aria-label="Workspaces">
      <div class="sd-rail-list">
        ${SPACES.map(tile).join("\n        ")}
      </div>
    </nav>`;
}

const states = uptimeStates(30);
const webStates = uptimeStates(-1);
const hist = history();
const ch = CHANNELS[0];

/** The composition: a real app shell holding a thread, stats, a live plot, a machine and a form. */
export function homeStage() {
  const { version } = JSON.parse(readFileSync(resolve(dir, "../package.json"), "utf8"));
  return `  <div class="home-stage" id="home-stage">
    <div class="sd-shell home-shell" id="home-shell">
${rail()}
${sidebar()}
      <div class="sd-shell-main" id="home-main">
        <header class="sd-shell-bar">
          <div class="sd-shell-bar-title">${ic("hash")}<b id="home-channel">${ch.id}</b><span class="sd-desktop-only" id="home-topic">${ch.topic}</span></div>
          <div class="sd-shell-bar-end">
            <button class="sd-btn sd-btn-sm home-search" type="button" data-sd-open="nav-palette" aria-label="Search pages">${ic("search")}<span>Search pages</span></button>
            ${themeSeg("Theme", "sd-seg-inline home-theme")}
          </div>
        </header>

        <div class="sd-shell-content home-content">
          <div class="home-grid">
            <section class="home-cell home-thread" aria-labelledby="home-thread-h">
              ${head("home-thread-h", doc("messages"), `<span class="home-sub">${doc("composer")}</span>`)}
              <div class="sd-seg sd-seg-sm home-channels" data-sd-seg aria-label="Channel">${CHANNELS.map((c, i) => `<button type="button" data-channel="${c.id}" aria-pressed="${i === 0}">${c.id}</button>`).join("")}</div>
              <div class="home-feed" id="home-feed" role="log" aria-label="Messages" tabindex="0" data-sd-follow style="--sd-feed-bg: var(--sd-tone-3)">
${feedHtml(ch)}
              </div>
              <div class="sd-composer-status home-typing" id="home-typing" hidden><span class="sd-typing"><i><b></b></i><span><b style="--who: var(--sd-pending)">Scout</b> is typing</span></span></div>
              <form class="sd-composer home-composer" id="home-composer">
                <div class="sd-composer-row">
                  <textarea rows="1" data-sd-autogrow data-sd-enter-submit data-sd-suggest="home-mentions" placeholder="Message #${ch.id}, @ to mention" aria-label="Message"></textarea>
                  <button class="sd-btn sd-btn-icon sd-composer-send" aria-label="Send">${ic("send")}</button>
                </div>
                <div class="sd-suggest" id="home-mentions" hidden>
                  <div class="sd-menu" role="listbox" aria-label="Mention">
                    <button type="button" role="option" data-value="Maya"><span class="sd-avatar sd-avatar-sm" data-tone="extra">MA</span> Maya</button>
                    <button type="button" role="option" data-value="Jonas"><span class="sd-avatar sd-avatar-sm" data-tone="accent">JO</span> Jonas</button>
                    <button type="button" role="option" data-value="Scout"><span class="sd-avatar sd-avatar-sm" data-tone="pending">SC</span> Scout</button>
                  </div>
                </div>
              </form>
            </section>

            <section class="home-cell home-stats" aria-labelledby="home-stats-h">
              ${head("home-stats-h", doc("stats"), `<span class="home-sub"><span class="sd-cluster"><span class="sd-status" data-tone="success">healthy</span><span class="sd-badge" data-tone="pending">canary</span><span class="sd-badge" id="home-version">v${version}</span></span>${doc("badges")}</span>`)}
              <div class="home-stat-row">
                <div class="sd-stat"><span class="sd-stat-value" id="home-deploys">18</span><span class="sd-stat-label">Deploys today</span><span class="sd-stat-delta" data-tone="success">+3 since 09:00</span></div>
                <div class="sd-stat"><span class="sd-stat-value"><span id="home-p95">${hist.p95.at(-1)}</span><small>ms</small></span><span class="sd-stat-label">p95 latency</span><span class="sd-stat-delta" id="home-p95-delta" data-tone="success">steady</span></div>
                <div class="sd-stat"><span class="sd-stat-value">0.4<small>%</small></span><span class="sd-stat-label">Error rate</span><span class="sd-stat-delta">of 1.2M requests</span></div>
              </div>
            </section>

            <section class="home-cell home-chart" aria-labelledby="home-chart-h">
              ${head("home-chart-h", doc("charts"), `<div class="sd-seg sd-seg-sm sd-seg-inline" data-sd-seg aria-label="Percentile" id="home-percentile"><button type="button" data-value="p50" aria-pressed="false">p50</button><button type="button" data-value="p95" aria-pressed="true">p95</button></div>`)}
              <div class="sd-plot home-plot" data-tone="accent" id="home-plot" role="img" aria-label="Request latency over the last ${hist.p95.length} samples">
                <svg viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">${plotSvg(hist.p95, "p95")}</svg>
                <span class="sd-plot-readout" id="home-readout">now<b>${hist.p95.at(-1)} ms</b></span>
              </div>
              <div class="home-uptime">
                <div><div class="home-uptime-label"><span>api</span><span class="sd-subtle" id="home-api-pct">99.92%</span></div><div class="sd-uptime" id="home-api" aria-label="API uptime, last ${UPTIME_CELLS} checks" role="img" data-cells="${UPTIME_CELLS}">${uptimeHtml(states)}</div></div>
                <div><div class="home-uptime-label"><span>web</span><span class="sd-subtle">100%</span></div><div class="sd-uptime" aria-label="Web uptime, last ${UPTIME_CELLS} checks" role="img">${uptimeHtml(webStates)}</div></div>
              </div>
            </section>

            <section class="home-cell home-flow" aria-labelledby="home-flow-h">
              ${head("home-flow-h", doc("machine"), `<button class="sd-btn sd-btn-sm sd-btn-ghost" type="button" id="home-flow-toggle">Pause</button>`)}
              <figure class="sd-machine" id="home-machine" aria-label="Deploy queue"><div class="sd-machine-board"></div></figure>
            </section>

            <section class="home-cell home-form" aria-labelledby="home-form-h">
              ${head("home-form-h", doc("fields"), `<span class="home-sub">${doc("choices")}</span>`)}
              <form class="sd-form home-settings" id="home-settings" onsubmit="return false" novalidate>
                <div class="sd-field">
                  <span class="sd-field-label" id="home-env-l">Environment</span>
                  <div class="sd-seg sd-seg-block" data-sd-seg id="home-env" role="group" aria-labelledby="home-env-l"><button type="button" data-value="staging" aria-pressed="true">staging</button><button type="button" data-value="production" aria-pressed="false">production</button></div>
                </div>
                <div class="sd-choices">
                  <label class="sd-check"><input type="checkbox" role="switch" id="home-canary" checked><span class="sd-check-text">Canary</span></label>
                  <label class="sd-check"><input type="checkbox" role="switch" id="home-notify"><span class="sd-check-text">Alerts</span></label>
                </div>
                <div class="home-share-row">
                  <div class="sd-field">
                    <label class="sd-field-label" for="home-share">Traffic share</label>
                    <div class="sd-number" data-sd-number><button type="button" data-step="-5" aria-label="Less">−</button><input id="home-share" type="number" value="25" min="5" max="100" step="5"><button type="button" data-step="5" aria-label="More">+</button></div>
                  </div>
                  <div class="home-rollout">
                    <p class="sd-progress-label"><span id="home-progress-l">Rollout</span><span id="home-progress-v">25%</span></p>
                    <div class="sd-progress" id="home-progress" style="--value: 25" role="progressbar" aria-labelledby="home-progress-l" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
                <div class="sd-field">
                  <label class="sd-field-label" for="home-reviewers">Reviewers</label>
                  <div class="sd-tags" data-sd-tags><span class="sd-chip" data-value="Maya">Maya <button type="button" aria-label="Remove Maya">×</button></span><span class="sd-chip" data-value="Jonas">Jonas <button type="button" aria-label="Remove Jonas">×</button></span><input id="home-reviewers" placeholder="Add"></div>
                </div>
                <div class="home-form-foot">
                  <button class="sd-btn" type="button" id="home-deploy">Deploy to staging</button>
                </div>
              </form>
            </section>

            <section class="home-cell home-people" aria-labelledby="home-people-h">
              ${head("home-people-h", doc("people"))}
              <div class="sd-roster" id="home-roster">
                <section class="sd-roster-group">
                  <h3 class="sd-roster-head"><button type="button" aria-expanded="true" aria-controls="home-roster-online"><span class="sd-roster-label">Online</span><span class="sd-roster-count"><b>4</b> / 5</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"><path d="M4 6l4 4 4-4"></path></svg></button></h3>
                  <ul id="home-roster-online">
                    <li><button class="sd-roster-row" type="button" data-mention="Maya" data-presence="online" style="--who: var(--sd-extra)"><span class="sd-roster-avatar"><span class="sd-avatar sd-avatar-sm" data-tone="extra">MA</span></span><span class="sd-roster-name">Maya<span class="sd-roster-sub">Lead</span></span></button></li>
                    <li><button class="sd-roster-row" type="button" data-mention="Jonas" data-presence="online" style="--who: var(--sd-accent)"><span class="sd-roster-avatar"><span class="sd-avatar sd-avatar-sm" data-tone="accent">JO</span></span><span class="sd-roster-name">Jonas</span></button></li>
                    <li><button class="sd-roster-row" type="button" data-mention="Scout" data-presence="online" style="--who: var(--sd-pending)"><span class="sd-roster-avatar"><span class="sd-avatar sd-avatar-sm" data-tone="pending">SC</span></span><span class="sd-roster-name">Scout</span><span class="sd-badge">Agent</span></button></li>
                    <li><button class="sd-roster-row" type="button" data-mention="Priya" data-presence="online" style="--who: var(--sd-success)"><span class="sd-roster-avatar"><span class="sd-avatar sd-avatar-sm" data-tone="success">PR</span></span><span class="sd-roster-name">Priya<span class="sd-roster-sub">You</span></span></button></li>
                  </ul>
                </section>
                <section class="sd-roster-group">
                  <h3 class="sd-roster-head"><button type="button" aria-expanded="true" aria-controls="home-roster-away"><span class="sd-roster-label">Away</span><span class="sd-roster-count"><b>1</b></span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"><path d="M4 6l4 4 4-4"></path></svg></button></h3>
                  <ul id="home-roster-away">
                    <li><button class="sd-roster-row" type="button" data-mention="Lena" data-presence="offline"><span class="sd-roster-avatar"><span class="sd-avatar sd-avatar-sm" data-tone="warning">LE</span></span><span class="sd-roster-name">Lena</span></button></li>
                  </ul>
                </section>
              </div>
            </section>
          </div>
        </div>
      </div>
      <footer class="sd-statusbar sd-shell-status">
        <span class="sd-statusbar-seg"><span class="sd-dot" data-tone="success" aria-hidden="true"></span> Live</span>
        <span class="sd-statusbar-seg home-status-doc">Frame: ${doc("sidebar", "Sidebar")} · ${doc("rail", "Rail")}</span>
      </footer>
    </div>
  </div>`;
}

/** Every example app as a scaled live preview that opens the app full size. */
export function homePreviews() {
  const card = (p) => `      <article class="home-preview">
        <div class="home-frame"><iframe data-src="./${p.file}?frame" title="${p.title} example" loading="lazy" inert tabindex="-1"></iframe></div>
        <div class="home-preview-text"><h3><a href="./${p.file}">${p.title}</a></h3><p>${p.summary}</p></div>
      </article>`;
  return `  <section class="home-section" id="home-examples" aria-labelledby="home-examples-h">
    <div class="home-inner">
      <h2 id="home-examples-h" class="home-h">Example apps</h2>
      <div class="home-previews">
${EXAMPLES.map(card).join("\n")}
      </div>
    </div>
  </section>`;
}

/** Every library page as a link, grouped the way the docs sidebar groups them. Phones get this list in place of the wall. */
function homeIndex() {
  const group = (g) => `        <div class="home-index-group">
          <h4>${g.title} <span class="sd-count">${g.pages.length}</span></h4>
          <ul>${g.pages.map((p) => `<li><a href="./${p.file}">${p.title}</a></li>`).join("")}</ul>
        </div>`;
  const section = (s) => `      <section class="home-index-section" aria-labelledby="home-index-${s.id}-h">
        <h3 id="home-index-${s.id}-h">${s.title}</h3>
        <div class="home-index-groups">
${s.groups.map(group).join("\n")}
        </div>
      </section>`;
  return `    <div class="home-index">
${SECTIONS.map(section).join("\n")}
    </div>`;
}

/**
 * Every library page: a wall of live parts from 48rem up, the plain link index
 * below it (a phone scrolls 15,000px to get through the wall). One section
 * holds both so #home-components is a single anchor at every width.
 */
export function homeComponents() {
  return `  <section class="home-section home-components" id="home-components" aria-labelledby="home-components-h">
    <div class="home-inner">
      <h2 id="home-components-h" class="home-h">Components &amp; foundations</h2>
${homeWall()}
${homeIndex()}
    </div>
  </section>`;
}

/** The files an agent reads, and the check that keeps its work inside the rules. */
export function homeAgents() {
  return `  <section class="home-section" id="home-ai" aria-labelledby="home-ai-h">
    <div class="home-inner">
      <h2 id="home-ai-h" class="home-h">For AI agents</h2>
      <div class="home-agents">
        <div><h3><a href="${REPO}/blob/main/AGENTS.md">AGENTS.md</a></h3><p>The rules the design holds to and the components to build from.</p></div>
        <div><h3><a href="${REPO}/blob/main/llms-full.txt">llms-full.txt</a></h3><p>The guide and every component's HTML in one text file.</p></div>
        <div><h3><a href="${REPO}/blob/main/ai/components.json">ai/components.json</a></h3><p>Every block as data, with classes, attributes, and copyable markup.</p></div>
        <div><h3><a href="./lib-setup.html">Setup</a></h3><p>What <code>init()</code> wires, attribute by attribute.</p></div>
      </div>
      <p class="home-foot">Signal design library · MIT · <a href="${REPO}">GitHub</a></p>
    </div>
  </section>`;
}

/** Everything under the topbar. The first screen is the intro over the composition; the rest scrolls. */
export function homeContent() {
  return `  <div class="home-top">
${homeIntro()}
${homeStage()}
  </div>

${homePreviews()}

${homeComponents()}

${homeAgents()}`;
}
