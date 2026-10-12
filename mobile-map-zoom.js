(function () {
  const mobileQuery = window.matchMedia("(max-width: 768px)");
  const mapSelector = [
    ".detail-map-canvas > svg",
    ".national-map-shell > svg"
  ].join(",");

  function parseViewBox(svg) {
    const raw = svg.getAttribute("viewBox");
    if (!raw) return null;
    const values = raw.trim().split(/[\s,]+/).map(Number);
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
    return { x: values[0], y: values[1], width: values[2], height: values[3] };
  }

  function setViewBox(svg, box) {
    svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
  }

  function clampBox(box, base) {
    const minWidth = base.width / 4;
    const minHeight = base.height / 4;
    const next = {
      x: box.x,
      y: box.y,
      width: Math.max(minWidth, Math.min(base.width, box.width)),
      height: Math.max(minHeight, Math.min(base.height, box.height))
    };
    next.x = Math.max(base.x, Math.min(base.x + base.width - next.width, next.x));
    next.y = Math.max(base.y, Math.min(base.y + base.height - next.height, next.y));
    return next;
  }

  function zoom(svg, state, scale) {
    const current = parseViewBox(svg) || state.base;
    const nextWidth = current.width / scale;
    const nextHeight = current.height / scale;
    const next = clampBox({
      x: current.x + (current.width - nextWidth) / 2,
      y: current.y + (current.height - nextHeight) / 2,
      width: nextWidth,
      height: nextHeight
    }, state.base);
    setViewBox(svg, next);
  }

  function reset(svg, state) {
    setViewBox(svg, state.base);
  }

  function pointFromEvent(event) {
    if (event.touches && event.touches.length) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }

  function distance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function enablePanAndPinch(svg, state) {
    let dragStart = null;
    let pinchStart = null;

    svg.addEventListener("pointerdown", (event) => {
      if (!mobileQuery.matches || event.pointerType === "mouse") return;
      event.preventDefault();
      svg.setPointerCapture?.(event.pointerId);
      dragStart = {
        point: pointFromEvent(event),
        box: parseViewBox(svg) || state.base
      };
    });

    svg.addEventListener("pointermove", (event) => {
      if (!dragStart || !mobileQuery.matches || event.pointerType === "mouse") return;
      event.preventDefault();
      const point = pointFromEvent(event);
      const rect = svg.getBoundingClientRect();
      const dx = ((dragStart.point.x - point.x) / rect.width) * dragStart.box.width;
      const dy = ((dragStart.point.y - point.y) / rect.height) * dragStart.box.height;
      setViewBox(svg, clampBox({
        ...dragStart.box,
        x: dragStart.box.x + dx,
        y: dragStart.box.y + dy
      }, state.base));
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
      svg.addEventListener(eventName, () => {
        dragStart = null;
      });
    });

    svg.addEventListener("touchstart", (event) => {
      if (!mobileQuery.matches || event.touches.length !== 2) return;
      pinchStart = {
        distance: distance(event.touches),
        box: parseViewBox(svg) || state.base
      };
    }, { passive: true });

    svg.addEventListener("touchmove", (event) => {
      if (!pinchStart || !mobileQuery.matches || event.touches.length !== 2) return;
      event.preventDefault();
      const scale = Math.max(0.5, Math.min(2.5, distance(event.touches) / pinchStart.distance));
      const nextWidth = pinchStart.box.width / scale;
      const nextHeight = pinchStart.box.height / scale;
      setViewBox(svg, clampBox({
        x: pinchStart.box.x + (pinchStart.box.width - nextWidth) / 2,
        y: pinchStart.box.y + (pinchStart.box.height - nextHeight) / 2,
        width: nextWidth,
        height: nextHeight
      }, state.base));
    }, { passive: false });

    svg.addEventListener("touchend", () => {
      pinchStart = null;
    });
  }

  function createControls(svg, state) {
    const parent = svg.parentElement;
    const controlsBelongInsideParent = parent?.classList.contains("national-map-shell");
    const controlsExist = controlsBelongInsideParent
      ? parent.querySelector(":scope > .mobile-map-zoom-controls")
      : parent?.nextElementSibling?.classList.contains("mobile-map-zoom-controls");
    if (!parent || controlsExist) return;

    const controls = document.createElement("div");
    controls.className = "mobile-map-zoom-controls";
    controls.setAttribute("aria-label", "Map zoom controls");
    controls.innerHTML = `
      <button type="button" data-map-zoom="in" aria-label="Zoom in">+</button>
      <button type="button" data-map-zoom="out" aria-label="Zoom out">-</button>
      <button type="button" data-map-zoom="reset" aria-label="Reset map zoom">Reset</button>
    `;
    controls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-map-zoom]");
      if (!button) return;
      const action = button.getAttribute("data-map-zoom");
      if (action === "in") zoom(svg, state, 1.35);
      if (action === "out") zoom(svg, state, 1 / 1.35);
      if (action === "reset") reset(svg, state);
    });
    if (controlsBelongInsideParent) {
      parent.classList.add("mobile-map-zoom-card");
      parent.appendChild(controls);
    } else {
      parent.insertAdjacentElement("afterend", controls);
    }
  }

  function setupMap(svg) {
    if (svg.dataset.mobileMapZoomReady === "true") return;
    const base = parseViewBox(svg);
    if (!base) return;
    svg.dataset.mobileMapZoomReady = "true";
    svg.classList.add("mobile-map-zoom-target");
    const state = { base };
    createControls(svg, state);
    enablePanAndPinch(svg, state);
  }

  function init() {
    document.querySelectorAll(mapSelector).forEach(setupMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  const observer = new MutationObserver(init);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
