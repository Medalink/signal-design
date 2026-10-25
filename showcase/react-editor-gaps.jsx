import { useState } from "react";
import { Demo } from "./react-demo.jsx";
import { WeightedBar } from "../src/react/index.js";

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

export function EditorGaps() {
  return (
    <>
      <Weighted />
    </>
  );
}
