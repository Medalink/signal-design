/** The doc sections of lib-choices.html: see page-docs/index.js. */
export default {
  when: [
    "One choice from a few options that each need a title and a sentence: option cards, with a preview when the look matters.",
    "A short switch between views or ranges, such as hour, day, and week: a segmented control.",
    "A segmented control in a narrow container: <code>sd-seg-wrap</code> lets the items flow onto more rows.",
  ],
  notWhen: [
    "A long list of options: a native <code>select</code> or a combobox does that (see Combobox and tags).",
    "A yes or no setting: a switch does that (see Fields).",
    "Moving between pages: a link or tabs read as navigation (see Bars and tabs).",
  ],
  usage: "&lt;div class=\"sd-field\"&gt;\n  &lt;span class=\"sd-field-label\" id=\"theme-label\"&gt;Theme&lt;/span&gt;\n  &lt;div class=\"sd-options\" role=\"radiogroup\" aria-labelledby=\"theme-label\"&gt;\n    &lt;label class=\"sd-option\"&gt;\n      &lt;input type=\"radio\" name=\"theme\" value=\"ink\" checked&gt;\n      &lt;span class=\"sd-option-title\"&gt;Ink&lt;/span&gt;\n      &lt;span class=\"sd-option-desc\"&gt;Near-black. The default.&lt;/span&gt;\n    &lt;/label&gt;\n    &lt;label class=\"sd-option\"&gt;\n      &lt;input type=\"radio\" name=\"theme\" value=\"paper\"&gt;\n      &lt;span class=\"sd-option-title\"&gt;Paper&lt;/span&gt;\n      &lt;span class=\"sd-option-desc\"&gt;White, for bright rooms.&lt;/span&gt;\n    &lt;/label&gt;\n  &lt;/div&gt;\n&lt;/div&gt;\n&lt;div class=\"sd-seg sd-seg-wrap\" data-sd-seg aria-label=\"Range\"&gt;\n  &lt;button type=\"button\" aria-pressed=\"false\"&gt;hour&lt;/button&gt;\n  &lt;button type=\"button\" aria-pressed=\"true\"&gt;day&lt;/button&gt;\n&lt;/div&gt;",
  api: [
    { name: "sd-options", type: "class", desc: "A wrapping grid of option cards. <code>--min</code> sets the narrowest column (default 12rem)." },
    { name: "sd-option", type: "class", desc: "One card: a <code>label</code> around a radio or checkbox, or a button. Selected by <code>:checked</code>, <code>aria-pressed</code>, or <code>aria-checked</code>." },
    { name: "sd-option-preview", type: "class", desc: "A 16:9 picture across the top of the card. Mark it <code>aria-hidden</code>." },
    { name: "sd-option-title, sd-option-desc", type: "class", desc: "The card's title and its one-sentence description." },
    { name: "sd-seg", type: "class", desc: "A segmented control that fills its container. <code>sd-seg-inline</code> sizes it to its content, and <code>sd-seg-sm</code> makes it smaller." },
    { name: "sd-seg-wrap", type: "class", desc: "Lets the items wrap onto more rows in a narrow container; each row fills the width. Without it the items stay on one line." },
    { name: "data-sd-seg", type: "attribute", desc: "Keeps one child button pressed and fires <code>change</code> on the group. Leave it out where a framework renders <code>aria-pressed</code>." },
    { name: "aria-pressed", type: "ARIA", desc: "On a button in <code>sd-seg</code> or <code>sd-option</code>: the chosen one is <code>true</code>. <code>aria-checked</code> and <code>aria-selected</code> style it too." },
    { name: "change", type: "event", desc: "Fires on the <code>data-sd-seg</code> group with <code>detail.value</code>: the button's <code>value</code>, or its text." },
    { name: "disabled", type: "attribute", desc: "On an option, or <code>aria-disabled=\"true\"</code>: the card dims to half and shows a not-allowed cursor." },
  ],
  keyboard: [
    ["Arrow keys", "Move the choice in a radio group of option cards or a radio segmented control, with no JS."],
    ["Tab", "Moves between buttons in a <code>data-sd-seg</code> group."],
    ["Enter / Space", "Presses the focused button, which becomes the chosen one."],
  ],
  a11y: [
    "Name the group: <code>role=\"radiogroup\"</code> or <code>role=\"group\"</code> with <code>aria-labelledby</code> pointing at a visible label, or an <code>aria-label</code> on a segmented control.",
    "The chosen state is carried by <code>:checked</code>, <code>aria-pressed</code>, or <code>aria-checked</code>, so a screen reader hears what the style shows.",
    "A selected option is marked by a 2px accent edge and a corner square, and its fill steps up, so it does not rely on color alone; the description keeps 4.5:1 on that fill.",
    "A preview is decoration: set <code>aria-hidden=\"true\"</code> on it and put the meaning in the title and description.",
    "Keyboard focus draws a 1px foreground outline on a radio card and on a radio segment.",
  ],
  motion: [
    "Option borders, fills, and the selected edge change over 120ms.",
    "Segment fills and colors change over 120ms.",
    "prefers-reduced-motion shortens the transitions to 0.01ms; the selected state stays visible.",
  ],
  responsive: [
    "<code>sd-options</code> uses <code>auto-fill</code> columns of <code>min(100%, var(--min))</code>, so cards stack to one column in a narrow container.",
    "<code>sd-seg</code> items stay on one line and overflow a narrow container; add <code>sd-seg-wrap</code> there.",
  ],
  notes: [
    "Pick option cards when each choice needs a sentence or a preview, and a segmented control when the labels are one word.",
    "Use radios inside labels for no-JS selection; use buttons with <code>aria-pressed</code> and <code>data-sd-seg</code> when you want a <code>change</code> event.",
    "Where React, Vue, or Svelte renders <code>aria-pressed</code>, drop <code>data-sd-seg</code> so there is one writer (React has <code>SegmentedControl</code> and <code>RadioGroup</code>).",
    "The selected option cards use accent, one of the three selection markers; the title and text stay grey.",
  ],
  related: [
    "fields",
    "buttons",
    "pickers",
    "nav-bars",
  ],
};
