// Goals on the docs site: find a page, reach an example, copy code, change the theme. Each is the
// shortest path the UI offers today, per layout. A phone has no Ctrl K, no topbar links and no
// side navigation until its drawer is open. A `done` runs in the page, so it names its goal
// literally: it cannot close over anything.

export const DOCS_TASKS = [
  {
    id: 'docs.find-search',
    title: 'Find the Overlays page, where tooltips are documented, by search',
    start: 'index.html',
    steps: [
      { key: 'ControlOrMeta+k', only: 'desktop' },
      { click: '.doc-topbar-search', only: 'phone' },
      { type: 'tooltip' },
      { key: 'Enter' },
    ],
    done: () => location.pathname.endsWith('/lib-overlays.html'),
  },
  {
    id: 'docs.find-nav',
    title: 'Reach the Messages page through navigation only',
    start: 'index.html',
    steps: [
      { click: '.doc-topbar-nav a[href="./lib-rules.html"]', only: 'desktop' },
      { click: '.doc-nav-link[href="./lib-messages.html"]', only: 'desktop' },
      { click: '.home-index a[href="./lib-messages.html"]', only: 'phone' },
    ],
    done: () => location.pathname.endsWith('/lib-messages.html'),
  },
  {
    id: 'docs.view-code',
    title: 'Show the code of the first demo on Buttons',
    start: 'lib-buttons.html',
    steps: [{ click: '[data-code-all="code"]' }],
    done: () => {
      const block = document.querySelector('.demo-block')
      return block?.dataset.view === 'code' && Boolean(block.querySelector('.demo-code')?.getClientRects().length)
    },
  },
  {
    id: 'docs.copy-html',
    title: 'Copy the HTML of the first demo on Buttons',
    start: 'lib-buttons.html',
    steps: [
      { click: '[data-code-all="code"]' },
      { click: '.demo-block [data-sd-copy="#code-0"]' },
    ],
    done: async () => (await navigator.clipboard.readText()).includes('class="sd-btn sd-btn-primary"'),
  },
  {
    id: 'docs.copy-install',
    title: 'Copy the install command',
    start: 'lib-buttons.html',
    steps: [{ click: '.doc-install-pill button' }],
    done: async () => (await navigator.clipboard.readText()) === 'pnpm add github:Medalink/signal-design',
  },
  {
    id: 'docs.theme-paper',
    title: 'Switch the site to the paper theme',
    start: 'index.html',
    steps: [
      { click: '.doc-topbar-appearance' },
      { click: '#doc-appearance [data-sd-theme="paper"]' },
    ],
    done: () => document.documentElement.dataset.theme === 'paper',
  },
  {
    id: 'docs.to-example',
    title: 'Open the chat example from the Messages page',
    start: 'lib-messages.html',
    steps: [{ click: '.demo-intro a[href="./chat.html"]' }],
    done: () => location.pathname.endsWith('/chat.html'),
  },
  {
    id: 'docs.next-page',
    title: 'Go to the next page with the pager on Buttons',
    start: 'lib-buttons.html',
    steps: [{ click: 'a.doc-pager-link[rel="next"]' }],
    done: () => location.pathname.endsWith('/lib-fields.html'),
  },
]
