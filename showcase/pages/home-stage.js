/** The overview's live composition and previews. pages/home.js loads it once it knows the visit is not an old link. */
import { mountLibrary } from "../library.js";
import { getTheme, toast } from "../../src/js/index.js";
import { mountMachine } from "../../src/js/machine.js";
import { CHANNELS, ME, POINTS, UPTIME_CELLS, feedHtml, history, messageHtml, plotSvg, uptimeHtml, uptimeStates } from "../home-data.js";

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const now = () => new Date().toTimeString().slice(0, 5);

/** Ticks only while the composition is on screen and the tab is visible. */
function whileVisible(el, fn, ms) {
  let timer = 0;
  let onScreen = true;
  const run = () => {
    clearInterval(timer);
    timer = 0;
    if (onScreen && !document.hidden && !reduced.matches) timer = setInterval(fn, ms);
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    run();
  }).observe(el);
  document.addEventListener("visibilitychange", run);
  reduced.addEventListener("change", run);
  run();
}

/* ---- Thread: channels, composer, a reply from the agent ------------------ */

function mountThread() {
  const feed = $("home-feed");
  const form = $("home-composer");
  const input = form.querySelector("textarea");
  const typing = $("home-typing");
  const messages = new Map(CHANNELS.map((c) => [c.id, [...c.messages]]));
  const unread = new Map(CHANNELS.map((c) => [c.id, c.unread]));
  let current = CHANNELS[0].id;

  const toBottom = () => {
    feed.scrollTop = feed.scrollHeight;
  };
  const show = (id) => {
    current = id;
    unread.set(id, 0);
    feed.innerHTML = feedHtml({ messages: messages.get(id) });
    toBottom();
    typing.hidden = true;
    input.placeholder = `Message #${id}, @ to mention`;
    const channel = CHANNELS.find((c) => c.id === id);
    $("home-channel").textContent = id;
    $("home-topic").textContent = channel.topic;
    for (const b of document.querySelectorAll("[data-channel]")) {
      const on = b.dataset.channel === id;
      if (b.matches("button.sd-sidebar-link")) {
        if (on) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
        b.querySelector(".sd-badge-count")?.remove();
      } else b.setAttribute("aria-pressed", String(on));
    }
  };
  // The sidebar and the narrow-screen switch both carry data-channel.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-channel]");
    if (button) show(button.dataset.channel);
    const space = event.target.closest("[data-space]");
    if (space) {
      for (const tile of document.querySelectorAll("[data-space]")) {
        if (tile === space) tile.setAttribute("aria-current", "true");
        else tile.removeAttribute("aria-current");
      }
      document.querySelector("[data-space-name]").textContent = space.dataset.name;
    }
  });

  const add = (message, channel = current) => {
    messages.get(channel).push(message);
    if (channel !== current) return;
    feed.insertAdjacentHTML("beforeend", messageHtml(message));
    toBottom();
  };

  const reply = (text, channel) => {
    const lines = [
      "Noted. I will watch the p95 line and post here if it moves more than 10%.",
      "Queued it. The canary keeps its share until the checks finish.",
      "Seen. I am adding it to the rollout notes.",
    ];
    typing.hidden = false;
    setTimeout(() => {
      typing.hidden = true;
      add({ from: "Scout", time: now(), text: lines[text.length % lines.length] }, channel);
    }, reduced.matches ? 300 : 1400);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const last = messages.get(current).at(-1);
    add({ from: ME, own: true, time: now(), text, grouped: last?.from === ME });
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    reply(text, current);
  });

  return { say: (text, from = "Scout") => add({ from, time: now(), text }) };
}

/* ---- Plot, stats and uptime ----------------------------------------------- */

function mountMetrics() {
  const data = history();
  let key = "p95";
  const plot = $("home-plot");
  const svg = plot.querySelector("svg");
  const draw = () => {
    svg.innerHTML = plotSvg(data[key], key);
    $("home-readout").innerHTML = `${now()}<b>${data[key].at(-1)} ms</b>`;
    plot.dataset.tone = key === "p95" ? "accent" : "extra";
  };
  $("home-percentile").addEventListener("click", (event) => {
    const button = event.target.closest("[data-value]");
    if (!button) return;
    key = button.dataset.value;
    draw();
  });

  const step = (series, lo, hi, size) => {
    const v = series.at(-1) + (Math.random() - 0.5) * size;
    series.push(Math.round(Math.min(hi, Math.max(lo, v))));
    if (series.length > POINTS) series.shift();
  };
  const api = $("home-api");
  const cells = uptimeStates(30);
  let ticks = 0;
  whileVisible($("home-stage"), () => {
    step(data.p50, 96, 150, 16);
    step(data.p95, 190, 300, 30);
    draw();
    const p95 = data.p95.at(-1);
    const previous = data.p95.at(-2);
    $("home-p95").textContent = p95;
    const delta = $("home-p95-delta");
    delta.textContent = p95 === previous ? "steady" : `${p95 > previous ? "+" : "−"}${Math.abs(p95 - previous)} ms`;
    delta.dataset.tone = p95 > 270 ? "danger" : p95 > 250 ? "warning" : "success";
    if (++ticks % 3 === 0) {
      cells.push("ok");
      cells.shift();
      if (cells.length !== UPTIME_CELLS) cells.length = UPTIME_CELLS;
      api.innerHTML = uptimeHtml(cells);
    }
  }, 1500);
}

/* ---- Settings: each control changes something you can see ----------------- */

function mountSettings(thread) {
  const env = $("home-env");
  const deploy = $("home-deploy");
  const canary = $("home-canary");
  const share = $("home-share");
  const progress = $("home-progress");
  const setProgress = () => {
    const full = !canary.checked;
    const value = full ? 100 : Math.min(100, Math.max(0, Number(share.value) || 0));
    progress.style.setProperty("--value", value);
    progress.setAttribute("aria-valuenow", value);
    $("home-progress-v").textContent = `${value}%`;
    share.disabled = full;
    for (const button of share.parentElement.querySelectorAll("button")) button.disabled = full;
  };
  const label = () => {
    const name = env.querySelector('[aria-pressed="true"]')?.dataset.value ?? "staging";
    deploy.textContent = `Deploy to ${name}`;
    if (name === "production") deploy.dataset.tone = "danger";
    else delete deploy.dataset.tone;
    return name;
  };
  env.addEventListener("click", () => queueMicrotask(label));
  canary.addEventListener("change", setProgress);
  share.addEventListener("input", setProgress);
  share.addEventListener("change", setProgress);
  $("home-notify").addEventListener("change", (event) => toast(event.target.checked ? "Alerts on for failed deploys" : "Alerts off"));
  deploy.addEventListener("click", () => {
    const name = label();
    const count = $("home-deploys");
    count.textContent = Number(count.textContent) + 1;
    deploy.setAttribute("aria-busy", "true");
    toast(`Deploy queued for ${name}`, { tone: name === "production" ? "danger" : "success" });
    thread.say(`Deploy to ${name} queued at ${canary.checked ? `${share.value}% of traffic` : "full traffic"}.`);
    setTimeout(() => deploy.removeAttribute("aria-busy"), 1600);
  });
  setProgress();
  label();
}

/* ---- People: a row mentions the person in the composer ------------------ */

function mountRoster() {
  const input = document.querySelector("#home-composer textarea");
  const roster = $("home-roster");
  roster.addEventListener("click", (event) => {
    const head = event.target.closest(".sd-roster-head button");
    if (head) {
      const open = head.getAttribute("aria-expanded") !== "true";
      head.setAttribute("aria-expanded", String(open));
      $(head.getAttribute("aria-controls")).hidden = !open;
      return;
    }
    const row = event.target.closest("[data-mention]");
    if (!row) return;
    input.value = `${input.value}${input.value && !input.value.endsWith(" ") ? " " : ""}@${row.dataset.mention} `;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
}

/* ---- Machine: runs while it is on screen ---------------------------------- */

// The deploy queue from the Machine page, on a smaller board so its labels stay readable in a card.
const DEPLOY = {
  seed: 7,
  size: [30, 9],
  cell: 12,
  clock: { period: 40 },
  nodes: [
    { id: "writers", kind: "source", at: [1, 2.5], size: [4, 6], agents: 2, every: [5, 9], to: "build", label: "writers", labelSide: "top-start" },
    { id: "build", kind: "box", at: [8, 4], size: [4, 4], capacity: 2, hold: [2, 4], label: "build", labelSide: "top-start", out: "deploy" },
    { id: "deploy", kind: "press", at: [15, 4], size: [4, 4], hold: [0.6, 1.2], label: "deploy", labelSide: "top-start", out: "prod" },
    { id: "prod", kind: "line", at: [22, 5], size: [7, 2], label: "prod", labelSide: "top-start", note: "", notes: { done: "healthy", failed: "failing" } },
  ],
  wires: [
    { from: "writers", to: "build" },
    { from: "build", to: "deploy" },
    { from: "deploy", to: "prod" },
  ],
};

function mountFlow() {
  const figure = $("home-machine");
  // A card has about 26 cells of room at 1280 and more on a wide screen: size the cell to what it has.
  const room = figure.clientWidth;
  const machine = mountMachine(figure, { ...DEPLOY, cell: Math.min(20, Math.max(11, Math.floor(room / DEPLOY.size[0]))) });
  const toggle = $("home-flow-toggle");
  let paused = false;
  let visible = true;
  const apply = () => {
    const play = !paused && visible && !document.hidden && !reduced.matches;
    if (play !== machine.playing) machine.toggle();
    toggle.textContent = paused || reduced.matches ? "Play" : "Pause";
  };
  toggle.addEventListener("click", () => {
    paused = reduced.matches ? false : !paused;
    if (reduced.matches) machine.toggle();
    apply();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    apply();
  }).observe(figure);
  document.addEventListener("visibilitychange", apply);
  apply();
}

/* ---- Previews: frames scaled to their card, in the page's theme ------------ */

function mountPreviews() {
  const frames = [...document.querySelectorAll(".home-frame")];
  const fit = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      const width = parseFloat(getComputedStyle(target).getPropertyValue("--fw")) || 1440;
      target.style.setProperty("--scale", String(target.clientWidth / width));
    }
  });
  for (const frame of frames) fit.observe(frame);
  // A frame starts loading a screen before it is reached, so the first screen carries none of them.
  const load = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        load.unobserve(target);
        const iframe = target.querySelector("iframe");
        iframe.src = iframe.dataset.src;
      }
    },
    { rootMargin: "400px 0px" },
  );
  for (const frame of frames) load.observe(frame);
  // A frame that already loaded keeps the theme it loaded with; tell it when the page changes theme.
  document.addEventListener("sd:theme", ({ detail }) => {
    for (const iframe of document.querySelectorAll(".home-frame iframe")) {
      iframe.contentWindow?.postMessage({ sdSync: { key: "theme", value: detail?.theme ?? getTheme() } }, location.origin);
    }
  });
}

mountLibrary();
// A sidebar folded on another page stays open here: it is how the channels are chosen.
$("home-shell").removeAttribute("data-sidebar");
const thread = mountThread();
mountMetrics();
mountSettings(thread);
mountRoster();
mountFlow();
mountPreviews();
