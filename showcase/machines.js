/**
 * The machines the Flow example can run. Each is one plain spec for
 * mountMachine() plus what the page shows around it: `stats` for the tiles
 * and `extras` for the rows of chains under the board. Add a machine by
 * adding an entry; nothing else lists them.
 */

const flow = {
  id: "continuous-flow",
  title: "Continuous flow",
  icon: "sync",
  summary: "Every change ships straight to main. Rings run after it lands.",
  line: "main",
  stats: [
    { label: "Landed", node: "main", key: "done" },
    { label: "Lab red", node: "lab", key: "failed" },
    { label: "Folded", event: "fold" },
    { label: "Agent runs", node: "runs", key: "in" },
  ],
  extras: [
    {
      title: "In the flow",
      rows: [
        { name: "lost push race", sub: "gate again on what arrived", chain: [["push rejected", "done"], ["rebase", "done"], ["gate the new range", "done"], ["push", "done"]] },
        { name: "regenerate", sub: "generated files never block a rebase", chain: [["rebase stops", "done"], ["only generated files", "done"], ["rebuild them", "done"], ["continue", "done"]] },
        { name: "doors", sub: "a door labels the note, it holds nothing", chain: [["range touches a door", "done"], ["lands anyway", "done"], ["note names the door", "done"]] },
      ],
    },
    {
      title: "On request",
      rows: [
        { name: "consumer bumps", sub: "the operator starts them", chain: [["release tagged"], ["bump each app"], ["each app ships it"]] },
      ],
    },
  ],
  spec: {
    seed: 11,
    size: [62, 30],
    travel: 320,
    clock: { period: 60 },
    nodes: [
      { id: "agents", kind: "source", at: [1, 4], size: [5, 10], agents: 4, every: [7, 12], to: "ship", label: "agents", meta: "own worktree", labelSide: "top-start" },
      {
        id: "ship", kind: "box", at: [10, 5], size: [4, 8], capacity: 4, hold: [3, 6], label: "ship", meta: "rebase + gate",
        out: { pass: { to: "push", weight: 14 }, red: { to: "agents", weight: 2, status: "failed" } },
      },
      {
        id: "push", kind: "press", at: [18, 6], size: [6, 6], hold: [0.7, 1.5], label: "push", meta: "one at a time", note: "{done} landed",
        out: { pass: { to: "main", weight: 11 }, race: { to: "ship", weight: 1, status: "waiting" } },
      },
      { id: "main", kind: "line", at: [27, 8], size: [34, 2], label: "main", labelSide: "top-start", note: "waiting for the lab", notes: { done: "green", failed: "red · agent run queued" } },
      {
        id: "lab", kind: "checks", at: [33, 12], size: [28, 3], queue: "latest", judge: true, hold: [6, 9],
        items: ["sweep chromium", "sweep webkit", "a11y audit", "ai files", "perf"], label: "lab", meta: "every SHA · gates nothing", labelSide: "top-start",
        out: { pass: { weight: 5, status: "done" }, fail: { to: "runs", weight: 1, status: "failed" } },
      },
      {
        id: "release", kind: "scan", at: [33, 18], size: [16, 3], queue: "latest", hold: [2.5, 4], label: "release", meta: "after ai-files", labelSide: "top-start",
        out: { tag: { to: "tag", weight: 3, status: "done" }, none: { weight: 1 } },
      },
      { id: "tag", kind: "sink", at: [53, 18], size: [8, 3], format: "v1.4.{n}", start: 56, label: "tag" },
      { id: "pages", kind: "scan", at: [33, 24], size: [16, 3], queue: "latest", hold: [3, 5], label: "pages", meta: "deploy", labelSide: "top-start", out: { pass: { status: "done" } } },
      {
        id: "runs", kind: "box", at: [12, 21], size: [10, 5], capacity: 4, cols: 4, hold: [5, 9], label: "agent runs", meta: "one per key", labelSide: "top-start",
        note: "{busy} working · {queue} waiting", out: { fix: { to: "ship" } },
      },
    ],
    wires: [
      { from: "agents", to: "ship" },
      { from: "ship", to: "push" },
      { from: "push", to: "main" },
      { from: "main", to: "lab", start: [29, 9], via: [[29, 13.5]] },
      { from: "main", to: "release", start: [29, 9], via: [[29, 19.5]] },
      { from: "main", to: "pages", start: [29, 9], via: [[29, 25.5]] },
      { from: "release", to: "tag" },
      { from: "push", to: "ship", start: [21, 12], via: [[21, 14], [13, 14]], end: [13, 13], dashed: true },
      { from: "ship", to: "agents", start: [11, 13], via: [[11, 15.5], [0.5, 15.5], [0.5, 9]], end: [1, 9], dashed: true },
      { from: "lab", to: "runs", start: [35, 15], via: [[35, 16], [24, 16], [24, 23.5]], end: [22, 23.5] },
      { from: "runs", to: "ship", start: [12, 23.5], via: [[8, 23.5], [8, 11]], end: [10, 11] },
    ],
    text: [
      { at: [16, 1.5], lines: ["every ship lands · a door only labels the note"] },
      { at: [1, 16.5], lines: ["red gate → back to its agent"] },
      { at: [12, 27], lines: ["a red ring queues one run per key", "the fix ships like any change"] },
      { at: [33, 28.2], lines: ["each ring takes the newest SHA · what waited folds into its range"] },
    ],
  },
};

const pulls = {
  id: "pull-requests",
  title: "Pull requests",
  icon: "join",
  summary: "The loop before the flow: every change waits on CI and a person.",
  line: "main",
  stats: [
    { label: "Merged", node: "main", key: "done" },
    { label: "CI red", node: "ci", key: "failed" },
    { label: "Changes asked", node: "review", key: "failed" },
    { label: "Waiting on review", node: "review", key: "queue" },
  ],
  extras: [
    {
      title: "Why it stalls",
      rows: [
        { name: "one reviewer", sub: "every change queues behind a person", chain: [["open"], ["CI"], ["wait for review"], ["merge"]] },
      ],
    },
  ],
  spec: {
    seed: 5,
    size: [62, 19],
    travel: 300,
    clock: { period: 60 },
    nodes: [
      { id: "agents", kind: "source", at: [1, 4], size: [5, 10], agents: 3, every: [14, 22], to: "open", label: "agents", labelSide: "top-start" },
      { id: "open", kind: "box", at: [10, 6], size: [4, 6], capacity: 3, hold: [0.6, 1.2], label: "open", meta: "a PR each", out: "ci" },
      {
        id: "ci", kind: "checks", at: [18, 7.5], size: [14, 3], hold: [3, 5], items: ["build", "lint", "e2e"], label: "CI", meta: "one runner",
        out: { pass: { to: "review", weight: 4, status: "done" }, fail: { to: "agents", weight: 1, status: "failed" } },
      },
      {
        id: "review", kind: "box", at: [36, 6], size: [5, 6], capacity: 2, hold: [5, 10], label: "review", meta: "a person", note: "{queue} waiting",
        out: { approve: { to: "merge", weight: 3, status: "done" }, changes: { to: "agents", weight: 1, status: "waiting" } },
      },
      { id: "merge", kind: "press", at: [45, 6], size: [5, 6], hold: [0.6, 1.2], label: "merge", out: "main" },
      { id: "main", kind: "line", at: [53, 8], size: [8, 2], label: "main", labelSide: "top-start" },
    ],
    wires: [
      { from: "agents", to: "open" },
      { from: "open", to: "ci" },
      { from: "ci", to: "review" },
      { from: "review", to: "merge" },
      { from: "merge", to: "main" },
      { from: "ci", to: "agents", start: [25, 10.5], via: [[25, 14.5], [0.5, 14.5], [0.5, 9]], end: [1, 9], dashed: true },
      { from: "review", to: "agents", start: [38.5, 12], via: [[38.5, 16], [0.5, 16], [0.5, 9]], end: [1, 9], dashed: true },
    ],
    text: [{ at: [1, 17], lines: ["red CI or asked for changes → back to its agent"] }],
  },
};

const runs = {
  id: "agent-runs",
  title: "Agent runs",
  icon: "terminal",
  summary: "How the engine starts agent runs: one per key, and only while the pool has room.",
  stats: [
    { label: "Events", node: "inbox", key: "in" },
    { label: "Local pool", node: "local", key: "done" },
    { label: "Fallback pool", node: "fallback", key: "done" },
    { label: "Fixes shipped", node: "fixes", key: "done" },
  ],
  extras: [
    {
      title: "Room on the pool",
      rows: [
        { name: "go", sub: "nothing waiting and a slot free", chain: [["start on the local pool", "done"]] },
        { name: "cool", sub: "requests waiting or every slot busy", chain: [["start nothing new there", "running"]] },
        { name: "halt", sub: "a long queue or slow answers", chain: [["start nothing", "failed"], ["post an incident", "failed"]] },
      ],
    },
  ],
  spec: {
    seed: 9,
    size: [62, 22],
    travel: 320,
    clock: { period: 60 },
    nodes: [
      { id: "events", kind: "source", at: [1, 4], size: [5, 12], agents: 5, every: [8, 14], to: "inbox", label: "events", meta: "rings, issues, ideas", labelSide: "top-start" },
      { id: "inbox", kind: "box", at: [10, 7], size: [4, 6], capacity: 1, hold: [0.4, 0.9], label: "inbox", meta: "oldest first", note: "{queue} queued", out: "room" },
      {
        id: "room", kind: "press", at: [18, 7], size: [6, 6], hold: [0.3, 0.7], label: "room", meta: "go · cool · halt",
        out: { go: { to: "local", weight: 3 }, overflow: { to: "fallback", weight: 1, status: "waiting" } },
      },
      { id: "local", kind: "box", at: [30, 3], size: [14, 5], capacity: 4, cols: 4, hold: [6, 12], label: "local pool", meta: "free per token", note: "{busy} of 4", out: "fixes" },
      { id: "fallback", kind: "box", at: [30, 13], size: [11, 5], capacity: 3, cols: 3, hold: [4, 8], label: "fallback pool", meta: "while the pool is busy", note: "{busy} of 3", labelSide: "top-start", out: "fixes" },
      { id: "fixes", kind: "press", at: [48, 7], size: [5, 6], hold: [0.6, 1.2], label: "ship", meta: "the fix", out: "main" },
      { id: "main", kind: "sink", at: [56, 8.5], size: [5, 3], format: "{n} fixed", start: 0, label: "main" },
    ],
    wires: [
      { from: "events", to: "inbox" },
      { from: "inbox", to: "room" },
      { from: "room", to: "local", via: [[27, 10], [27, 5.5]] },
      { from: "room", to: "fallback", via: [[27, 10], [27, 15.5]] },
      { from: "local", to: "fixes", via: [[46, 5.5], [46, 10]] },
      { from: "fallback", to: "fixes", via: [[46, 15.5], [46, 10]] },
      { from: "fixes", to: "main" },
    ],
    text: [{ at: [10, 19], lines: ["one run per key: a second failure of the same ring joins the open run"] }],
  },
};

const kitchen = {
  id: "kitchen-line",
  title: "Kitchen line",
  icon: "fire",
  summary: "Not CI at all: tickets, a grill that cooks one at a time, a pass that sends plates back.",
  stats: [
    { label: "Tickets", node: "tickets", key: "in" },
    { label: "Sent back", node: "pass", key: "failed" },
    { label: "Served", node: "served", key: "done" },
    { label: "On the rail", node: "grill", key: "queue" },
  ],
  extras: [],
  spec: {
    seed: 4,
    size: [62, 18],
    travel: 260,
    clock: { period: 90 },
    nodes: [
      { id: "tables", kind: "source", at: [1, 3], size: [5, 10], agents: 4, every: [10, 16], to: "tickets", label: "tables", labelSide: "top-start" },
      { id: "tickets", kind: "box", at: [10, 5], size: [6, 6], capacity: 4, cols: 2, hold: [0.6, 1.4], label: "tickets", meta: "on the rail", out: "grill" },
      { id: "grill", kind: "press", at: [21, 5], size: [6, 6], hold: [1.6, 2.6], label: "grill", meta: "one at a time", note: "{queue} waiting", out: "pass" },
      {
        id: "pass", kind: "scan", at: [32, 6.5], size: [14, 3], hold: [1, 2], label: "pass", meta: "the chef checks",
        out: { served: { to: "served", weight: 8, status: "done" }, back: { to: "grill", weight: 1, status: "failed" } },
      },
      { id: "served", kind: "sink", at: [51, 6.5], size: [10, 3], format: "{n} plates", start: 0, label: "served" },
    ],
    wires: [
      { from: "tables", to: "tickets" },
      { from: "tickets", to: "grill" },
      { from: "grill", to: "pass" },
      { from: "pass", to: "served" },
      { from: "pass", to: "grill", start: [39, 9.5], via: [[39, 13.5], [24, 13.5]], end: [24, 11], dashed: true },
    ],
    text: [{ at: [26, 15], lines: ["sent back → the grill again, ahead of nothing"] }],
  },
};

export const MACHINES = [flow, pulls, runs, kitchen];
