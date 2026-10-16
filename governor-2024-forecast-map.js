(() => {
  const svg = d3.select("#governor-forecast-map");
  if (svg.empty() || !window.topojson) return;

  const statesUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
  const stateAbbreviations = {
    Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
    Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
    Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
    Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
    Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
    Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
    Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
    Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY"
  };

  const labelAdjustments = {
    Michigan: [20, 18],
    Louisiana: [-10, 5],
    "Rhode Island": [10, 5],
    Hawaii: [-8, 15],
    Alaska: [2, 0],
    Connecticut: [0, 4],
    Delaware: [19, 7],
    Florida: [14, 4],
    Massachusetts: [40, 0],
    Maryland: [-10, -4],
    "New Jersey": [25, 5]
  };

  const forecastMaps = {
    projected: {
      dem: ["Washington", "New Hampshire", "North Carolina", "Delaware"],
      rep: ["Indiana", "Montana", "West Virginia", "North Dakota", "Utah", "Missouri", "Vermont"]
    },
    actual: {
      dem: ["Washington", "North Carolina", "Delaware"],
      rep: ["Indiana", "New Hampshire", "Montana", "West Virginia", "North Dakota", "Utah", "Missouri", "Vermont"]
    }
  };
  const margins = {
    Washington: { projected: "D+7.0", actual: "D+11.2" },
    Indiana: { projected: "R+8.9", actual: "R+13.3" },
    "New Hampshire": { projected: "D+1.1", actual: "R+9.3" },
    "North Carolina": { projected: "D+8.7", actual: "D+14.8" }
  };

  let activeMode = "projected";
  let stateShapes = null;

  function buildPatterns() {
    const defs = svg.append("defs");
    defs.append("pattern")
      .attr("id", "governor-forecast-dem-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call((pattern) => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#5a96c8");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#2879b5");
      });

    defs.append("pattern")
      .attr("id", "governor-forecast-rep-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call((pattern) => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#d86a6a");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#cf2f2f");
      });
  }

  function buildLookup(mode) {
    const data = forecastMaps[mode];
    const lookup = new Map();
    data.dem.forEach((state) => lookup.set(state, "D"));
    data.rep.forEach((state) => lookup.set(state, "R"));
    return lookup;
  }

  function fillForState(stateName, party) {
    if (activeMode === "projected" && stateName === "New Hampshire") {
      return "url(#governor-forecast-dem-flip-pattern)";
    }
    if (party === "D") return "#2879b5";
    if (party === "R") return "#cf2f2f";
    return "rgba(148, 163, 184, 0.18)";
  }

  function updateButtons() {
    document.querySelectorAll(".forecast-map-toggle-button").forEach((button) => {
      const isActive = button.dataset.forecastMapMode === activeMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function paintMap() {
    if (!stateShapes) return;
    const lookup = buildLookup(activeMode);
    stateShapes
      .attr("fill", (feature) => fillForState(feature.properties.name, lookup.get(feature.properties.name)))
      .classed("is-on-map", (feature) => lookup.has(feature.properties.name))
      .classed("is-muted", (feature) => !lookup.has(feature.properties.name));
    stateShapes.select("title").text((feature) => {
      const stateName = feature.properties.name;
      const result = margins[stateName];
      return result
        ? `${stateName}: Polycivic ${result.projected}; actual ${result.actual}`
        : lookup.has(stateName)
          ? `${stateName}: safe race; not forecast by Polycivic`
          : `${stateName}: not included in this forecast`;
    });
    updateButtons();
  }

  function renderMap() {
    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);

    d3.json(statesUrl).then((us) => {
      const states = topojson.feature(us, us.objects.states).features;
      const collection = { type: "FeatureCollection", features: states };
      const mapFitArea = [[18, 8], [1368, 892]];
      projection.fitExtent(mapFitArea, collection);

      const initialBounds = path.bounds(collection);
      const currentCenterX = (initialBounds[0][0] + initialBounds[1][0]) / 2;
      const currentCenterY = (initialBounds[0][1] + initialBounds[1][1]) / 2;
      const targetCenterX = (mapFitArea[0][0] + mapFitArea[1][0]) / 2;
      const targetCenterY = (mapFitArea[0][1] + mapFitArea[1][1]) / 2;
      const currentTranslate = projection.translate();
      projection.translate([
        currentTranslate[0] + (targetCenterX - currentCenterX),
        currentTranslate[1] + (targetCenterY - currentCenterY)
      ]);

      const artwork = svg.append("g");

      stateShapes = artwork.selectAll(".forecast-senate-state")
        .data(states)
        .enter()
        .append("path")
        .attr("class", "forecast-senate-state")
        .attr("d", path)
        .on("mouseover", (event, feature) => {
          if (!buildLookup(activeMode).has(feature.properties.name)) return;
          d3.select(event.currentTarget).classed("is-active", true);
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).classed("is-active", false);
        });

      stateShapes.append("title");

      artwork.selectAll(".forecast-senate-map-label")
        .data(states)
        .enter()
        .append("text")
        .attr("class", "forecast-senate-map-label")
        .attr("x", (feature) => path.centroid(feature)[0] + (labelAdjustments[feature.properties.name]?.[0] || 0))
        .attr("y", (feature) => path.centroid(feature)[1] + (labelAdjustments[feature.properties.name]?.[1] || 0))
        .text((feature) => {
          const contested = buildLookup(activeMode).has(feature.properties.name);
          return contested ? (stateAbbreviations[feature.properties.name] || "") : "";
        });

      paintMap();
      const bounds = artwork.node().getBBox();
      artwork.attr("transform", `translate(${800 - bounds.x - bounds.width / 2} ${450 - bounds.y - bounds.height / 2})`);
    }).catch(() => {
      const message = document.getElementById("governor-forecast-map-status");
      if (message) message.textContent = "The forecast map could not be loaded. The comparisons below remain available.";
    });
  }

  document.querySelectorAll(".forecast-map-toggle-button").forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.forecastMapMode;
      if (!nextMode || nextMode === activeMode) return;
      activeMode = nextMode;
      svg.selectAll(".forecast-senate-map-label")
        .text((feature) => {
          const contested = buildLookup(activeMode).has(feature.properties.name);
          return contested ? (stateAbbreviations[feature.properties.name] || "") : "";
        });
      paintMap();
    });
  });

  buildPatterns();
  renderMap();
})();
