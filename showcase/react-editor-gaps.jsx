import { useEffect, useRef, useState } from "react";
import { Demo } from "./react-demo.jsx";
import { ICON_NAMES } from "../src/js/icons.js";
import { GutterBlock, HoverCardHost, Icon, IconButton, Manuscript, ResizablePanel, Toolbar, ToolbarButton, ToolbarGroup, ToolbarMore, ToolbarSeparator, Tree, TreeItem, WeightedBar } from "../src/react/index.js";

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

const CHAPTERS = [
  { id: "ch-1", label: "The harbour" },
  { id: "ch-2", label: "The long way round" },
  { id: "ch-3", label: "Forty drafts" },
  { id: "ch-4", label: "Lisbon", disabled: true },
];

function TreeActions() {
  const [chapters, setChapters] = useState(CHAPTERS);
  const [selected, setSelected] = useState("ch-1");
  const [last, setLast] = useState("none");
  const actionsOf = (id) => [
    { label: "Rename", key: "F2", icon: <Icon name="edit" />, onSelect: () => setLast(`rename ${id}`) },
    {
      label: "Delete",
      key: "Delete",
      icon: <Icon name="delete" />,
      tone: "danger",
      onSelect: () => {
        setChapters((current) => current.filter((chapter) => chapter.id !== id));
        setLast(`delete ${id}`);
      },
    },
  ];
  return (
    <Demo
      id="react-editor-tree-actions"
      title="Tree row actions"
      code={`<Tree label="Chapters" selected={id} onSelectedChange={setId}>
  <TreeItem
    id="ch-1"
    label="The harbour"
    actions={[
      { label: "Rename", key: "F2", icon: <Icon name="edit" />, onSelect: () => rename("ch-1") },
      { label: "Delete", key: "Delete", icon: <Icon name="delete" />, tone: "danger", onSelect: () => remove("ch-1") },
    ]}
  />
</Tree>`}
    >
      <div className="grid max-w-[24rem] border border-line bg-surface py-2">
        <Tree label="Chapters" selected={selected} onSelectedChange={setSelected}>
          {chapters.map((chapter) => (
            <TreeItem key={chapter.id} id={chapter.id} label={chapter.label} disabled={chapter.disabled} actions={actionsOf(chapter.id)} />
          ))}
        </Tree>
      </div>
      <div className="flex items-center gap-4">
        <p className="sd-subtle text-sm" data-tree-actions-state>
          selected: {selected} · last action: {last}
        </p>
        <button className="sd-btn sd-btn-sm" type="button" onClick={() => setChapters(CHAPTERS)}>
          Restore chapters
        </button>
      </div>
    </Demo>
  );
}

function Resizable() {
  const [binder, setBinder] = useState(200);
  const [inspector, setInspector] = useState(240);
  const [dock, setDock] = useState(96);
  return (
    <Demo
      id="react-editor-resizable"
      title="Resizable panels"
      code={`<div className="flex">
  <ResizablePanel edge="end" size={binder} onSizeChange={setBinder} minSize={160} maxSize={360} label="Resize binder">
    <nav aria-label="Binder">…</nav>
  </ResizablePanel>
  <main className="min-w-0 flex-1">…</main>
  <ResizablePanel edge="start" size={inspector} onSizeChange={setInspector} label="Resize inspector">…</ResizablePanel>
</div>
<ResizablePanel edge="top" size={dock} onSizeChange={setDock} minSize={64} maxSize={200} label="Resize dock">…</ResizablePanel>`}
    >
      <div className="flex h-64 overflow-hidden border border-line bg-surface" id="resizable-row">
        <ResizablePanel edge="end" size={binder} onSizeChange={setBinder} minSize={160} maxSize={360} label="Resize binder" className="border-e border-line p-3" id="resizable-binder">
          <p className="sd-label">Binder</p>
          <ul className="mt-2 grid gap-1" data-binder-list>
            {Array.from({ length: 24 }, (_, index) => (
              <li key={index}>
                <button className="sd-btn sd-btn-ghost sd-btn-sm w-full justify-start" type="button">
                  Chapter {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </ResizablePanel>
        <div className="min-w-0 flex-1 p-3">
          <p className="sd-label">Manuscript</p>
        </div>
        <ResizablePanel edge="start" size={inspector} onSizeChange={setInspector} minSize={160} maxSize={360} label="Resize inspector" className="border-s border-line p-3 max-sm:hidden" id="resizable-inspector">
          <p className="sd-label">Inspector</p>
        </ResizablePanel>
      </div>
      <div className="flex h-56 flex-col overflow-hidden border border-line bg-surface" id="resizable-column">
        <div className="min-h-0 flex-1 p-3">
          <p className="sd-label">Manuscript</p>
        </div>
        <ResizablePanel edge="top" size={dock} onSizeChange={setDock} minSize={64} maxSize={160} label="Resize dock" className="border-t border-line p-3" id="resizable-dock">
          <p className="sd-label">Dock</p>
        </ResizablePanel>
      </div>
      <p className="sd-subtle text-sm" data-resize-state>
        binder {binder} · inspector {inspector} · dock {dock}
      </p>
    </Demo>
  );
}

// One element per entity: showing it beside a second place gives the card the same content to a new anchor.
const ENTITIES = {
  lisbon: { kind: "Place", card: <><p className="sd-hovercard-title">Lisbon</p><p className="sd-hovercard-meta">Place</p><p>Capital of Portugal, first named in chapter 2.</p></> },
  ines: { kind: "Person", card: <><p className="sd-hovercard-title">Ines Duarte</p><p className="sd-hovercard-meta">Person</p><p>Translator. Appears in chapters 3 and 5.</p></> },
};

function Imperative() {
  const host = useRef(null);
  const prose = useRef(null);
  const opened = useRef(null);
  const [state, setState] = useState("closed");

  // The prose is plain DOM that React did not render, as a ProseMirror view's is.
  useEffect(() => {
    const root = prose.current;
    root.innerHTML = '<p>Rain over <span class="sd-mark" data-mark="entity" data-entity="lisbon" tabindex="0">Lisbon</span>, and <span class="sd-mark" data-mark="entity" data-entity="ines" tabindex="0">Ines</span> reading by the window. By evening the rain had reached <span class="sd-mark" data-mark="entity" data-entity="lisbon" data-second tabindex="0">Lisbon</span> too. <span data-range>A passage the editor points at by its position.</span></p>';
    let timer = 0;
    const close = () => {
      clearTimeout(timer);
      host.current.hide();
    };
    const open = (target, delay) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const entity = ENTITIES[target.dataset.entity];
        opened.current?.removeAttribute("aria-describedby");
        opened.current = target;
        target.setAttribute("aria-describedby", host.current.id);
        host.current.show(
          target,
          entity.card,
          { label: entity.kind },
        );
        setState(`open: ${target.dataset.entity}`);
      }, delay);
    };
    const listeners = [
      ["pointerover", (event) => event.target.closest("[data-entity]") && open(event.target.closest("[data-entity]"), 300)],
      ["pointerout", (event) => event.target.closest("[data-entity]") && close()],
      ["focusin", (event) => event.target.closest("[data-entity]") && open(event.target.closest("[data-entity]"), 0)],
      ["focusout", (event) => event.target.closest("[data-entity]") && close()],
    ];
    for (const [type, listener] of listeners) root.addEventListener(type, listener);
    return () => {
      clearTimeout(timer);
      for (const [type, listener] of listeners) root.removeEventListener(type, listener);
    };
  }, []);

  const preview = () => {
    const text = prose.current.querySelector("[data-range]").firstChild;
    const range = document.createRange();
    range.setStart(text, 2);
    range.setEnd(text, 9);
    host.current.show(() => range.getBoundingClientRect(), <p>Placed at a text range, which is how a document position becomes a rect.</p>, { label: "Range preview", side: "top", align: "center" });
    setState("open: range");
  };

  return (
    <Demo
      id="react-editor-hostcard"
      title="Hover card for a trigger React does not render"
      code={`const host = useRef(null);
<HoverCardHost ref={host} onOpenChange={(open) => !open && clearHover()} />

// Anywhere: a ProseMirror plugin, a DOM listener.
host.current.show(span, <EntityCard entity={entity} />, { label: "Place" });
span.setAttribute("aria-describedby", host.current.id);
host.current.show(() => view.coordsAtPos(pos), <Suggestion />, { side: "top" });
host.current.hide();`}
    >
      <div className="grid max-w-[40rem] gap-3">
        <div ref={prose} className="sd-manuscript-page" data-face="reading" style={{ minHeight: 0, padding: "16px 20px" }} />
        <div className="flex flex-wrap items-center gap-3">
          <button className="sd-btn sd-btn-sm" type="button" onClick={preview}>
            Preview at a range
          </button>
          <button className="sd-btn sd-btn-sm" type="button" onClick={() => host.current.hide()}>
            Hide
          </button>
          <p className="sd-subtle text-sm" data-host-state>
            {state}
          </p>
        </div>
        <HoverCardHost
          ref={host}
          onOpenChange={(open) => {
            if (open) return;
            opened.current?.removeAttribute("aria-describedby");
            opened.current = null;
            setState("closed");
          }}
        />
      </div>
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
      <TreeActions />
      <Resizable />
      <Imperative />
      <Weighted />
      <Gutter />
    </>
  );
}
