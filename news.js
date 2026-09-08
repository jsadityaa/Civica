(() => {
  const buttons = Array.from(document.querySelectorAll("[data-news-category]"));
  const panels = Array.from(document.querySelectorAll("[data-news-panel]"));

  if (!buttons.length || !panels.length) return;

  const setActiveCategory = (category) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.newsCategory === category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.newsPanel !== category;
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveCategory(button.dataset.newsCategory);
    });
  });
})();
