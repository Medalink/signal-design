/** The "Framework-owned state" block: page code owns the state and renders the attributes, as React would. */
export function mountOwnedDemo() {
  const seg = document.getElementById("owned-view");
  const toggle = document.getElementById("owned-toggle");
  const panel = document.getElementById("owned-details");
  const react = document.getElementById("owned-reaction");
  const state = { view: "list", open: false, liked: false, likes: 2 };
  const render = () => {
    for (const b of seg.children) b.setAttribute("aria-pressed", String(b.dataset.value === state.view));
    toggle.setAttribute("aria-expanded", String(state.open));
    panel.toggleAttribute("data-open", state.open);
    react.setAttribute("aria-pressed", String(state.liked));
    react.querySelector("b").textContent = String(state.likes + (state.liked ? 1 : 0));
  };
  seg.addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (b) (state.view = b.dataset.value), render();
  });
  toggle.addEventListener("click", () => ((state.open = !state.open), render()));
  react.addEventListener("click", () => ((state.liked = !state.liked), render()));
  render();
}
