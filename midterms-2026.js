(() => {
  const STATE_ABBREVIATIONS = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY"
  };

  const LABEL_ADJUSTMENTS = {
    Connecticut: [10, 4],
    Delaware: [16, 8],
    Florida: [12, 8],
    Hawaii: [0, 8],
    Maryland: [18, 3],
    Massachusetts: [16, -4],
    "New Hampshire": [14, -7],
    "New Jersey": [16, 8],
    "Rhode Island": [24, 10],
    Vermont: [-8, -10]
  };

  const SENATE_STATES = new Set([
    "Alabama",
    "Alaska",
    "Arkansas",
    "Colorado",
    "Delaware",
    "Florida",
    "Georgia",
    "Idaho",
    "Illinois",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Montana",
    "Nebraska",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "North Carolina",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Virginia",
    "West Virginia",
    "Wyoming"
  ]);

  const mapConfig = [
    {
      selector: "#midterm-senate-map",
      stateClass: "midterm-state midterm-state--senate",
      labelClass: "midterm-map-label",
      isActive: (name) => SENATE_STATES.has(name)
    }
  ];

  const tooltip = d3.select("#midterm-map-tooltip");

  function tooltipHTML(title, message) {
    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${title}</div>
      </div>
      <p class="midterm-tooltip-pending">${message}</p>
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

  function showTooltip(event, title, message = "Results pending.") {
    if (tooltip.empty()) return;

    tooltip
      .style("opacity", 1)
      .html(tooltipHTML(title, message));
    positionTooltip(event);
  }

  function hideTooltip() {
    if (tooltip.empty()) return;
    tooltip.style("opacity", 0);
  }

  function drawStateMap(config, states) {
    const svg = d3.select(config.selector);
    if (svg.empty()) return;

    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);
    const stateCollection = { type: "FeatureCollection", features: states };
    const mapFitArea = [[42, 8], [1392, 892]];

    projection.fitExtent(mapFitArea, stateCollection);

    const bounds = path.bounds(stateCollection);
    const currentCenterX = (bounds[0][0] + bounds[1][0]) / 2;
    const currentCenterY = (bounds[0][1] + bounds[1][1]) / 2;
    const targetCenterX = (mapFitArea[0][0] + mapFitArea[1][0]) / 2;
    const targetCenterY = (mapFitArea[0][1] + mapFitArea[1][1]) / 2;
    const translate = projection.translate();

    projection.translate([
      translate[0] + (targetCenterX - currentCenterX),
      translate[1] + (targetCenterY - currentCenterY)
    ]);

    const group = svg.append("g").attr("class", "midterm-empty-state-layer");

    group.selectAll("path")
      .data(states)
      .enter()
      .append("path")
      .attr("class", (feature) => {
        const activeClass = config.isActive(feature.properties.name) ? "is-on-map" : "is-muted";
        return `${config.stateClass} ${activeClass}`;
      })
      .attr("d", path)
      .on("mouseover", (event, feature) => {
        const stateName = feature.properties.name;
        const message = config.isActive(stateName)
          ? "Results pending."
          : "There are no elections in this state.";

        d3.select(event.currentTarget).classed("is-active", true);
        showTooltip(event, stateName, message);
      })
      .on("mousemove", positionTooltip)
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        hideTooltip();
      });

    group.selectAll("text")
      .data(states.filter((feature) => config.isActive(feature.properties.name)))
      .enter()
      .append("text")
      .attr("class", config.labelClass)
      .attr("x", (feature) => path.centroid(feature)[0] + (LABEL_ADJUSTMENTS[feature.properties.name]?.[0] || 0))
      .attr("y", (feature) => path.centroid(feature)[1] + (LABEL_ADJUSTMENTS[feature.properties.name]?.[1] || 0))
      .text((feature) => STATE_ABBREVIATIONS[feature.properties.name] || "");
  }

  function drawHouseMap() {
    const svg = d3.select("#midterm-house-map");
    const geojson = window.HOUSE_2024_GEOJSON;
    if (svg.empty() || !geojson) return;

    const features = geojson.features || [];
    const projection = d3.geoAlbersUsa().fitExtent([[18, 8], [1398, 892]], geojson);
    const path = d3.geoPath().projection(projection);

    svg.append("g")
      .attr("class", "midterm-empty-house-layer")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "midterm-district")
      .attr("d", path)
      .on("mouseover", (event, feature) => {
        d3.select(event.currentTarget).classed("is-active", true);
        showTooltip(event, feature.properties.code || "House district");
      })
      .on("mousemove", positionTooltip)
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        hideTooltip();
      });
  }

  function init() {
    if (!window.d3 || !window.topojson) return;

    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then((us) => {
      const states = topojson.feature(us, us.objects.states).features;
      mapConfig.forEach((config) => drawStateMap(config, states));
    });

    drawHouseMap();
  }

  init();
})();
