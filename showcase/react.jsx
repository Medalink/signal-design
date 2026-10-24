import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { mountBar } from "./viewport.js";
import { cycleTheme, hotkeys } from "../src/js/index.js";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CountBadge,
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  EmptyState,
  Field,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  Panel,
  PanelDescription,
  PanelTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  Sheet,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  ToastProvider,
  Tooltip,
  buttonClass,
  useToast,
} from "../src/react/index.js";

mountBar();
hotkeys({ "shift+t": cycleTheme });

function Demo({ id, title, code, children }) {
  return (
    <section className="demo-block" id={id}>
      <div className="demo-head">
        <h2 className="sd-label">{title}</h2>
      </div>
      <div className="grid gap-4">{children}</div>
      <div className="sd-code">
        <div className="sd-code-head">JSX</div>
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
}

const Gear = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" />
    <path d="M4 9h16M9 4v16" />
  </svg>
);

function Buttons() {
  const [busy, setBusy] = useState(false);
  return (
    <Demo
      id="react-buttons"
      title="Buttons"
      code={`<Button variant="primary">Approve</Button>
<Button tone="danger">Reject</Button>
<Button size="sm" busy={busy} onClick={save}>Save</Button>
<IconButton label="Settings"><Gear /></IconButton>
<a className={buttonClass({ variant: "ghost" })} href="/docs">Docs</a>`}
    >
      <div className="sd-actions">
        <Button variant="primary">Approve</Button>
        <Button>Save for later</Button>
        <Button tone="danger">Reject</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="link">Reset to defaults</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="sd-actions">
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button
          size="sm"
          busy={busy}
          onClick={() => {
            setBusy(true);
            setTimeout(() => setBusy(false), 1200);
          }}
        >
          {busy ? "Saving" : "Save"}
        </Button>
        <IconButton label="Settings">
          <Gear />
        </IconButton>
        <a className={buttonClass({ variant: "ghost" })} href="./index.html">
          Link as button
        </a>
      </div>
    </Demo>
  );
}

function Forms() {
  const [name, setName] = useState("");
  const [notify, setNotify] = useState(false);
  const error = name.trim() === "" ? "Name is required." : undefined;
  return (
    <Demo
      id="react-forms"
      title="Fields and controls"
      code={`<Field label="Name" hint="Shown on your profile." error={error}>
  <Input value={name} onChange={(event) => setName(event.target.value)} />
</Field>
<Field label="Bio"><Textarea /></Field>
<Field label="Plan"><Select><option>Free</option></Select></Field>
<Checkbox label="Weekly summary" description="Sent every Monday." />
<Switch label="Push notifications" checked={notify} onChange={...} />`}
    >
      <form className="sd-form max-w-narrow" onSubmit={(event) => event.preventDefault()} noValidate>
        <Field label="Name" hint="Shown on your profile." error={error} required>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jane Doe" />
        </Field>
        <Field label="Bio" aside="optional">
          <Textarea rows={3} />
        </Field>
        <Field label="Plan">
          <Select defaultValue="pro">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </Select>
        </Field>
        <div className="sd-choices">
          <Checkbox label="Email me a weekly summary" description="Sent every Monday morning." defaultChecked />
          <Switch label="Push notifications" description={notify ? "On" : "Off"} checked={notify} onChange={(event) => setNotify(event.target.checked)} />
          <Switch label="Auto-approve" description="Not available on your plan." disabled />
        </div>
      </form>
    </Demo>
  );
}

function Status() {
  return (
    <Demo
      id="react-status"
      title="Badges, counts and avatars"
      code={`<Badge tone="success">Passing</Badge>
<CountBadge value={120} label="Unread" />
<Avatar name="Ada Lovelace" status="online" />
<AvatarStack><Avatar name="Ada Lovelace" /><Avatar name="Grace Hopper" /></AvatarStack>`}
    >
      <div className="sd-cluster">
        <Badge tone="danger">Risk</Badge>
        <Badge tone="warning">Costly</Badge>
        <Badge tone="success">Passing</Badge>
        <Badge>v1.0</Badge>
        <Badge tone="success" solid>
          Done
        </Badge>
        <CountBadge value={3} label="Unread" />
        <CountBadge value={120} label="Unread" tone="danger" />
        <IconButton label="Inbox, 2 new" className="relative">
          <Gear />
          <CountBadge value={2} tone="danger" corner />
        </IconButton>
      </div>
      <div className="sd-cluster" style={{ "--gap": "16px" }}>
        <Avatar name="Jane Doe" size="sm" tone="success" />
        <Avatar name="Alex Lee" tone="extra" status="online" />
        <Avatar name="Sam Kim" size="lg" tone="warning" status="away" />
        <Avatar name="Tess Park" size="xl" tone="accent" status="busy" />
        <AvatarStack aria-label="Four collaborators">
          <Avatar name="Jane Doe" tone="success" />
          <Avatar name="Alex Lee" tone="extra" />
          <Avatar name="Sam Kim" tone="warning" />
          <Avatar name="Tess Park" tone="accent" />
        </AvatarStack>
      </div>
    </Demo>
  );
}

function Surfaces() {
  return (
    <Demo
      id="react-surfaces"
      title="Cards and panels"
      code={`<Card tone="danger">
  <CardHeader>Toned card</CardHeader>
  <CardBody>…</CardBody>
  <CardFooter><Button size="sm">Open</Button></CardFooter>
</Card>
<Panel width="wide"><PanelTitle>Billing cycle</PanelTitle>…</Panel>`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            Card <Badge>3</Badge>
          </CardHeader>
          <CardBody className="sd-muted">Header, body and footer split by hairlines.</CardBody>
          <CardFooter>
            <Button size="sm">Open</Button>
          </CardFooter>
        </Card>
        <Card tone="danger" href="./index.html">
          <CardBody>
            <p className="sd-label">Link card</p>
            <p className="mt-2">The whole card is a link.</p>
          </CardBody>
        </Card>
      </div>
      <Panel>
        <PanelTitle>Billing cycle</PanelTitle>
        <PanelDescription>You are billed at the start of each cycle.</PanelDescription>
      </Panel>
    </Demo>
  );
}

const rows = [
  { team: "Platform", project: "Website", items: 12, done: 9 },
  { team: "Sales", project: "Billing", items: 4, done: 1 },
  { team: "Design", project: "Mobile app", items: 31, done: 31 },
];

function Tables() {
  const [sort, setSort] = useState({ key: "team", direction: "ascending" });
  const [selected, setSelected] = useState("Sales");
  const sorted = [...rows].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * (sort.direction === "ascending" ? 1 : -1));
  const header = (key, label, numeric) => (
    <TableHeader
      numeric={numeric}
      sort={sort.key === key ? sort.direction : undefined}
      onSort={() => setSort({ key, direction: sort.key === key && sort.direction === "ascending" ? "descending" : "ascending" })}
    >
      {label}
    </TableHeader>
  );
  return (
    <Demo
      id="react-table"
      title="Table"
      code={`<Table hover>
  <TableCaption className="sd-sr-only">Projects</TableCaption>
  <TableHead><TableRow>
    <TableHeader sort="ascending" onSort={toggle}>Team</TableHeader>
    <TableHeader numeric>Items</TableHeader>
  </TableRow></TableHead>
  <TableBody><TableRow selected><TableCell>Sales</TableCell>…</TableRow></TableBody>
</Table>`}
    >
      <Table hover>
        <TableCaption className="sd-sr-only">Projects by team</TableCaption>
        <TableHead>
          <TableRow>
            {header("team", "Team")}
            {header("project", "Project")}
            {header("items", "Items", true)}
            <TableHeader numeric>Done</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.team} selected={selected === row.team} onClick={() => setSelected(row.team)}>
              <TableCell>{row.team}</TableCell>
              <TableCell>{row.project}</TableCell>
              <TableCell numeric>{row.items}</TableCell>
              <TableCell numeric>{row.done}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Demo>
  );
}

function Empty() {
  return (
    <Demo
      id="react-empty"
      title="Empty state"
      code={`<EmptyState title="Nothing here yet." action={<Button size="sm">Create an item</Button>}>
  Items your team creates will show up here.
</EmptyState>`}
    >
      <EmptyState title="Nothing here yet." action={<Button size="sm">Create an item</Button>}>
        Items your team creates will show up here.
      </EmptyState>
    </Demo>
  );
}

function Overlays() {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [note, setNote] = useState("Also handle an expired card.");
  const [result, setResult] = useState("none");
  const [guard, setGuard] = useState(false);
  // Counted without a render, so refusing a close changes no React state at all.
  const refused = useRef(0);
  const refusedLabel = useRef(null);
  return (
    <Demo
      id="react-dialog"
      title="Dialog and sheet"
      code={`<Dialog open={open} onOpenChange={setOpen}>
  <DialogHeader>Request changes on ACME-421?</DialogHeader>
  <DialogBody><Field label="Note"><Textarea /></Field></DialogBody>
  <DialogFooter>
    <DialogClose><Button variant="ghost">Cancel</Button></DialogClose>
    <Button tone="danger" onClick={send}>Request changes</Button>
  </DialogFooter>
</Dialog>
<Sheet open={sheet} onOpenChange={setSheet}>…</Sheet>
<Dialog open={guard} onOpenChange={(next) => (next ? setGuard(true) : refuse())}>…</Dialog>
<Dialog trigger={<Button>Uncontrolled</Button>} size="sm">…</Dialog>`}
    >
      <div className="sd-actions">
        <Button onClick={() => setOpen(true)}>Dialog</Button>
        <Button onClick={() => setSheet(true)}>Sheet</Button>
        <Dialog
          size="sm"
          trigger={<Button>Uncontrolled dialog</Button>}
        >
          <DialogHeader>Discard draft?</DialogHeader>
          <DialogBody>Your note will be lost.</DialogBody>
          <DialogFooter>
            <DialogClose>
              <Button variant="ghost">Keep</Button>
            </DialogClose>
            <DialogClose>
              <Button tone="danger">Discard</Button>
            </DialogClose>
          </DialogFooter>
        </Dialog>
        <Dialog size="sm" static trigger={<Button>Static dialog</Button>}>
          <DialogHeader closeButton={false}>Static</DialogHeader>
          <DialogBody>Escape and the backdrop leave it open.</DialogBody>
          <DialogFooter>
            <DialogClose>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </Dialog>
        <Button onClick={() => setGuard(true)}>Guarded dialog</Button>
        <span className="sd-subtle text-sm" data-result>
          result: {result}
        </span>
        <span className="sd-subtle text-sm" data-blocked ref={refusedLabel}>
          blocked: 0
        </span>
      </div>

      <Dialog
        open={guard}
        size="sm"
        onOpenChange={(next) => {
          if (next) setGuard(true);
          else refusedLabel.current.textContent = `blocked: ${++refused.current}`;
        }}
      >
        <DialogHeader>Unsaved changes</DialogHeader>
        <DialogBody>Closing is refused until you discard them.</DialogBody>
        <DialogFooter>
          <Button tone="danger" onClick={() => setGuard(false)}>
            Discard changes
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>Request changes on ACME-421?</DialogHeader>
        <DialogBody>
          <Field label="Note for Platform">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Field label="Reviewer">
            <Input placeholder="Alex" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            tone="danger"
            onClick={() => {
              setResult("sent");
              setOpen(false);
            }}
          >
            Request changes
          </Button>
        </DialogFooter>
      </Dialog>

      <Sheet open={sheet} onOpenChange={setSheet}>
        <DialogHeader>Item details</DialogHeader>
        <DialogBody>
          <p className="text-sm">These settings apply to this item only.</p>
        </DialogBody>
      </Sheet>
    </Demo>
  );
}

function Menus() {
  const [picked, setPicked] = useState("none");
  const [popOpen, setPopOpen] = useState(false);
  return (
    <Demo
      id="react-menu"
      title="Menu and popover"
      code={`<Menu>
  <MenuTrigger><Button>Save for later</Button></MenuTrigger>
  <MenuContent label="Remind me">
    <MenuItem hint="1" onSelect={later}>Later today</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger">Delete</MenuItem>
  </MenuContent>
</Menu>
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger><Button>Why flagged</Button></PopoverTrigger>
  <PopoverContent pad side="top">…</PopoverContent>
</Popover>`}
    >
      <div className="sd-actions">
        <Menu>
          <MenuTrigger>
            <Button>Save for later</Button>
          </MenuTrigger>
          <MenuContent label="Remind me">
            <MenuLabel>Remind me</MenuLabel>
            <MenuItem hint="1" onSelect={() => setPicked("later today")}>
              Later today
            </MenuItem>
            <MenuItem hint="2" onSelect={() => setPicked("tomorrow")}>
              Tomorrow 09:00
            </MenuItem>
            <MenuItem hint="3" onSelect={() => setPicked("monday")}>
              Monday
            </MenuItem>
            <MenuSeparator />
            <MenuItem disabled>Custom (unavailable)</MenuItem>
            <MenuItem tone="danger" onSelect={() => setPicked("deleted")}>
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
        <Popover open={popOpen} onOpenChange={setPopOpen}>
          <PopoverTrigger>
            <Button>Why flagged</Button>
          </PopoverTrigger>
          <PopoverContent pad side="top">
            <p className="sd-label">Why this is flagged</p>
            <p className="mt-2 sd-muted">It sends money to a customer, which cannot be undone.</p>
          </PopoverContent>
        </Popover>
        <span className="sd-subtle text-sm" data-picked>
          picked: {picked}
        </span>
        <span className="sd-subtle text-sm">popover: {popOpen ? "open" : "closed"}</span>
      </div>
    </Demo>
  );
}

function Tooltips() {
  return (
    <Demo
      id="react-tooltip"
      title="Tooltip"
      code={`<Tooltip content="Approve (a)"><Button>Approve</Button></Tooltip>
<Tooltip content="Below" side="bottom"><IconButton label="Settings">…</IconButton></Tooltip>`}
    >
      <div className="sd-actions">
        <Tooltip content="Approve (a)">
          <Button>Hover or focus me</Button>
        </Tooltip>
        <Tooltip content="Below" side="bottom">
          <IconButton label="Settings">
            <Gear />
          </IconButton>
        </Tooltip>
      </div>
    </Demo>
  );
}

function TabsDemo() {
  const [value, setValue] = useState("overview");
  return (
    <Demo
      id="react-tabs"
      title="Tabs"
      code={`<Tabs value={value} onValueChange={setValue}>
  <TabList label="Item detail">
    <Tab value="overview">Overview</Tab>
    <Tab value="checks">Checks <CountBadge value={4} /></Tab>
  </TabList>
  <TabPanel value="overview">…</TabPanel>
  <TabPanel value="checks">…</TabPanel>
</Tabs>`}
    >
      <Tabs value={value} onValueChange={setValue}>
        <TabList label="Item detail">
          <Tab value="overview">Overview</Tab>
          <Tab value="checks">Checks</Tab>
          <Tab value="activity">Activity</Tab>
          <Tab value="archived" disabled>
            Archived
          </Tab>
        </TabList>
        <TabPanel value="overview">
          <p className="sd-muted">Summary, owner and due date go here. Arrow keys move between tabs.</p>
        </TabPanel>
        <TabPanel value="checks">
          <p className="sd-muted">checks passed · 214 tests</p>
        </TabPanel>
        <TabPanel value="activity">
          <p className="sd-muted">ACME-421 · updated 2 min ago</p>
        </TabPanel>
      </Tabs>
      <span className="sd-subtle text-sm" data-tab>
        selected: {value}
      </span>
    </Demo>
  );
}

function Toasts() {
  const toast = useToast();
  return (
    <Demo
      id="react-toast"
      title="Toast"
      code={`<ToastProvider>…</ToastProvider>

const toast = useToast();
toast("Approved ACME-421", { tone: "success" });
toast("Archived", { action: { label: "Undo", onClick: undo }, timeout: 0 });`}
    >
      <div className="sd-actions">
        <Button onClick={() => toast("Approved ACME-421", { tone: "success" })}>Toast: success</Button>
        <Button onClick={() => toast("Archived", { action: { label: "Undo", onClick: () => toast("Restored") }, timeout: 0 })}>Toast with undo</Button>
        <Button onClick={() => toast("Quick", { timeout: 1200 })}>Quick toast</Button>
      </div>
    </Demo>
  );
}

function App() {
  return (
    <ToastProvider>
      <Buttons />
      <Forms />
      <Status />
      <Surfaces />
      <Tables />
      <Empty />
      <Overlays />
      <Menus />
      <Tooltips />
      <TabsDemo />
      <Toasts />
    </ToastProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
