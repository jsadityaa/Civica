(() => {
  const svg = d3.select("#brazil-state-legislature-map");
  const tooltip = d3.select("#brazil-state-legislature-map-tooltip");
  const legislatureTiles = document.querySelectorAll(".brazil-state-legislature-tile");
  const geojson = window.BRAZIL_STATES_GEOJSON;

  const stateSeats = {
    AC: 24,
    AL: 27,
    AP: 24,
    AM: 24,
    BA: 63,
    CE: 46,
    DF: 24,
    ES: 30,
    GO: 41,
    MA: 42,
    MT: 24,
    MS: 24,
    MG: 77,
    PA: 41,
    PB: 36,
    PR: 54,
    PE: 49,
    PI: 30,
    RJ: 70,
    RN: 24,
    RS: 55,
    RO: 24,
    RR: 24,
    SC: 40,
    SP: 94,
    SE: 24,
    TO: 24,
  };

  function getTileStateName(tile) {
    return (tile.dataset.state || "").replace(/\s[A-Z]{2}$/, "");
  }

  function enhanceLegislatureTiles() {
    legislatureTiles.forEach((tile) => {
      const abbreviation = tile.querySelector("span");
      const stateName = getTileStateName(tile);

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

  enhanceLegislatureTiles();

  if (svg.empty() || !geojson || !window.d3) return;

  function tooltipHTML(feature) {
    const name = feature.properties.name || "Brazil state";
    const abbreviation = feature.properties.sigla || "";
    const seats = stateSeats[abbreviation] || 0;
    const seatLabel = abbreviation === "DF" ? "district deputy seats" : "state deputy seats";

    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${name}</div>
      </div>
      <p class="midterm-tooltip-pending">${seats} ${seatLabel}.</p>
    `;
  }

  function positionTooltip(event) {
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

  function showTooltip(event, feature) {
    if (tooltip.empty()) return;

    tooltip
      .style("opacity", 1)
      .html(tooltipHTML(feature));
    positionTooltip(event);
  }

  function hideTooltip() {
    if (tooltip.empty()) return;
    tooltip.style("opacity", 0);
  }

  const projection = d3.geoMercator().fitExtent([[64, 34], [1136, 966]], geojson);
  const path = d3.geoPath().projection(projection);
  const features = geojson.features || [];
  const layer = svg.append("g").attr("class", "brazil-state-legislature-state-layer");

  layer.selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "midterm-state brazil-state state-legislature-state state-legislature-pending is-on-map")
    .attr("d", path)
    .on("mouseover", (event, feature) => {
      d3.select(event.currentTarget).classed("is-active", true);
      showTooltip(event, feature);
    })
    .on("mousemove", positionTooltip)
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      hideTooltip();
    });

  layer.selectAll("text")
    .data(features)
    .enter()
    .append("text")
    .attr("class", "midterm-map-label brazil-map-label")
    .attr("x", (feature) => path.centroid(feature)[0])
    .attr("y", (feature) => path.centroid(feature)[1])
    .text((feature) => feature.properties.sigla || "");
})();
