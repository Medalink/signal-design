/**
 * What the home page's live composition shows: the channels and their
 * messages, the latency series behind the plot, and the uptime cells. Plain
 * ESM with no DOM, so the build (home-markup.js) writes the first paint from
 * the same data the page script (pages/home.js) re-renders from.
 */

const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Name colors come from the roles; `who` is the --who a message's author takes. */
const PEOPLE = {
  Maya: { who: "--sd-extra", tag: "Lead" },
  Jonas: { who: "--sd-accent" },
  Scout: { who: "--sd-pending", badge: "Agent" },
  Priya: { who: "--sd-success" },
  Lena: { who: "--sd-warning" },
};
export const ME = "Priya";

export const SPACES = [
  { id: "platform", initials: "PL", name: "Platform" },
  { id: "design", initials: "DS", name: "Design" },
  { id: "docs", initials: "DC", name: "Docs" },
];

export const CHANNELS = [
  {
    id: "deploys",
    topic: "Releases and rollouts",
    unread: 0,
    messages: [
      { divider: "Yesterday" },
      { from: "Jonas", time: "16:10", text: "Release 1.3.2 is out. The font subset change cut the stylesheet by 38 KB." },
      { from: "Scout", time: "16:14", text: "Post-release check passed on all three regions. No alerts in the last hour.", reactions: [["👍", 2, false]] },
      { from: "Lena", time: "16:30", text: "Docs for the sidebar resize are live. I added the keyboard section." },
      { from: "Maya", time: "16:41", text: "Thanks. Next up is 1.4: the shell frame and the new rail tile." },
      { from: "Jonas", time: "16:42", text: "I will cut the branch after standup.", grouped: true },
      { divider: "Today" },
      { from: "Maya", time: "09:42", text: "Release 1.4 is on staging. Checks are green, so production starts at 10:00.", reactions: [["👍", 3, true], ["👀", 1, false]] },
      { from: "Scout", time: "09:46", text: "Canary at 5% for six minutes: p95 held at 240 ms and no new errors." },
      { from: "Jonas", time: "09:51", text: "<mention>@Maya</mention> should the migration finish before the rollout widens?", mention: true },
      { from: "Maya", time: "09:52", text: "Yes. I will hold at 25% until it reports done.", reactions: [["✅", 2, false]] },
    ],
  },
  {
    id: "incidents",
    topic: "Alerts and follow-ups",
    unread: 2,
    messages: [
      { divider: "Yesterday" },
      { from: "Scout", time: "22:04", text: "Certificate for the docs host renews in 6 days. Renewal job is scheduled." },
      { from: "Maya", time: "22:10", text: "Good. Ping me if it fails twice." },
      { divider: "Today" },
      { from: "Scout", time: "08:15", text: "Queue depth passed 500 for the mailer. Autoscaling added two workers.", reactions: [["👀", 2, false]] },
      { from: "Lena", time: "08:20", text: "Depth is back under 100. I am keeping the extra workers until noon." },
      { from: "Lena", time: "08:21", text: "Opened a follow-up to raise the baseline.", grouped: true },
    ],
  },
  {
    id: "general",
    topic: "Team chat",
    unread: 0,
    messages: [
      { divider: "Yesterday" },
      { from: "Lena", time: "17:20", text: "Reminder: the design review moves to Thursday." },
      { from: "Maya", time: "17:24", text: "Works for me.", reactions: [["👍", 3, false]] },
      { divider: "Today" },
      { from: "Jonas", time: "10:02", text: "The docs build is under a minute again after the font subset change.", reactions: [["🔥", 4, true]] },
      { from: "Priya", time: "10:05", text: "Nice. I will review the changelog entry after lunch.", own: true },
    ],
  },
];

const reactions = (list) =>
  list?.length
    ? `<div class="sd-reactions">${list.map(([emoji, n, on]) => `<button data-sd-reaction aria-pressed="${on}"><span>${emoji}</span><b>${n}</b></button>`).join("")}</div>`
    : "";

const body = (m) => esc(m.text).replace(/&lt;mention&gt;(.*?)&lt;\/mention&gt;/, '<span class="sd-mention" style="--who: var(--sd-extra)">$1</span>');

/** One message row. A grouped row repeats neither time nor name, as in the Messages page. */
export function messageHtml(m) {
  if (m.divider) return `<div class="sd-divider sd-feed-day">${m.divider}</div>`;
  const p = PEOPLE[m.from] ?? { who: "--sd-extra" };
  const own = m.own || m.from === ME ? " data-own" : "";
  const mention = m.mention ? " data-mention" : "";
  if (m.grouped)
    return `<article class="sd-message" data-grouped${own} title="${m.time}" style="--who: var(${p.who})"><div class="sd-message-body"><div class="sd-message-text">${body(m)}</div>${reactions(m.reactions)}</div></article>`;
  const marks = (p.tag ? `<span class="sd-message-tag">${p.tag}</span>` : "") + (p.badge ? `<span class="sd-badge">${p.badge}</span>` : "");
  return `<article class="sd-message"${own}${mention} style="--who: var(${p.who})"><time class="sd-message-time" datetime="${m.time}">${m.time}</time><div class="sd-message-body"><div class="sd-message-text"><b class="sd-message-author">${m.from}</b>${marks}${body(m)}</div>${reactions(m.reactions)}</div></article>`;
}

export const feedHtml = (channel) => channel.messages.map(messageHtml).join("\n");

/* ---- Latency: two series, one seeded history ------------------------------ */

export const POINTS = 40;
const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647), (seed - 1) / 2147483646);

/** p50 and p95 in milliseconds, POINTS long, oldest first. The same history every build. */
export function history() {
  const rnd = seeded(41);
  const out = { p50: [], p95: [] };
  let a = 118;
  let b = 236;
  for (let i = 0; i < POINTS; i++) {
    a = Math.min(150, Math.max(96, a + (rnd() - 0.5) * 14));
    b = Math.min(300, Math.max(190, b + (rnd() - 0.5) * 26));
    out.p50.push(Math.round(a));
    out.p95.push(Math.round(b));
  }
  return out;
}

const W = 600;
const H = 120;
const RANGE = { p50: [60, 180], p95: [150, 330] };

/** The polygon and polyline of a series inside the plot's 600 x 120 viewBox. */
export function plotPoints(values, key) {
  const [lo, hi] = RANGE[key];
  const pts = values.map((v, i) => `${Math.round((i / (values.length - 1)) * W)},${Math.round(H - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - 16) - 8)}`);
  return { line: pts.join(" "), area: `0,${H} ${pts.join(" ")} ${W},${H}` };
}

export function plotSvg(values, key) {
  const { line, area } = plotPoints(values, key);
  return `<path class="grid" d="M0 30H${W}M0 60H${W}M0 90H${W}"></path><polygon class="area" points="${area}"></polygon><polyline class="line" points="${line}"></polyline>`;
}

/* ---- Uptime ---------------------------------------------------------------- */

export const UPTIME_CELLS = 48;
export const uptimeHtml = (states) => states.map((s) => `<i data-state="${s}"></i>`).join("");
export const uptimeStates = (down) => Array.from({ length: UPTIME_CELLS }, (_, i) => (i === down ? "degraded" : "ok"));
