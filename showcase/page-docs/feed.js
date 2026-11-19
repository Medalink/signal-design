/** The doc sections of lib-feed.html: see page-docs/index.js. */
export default {
  when: [
    "A scroller of messages or events that grows at the bottom: the newest row stays in view while the reader is there.",
    "Day breaks that stay readable while the rows scroll under them: <code>sd-feed-day</code> sticks to the top.",
    "A reader who scrolled up needs a way back: the jump bar offers it and says when new rows arrived.",
    "A reader returns after hours away: the catch-up card lists what they missed above the first unread row.",
  ],
  notWhen: [
    "A short list that never scrolls: plain rows do that (see People).",
    "Keyboard navigation through a feed that updates live: the live feed script does that (see Live feed).",
  ],
  usage: "&lt;div id=\"feed\" role=\"log\" aria-label=\"Messages\" tabindex=\"0\" data-sd-follow style=\"--sd-feed-bg: var(--sd-surface)\"&gt;\n  &lt;div class=\"sd-divider sd-feed-day\"&gt;Today&lt;/div&gt;\n  &lt;article class=\"sd-message\"&gt;…&lt;/article&gt;\n  &lt;div class=\"sd-event\"&gt;&lt;svg&gt;…&lt;/svg&gt;&lt;span&gt;&lt;b&gt;Kai&lt;/b&gt; left&lt;time&gt;16:40&lt;/time&gt;&lt;/span&gt;&lt;/div&gt;\n&lt;/div&gt;\n&lt;div class=\"sd-feed-jump\" hidden&gt;\n  &lt;span&gt;Viewing older messages&lt;/span&gt;\n  &lt;button class=\"sd-btn sd-btn-sm sd-btn-ghost\"&gt;Jump to present&lt;/button&gt;\n&lt;/div&gt;",
  api: [
    { name: "data-sd-follow", type: "attribute", desc: "On the scroller. Keeps the newest row in view while the reader is at the bottom and runs the jump bar that follows it; <code>init()</code> wires it." },
    { name: "sd-feed-day", type: "class", desc: "A day divider, used with <code>sd-divider</code>. It sticks to the top of the scroller." },
    { name: "--sd-feed-bg", type: "token", def: "--sd-surface", desc: "The pane color the sticky day line paints, so it covers rows scrolling under it." },
    { name: "sd-event", type: "class", desc: "A line for something that happened, such as a join or leave: an icon in the time column, then a name and a <code>time</code>." },
    { name: "sd-feed-jump", type: "class", desc: "The bar after the scroller. Keep <code>hidden</code> while at the bottom; it gets <code>data-new</code> when it appears." },
    { name: "role=\"log\"", type: "ARIA", desc: "On the scroller, with an <code>aria-label</code>, so new rows are announced politely." },
    { name: "sd-catchup", type: "class", desc: "The \"While you were away\" card, with <code>-head</code>, <code>-title</code>, <code>-stat</code>, <code>-list</code>, <code>-mark</code>, <code>-text</code>, <code>-count</code> and <code>-actions</code>." },
    { name: "sd-catchup-mark", type: "class", desc: "Leads each line: <code>@</code> for a mention, an icon for polls, the emoji of the most reacted message." },
    { name: "sd-marker", type: "class", desc: "The new-messages line under the card, with <code>data-tone=\"pending\"</code>." },
  ],
  keyboard: [
    ["Tab", "Focuses the scroller (it needs <code>tabindex=\"0\"</code>), then the jump bar's button once the bar is visible."],
    ["↑ / ↓ / Page Up / Page Down / Home / End", "Scroll the focused scroller natively; the follow script stops its ride to the bottom when a key is pressed."],
    ["Enter / Space", "On the jump bar's button, scrolls down to the newest row."],
  ],
  a11y: [
    "Give the scroller <code>role=\"log\"</code>, an <code>aria-label</code> and <code>tabindex=\"0\"</code>, so a keyboard user can focus and scroll it.",
    "The jump bar's button is a real button with visible text; keep its label specific, such as \"Jump to present\".",
    "The catch-up card is a <code>section</code> with an <code>aria-label</code>; give the <code>sd-catchup-mark</code> glyphs <code>aria-hidden</code> where they only repeat the text, and an <code>aria-label</code> on the count (\"9 reactions\").",
    "Name an icon in an event's time column with the text beside it, or mark it <code>aria-hidden</code>.",
  ],
  motion: [
    "The jump bar appears with a 140ms rise when it gets <code>data-new</code>; a new day line or event fades up in 160ms.",
    "Jumping down runs 200ms with an ease-out curve and stops the moment the reader scrolls, touches or presses a key.",
    "<code>prefers-reduced-motion</code> makes the jump land at once and cuts the CSS animations to 0.01ms.",
  ],
  responsive: [
    "The bar shows when the reader is more than 120px, or a fifth of the scroller's height if larger, above the bottom; within 8px counts as at the bottom.",
    "The feed fills the height its container gives it, so give the container a height or a flex layout.",
  ],
  notes: [
    "<code>data-sd-follow</code> also holds the bottom while images load and while a growing composer shrinks the scroller. The demo above wires a smaller scroll listener by hand to show the pieces; in an app, use the attribute.",
    "Put the jump bar as the next sibling of the scroller: the script finds it there.",
    "Set <code>--sd-feed-bg</code> to the pane color, or the day line shows the wrong fill over the rows.",
    "<code>init()</code> wires every <code>data-sd-follow</code> feed on the page; call it again for a feed added later.",
  ],
  related: [
    "messages",
    "composer",
    "live-feed",
    "people",
  ],
};
