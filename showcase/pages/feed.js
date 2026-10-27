import { mountLibrary } from "../library.js";

mountLibrary();

const feed = document.getElementById("demo-feed");
const jump = document.getElementById("demo-jump");
feed.scrollTop = feed.scrollHeight;
feed.addEventListener("scroll", () => {
  const away = feed.scrollHeight - feed.scrollTop - feed.clientHeight > 80;
  if (away === jump.hidden) jump.hidden = !away;
});
jump.querySelector("button").addEventListener("click", () => feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" }));
