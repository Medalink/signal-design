/** The doc sections of lib-flow.html: see page-docs/index.js. */
export default {
  when: [
    "A run that moves through stages: each stage is a column of jobs, and the edges between stages show how far the run has got.",
    "Jobs that may need a person or may fail: waiting, failed, and skipped states are drawn in their own marks and colors, so a stuck run is easy to find.",
    "A list of named checks with results beside the flow: the checklist uses the same status words and marks, so a run and its checks read together.",
  ],
  notWhen: [
    "A state machine you draw from a spec with moving tokens: the machine does that (see Machine).",
    "Ranges over a time axis: a timeline shows when each one started and ended (see Timeline).",
    "A single task's progress: a progress bar says how far it has come (see Feedback).",
  ],
  usage: "&lt;figure class=\"sd-flow\" aria-labelledby=\"flow-h\"&gt;\n  &lt;div class=\"sd-flow-head\"&gt;\n    &lt;span class=\"sd-label sd-label-strong\" id=\"flow-h\"&gt;Stages · run 4821&lt;/span&gt;\n    &lt;div class=\"sd-flow-legend\"&gt;&lt;span data-status=\"done\"&gt;&lt;i&gt;&lt;/i&gt;Done&lt;/span&gt;&lt;span data-status=\"running\"&gt;&lt;i&gt;&lt;/i&gt;Running&lt;/span&gt;&lt;/div&gt;\n  &lt;/div&gt;\n  &lt;div class=\"sd-flow-board\"&gt;\n    &lt;div class=\"sd-flow-canvas\"&gt;\n      &lt;div class=\"sd-flow-stage\" role=\"group\" aria-labelledby=\"flow-build\" data-status=\"done\"&gt;\n        &lt;div class=\"sd-flow-stage-head\" style=\"--value: 100\"&gt;&lt;i&gt;&lt;/i&gt;&lt;b id=\"flow-build\"&gt;Build&lt;/b&gt;&lt;span&gt;2m 10s&lt;/span&gt;&lt;span&gt;1/1&lt;/span&gt;&lt;/div&gt;\n        &lt;div class=\"sd-flow-jobs\"&gt;\n          &lt;button class=\"sd-flow-job\" type=\"button\" data-status=\"done\"&gt;&lt;i&gt;&lt;/i&gt;&lt;b&gt;build-web&lt;/b&gt;&lt;span&gt;1m 48s&lt;/span&gt;&lt;span class=\"sd-sr-only\"&gt;Done&lt;/span&gt;&lt;/button&gt;\n        &lt;/div&gt;\n      &lt;/div&gt;\n      &lt;div class=\"sd-flow-stage\" role=\"group\" aria-labelledby=\"flow-verify\" data-status=\"running\"&gt;\n        &lt;div class=\"sd-flow-stage-head\" style=\"--value: 43\"&gt;&lt;i&gt;&lt;/i&gt;&lt;b id=\"flow-verify\"&gt;Verify&lt;/b&gt;&lt;span&gt;3m 12s&lt;/span&gt;&lt;span&gt;0/1&lt;/span&gt;&lt;/div&gt;\n        &lt;div class=\"sd-flow-jobs\"&gt;\n          &lt;button class=\"sd-flow-job\" type=\"button\" data-status=\"running\" style=\"--value: 43\"&gt;&lt;i&gt;&lt;/i&gt;&lt;b&gt;e2e-chromium&lt;/b&gt;&lt;span&gt;18/42&lt;/span&gt;&lt;span class=\"sd-sr-only\"&gt;Running&lt;/span&gt;&lt;/button&gt;\n        &lt;/div&gt;\n      &lt;/div&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n&lt;/figure&gt;\n\n&lt;section class=\"sd-checklist\" aria-labelledby=\"checks-h\"&gt;\n  &lt;div class=\"sd-checklist-head\"&gt;&lt;span class=\"sd-label sd-label-strong\" id=\"checks-h\"&gt;Checks&lt;/span&gt;&lt;/div&gt;\n  &lt;ul&gt;\n    &lt;li data-status=\"done\"&gt;&lt;i&gt;&lt;/i&gt;&lt;b&gt;Type check&lt;/b&gt;&lt;span&gt;0 errors&lt;/span&gt;&lt;span class=\"sd-sr-only\"&gt;Passed&lt;/span&gt;&lt;/li&gt;\n    &lt;li data-status=\"running\" style=\"--value: 43\"&gt;&lt;i&gt;&lt;/i&gt;&lt;b&gt;End to end&lt;/b&gt;&lt;span&gt;18 / 42&lt;/span&gt;&lt;span class=\"sd-sr-only\"&gt;Running&lt;/span&gt;&lt;/li&gt;\n  &lt;/ul&gt;\n&lt;/section&gt;",
  api: [
    { name: "sd-flow", type: "class", desc: "The figure: stages left to right on a dot grid. CSS only." },
    { name: "sd-flow-head, sd-flow-legend", type: "class", desc: "A title row and a legend whose spans take the same <code>data-status</code> and mark as the stages." },
    { name: "sd-flow-board, sd-flow-canvas", type: "class", desc: "The sideways-scrolling wrapper and the row of stage columns." },
    { name: "sd-flow-stage, sd-flow-stage-head", type: "class", desc: "A column and its head: a mark, the name in a <code>b</code>, the elapsed time, and the count." },
    { name: "sd-flow-jobs, sd-flow-job", type: "class", desc: "The jobs in a stage, centered on one line, and one job; use a <code>button</code> or <code>a</code> so it can open detail." },
    { name: "data-status", type: "attribute", def: "queued look", desc: "<code>done</code>, <code>running</code>, <code>queued</code>, <code>waiting</code>, <code>failed</code>, or <code>skipped</code>, on a stage, a job, a legend entry, or a check." },
    { name: "--value", type: "token", def: "0", desc: "0 to 100: fills the line under a stage head, the underline of a running job, and a running check's bar." },
    { name: "aria-current, aria-selected", type: "ARIA", desc: "On a job: the open or selected job, drawn with a foreground edge." },
    { name: "--stage-w, --job-h, --head-h, --job-gap", type: "token", def: "12.5rem, 52px, 44px, 12px", desc: "Stage width, job height, head height, and the gap between jobs." },
    { name: "data-chart-theme", type: "attribute", def: "mono", desc: "<code>mono</code> keeps done and running in greys and colors only what needs a person; <code>spectrum</code> uses the full palette." },
    { name: "sd-checklist, sd-checklist-head", type: "class", desc: "Named checks in a <code>ul</code>, under a head with counts." },
    { name: "li[data-status]", type: "attribute", desc: "A check: an <code>i</code> mark, a <code>b</code> name, and a <code>span</code> result; <code>data-tone</code> on the result names an exception, such as warnings." },
  ],
  keyboard: [
    ["Tab", "Moves through the jobs, which are buttons or links, and through the board when it scrolls."],
    ["Enter, Space", "Activates the focused job."],
  ],
  a11y: [
    "Name the figure with <code>aria-labelledby</code> on the title, and give each stage <code>role=\"group\"</code> with <code>aria-labelledby</code> pointing at its name.",
    "The mark is color and shape together: solid when settled (done, failed), hollow before it starts, dashed while waiting or skipped, and turning while running.",
    "Say the status in text too: add a <code>span class=\"sd-sr-only\"</code> with the word to each job and check, since the mark carries no text.",
    "Mark the open job with <code>aria-current=\"true\"</code>; it also gets a foreground edge and a lighter fill.",
    "Waiting and failed job results and stage meta take their status color mixed toward the foreground color, so keep that text short.",
    "A job button keeps a visible focus outline, 1px with a 2px offset.",
  ],
  motion: [
    "A running mark turns 90 degrees over 1.4s and repeats; every running stage, job, legend item, and check turns.",
    "Stage backgrounds, job fills, and job edges change over 160ms on hover and state changes.",
    "The board's right edge fades while more stages run past it, and the fade follows the scroll position, ending at the last stage; it needs scroll-driven animation support.",
    "prefers-reduced-motion stops the turning mark and cuts the transitions to near zero; the status still shows by shape and color.",
  ],
  responsive: [
    "The board scrolls sideways when the stages do not fit; each stage is at least <code>--stage-w</code> wide and shares the extra space.",
    "Under 40rem no stage is narrower than 15rem, so a head keeps room for its name, time, and count.",
    "A long job name ends in an ellipsis: jobs have a fixed height so the edges between stages line up.",
    "In a head, the elapsed time gives way first, then the count; the name stays whole.",
  ],
  notes: [
    "Give a stage and its jobs the same kind of <code>data-status</code>; the edge leaving a stage follows its status: solid once it is done, dashed while it runs, grey before.",
    "Keep every stage's jobs a fixed height: the bus lines between stages assume it.",
    "Use <code>data-status=\"waiting\"</code> for something that needs a person, and say what in the result text.",
    "Set <code>data-chart-theme</code> on a shared ancestor to switch a flow and its checklist together.",
  ],
  related: [
    "machine",
    "timeline",
    "schedule",
    "feedback",
  ],
};
