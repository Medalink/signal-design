/** The doc sections of lib-avatars.html: see page-docs/index.js. */
export default {
  when: [
    "A person, group, or workspace needs a face in a list, header, or message: a square picture or initials, in five sizes.",
    "Presence matters beside a name: <code>data-status</code> adds a square on the corner for online, away, busy, or offline.",
    "Several people share one item: a stack overlaps up to a few avatars, and a grid shows a group chat's four members as one square.",
    "A number needs to sit on something: a count badge pinned to the corner shows unread items on an avatar or an icon button.",
    "A state needs a word: an inline status pairs a square with its label, and an fps counter shows the frame rate.",
  ],
  notWhen: [
    "A fact about an item rather than a person: a badge states it (see Badges).",
    "A person's color in a conversation: the name takes <code>--who</code> in a message (see Messages).",
  ],
  usage: "&lt;span class=\"sd-avatar sd-avatar-md\" data-tone=\"extra\" data-status=\"online\"&gt;AL&lt;/span&gt;\n\n&lt;span class=\"sd-avatar-stack\"&gt;\n  &lt;span class=\"sd-avatar\" data-tone=\"success\"&gt;JD&lt;/span&gt;\n  &lt;span class=\"sd-avatar\" data-tone=\"warning\"&gt;SK&lt;/span&gt;\n&lt;/span&gt;\n\n&lt;span class=\"sd-avatar-grid sd-avatar-md\" role=\"img\" aria-label=\"Maya, Kai, Leo\"&gt;\n  &lt;span class=\"sd-avatar\" data-tone=\"extra\"&gt;M&lt;/span&gt;\n  &lt;span class=\"sd-avatar\" data-tone=\"success\"&gt;K&lt;/span&gt;\n  &lt;span class=\"sd-avatar\" data-tone=\"warning\"&gt;L&lt;/span&gt;\n&lt;/span&gt;\n\n&lt;span class=\"sd-status\" data-tone=\"success\"&gt;live&lt;/span&gt;\n&lt;span class=\"sd-count\" data-tone=\"danger\"&gt;6&lt;/span&gt;",
  api: [
    { name: "sd-avatar", type: "class", def: "24px", desc: "A square of initials or an <code>img</code>; <code>data-tone</code> colors the fill." },
    { name: "sd-avatar-sm, -md, -lg, -xl", type: "class", desc: "Sizes of 22, 28, 34, and 48px; the unclassed avatar is 24px." },
    { name: "--sd-avatar-size", type: "token", def: "24px", desc: "Sets any size; the initials and the presence square grow with it." },
    { name: "data-status", type: "attribute", desc: "<code>online</code>, <code>away</code>, <code>afk</code>, <code>busy</code>, or <code>offline</code>: a square on the avatar's corner." },
    { name: "--sd-ring", type: "token", def: "page canvas", desc: "The color of the cut-out around the presence square, a corner count, and a stack's gaps." },
    { name: "sd-avatar-stack", type: "class", desc: "Overlaps avatars by 2px, each ringed in <code>--sd-ring</code>." },
    { name: "sd-avatar-grid", type: "class", desc: "Four members two by two in one square; letters show from 40px up, tones only below." },
    { name: "sd-status", type: "class", desc: "An inline square and word; <code>data-tone</code> colors the square." },
    { name: "sd-count", type: "class", desc: "A plain number beside a label; <code>data-tone</code> colors it." },
    { name: "sd-badge-count", type: "class", desc: "A solid number; <code>data-corner</code> pins it to the corner of a positioned parent." },
    { name: "sd-fps, data-sd-fps", type: "attribute", desc: "A frame rate counter the JS fills in the <code>b</code>, with a tone by rate." },
    { name: "Avatar, AvatarStack, AvatarGrid, CountBadge", type: "function", desc: "React parts for the same classes; <code>Avatar</code> takes <code>name</code>, <code>src</code>, <code>size</code>, <code>tone</code>, and <code>status</code>." },
  ],
  a11y: [
    "An image avatar needs its name: <code>Avatar</code> uses <code>name</code>; in markup keep the initials, or set <code>alt</code> on the <code>img</code>.",
    "Name a whole <code>sd-avatar-grid</code> with <code>role=\"img\"</code> and an <code>aria-label</code> listing the members, since small grids show tones only.",
    "Presence is drawn, not spoken: say it in nearby text, or give the row an accessible name that includes it.",
    "A corner count needs the control's <code>aria-label</code> to include the number, such as \"Inbox, 3 unread\".",
    "Presence squares differ by fill: success, pending, danger, a hollow square for offline, so offline does not rely on color.",
    "The fps counter sets its own <code>aria-label</code> each time it updates.",
  ],
  motion: [
    "Avatars, presence squares, and counts have no transitions.",
    "The fps counter samples one second, then rests three seconds before the next sample; it does not run a loop while idle.",
    "A count badge takes part in the hover shimmer of its parent control, which plays once per hover; prefers-reduced-motion stops it.",
  ],
  responsive: [
    "Avatar sizes are fixed pixels, not fluid; set <code>--sd-avatar-size</code> for another size.",
    "The presence square scales with the avatar, 8px up to an 80px avatar and 20px at most.",
    "A group avatar fits the size of one avatar, so it sits in a list row at any width.",
  ],
  notes: [
    "Tone an avatar only when the tone means something, such as a person's color; an untoned avatar is grey.",
    "On a panel of your own, set <code>--sd-ring</code> to its background so presence squares, corner counts, and stacks cut out cleanly.",
    "Up to four members go in a grid; a fifth person is a <code>+N</code> cell in place of the fourth.",
    "Use <code>sd-badge-count</code> over an icon or avatar, and <code>sd-count</code> beside a label.",
  ],
  related: [
    "badges",
    "people",
    "messages",
    "feedback",
  ],
};
