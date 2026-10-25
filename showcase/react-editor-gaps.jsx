import { useState } from "react";
import { Demo } from "./react-demo.jsx";
import { ICON_NAMES } from "../src/js/icons.js";
import { GutterBlock, Icon, IconButton, Manuscript, Toolbar, ToolbarButton, ToolbarGroup, ToolbarMore, ToolbarSeparator, WeightedBar } from "../src/react/index.js";

const WORDS = [
  { weight: 12000, state: "drafted", label: "Part one · 12,000 words" },
  { weight: 18000, state: "drafted", label: "Part two · 18,000 words" },
  { weight: 11200, state: "current", label: "Chapter 4 · 11,200 words so far" },
  { weight: 18800, state: "planned", label: "Part four · 18,800 words planned" },
];

function Icons() {
  const [marks, setMarks] = useState({ bold: false, italic: true, underline: false });
  const toggle = (name) => (pressed) => setMarks((current) => ({ ...current, [name]: pressed }));
  return (
    <Demo
      id="react-editor-icons"
      title="Icons"
      code={`<Toolbar label="Formatting">
  <ToolbarButton label="Undo"><Icon name="undo" /></ToolbarButton>
  <ToolbarButton label="Bold" pressed={bold} onPressedChange={setBold}><Icon name="bold" /></ToolbarButton>
  <ToolbarMore icon={<Icon name="more" />}>…</ToolbarMore>
</Toolbar>
<IconButton label="Delete" size="sm"><Icon name="delete" /></IconButton>
<span className="sd-icon-text"><Icon name="warning" /> Not saved</span>`}
    >
      <Toolbar label="Icon toolbar">
        <ToolbarGroup label="History">
          <ToolbarButton label="Undo">
            <Icon name="undo" />
          </ToolbarButton>
          <ToolbarButton label="Redo">
            <Icon name="redo" />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup label="Text">
          <ToolbarButton label="Bold" pressed={marks.bold} onPressedChange={toggle("bold")}>
            <Icon name="bold" />
          </ToolbarButton>
          <ToolbarButton label="Italic" pressed={marks.italic} onPressedChange={toggle("italic")}>
            <Icon name="italic" />
          </ToolbarButton>
          <ToolbarButton label="Underline" pressed={marks.underline} onPressedChange={toggle("underline")}>
            <Icon name="underline" />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough">
            <Icon name="strike" />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarButton label="Comment">
          <Icon name="comment" />
        </ToolbarButton>
        <ToolbarButton label="Assist">
          <Icon name="sparkle" />
        </ToolbarButton>
        <ToolbarMore icon={<Icon name="more" />} label="More formatting" />
      </Toolbar>
      <div className="flex flex-wrap items-center gap-4">
        <IconButton label="Rename" size="sm" variant="ghost">
          <Icon name="edit" />
        </IconButton>
        <IconButton label="Delete" size="sm" variant="ghost">
          <Icon name="delete" />
        </IconButton>
        <span className="sd-icon-text text-sm">
          <Icon name="warning" /> Not saved
        </span>
        <span className="sd-icon-text">
          <Icon name="sync" /> Syncing
        </span>
      </div>
      <ul className="demo-icons" aria-label="Icon set">
        {ICON_NAMES.map((name) => (
          <li key={name}>
            <Icon name={name} />
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </Demo>
  );
}

function Weighted() {
  const [goal, setGoal] = useState(80000);
  return (
    <Demo
      id="react-editor-weighted"
      title="Weighted bar"
      code={`<WeightedBar
  label="41,200 of 80,000 words drafted, chapter 4 in progress, 18,800 planned"
  goal={80000}
  segments={[
    { weight: 12000, state: "drafted", label: "Part one" },
    { weight: 11200, state: "current", label: "Chapter 4" },
    { weight: 18800, state: "planned" },
  ]}
/>`}
    >
      <div className="grid gap-2">
        <div className="flex justify-between text-sm">
          <span>Manuscript</span>
          <span className="sd-subtle">goal {goal.toLocaleString("en-US")} words</span>
        </div>
        <WeightedBar label={`41,200 of ${goal.toLocaleString("en-US")} words drafted, chapter 4 in progress, 18,800 planned`} goal={goal} segments={WORDS} />
        <div className="sd-actions">
          <button className="sd-btn sd-btn-sm" type="button" onClick={() => setGoal(goal === 80000 ? 60000 : 80000)}>
            Goal {goal === 80000 ? "60,000" : "80,000"}
          </button>
        </div>
      </div>
    </Demo>
  );
}

function Gutter() {
  const [open, setOpen] = useState("a");
  const pick = (id) => () => setOpen(id);
  return (
    <Demo
      id="react-editor-gutter"
      title="Gutter markers"
      code={`<Manuscript face="reading">
  <GutterBlock as="p" marker={{ label: "2 comments", count: 2, active: open === "a", onClick: () => setOpen("a") }}>
    The harbour woke before the town did.
  </GutterBlock>
  <GutterBlock as="p" marker={{ kind: "suggestion", label: "1 suggestion", count: 1 }}>…</GutterBlock>
  <GutterBlock as="p" side="start" marker={{ label: "Resolved", count: 1, resolved: true }}>…</GutterBlock>
</Manuscript>`}
    >
      <Manuscript measure="40rem" face="reading" aria-label="Gutter markers">
        <GutterBlock as="p" marker={{ label: "2 comments", count: 2, active: open === "a", onClick: pick("a") }}>
          The harbour woke before the town did. Boats knocked against the quay in the half dark, and somewhere above the roofs a gull tried the same two notes again.
        </GutterBlock>
        <GutterBlock as="p" marker={{ kind: "suggestion", label: "1 suggestion", count: 1, active: open === "b", onClick: pick("b") }}>
          She had written the first line forty times and kept none of them. This one stayed because it was plain.
        </GutterBlock>
        <GutterBlock as="p" marker={{ label: "1 resolved comment", count: 1, resolved: true, active: open === "c", onClick: pick("c") }}>
          By noon the fog had lifted from the water and left the far shore standing there as if it had been moved in the night.
        </GutterBlock>
        <GutterBlock as="p" side="start" marker={{ label: "3 comments", count: 3, active: open === "d", onClick: pick("d") }}>
          A marker can sit in the leading margin instead, for a right-to-left page or a left-hand rail.
        </GutterBlock>
      </Manuscript>
      <p className="sd-subtle text-sm" data-open-thread>
        open thread: {open}
      </p>
    </Demo>
  );
}

export function EditorGaps() {
  return (
    <>
      <Icons />
      <Weighted />
      <Gutter />
    </>
  );
}
