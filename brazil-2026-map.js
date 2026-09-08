(() => {
  const svg = d3.select("#brazil-president-map");
  const tooltip = d3.select("#brazil-map-tooltip");
  const geojson = window.BRAZIL_STATES_GEOJSON;

  if (svg.empty() || !geojson || !window.d3) return;

  function tooltipHTML(title) {
    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${title}</div>
      </div>
      <p class="midterm-tooltip-pending">Results pending.</p>
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

  function showTooltip(event, title) {
    if (tooltip.empty()) return;

    tooltip
      .style("opacity", 1)
      .html(tooltipHTML(title));
    positionTooltip(event);
  }

  function hideTooltip() {
    if (tooltip.empty()) return;
    tooltip.style("opacity", 0);
  }

  const projection = d3.geoMercator().fitExtent([[64, 34], [1136, 966]], geojson);
  const path = d3.geoPath().projection(projection);
  const features = geojson.features || [];

  const layer = svg.append("g").attr("class", "brazil-empty-state-layer");

  layer.selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "midterm-state brazil-state is-on-map")
    .attr("d", path)
    .on("mouseover", (event, feature) => {
      d3.select(event.currentTarget).classed("is-active", true);
      showTooltip(event, feature.properties.name || "Brazil state");
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
