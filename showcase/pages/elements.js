import { mountLibrary } from "../library.js";

mountLibrary();

for (const cb of document.querySelectorAll("[data-indeterminate]")) cb.indeterminate = true;
