/** The doc sections of lib-level.html: see page-docs/index.js. */
export default {
  when: [
    "A live signal the user watches while it changes: a microphone input, a call's speaking level, a recording meter.",
    "A reading that holds still between updates: the bars change only when the value crosses one, so a steady level does not move.",
  ],
  notWhen: [
    "Progress toward a finish: a progress bar shows how far work has come (see Feedback).",
    "A history of values over time: a sparkline or chart shows the shape (see Charts).",
  ],
  usage: "&lt;span class=\"sd-level\" role=\"meter\" aria-label=\"Microphone level\"\n  aria-valuemin=\"0\" aria-valuemax=\"1\" aria-valuenow=\"0.6\" style=\"--level: 0.6\"&gt;\n  &lt;i&gt;&lt;/i&gt;&lt;i&gt;&lt;/i&gt;&lt;i&gt;&lt;/i&gt;&lt;i&gt;&lt;/i&gt;&lt;i&gt;&lt;/i&gt;\n&lt;/span&gt;",
  api: [
    { name: "sd-level", type: "class", desc: "The meter: 2 to 8 <code>i</code> bars of rising height, 3px wide with a 2px gap." },
    { name: "--level", type: "token", def: "0", desc: "The value from 0 to 1; a bar lights when the level reaches it." },
    { name: "--h", type: "token", def: "1.5cap", desc: "The meter's height; it follows the text's cap height unless set." },
    { name: "data-tone", type: "attribute", def: "foreground", desc: "Colors the lit bars with a status role such as <code>success</code> or <code>warning</code>." },
    { name: "role=\"meter\"", type: "ARIA", desc: "Names the part a gauge, with <code>aria-valuemin</code>, <code>aria-valuemax</code>, and <code>aria-valuenow</code>." },
    { name: "aria-valuenow", type: "ARIA", desc: "The same value as <code>--level</code>; your code writes both." },
  ],
  a11y: [
    "Use <code>role=\"meter\"</code> with <code>aria-valuemin</code>, <code>aria-valuemax</code>, and <code>aria-valuenow</code>, and an <code>aria-label</code> that names what is measured.",
    "The CSS draws the bars only; keep <code>aria-valuenow</code> in step with <code>--level</code>, or a screen reader reads a stale value.",
    "Do not announce every frame: update <code>aria-valuenow</code> but do not wrap the meter in a live region.",
    "Color is an add-on: lit and unlit bars differ by fill, and a tone adds meaning such as clipping, not the level itself.",
  ],
  motion: [
    "A bar fades in 120ms when the level crosses it, and holds still otherwise.",
    "prefers-reduced-motion cuts the fade to near zero; the lit bars still follow the value.",
  ],
  responsive: [
    "The meter is inline and sized by bars, not by its container: 3px bars, a 2px gap, and a height from <code>--h</code> or the text's cap height.",
    "Put it in a flex row beside a label so it stays on the text's line when the row wraps.",
  ],
  notes: [
    "Write <code>--level</code> and <code>aria-valuenow</code> from your own code, for example from the RMS of an <code>AnalyserNode</code> frame; there is no <code>data-sd-*</code> attribute for it.",
    "The number of <code>i</code> bars sets the resolution: 2 to 8 are supported; the CSS counts them itself.",
    "Use <code>data-tone=\"warning\"</code> for clipping and <code>success</code> for speaking; leave it off for a plain meter.",
  ],
  related: [
    "feedback",
    "stats",
    "charts",
  ],
};
