# Tauri check app

A minimal Tauri 2 app that loads the prebuilt Signal bundle, for checking the
library in a real Tauri webview (WebView2 on Windows, WKWebView on macOS,
WebKitGTK on Linux).

```bash
pnpm build:css
node scripts/tauri-prep.mjs
cd examples/tauri/src-tauri
cargo tauri dev
```

`scripts/tauri-prep.mjs` copies `dist/signal.css`, the fonts, the JS and the
chat example into `examples/tauri/web/` (generated, not committed). The window
is frameless (`decorations: false`), so the page's `sd-titlebar` provides the
drag region and the minimize, maximize and close buttons, through Tauri's
window API (`withGlobalTauri`).
