import { useState } from "react";
import { createRoot } from "react-dom/client";
import { mountBar } from "./viewport.js";
import { cycleTheme, hotkeys } from "../src/js/index.js";
import { Demo } from "./react-demo.jsx";
import { HoverCard, Manuscript, Mark, MenuItem, StatusSegment, Toolbar, ToolbarButton, ToolbarGroup, ToolbarMore, ToolbarSeparator } from "../src/react/index.js";

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
<footer className="sd-statusbar">
  <StatusSegment>1,284 words</StatusSegment>
  <StatusSegment pressed={focus} onClick={toggleFocus}>Focus</StatusSegment>
  <StatusSegment end tone="success">Saved</StatusSegment>
</footer>`}
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
        <footer className="sd-statusbar">
          <StatusSegment>1,284 words</StatusSegment>
          <StatusSegment>Chapter 3 of 12</StatusSegment>
          <StatusSegment pressed={focus} onClick={() => setFocus(!focus)}>
            Focus mode
          </StatusSegment>
          <StatusSegment end tone="success">
            Saved
          </StatusSegment>
        </footer>
      </div>
    </Demo>
  );
}

function Marks() {
  const [open, setOpen] = useState("c1");
  return (
    <Demo
      id="react-editor-marks"
      title="Marks and hover card"
      code={`<Mark kind="comment" active={open === "c1"} onClick={() => setOpen("c1")}>the harbour</Mark>
<Mark kind="comment" resolved>settled</Mark>
<Mark kind="insert">added words</Mark>
<Mark kind="delete">removed words</Mark>
<Mark kind="mention" who="var(--sd-success)" href="/people/jane">@Jane</Mark>
<HoverCard content={<><p className="sd-hovercard-title">Lisbon</p>…</>}>
  <Mark kind="entity" tabIndex={0}>Lisbon</Mark>
</HoverCard>`}
    >
      <Manuscript measure="44rem" aria-label="Marks">
        <p>
          The{" "}
          <Mark kind="comment" active={open === "c1"} onClick={() => setOpen("c1")}>
            harbour woke before the town did
          </Mark>
          . <Mark kind="comment" active={open === "c2"} onClick={() => setOpen("c2")}>Boats knocked against the quay</Mark> in the half dark, and the{" "}
          <Mark kind="comment" resolved>
            gull
          </Mark>{" "}
          tried the same two notes again.
        </p>
        <p>
          She wrote it <Mark kind="delete">forty times</Mark> <Mark kind="insert">once more</Mark> and sent it to{" "}
          <Mark kind="mention" who="var(--sd-success)" href="#marks">
            @Jane
          </Mark>{" "}
          in{" "}
          <HoverCard
            content={
              <>
                <p className="sd-hovercard-title">Lisbon</p>
                <p className="sd-hovercard-meta">Place · 4 mentions</p>
                <p>Capital of Portugal. First named in chapter 2, where the ferry leaves for the south shore.</p>
              </>
            }
          >
            <Mark kind="entity" tabIndex={0}>
              Lisbon
            </Mark>
          </HoverCard>
          .
        </p>
      </Manuscript>
      <p className="sd-subtle text-sm" data-open-comment>
        open comment: {open}
      </p>
    </Demo>
  );
}

function App() {
  return (
    <>
      <EditorChrome />
      <Marks />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
