import { navColorRule } from "../../bin/rules.mjs";
import { probeRule } from "../rule-probe.mjs";

export const page = "nav-bars";

/** The nav-color rule fails a signal color on navigation and headings, and lets grey, status and a person's color through. */
export default async function checkNavColorRule(page, where, fail) {
  const at = `${where} nav-color rule`;
  const role = (name) => `color:var(--sd-${name})`;
  const probe = (tag, style, extra = {}) => `<${tag} class="rule-probe${extra.cls ? ` ${extra.cls}` : ""}" ${extra.attrs ?? ""} style="${style}">Item</${tag}>`;
  const icon = (style) => `<svg class="rule-probe" width="16" height="16" viewBox="0 0 16 16" style="${style}"><path d="M0 0h16v16H0z" fill="currentColor"/></svg>`;
  const found = await probeRule(page, navColorRule, {
    heading: probe("h2", role("accent")),
    link: `<nav>${probe("a", role("danger"), { attrs: 'href="#"' })}</nav>`,
    sidebar: probe("a", role("success"), { cls: "sd-sidebar-link", attrs: 'href="#"' }),
    rail: probe("a", role("extra"), { cls: "sd-rail-item", attrs: 'href="#"' }),
    tab: probe("button", role("warning"), { attrs: 'role="tab"' }),
    crumb: `<ol class="sd-breadcrumb"><li>${probe("a", role("pending"), { attrs: 'href="#"' })}</li></ol>`,
    icon: `<h3>${icon(role("accent"))}</h3>`,
    grey: probe("h2", "color:var(--sd-fg-muted)"),
    plain: probe("h2", ""),
    notNav: probe("p", role("accent")),
    tone: `<div data-tone="danger">${probe("h2", role("danger"))}</div>`,
    badge: `<span class="sd-badge">${probe("h2", role("success"))}</span>`,
    count: `<span class="sd-count">${probe("h2", role("accent"))}</span>`,
    dot: `<span class="sd-dot">${probe("h2", role("accent"))}</span>`,
    status: `<span class="sd-status">${probe("h2", role("extra"))}</span>`,
    who: probe("h4", "--who:var(--sd-accent);color:var(--who)"),
    silent: `<div data-sd-check-ignore="nav-color">${probe("h2", role("accent"))}</div>`,
    otherRule: `<div data-sd-check-ignore="color">${probe("h2", role("accent"))}</div>`,
  });
  const says = (lines, text) => lines.some((line) => line.startsWith("nav-color: ") && line.includes(text));
  if (!says(found.heading, "h2.rule-probe: color") || !says(found.heading, "is the accent role (navigation and headings stay grey)")) fail(at, `a heading in the accent color was not reported: ${JSON.stringify(found.heading)}`);
  if (!says(found.link, "is the danger role")) fail(at, `a nav link in the danger color was not reported: ${JSON.stringify(found.link)}`);
  if (!says(found.sidebar, "is the success role")) fail(at, `a sidebar link in the success color was not reported: ${JSON.stringify(found.sidebar)}`);
  if (!says(found.rail, "is the extra role")) fail(at, `a rail item in the extra color was not reported: ${JSON.stringify(found.rail)}`);
  if (!says(found.tab, "is the warning role")) fail(at, `a tab in the warning color was not reported: ${JSON.stringify(found.tab)}`);
  if (!says(found.crumb, "is the pending role")) fail(at, `a breadcrumb link in the pending color was not reported: ${JSON.stringify(found.crumb)}`);
  if (!says(found.icon, "svg.rule-probe: color")) fail(at, `a colored icon in a heading was not reported: ${JSON.stringify(found.icon)}`);
  for (const name of ["grey", "plain", "notNav", "tone", "badge", "count", "dot", "status", "who", "silent"]) {
    if (found[name].length) fail(at, `${name} was reported: ${JSON.stringify(found[name])}`);
  }
  if (!says(found.otherRule, "is the accent role")) fail(at, 'data-sd-check-ignore="color" silenced the nav-color rule');
}
