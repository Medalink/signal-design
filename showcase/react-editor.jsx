import { useState } from "react";
import { createRoot } from "react-dom/client";
import { mountBar } from "./viewport.js";
import { cycleTheme, hotkeys } from "../src/js/index.js";
import { Demo } from "./react-demo.jsx";
import { Manuscript, MenuItem, Statusbar, StatusSegment, Toolbar, ToolbarButton, ToolbarGroup, ToolbarMore, ToolbarSeparator } from "../src/react/index.js";

mountBar();
hotkeys({ "shift+t": cycleTheme });

function EditorChrome() {
  const [marks, setMarks] = useState({ bold: false, italic: true, underline: false });
  const [block, setBlock] = useState("paragraph");
  const [focus, setFocus] = useState(false);
  const toggle = (name) => (pressed) => setMarks((current) => ({ ...current, [name]: pressed }));
  return (
    <Demo
      id="react-editor-chrome"
      title="Toolbar, manuscript and status bar"
      code={`<Toolbar label="Formatting">
  <ToolbarGroup label="Text">
    <ToolbarButton label="Bold" pressed={bold} onPressedChange={setBold}>B</ToolbarButton>
    <ToolbarButton label="Italic" pressed={italic} onPressedChange={setItalic}>I</ToolbarButton>
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarButton pressed={block === "h1"} onPressedChange={() => setBlock("h1")}>Heading</ToolbarButton>
  <ToolbarMore><MenuItem>Clear formatting</MenuItem></ToolbarMore>
</Toolbar>
<Manuscript measure="38rem"><h1>Chapter one</h1><p>…</p></Manuscript>
<Statusbar>
  <StatusSegment>1,284 words</StatusSegment>
  <StatusSegment pressed={focus} onClick={toggleFocus}>Focus</StatusSegment>
  <StatusSegment end tone="success">Saved</StatusSegment>
</Statusbar>`}
    >
      <div className="grid h-[28rem] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border border-line">
        <Toolbar label="Formatting">
          <ToolbarGroup label="Text">
            <ToolbarButton label="Bold" pressed={marks.bold} onPressedChange={toggle("bold")}>
              B
            </ToolbarButton>
            <ToolbarButton label="Italic" pressed={marks.italic} onPressedChange={toggle("italic")}>
              I
            </ToolbarButton>
            <ToolbarButton label="Underline" pressed={marks.underline} onPressedChange={toggle("underline")}>
              U
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup label="Block">
            <ToolbarButton pressed={block === "paragraph"} onPressedChange={() => setBlock("paragraph")}>
              Text
            </ToolbarButton>
            <ToolbarButton pressed={block === "h1"} onPressedChange={() => setBlock("h1")}>
              Heading 1
            </ToolbarButton>
            <ToolbarButton pressed={block === "h2"} onPressedChange={() => setBlock("h2")}>
              Heading 2
            </ToolbarButton>
            <ToolbarButton pressed={block === "quote"} onPressedChange={() => setBlock("quote")}>
              Quote
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup label="History">
            <ToolbarButton label="Undo">↶</ToolbarButton>
            <ToolbarButton label="Redo" disabled>
              ↷
            </ToolbarButton>
          </ToolbarGroup>
          <ToolbarMore label="More formatting">
            <MenuItem>Clear formatting</MenuItem>
            <MenuItem>Insert footnote</MenuItem>
          </ToolbarMore>
        </Toolbar>
        <Manuscript measure="38rem" tabIndex={0} aria-label="Chapter one">
          <h1>Chapter one</h1>
          <p>The harbour woke before the town did. Boats knocked against the quay in the half dark, and somewhere above the roofs a gull tried the same two notes again.</p>
          <p>She had written the first line forty times and kept none of them. This one stayed because it was plain: nothing in it asked to be admired.</p>
          <blockquote>Every draft is a letter to someone who has not arrived yet.</blockquote>
          <h2>The long way round</h2>
          <p>By noon the fog had lifted from the water and left the far shore standing there as if it had been moved in the night.</p>
        </Manuscript>
        <Statusbar>
          <StatusSegment>1,284 words</StatusSegment>
          <StatusSegment>Chapter 3 of 12</StatusSegment>
          <StatusSegment pressed={focus} onClick={() => setFocus(!focus)}>
            Focus mode
          </StatusSegment>
          <StatusSegment end tone="success">
            Saved
          </StatusSegment>
        </Statusbar>
      </div>
    </Demo>
  );
}

function App() {
  return <EditorChrome />;
}

createRoot(document.getElementById("root")).render(<App />);
