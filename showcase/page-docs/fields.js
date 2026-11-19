/** The doc sections of lib-fields.html: see page-docs/index.js. */
export default {
  intro: "One field is a label, a control, and its hint or error, read in that order by assistive tech and styled by the library.",
  when: [
    "Any form: settings, creation dialogs, filters, and importers.",
    "A value needs a format: the hint states it, the error restates it after a failed blur.",
    "Files must come from the user: the dropzone labels a real file input.",
  ],
  notWhen: [
    "A choice between options shown all at once: option cards and radios do that (see Choices).",
    "Picking many values with search: a combobox does that (see Combobox and tags).",
  ],
  usage: "&lt;div class=\"sd-field\"&gt;\n  &lt;label class=\"sd-field-label\" for=\"name\"&gt;Name&lt;/label&gt;\n  &lt;input id=\"name\" aria-describedby=\"name-hint\"&gt;\n  &lt;p class=\"sd-field-hint\" id=\"name-hint\"&gt;Shown on your profile.&lt;/p&gt;\n&lt;/div&gt;",
  api: [
    { name: "sd-form", type: "class", desc: "The form grid; sd-form-row puts fields side by side." },
    { name: "sd-field", type: "class", desc: "One field: label, control, hint, and error in a column." },
    { name: "sd-field-label", type: "class", desc: "The visible label. Point its for at the control." },
    { name: "sd-field-hint, sd-field-error", type: "class", desc: "Helper text under the control; the error shows when the field is invalid." },
    { name: "sd-field-aside", type: "class", desc: "A marker in the label, such as optional." },
    { name: "data-invalid, aria-invalid", type: "attribute", desc: "Shows the error text and reddens the label." },
    { name: "sd-input-group, sd-addon", type: "class", desc: "Joins a prefix or a button to an input." },
    { name: "sd-control-sm, sd-control-lg", type: "class", desc: "Smaller and larger controls, matching the button sizes." },
    { name: "sd-dropzone", type: "class", desc: "A label wrapping a file input, with a drag state." },
  ],
  keyboard: [
    ["Tab", "Moves between controls in DOM order; keep the label before its control."],
    ["Enter", "Submits the form, unless it moves to the next line in a textarea."],
  ],
  a11y: [
    "Every field is named by visible text: a placeholder is a hint, not a label.",
    "Point aria-describedby at the hint and error so they are read with the field.",
    "Mark invalid fields with aria-invalid as well as data-invalid, so the state is announced.",
  ],
  motion: [
    "Focus and invalid states change without animation.",
    "The dropzone drag state is a background change, safe under prefers-reduced-motion.",
  ],
  related: [
    "choices",
    "pickers",
    "elements",
  ],
};
