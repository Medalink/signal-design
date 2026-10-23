import { mountLibrary } from "../library.js";

mountLibrary();

const levelMeter = document.getElementById("demo-level");
document.getElementById("demo-level-input").addEventListener("input", (e) => {
  levelMeter.style.setProperty("--level", e.target.value);
  levelMeter.setAttribute("aria-valuenow", Number(e.target.value).toFixed(2));
});

const feed = document.getElementById("demo-feed");
const jump = document.getElementById("demo-jump");
feed.scrollTop = feed.scrollHeight;
feed.addEventListener("scroll", () => {
  const away = feed.scrollHeight - feed.scrollTop - feed.clientHeight > 80;
  if (away === jump.hidden) jump.hidden = !away;
});
jump.querySelector("button").addEventListener("click", () => feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" }));
