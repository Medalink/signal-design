import { useState } from "react";
import { Demo } from "./react-demo.jsx";
import { GutterBlock, Manuscript, WeightedBar } from "../src/react/index.js";

const WORDS = [
  { weight: 12000, state: "drafted", label: "Part one · 12,000 words" },
  { weight: 18000, state: "drafted", label: "Part two · 18,000 words" },
  { weight: 11200, state: "current", label: "Chapter 4 · 11,200 words so far" },
  { weight: 18800, state: "planned", label: "Part four · 18,800 words planned" },
];

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
      <Weighted />
      <Gutter />
    </>
  );
}
