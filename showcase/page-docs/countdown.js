/** The doc sections of lib-countdown.html: see page-docs/index.js. */
export default {
  when: [
    "A step starts on its own after a wait and the user may stop it: show the seconds left and a bar for the time elapsed.",
    "The time is owned elsewhere (a server, a store): <code>set({ remainingMs, running })</code> takes that authoritative value on every change.",
    "The wait can pause and resume, and a later sync can replace the time.",
  ],
  notWhen: [
    "Work with an amount of its own: a progress bar shows it (see Feedback).",
    "A clock or timestamp: the countdown shows seconds left, not a time of day.",
    "A rule about who may act or what happens at zero: the application owns eligibility and actions, the countdown only presents time.",
  ],
  usage: "&lt;div class=\"sd-stack\" id=\"next\" data-sd-countdown&gt;\n  &lt;p class=\"sd-note\"&gt;Next step in &lt;span data-sd-countdown-value&gt;5&lt;/span&gt;s.&lt;/p&gt;\n  &lt;div class=\"sd-progress\" role=\"progressbar\" aria-label=\"Elapsed countdown time\"&gt;&lt;/div&gt;\n&lt;/div&gt;\n\n&lt;script type=\"module\"&gt;\n  import { mountCountdown } from \"signal-design/js\";\n  const countdown = mountCountdown(document.getElementById(\"next\"));\n  countdown.set({ remainingMs: 5000, running: true });\n&lt;/script&gt;",
  api: [
    { name: "mountCountdown(root)", type: "function", desc: "Mounts one countdown and returns set and dispose. init() does not mount it." },
    { name: "set({ remainingMs, running })", type: "function", desc: "Supplies authoritative time; zero or less completes it, and a non-finite value throws a TypeError." },
    { name: "dispose()", type: "function", desc: "Stops updates and timers; later set() calls do nothing." },
    { name: "data-sd-countdown", type: "attribute", desc: "Marks the root; the script writes data-state on it." },
    { name: "data-sd-countdown-value", type: "attribute", desc: "The element that receives the whole seconds left, rounded up." },
    { name: "data-state", type: "attribute", desc: "Set on the root to running, paused, or complete." },
    { name: "sd:countdown", type: "event", desc: "Bubbles from the root when the state changes, not on every tick; detail is { state, remainingMs, running }." },
    { name: "role=\"progressbar\"", type: "ARIA", desc: "The first progressbar in the root gets aria-valuemin, aria-valuemax, aria-valuenow, aria-valuetext, and --value." },
    { name: "setLabels({ \"countdown.remaining\": ... })", type: "function", desc: "Replaces the words in aria-valuetext; the keys are countdown.remaining, countdown.running, countdown.paused, and countdown.complete." },
  ],
  a11y: [
    "Give the progress bar an <code>aria-label</code>. The script sets <code>aria-valuetext</code> to text like \"5 seconds remaining, paused\".",
    "Put a <code>role=\"status\"</code> line beside the countdown for the state, so a change from running to paused or complete is announced. The page does this with <code>sd:countdown</code>.",
    "The seconds use tabular numbers, so the figure does not shift width as it counts down.",
    "Offer a way to pause or stop the action. The countdown has no controls of its own.",
  ],
  motion: [
    "No transitions or animations. The display refreshes by timer, at most every 100ms while running, and updates only when a value changed.",
    "Nothing here depends on <code>prefers-reduced-motion</code>: the bar and the number change in steps.",
  ],
  notes: [
    "Progress is measured against the largest remaining time since the mount or the last completion. Remount for a different task so the total resets.",
    "Call <code>dispose()</code> on teardown, for example from a framework effect cleanup.",
    "The page keeps its own clock between calls to <code>set()</code>: on pause, subtract the elapsed time and send the remainder again.",
  ],
  related: [
    "feedback",
    "setup",
    "live-feed",
  ],
};
