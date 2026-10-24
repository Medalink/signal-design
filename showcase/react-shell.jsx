import { useState } from "react";
import { createRoot } from "react-dom/client";
import { mountBar } from "./viewport.js";
import { cycleTheme } from "../src/js/index.js";
import {
  AppShell,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CountBadge,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  Rail,
  RailHome,
  RailItem,
  RailList,
  RailTools,
  ShellAside,
  ShellContent,
  ShellHeader,
  ShellMain,
  ShellToggle,
  ShellTopbar,
  Sidebar,
  SidebarBody,
  SidebarGroup,
  SidebarHead,
  SidebarLink,
  SidebarPanel,
  SidebarTitle,
  Statusbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToastProvider,
  useToast,
} from "../src/react/index.js";

mountBar();

const icons = {
  projects: (
    <>
      <rect x="3.5" y="4.5" width="17" height="4" />
      <rect x="3.5" y="10" width="17" height="4" />
      <rect x="3.5" y="15.5" width="17" height="4" />
    </>
  ),
  history: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <rect x="14" y="5" width="4" height="4" />
      <rect x="6" y="15" width="4" height="4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  collapse: <path d="M8 4L4 8l4 4M12 4L8 8l4 4" />,
  panel: (
    <>
      <rect x="2" y="2.5" width="12" height="11" />
      <path d="M10 2.5v11" />
    </>
  ),
  theme: (
    <>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M12 4h8v16h-8z" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

const Icon = ({ name }) => (
  <svg viewBox={name === "collapse" || name === "panel" ? "0 0 16 16" : "0 0 24 24"} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    {icons[name]}
  </svg>
);

const sections = [
  {
    id: "projects",
    label: "Projects",
    groups: [
      ["Views", ["All items", "Assigned to me", "Due this week"]],
      ["Teams", ["Platform", "Billing", "Design"]],
    ],
  },
  { id: "history", label: "History", groups: [["Recent", ["Today", "Yesterday", "Earlier"]]] },
  { id: "settings", label: "Settings", groups: [["Workspace", ["General", "Members", "Billing"]]] },
];

const items = [
  { n: 28, team: "Design", title: "Update pricing page copy", tone: undefined },
  { n: 27, team: "Platform", title: "Cut checkout p95 latency", tone: "warning" },
  { n: 26, team: "Platform", title: "Renew the TLS certificate", tone: "warning" },
  { n: 24, team: "Sales", title: "Send the renewal quote", tone: "danger" },
];

function Shell() {
  const toast = useToast();
  const [page, setPage] = useState("All items");
  const [picked, setPicked] = useState(items[1]);

  return (
    <AppShell defaultSection="projects" id="shell">
      <ShellTopbar>
        <ShellToggle target="drawer" className="sd-btn sd-btn-ghost sd-btn-icon" aria-label="Open navigation" aria-controls="shell-rail">
          <Icon name="menu" />
        </ShellToggle>
        <a href="./index.html" className="sd-wordmark">
          Scribe
        </a>
        <span className="sd-shell-topbar-label">{page}</span>
      </ShellTopbar>

      <Rail id="shell-rail" aria-label="Sections">
        <RailHome href="./index.html" aria-label="Scribe home">
          <b>S</b>
        </RailHome>
        <RailList>
          {sections.map((section) => (
            <RailItem key={section.id} section={section.id} href="#">
              <Icon name={section.id} />
              <span>{section.label}</span>
            </RailItem>
          ))}
        </RailList>
        <RailTools>
          <RailItem aria-label="Next theme" onClick={() => cycleTheme()}>
            <Icon name="theme" />
          </RailItem>
        </RailTools>
      </Rail>

      <Sidebar id="shell-sidebar">
        {sections.map((section) => (
          <SidebarPanel key={section.id} section={section.id}>
            <SidebarHead>
              <SidebarTitle>{section.label}</SidebarTitle>
              <ShellToggle target="sidebar" className="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm">
                <Icon name="collapse" />
              </ShellToggle>
            </SidebarHead>
            <SidebarBody aria-label={`${section.label} pages`}>
              {section.groups.map(([title, links]) => (
                <SidebarGroup key={title} title={title}>
                  {links.map((link) => (
                    <SidebarLink
                      key={link}
                      href="#"
                      current={page === link}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(link);
                      }}
                    >
                      {link}
                    </SidebarLink>
                  ))}
                </SidebarGroup>
              ))}
            </SidebarBody>
          </SidebarPanel>
        ))}
      </Sidebar>

      <ShellMain id="main" tabIndex={-1}>
        <ShellHeader>
          <div className="sd-shell-crumbs">
            <ShellToggle target="sidebar" className="sd-btn sd-btn-icon sd-btn-sm sd-shell-pin">
              <Icon name="collapse" />
            </ShellToggle>
            <ol className="sd-breadcrumb" aria-label="Breadcrumb">
              <li>
                <a href="./index.html">Scribe</a>
              </li>
              <li>
                <span aria-current="page">{page}</span>
              </li>
            </ol>
          </div>
          <div className="sd-shell-header-end">
            <Menu>
              <MenuTrigger>
                <IconButton label="Account" size="sm" variant="ghost">
                  <Avatar name="Jane Doe" tone="success" />
                </IconButton>
              </MenuTrigger>
              <MenuContent label="Account" align="end">
                <MenuLabel>jane@acme.example</MenuLabel>
                <MenuItem onSelect={() => toast("Signed out", { tone: "success" })}>Sign out</MenuItem>
              </MenuContent>
            </Menu>
            <ShellToggle target="aside" className="sd-btn sd-btn-sm" aria-controls="detail-panel">
              <Icon name="panel" />
              <span className="sd-desktop-only">Details</span>
            </ShellToggle>
          </div>
        </ShellHeader>

        <ShellContent>
          <div className="max-w-column">
            <header className="sd-header">
              <h1 className="sd-display">
                {items.length} open. <em>{page}.</em>
              </h1>
            </header>
            <Table hover>
              <TableHead>
                <TableRow>
                  <TableHeader>#</TableHeader>
                  <TableHeader>Item</TableHeader>
                  <TableHeader>Team</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.n} selected={picked.n === item.n} onClick={() => setPicked(item)}>
                    <TableCell>{item.n}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      <Badge tone={item.tone}>{item.team}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Card className="mt-6">
              <CardHeader>
                Inbox <CountBadge value={3} label="Unread" />
              </CardHeader>
              <CardBody className="sd-muted">The shell, rail, sidebar panels, groups and links are React components. Nothing on this page calls init().</CardBody>
            </Card>
          </div>
        </ShellContent>
      </ShellMain>

      <ShellAside id="detail-panel" aria-label="Item details">
        <div className="sd-shell-aside-head">
          <span className="flex-1">Item details</span>
          <span className="sd-subtle text-sm font-normal">#{picked.n}</span>
          <ShellToggle target="aside" className="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" aria-label="Close details">
            <Icon name="close" />
          </ShellToggle>
        </div>
        <div className="sd-shell-aside-section text-sm sd-subtle">{picked.title}</div>
        <div className="sd-shell-aside-section">
          <Button size="sm" onClick={() => toast(`Approved #${picked.n}`, { tone: "success" })}>
            Approve
          </Button>
        </div>
      </ShellAside>

      <Statusbar>
        <span>
          <kbd>Esc</kbd> closes the drawer and the sidebar peek
        </span>
        <span className="sd-statusbar-end">React · no init()</span>
      </Statusbar>
    </AppShell>
  );
}

createRoot(document.getElementById("root")).render(
  <ToastProvider>
    <Shell />
  </ToastProvider>,
);
