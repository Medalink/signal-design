import { mountFeed, hotkeys } from "../src/js/index.js";

export function mountFeedDemo() {
  const root = document.getElementById("demo-feed");
  root.addEventListener("sd:feed", ({ detail }) => {
    document.getElementById("feed-above").textContent = `${detail.aboveCount} above`;
  });
  const feed = mountFeed(root);
  hotkeys({ j: () => feed.move(1), k: () => feed.move(-1),
    "g t": () => feed.newest(), n: () => feed.oldest() },
    { target: root, sequenceTimeout: 900, enabled: () => !root.hidden });
  document.getElementById("feed-oldest").onclick = () => feed.oldest();
  document.getElementById("feed-newest").onclick = () => feed.newest();
  let order = 3;
  document.getElementById("feed-insert").onclick = () => {
    feed.beforeUpdate();
    const row = document.createElement("article");
    row.className = "sd-row";
    row.dataset.id = `activity-${++order}`;
    row.dataset.order = String(order);
    row.textContent = `Activity ${order} received`;
    root.prepend(row);
    feed.afterUpdate();
  };
}
