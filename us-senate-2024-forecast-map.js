(() => {
  const svg = d3.select("#senate-forecast-map");
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
      label: "Projected",
      difference: "Projected PA as Democratic",
      dem: ["California", "Washington", "Nevada", "Arizona", "New Mexico", "Minnesota", "Wisconsin", "Michigan", "Pennsylvania", "Virginia", "New York", "Maine", "Vermont", "Massachusetts", "Rhode Island", "Connecticut", "New Jersey", "Delaware", "Maryland"],
      rep: ["Utah", "Wyoming", "Montana", "North Dakota", "Nebraska", "Missouri", "Tennessee", "Mississippi", "Texas", "Indiana", "Ohio", "West Virginia", "Florida"]
    },
    actual: {
      label: "Actual",
      difference: "PA moved to Republican",
      dem: ["California", "Washington", "Nevada", "Arizona", "New Mexico", "Minnesota", "Wisconsin", "Michigan", "Virginia", "New York", "Maine", "Vermont", "Massachusetts", "Rhode Island", "Connecticut", "New Jersey", "Delaware", "Maryland"],
      rep: ["Utah", "Wyoming", "Montana", "North Dakota", "Nebraska", "Missouri", "Tennessee", "Mississippi", "Texas", "Indiana", "Ohio", "West Virginia", "Florida", "Pennsylvania"]
    }
  };

  let activeMode = "projected";
  let stateShapes = null;

  function buildPatterns() {
    const defs = svg.append("defs");
    defs.append("pattern")
      .attr("id", "senate-forecast-dem-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call((pattern) => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#5a96c8");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#2879b5");
      });

    defs.append("pattern")
      .attr("id", "senate-forecast-rep-flip-pattern")
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

  function isForecastFlip(stateName, party) {
    return party === "R" && (
      stateName === "Montana" ||
      stateName === "Ohio" ||
      stateName === "West Virginia" ||
      (activeMode === "actual" && stateName === "Pennsylvania")
    );
  }

  function isIndependentCaucusingDem(stateName) {
    return stateName === "Maine" || stateName === "Vermont";
  }

  function fillForState(stateName, party) {
    if (isForecastFlip(stateName, party)) return "url(#senate-forecast-rep-flip-pattern)";
    if (party === "D" && isIndependentCaucusingDem(stateName)) return "#c8a44d";
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

      stateShapes = svg.selectAll(".forecast-senate-state")
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

      svg.selectAll(".forecast-senate-map-label")
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

      const nebraskaFeature = states.find((feature) => feature.properties.name === "Nebraska");
      if (nebraskaFeature) {
        const nebraskaBounds = path.bounds(nebraskaFeature);
        const [minX, minY] = nebraskaBounds[0];
        const [maxX, maxY] = nebraskaBounds[1];
        const width = maxX - minX;
        const height = maxY - minY;
        const desiredWidth = 138;
        const scale = desiredWidth / width;
        const targetX = 1274;
        const targetY = 688;
        const insetGroup = svg.append("g")
          .attr("class", "forecast-senate-special-inset")
          .attr("transform", `translate(${targetX - minX * scale} ${targetY - minY * scale}) scale(${scale})`);

        insetGroup.append("path")
          .attr("class", "forecast-senate-special-shape")
          .attr("d", path(nebraskaFeature))
          .attr("fill", "#cf2f2f");

        const labelGroup = svg.append("g")
          .attr("class", "forecast-senate-special-label-group")
          .attr("transform", `translate(${targetX + desiredWidth + 8} ${targetY + (height * scale) / 2 - 8})`);

        labelGroup.append("text")
          .attr("class", "forecast-senate-special-label")
          .attr("x", 0)
          .attr("y", 0)
          .text("Neb.");

        labelGroup.append("text")
          .attr("class", "forecast-senate-special-label")
          .attr("x", 0)
          .attr("y", 16)
          .text("special");
      }

      paintMap();
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
