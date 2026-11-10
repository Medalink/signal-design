### Fixed
- `data-sd-tip`: a tooltip on a control inside an open modal dialog shows above the dialog instead of behind it.
- `toast()`: a toast raised while a modal dialog is open shows above it and its action button can be clicked. The toaster moves into the open modal and back to the page when it closes.
- `toast()`: a toast with an action stays while its button has keyboard focus and counts down again when focus leaves (WCAG 2.2.1).
- `role="tab"`: the arrow, Home and End keys skip a tab that is `disabled` or `aria-disabled="true"`, so selection and focus stay on the same tab.
- `role="tablist"` with `aria-orientation="vertical"`: ArrowUp and ArrowDown move between tabs. ArrowLeft and ArrowRight still work there, and a horizontal tablist is unchanged.
- `data-sd-shell="drawer"` and React `AppShell`: closing the phone drawer by Escape, the toggle, the scrim or a link returns focus to the control that opened it, if it is still on the page, instead of leaving it on `<body>`.
