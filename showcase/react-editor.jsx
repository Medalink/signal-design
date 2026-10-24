import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { mountBar } from "./viewport.js";
import { cycleTheme, hotkeys } from "../src/js/index.js";
import { Demo } from "./react-demo.jsx";
import { Button, Combobox, CommandPalette, Field, HoverCard, Manuscript, Mark, MenuItem, StatusSegment, Tree, TreeItem, Toolbar, ToolbarButton, ToolbarGroup, ToolbarMore, ToolbarSeparator } from "../src/react/index.js";

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

const OUTLINE = [
  { id: "part-1", label: "Part one", children: [{ id: "ch-1", label: "The harbour" }, { id: "ch-2", label: "The long way round" }, { id: "ch-3", label: "Forty drafts" }] },
  { id: "part-2", label: "Part two", children: [{ id: "ch-4", label: "Lisbon" }, { id: "ch-5", label: "The ferry" }] },
  { id: "notes", label: "Notes" },
];

/** Removes `id` from the outline and puts it before, after or inside `targetId`. */
function move(outline, { id, targetId, position }) {
  let moved;
  const without = (items) =>
    items.flatMap((item) => {
      if (item.id === id) {
        moved = item;
        return [];
      }
      return [item.children ? { ...item, children: without(item.children) } : item];
    });
  const rest = without(outline);
  const put = (items) =>
    items.flatMap((item) => {
      const next = item.children ? { ...item, children: put(item.children) } : item;
      if (item.id !== targetId) return [next];
      if (position === "before") return [moved, next];
      if (position === "after") return [next, moved];
      return [{ ...next, children: [...(next.children ?? []), moved] }];
    });
  return put(rest);
}

function Items({ items }) {
  return items.map((item) => (
    <TreeItem key={item.id} id={item.id} label={item.label} meta={item.children?.length}>
      {item.children && <Items items={item.children} />}
    </TreeItem>
  ));
}

function DocumentTree() {
  const [outline, setOutline] = useState(OUTLINE);
  const [selected, setSelected] = useState("ch-1");
  const [expanded, setExpanded] = useState(["part-1"]);
  const [last, setLast] = useState("none");
  return (
    <Demo
      id="react-editor-tree"
      title="Document tree"
      code={`<Tree label="Manuscript" selected={id} onSelectedChange={setId}
      expanded={open} onExpandedChange={setOpen} onMove={(move) => setOutline(reorder(outline, move))}>
  <TreeItem id="part-1" label="Part one" meta={3}>
    <TreeItem id="ch-1" label="The harbour" />
  </TreeItem>
  <TreeItem id="notes" label="Notes" />
</Tree>`}
    >
      <div className="grid max-w-[24rem] border border-line bg-surface py-2">
        <Tree
          label="Manuscript"
          selected={selected}
          onSelectedChange={setSelected}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onMove={(change) => {
            setOutline((current) => move(current, change));
            setLast(`${change.id} ${change.position} ${change.targetId}`);
          }}
        >
          <Items items={outline} />
        </Tree>
      </div>
      <p className="sd-subtle text-sm" data-tree-state>
        selected: {selected} · moved: {last}
      </p>
    </Demo>
  );
}

const PEOPLE = [
  { value: "jane", label: "Jane Okafor", keywords: "editor", group: "Editors" },
  { value: "sam", label: "Sam Reyes", keywords: "copy editor", group: "Editors" },
  { value: "ines", label: "Ines Duarte", keywords: "translator", group: "Contributors" },
  { value: "omar", label: "Omar Haddad", keywords: "illustrator", group: "Contributors" },
  { value: "wren", label: "Wren Calloway", keywords: "proofreader", group: "Contributors", disabled: true },
];

const DOCUMENTS = [
  { value: "ch-1", label: "The harbour" },
  { value: "ch-2", label: "The long way round" },
  { value: "ch-3", label: "Forty drafts" },
  { value: "ch-4", label: "Lisbon" },
  { value: "ch-5", label: "The ferry" },
  { value: "notes", label: "Notes" },
];

const COMMANDS = [
  { value: "open-ch-1", label: "The harbour", hint: "chapter", group: "Documents", keywords: "open go to" },
  { value: "open-ch-4", label: "Lisbon", hint: "chapter", group: "Documents", keywords: "open go to" },
  { value: "open-notes", label: "Notes", hint: "page", group: "Documents", href: "#choices" },
  { value: "focus", label: "Toggle focus mode", hint: "Ctrl .", group: "Actions" },
  { value: "export", label: "Export as PDF", group: "Actions", keywords: "download print" },
  { value: "delete", label: "Delete chapter", group: "Actions", disabled: true },
];

function Choices() {
  const [person, setPerson] = useState("sam");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState([]);
  const [searching, setSearching] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [ran, setRan] = useState("none");

  // Stands in for a request: the combobox only sees the items that come back.
  useEffect(() => {
    if (!query.trim()) {
      setFound([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      setFound(DOCUMENTS.filter((doc) => doc.label.toLowerCase().includes(query.trim().toLowerCase())));
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Demo
      id="react-editor-choices"
      title="Combobox and command palette"
      code={`<Field label="Editor">
  <Combobox items={people} value={person} onValueChange={setPerson} placeholder="Find a person" />
</Field>
<Field label="Jump to">
  <Combobox items={found} filter={false} busy={searching} inputValue={query} onInputValueChange={setQuery} />
</Field>
<CommandPalette items={commands} open={open} onOpenChange={setOpen} onSelect={(item) => run(item.value)} />`}
    >
      <div className="sd-form-row">
        <Field label="Editor">
          <Combobox items={PEOPLE} value={person} onValueChange={setPerson} placeholder="Find a person" listLabel="People" />
        </Field>
        <Field label="Jump to a chapter" hint="Results arrive after you stop typing.">
          <Combobox
            items={found}
            filter={false}
            busy={searching}
            inputValue={query}
            onInputValueChange={setQuery}
            placeholder="Type a title"
            listLabel="Chapters"
            emptyText={query.trim() ? "No chapter" : "Start typing"}
          />
        </Field>
      </div>
      <div className="sd-actions">
        <Button onClick={() => setPaletteOpen(true)}>Open palette</Button>
        <span className="sd-subtle text-sm" data-choice-state>
          editor: {person ?? "none"} · ran: {ran}
        </span>
      </div>
      <CommandPalette
        items={COMMANDS}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={(item, event) => {
          setRan(item.value);
          if (item.href) event.preventDefault();
        }}
        placeholder="Search chapters and actions"
        foot="Up and down move, Enter chooses, Esc closes"
      />
    </Demo>
  );
}

function App() {
  return (
    <>
      <EditorChrome />
      <Marks />
      <DocumentTree />
      <Choices />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
