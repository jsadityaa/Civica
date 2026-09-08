(() => {
  const tabButtons = document.querySelectorAll("[data-congress-tab]");
  const tabPanels = document.querySelectorAll("[data-congress-panel]");
  const delegationTiles = document.querySelectorAll(".brazil-chamber-seat-tile");
  const senateSeatArch = document.querySelector("#brazil-senate-seat-arch");
  const geojson = window.BRAZIL_STATES_GEOJSON;

  const senateArchRows = [
    { count: 13, xRadius: 22, yRadius: 34, span: 96 },
    { count: 15, xRadius: 29, yRadius: 45, span: 116 },
    { count: 17, xRadius: 36, yRadius: 56, span: 132 },
    { count: 17, xRadius: 42, yRadius: 67, span: 146 },
    { count: 19, xRadius: 46, yRadius: 78, span: 158 },
  ];

  const senateSeatResults = window.BRAZIL_SENATE_SEAT_RESULTS || {};

  const senateSeatLabels = {
    baseline: "uncontested in 2026",
    pending: "contested, pending",
    government: "government-aligned",
    opposition: "opposition-aligned",
    mixed: "mixed or unclear alignment",
  };

  function getDelegationStateName(tile) {
    return (tile.dataset.state || "").replace(/\s[A-Z]{2}$/, "");
  }

  function enhanceDelegationTiles() {
    delegationTiles.forEach((tile) => {
      const abbreviation = tile.querySelector("span");
      const stateName = getDelegationStateName(tile);

      if (!abbreviation || !stateName || abbreviation.querySelector(".state-help-button")) return;

      abbreviation.classList.add("state-abbrev-label");

      const helpButton = document.createElement("button");
      helpButton.className = "state-help-button";
      helpButton.type = "button";
      helpButton.setAttribute("aria-label", `Show full state name for ${abbreviation.textContent.trim()}`);
      helpButton.textContent = "?";

      const popup = document.createElement("span");
      popup.className = "state-help-popup";
      popup.setAttribute("role", "tooltip");
      popup.textContent = stateName;

      helpButton.append(popup);
      abbreviation.append(helpButton);
    });
  }

  enhanceDelegationTiles();

  function renderSenateSeatArch() {
    if (!senateSeatArch) return;

    const seats = [];
    let seatNumber = 1;

    senateArchRows.forEach((row, rowIndex) => {
      const startAngle = 270 - row.span / 2;
      const endAngle = 270 + row.span / 2;
      const angleStep = row.count === 1 ? 0 : (endAngle - startAngle) / (row.count - 1);

      Array.from({ length: row.count }).forEach((_, index) => {
        const angle = (startAngle + angleStep * index) * (Math.PI / 180);

        seats.push({
          number: seatNumber,
          rowIndex,
          distanceFromCenter: Math.abs(index - (row.count - 1) / 2),
          status: "pending",
          x: 50 + Math.cos(angle) * row.xRadius,
          y: 92 + Math.sin(angle) * row.yRadius,
        });

        seatNumber += 1;
      });
    });

    const baselineSeatNumbers = new Set(
      [...seats]
        .sort((a, b) => (
          a.rowIndex - b.rowIndex ||
          a.distanceFromCenter - b.distanceFromCenter ||
          a.number - b.number
        ))
        .slice(0, 27)
        .map((seat) => seat.number)
    );

    seats.forEach((seat) => {
      const result = senateSeatResults[seat.number] || {};
      seat.status = baselineSeatNumbers.has(seat.number) ? "baseline" : (result.status || "pending");
    });

    senateSeatArch.innerHTML = seats.map((seat) => `
      <span
        class="brazil-senate-seat brazil-senate-seat--${seat.status}"
        style="--seat-x: ${seat.x.toFixed(2)}%; --seat-y: ${seat.y.toFixed(2)}%;"
        title="Seat ${seat.number}: ${senateSeatLabels[seat.status] || "contested, pending"}"
      ></span>
    `).join("");
  }

  renderSenateSeatArch();

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTab = button.dataset.congressTab;

      tabButtons.forEach((tabButton) => {
        const isActive = tabButton.dataset.congressTab === selectedTab;
        tabButton.classList.toggle("is-active", isActive);
        tabButton.setAttribute("aria-selected", String(isActive));
      });

      tabPanels.forEach((panel) => {
        panel.hidden = panel.dataset.congressPanel !== selectedTab;
      });
    });
  });

  if (!window.d3 || !geojson) return;

  const mapConfigs = [
    {
      svgSelector: "#brazil-congress-map",
      tooltipSelector: "#brazil-congress-map-tooltip",
      tooltipText: "Senate seat alignment pending. Two seats are up in this state.",
    },
    {
      svgSelector: "#brazil-chamber-map",
      tooltipSelector: "#brazil-chamber-map-tooltip",
      tooltipText: "Chamber delegation results pending. Seats are allocated proportionally inside this state.",
    },
  ];

  function tooltipHTML(title, text) {
    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${title}</div>
      </div>
      <p class="midterm-tooltip-pending">${text}</p>
    `;
  }

  function positionTooltip(event, tooltip) {
    if (tooltip.empty()) return;

    const node = tooltip.node();
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    let left = event.clientX - width / 2;
    let top = event.clientY + 18;
    const minLeft = 12;
    const maxLeft = window.innerWidth - width - 12;
    const maxTop = window.innerHeight - height - 12;

    left = Math.max(minLeft, Math.min(left, maxLeft));
    top = Math.min(top, maxTop);
    tooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  function showTooltip(event, title, text, tooltip) {
    if (tooltip.empty()) return;

    tooltip
      .style("opacity", 1)
      .html(tooltipHTML(title, text));
    positionTooltip(event, tooltip);
  }

  function hideTooltip(tooltip) {
    if (tooltip.empty()) return;
    tooltip.style("opacity", 0);
  }

  const projection = d3.geoMercator().fitExtent([[64, 34], [1136, 966]], geojson);
  const path = d3.geoPath().projection(projection);
  const features = geojson.features || [];

  mapConfigs.forEach((config) => {
    const svg = d3.select(config.svgSelector);
    const tooltip = d3.select(config.tooltipSelector);

    if (svg.empty()) return;

    const layer = svg.append("g").attr("class", "brazil-empty-state-layer");

    layer.selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "midterm-state brazil-state is-on-map")
      .attr("d", path)
      .on("mouseover", (event, feature) => {
        d3.select(event.currentTarget).classed("is-active", true);
        showTooltip(event, feature.properties.name || "Brazil state", config.tooltipText, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        hideTooltip(tooltip);
      });

    layer.selectAll("text")
      .data(features)
      .enter()
      .append("text")
      .attr("class", "midterm-map-label brazil-map-label")
      .attr("x", (feature) => path.centroid(feature)[0])
      .attr("y", (feature) => path.centroid(feature)[1])
      .text((feature) => feature.properties.sigla || "");
  });
})();
