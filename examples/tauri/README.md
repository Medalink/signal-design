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
shell example into `examples/tauri/web/` (generated, not committed).
