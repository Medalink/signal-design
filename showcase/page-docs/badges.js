/** The doc sections of lib-badges.html: see page-docs/index.js. */
export default {
  when: [
    "A fact about an item that should show beside its name: a badge states risk, cost, or a version in capitals.",
    "A marker with no words: a dot flags irreversible or costly items in a dense list, hollow when there is nothing to flag, dashed when unproven.",
    "A filter or token the user can set or remove: a chip, pressed when active, with a remove button when it can be taken off.",
    "A counter that also acts: a pill such as \"21 new above\" jumps to what it counts.",
  ],
  notWhen: [
    "An unread or mention count on an icon or avatar: a count badge pins to the corner (see Avatars).",
    "A state shown with a word in running text: an inline status pairs a square with the word (see Avatars).",
    "Decoration: color is reserved for status, so a badge without a meaning stays grey.",
  ],
  usage: "&lt;span class=\"sd-dot\" data-tone=\"danger\"&gt;&lt;/span&gt;\n&lt;span class=\"sd-badge\" data-tone=\"danger\"&gt;Risk&lt;/span&gt;\n&lt;span class=\"sd-badge sd-badge-solid\" data-tone=\"success\"&gt;Done&lt;/span&gt;\n&lt;span class=\"sd-chip\"&gt;&lt;b&gt;project&lt;/b&gt; Website &lt;button type=\"button\" aria-label=\"Remove project\"&gt;×&lt;/button&gt;&lt;/span&gt;\n&lt;button class=\"sd-chip\" aria-pressed=\"true\"&gt;high risk&lt;/button&gt;\n&lt;button class=\"sd-pill\"&gt;↑ &lt;b&gt;21&lt;/b&gt; new above&lt;/button&gt;",
  examples: [
    {
      title: "Dot shapes",
      html: "<span class=\"sd-dot\" data-tone=\"danger\"></span> irreversible\n<span class=\"sd-dot\" data-tone=\"pending\" data-shape=\"dashed\"></span> unproven\n<span class=\"sd-dot\" data-shape=\"hollow\"></span> routine",
    },
  ],
  api: [
    { name: "sd-dot", type: "class", desc: "A 6px square marker; <code>sd-dot-lg</code> makes it 8px." },
    { name: "data-shape", type: "attribute", def: "solid", desc: "<code>hollow</code> is nothing to flag, <code>dashed</code> is unproven, on a dot." },
    { name: "sd-badge", type: "class", desc: "A small outlined label in capitals, colored by its tone." },
    { name: "sd-badge-solid", type: "class", desc: "Fills the badge with its tone, with canvas-colored text." },
    { name: "sd-chip", type: "class", desc: "A filled token for a filter or value; a <code>b</code> inside is the faint key." },
    { name: "sd-pill", type: "class", desc: "A filled counter tag in capitals; a <code>button</code> hovers lighter." },
    { name: "data-tone", type: "attribute", def: "unset", desc: "<code>accent</code>, <code>success</code>, <code>danger</code>, <code>warning</code>, <code>pending</code>, <code>extra</code>, or <code>neutral</code>; unset is grey." },
    { name: "aria-pressed", type: "ARIA", desc: "On a <code>button.sd-chip</code>: true draws the chip's edge in the foreground color." },
    { name: "aria-checked", type: "ARIA", desc: "Draws a chip's edge the same way when the chip has a checkbox role." },
    { name: "Badge", type: "function", desc: "React part with <code>tone</code> and <code>solid</code> props, rendering <code>sd-badge</code>." },
  ],
  a11y: [
    "Do not rely on color: a pending dot is ringed, a pending badge has a dashed edge, and every badge carries a word.",
    "A dot with no text next to it needs a label: put the meaning in nearby text or an <code>aria-label</code> on a wrapper.",
    "The remove button inside a chip is a real <code>button</code>; give it an <code>aria-label</code> that names the value, since its glyph is only a multiplication sign.",
    "A toggle chip is a <code>button</code> with <code>aria-pressed</code>; the CSS keys on it, so set it from your own code.",
  ],
  motion: [
    "Badges, dots, and non-interactive chips have no transitions: they are static marks.",
    "A <code>button.sd-chip</code> or <code>button.sd-pill</code> plays the hover shimmer once per hover; <code>button.sd-pill</code> also lightens its fill on hover.",
    "prefers-reduced-motion stops the shimmer; the pill's hover fill and the pressed chip's edge still show.",
  ],
  responsive: [
    "Badges, chips, and pills do not wrap their own text: they are <code>white-space: nowrap</code>, so put them in a wrapping row such as <code>sd-cluster</code>.",
    "A pill is capped at 100% of its container width.",
    "The chip's remove button has a 24px press box around a 16px glyph, so it holds the touch target size without making the chip taller.",
  ],
  notes: [
    "Choose by weight: a dot for a bare flag, a badge for a short fact, a chip for something the user sets, a pill for a counter that acts.",
    "Set meaning with <code>data-tone</code>, never a hue class. Leave it off when the label has no status.",
    "A badge reads capitals from CSS, so write the text in sentence case.",
    "For a count over an icon or avatar use <code>sd-badge-count</code> with <code>data-corner</code>, not a badge.",
  ],
  related: [
    "avatars",
    "feedback",
    "pickers",
  ],
};
