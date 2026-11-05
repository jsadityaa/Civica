(() => {
  const office = document.body.dataset.forecastOffice;
  const races = window.POLYCIVIC_FORECASTS_2026?.[office];
  if (!races) return;
  const byState = new Map(races.map(race => [race[0], race]));
  const currentParties = new Map(Object.entries(window.POLYCIVIC_FORECASTS_2026_CURRENT_PARTIES[office])
    .flatMap(([party, states]) => states.map(state => [state, party])));
  const isFlip = race => currentParties.has(race[0]) && currentParties.get(race[0]) !== race[1][0];
  const outcome = race => `Projected ${race[1][0] === "D" ? "Democratic" : "Republican"} ${isFlip(race) ? "flip" : "win"}`;
  const color = margin => margin.startsWith("D") ? "#2879b5" : "#cf2f2f";
  const label = race => `${race[0]}${race[2] ? ` — ${race[2]}` : ""}: ${race[1]} — ${outcome(race)}`;
  const stateSelect = document.querySelector("#forecast-detail-state");
  const inputs = window.POLYCIVIC_FORECASTS_2026_INPUTS?.[office];
  let renderStateShape = () => {};
  if (stateSelect && inputs) {
    races.forEach(([state, , special]) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = `${state}${special ? " · Special election" : ""}`;
      stateSelect.append(option);
    });
    const metrics = [
      ["polling", "Polling average", "A combined estimate of voter preferences from multiple opinion polls. Combining polls helps reduce the influence of any single survey."],
      ["nationalEnvironment", "National environment", "The broader political mood across the country, including which party voters favor overall. National trends can influence individual races."],
      ["statePartisanship", "State partisanship", "A state's underlying tendency to support one political party over another, based on its voting history."],
      ["candidateStrength", "Candidate strength (net)", "The relative electoral appeal of the candidates, including factors such as experience, name recognition, and personal popularity. Net strength compares the advantages of both sides."],
      ["fundraisingMargin", "Fundraising margin", "The relative fundraising advantage between the two sides. Fundraising can help campaigns pay for advertising, staff, and voter outreach."],
      ["fundamentals", "Fundamentals", "The underlying conditions that shape an election, such as a state's partisan lean, incumbency, candidate strength, and the national political climate."],
      ["expertAverage", "Expert average", "A combined assessment of a race from election analysts. Analysts evaluate factors such as polling, candidates, and the political climate when judging a race."]
    ];
    function addHelp(term, description, id, container) {
      const wrapper = document.createElement("span");
      wrapper.className = "forecast-term-help-wrapper";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "forecast-term-help";
      button.textContent = "?";
      button.setAttribute("aria-label", `What does ${term.textContent} mean?`);
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", id);
      button.setAttribute("aria-describedby", id);
      const explanation = document.createElement("span");
      explanation.id = id;
      explanation.className = "forecast-term-explanation";
      explanation.setAttribute("role", "tooltip");
      explanation.textContent = description;
      explanation.setAttribute("aria-hidden", "true");
      const position = event => {
        const anchor = button.getBoundingClientRect();
        const x = event?.clientX ?? anchor.left + anchor.width / 2;
        const y = event?.clientY ?? anchor.top;
        const bounds = explanation.getBoundingClientRect();
        explanation.style.left = `${Math.max(12, Math.min(x - bounds.width / 2, window.innerWidth - bounds.width - 12))}px`;
        explanation.style.top = `${Math.max(12, y - bounds.height - 14)}px`;
      };
      const show = event => {
        position(event);
        explanation.classList.add("is-visible");
        explanation.setAttribute("aria-hidden", "false");
        button.setAttribute("aria-expanded", "true");
      };
      const hide = () => {
        explanation.classList.remove("is-visible");
        explanation.setAttribute("aria-hidden", "true");
        button.setAttribute("aria-expanded", "false");
      };
      wrapper.addEventListener("mouseenter", show);
      button.addEventListener("mousemove", position);
      wrapper.addEventListener("mouseleave", hide);
      button.addEventListener("focus", show);
      button.addEventListener("blur", hide);
      button.addEventListener("click", show);
      container.addEventListener("keydown", event => {
        if (event.key === "Escape" && explanation.classList.contains("is-visible")) {
          button.focus();
          hide();
        }
      });
      window.addEventListener("scroll", hide, { passive: true });
      window.addEventListener("resize", hide);
      wrapper.append(button, explanation);
      term.append(" ", wrapper);
    }
    const fundraisingHeading = document.querySelector(".forecast-fundraising h4");
    addHelp(fundraisingHeading, "Money raised to support a campaign's activities, such as advertising, staffing, events, and voter outreach.", "forecast-help-fundraising", document.querySelector(".forecast-fundraising"));
    const forecastLabel = document.querySelector(".forecast-input-prediction-label");
    addHelp(forecastLabel, "An estimate of an election's likely outcome based on the available evidence. It reflects expectations before votes are counted and carries uncertainty.", "forecast-help-prediction", document.querySelector(".forecast-input-prediction-group"));
    function renderDetails() {
      const state = stateSelect.value;
      const race = byState.get(state);
      const input = inputs[state];
      if (!race || !input) return;
      document.querySelector("#forecast-detail-name").textContent = `${state}${race[2] ? " · Special election" : ""}`;
      document.querySelector("#forecast-detail-outcome").textContent = outcome(race);
      const prediction = document.querySelector("#forecast-detail-prediction");
      prediction.textContent = race[1];
      prediction.style.color = color(race[1]);
      renderStateShape();
      document.querySelector("#forecast-fundraising-dem").textContent = input.fundraisingD;
      document.querySelector("#forecast-fundraising-rep").textContent = input.fundraisingR;
      const dollars = value => Number(value.replace(/[^\d.]/g, ""));
      const dem = dollars(input.fundraisingD);
      const rep = dollars(input.fundraisingR);
      document.querySelector("#forecast-fundraising-dem-bar").style.width = `${dem + rep ? dem / (dem + rep) * 100 : 0}%`;
      document.querySelector("#forecast-fundraising-rep-bar").style.width = `${dem + rep ? rep / (dem + rep) * 100 : 0}%`;
      const grid = document.querySelector("#forecast-input-metrics");
      grid.replaceChildren();
      metrics.forEach(([field, title, description]) => {
        const cell = document.createElement("div");
        const term = document.createElement("dt");
        term.textContent = title;
        const value = document.createElement("dd");
        value.textContent = input[field] || "Not available";
        if (input[field]?.startsWith("D+")) value.dataset.party = "D";
        if (input[field]?.startsWith("R+")) value.dataset.party = "R";
        cell.append(term, value);
        addHelp(term, description, `forecast-help-${field}`, cell);
        grid.append(cell);
      });
    }
    stateSelect.addEventListener("change", renderDetails);
    renderDetails();
  }
  if (office === "senate") {
    // Current caucus balance: 45 Democrats + 2 independents, 53 Republicans.
    // https://www.senate.gov/about/parties-leadership/party-division.shtml
    const currentSeats = { D: 47, R: 53 };
    const totals = Object.fromEntries(Object.entries(currentSeats).map(([party, count]) => [party,
      count - [...currentParties.values()].filter(held => held === party).length
        + races.filter(race => race[1][0] === party).length
    ]));
    document.querySelector("#forecast-senate-dem-total").textContent = totals.D;
    document.querySelector("#forecast-senate-rep-total").textContent = totals.R;
    document.querySelector("#forecast-senate-bar-dem").style.flex = String(totals.D);
    document.querySelector("#forecast-senate-bar-rep").style.flex = String(totals.R);
    document.querySelector("#forecast-senate-balance").setAttribute("aria-label",
      `Projected Senate: ${totals.D} Democratic caucus seats, including 2 independents, and ${totals.R} Republican seats. 51 seats to control.`);
  }

  const status = document.querySelector(".forecast-2026-map-status");
  const tooltip = document.createElement("div");
  tooltip.id = "forecast-2026-tooltip";
  tooltip.className = "tooltip forecast-2026-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("aria-hidden", "true");
  document.body.append(tooltip);
  function hideTooltip() {
    tooltip.style.opacity = "0";
    tooltip.setAttribute("aria-hidden", "true");
  }
  function showTooltip(event, state) {
    const race = byState.get(state.properties.name);
    if (!race) { hideTooltip(); return; }
    tooltip.replaceChildren();
    const header = document.createElement("div");
    header.className = "tooltip-header";
    const title = document.createElement("div");
    title.className = "tooltip-title";
    title.textContent = race[0];
    const election = document.createElement("div");
    election.className = "tooltip-ev";
    election.textContent = `${office === "senate" ? "U.S. Senate" : "Governor"}${race[2] ? " · Special election" : ""}`;
    header.append(title, election);
    const caption = document.createElement("div");
    caption.className = "forecast-2026-tooltip-caption";
    caption.textContent = outcome(race);
    const margin = document.createElement("strong");
    margin.className = "forecast-input-prediction";
    margin.style.color = color(race[1]);
    margin.textContent = race[1];
    tooltip.append(header, caption, margin);
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.type === "focus" ? bounds.x + bounds.width / 2 : event.clientX;
    const y = event.type === "focus" ? bounds.y + bounds.height / 2 : event.clientY;
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const left = Math.max(12, Math.min(x + 16, window.innerWidth - width - 12));
    const top = Math.max(12, Math.min(y + 16, window.innerHeight - height - 12));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = "1";
    tooltip.setAttribute("aria-hidden", "false");
  }
  document.addEventListener("keydown", event => { if (event.key === "Escape") hideTooltip(); });
  document.addEventListener("pointerdown", event => {
    if (!event.target.closest("#forecast-2026-map")) hideTooltip();
  });
  window.addEventListener("scroll", hideTooltip, { passive: true });
  window.addEventListener("resize", hideTooltip);
  if (!window.d3 || !window.topojson) {
    status.textContent = "The forecast map could not load. Please refresh the page to try again.";
    return;
  }
  const abbreviations = {
    Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
    Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
    Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
    Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
    Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
    Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
    Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
    Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY"
  };
  const offsets = {
    Michigan: [20, 18], Louisiana: [-10, 5], Hawaii: [-8, 15], Florida: [14, 4],
    Connecticut: [0, 4], Delaware: [22, 10], Massachusetts: [42, 0], Maryland: [-10, -4],
    "New Jersey": [28, 5], "Rhode Island": [40, 15], "New Hampshire": [12, -5], Vermont: [-8, -10]
  };
  const svg = d3.select("#forecast-2026-map");
  const defs = svg.append("defs");
  [["D", "#5a96c8", "#2879b5"], ["R", "#d86a6a", "#cf2f2f"]].forEach(([party, light, base]) => {
    const pattern = defs.append("pattern")
      .attr("id", `forecast-2026-${party}-flip`)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12).attr("height", 12).attr("patternTransform", "rotate(45)");
    pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", light);
    pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", base);
  });
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
    const states = topojson.feature(us, us.objects.states).features.filter(state => abbreviations[state.properties.name]);
    const detailSvg = d3.select("#forecast-detail-shape");
    const detailDefs = detailSvg.append("defs");
    [["D", "#5a96c8", "#2879b5"], ["R", "#d86a6a", "#cf2f2f"]].forEach(([party, light, base]) => {
      const pattern = detailDefs.append("pattern").attr("id", `forecast-detail-${party}-flip`)
        .attr("patternUnits", "userSpaceOnUse").attr("width", 12).attr("height", 12)
        .attr("patternTransform", "rotate(45)");
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", light);
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", base);
    });
    const detailPath = detailSvg.append("path");
    renderStateShape = () => {
      const race = byState.get(stateSelect?.value);
      const state = states.find(feature => feature.properties.name === race?.[0]);
      if (!state) return;
      const detailProjection = d3.geoAlbersUsa().fitExtent([[12, 12], [268, 208]], state);
      detailPath.attr("d", d3.geoPath(detailProjection)(state))
        .attr("fill", isFlip(race) ? `url(#forecast-detail-${race[1][0]}-flip)` : color(race[1]));
      detailSvg.attr("aria-label", `${race[0]}: ${outcome(race)}, ${race[1]}`);
    };
    renderStateShape();
    const projection = d3.geoAlbersUsa().fitExtent([[38, 28], [1522, 872]], { type: "FeatureCollection", features: states });
    const path = d3.geoPath(projection);
    const artwork = svg.append("g");
    artwork.selectAll("path").data(states).join("path")
      .attr("d", path)
      .attr("class", state => `forecast-senate-state ${byState.has(state.properties.name) ? "is-on-map" : "is-muted"}`)
      .attr("fill", state => {
        const race = byState.get(state.properties.name);
        if (!race) return "#b7bdc7";
        return isFlip(race) ? `url(#forecast-2026-${race[1][0]}-flip)` : color(race[1]);
      })
      .attr("tabindex", state => byState.has(state.properties.name) ? 0 : null)
      .attr("role", state => byState.has(state.properties.name) ? "button" : null)
      .attr("aria-label", state => byState.has(state.properties.name) ? label(byState.get(state.properties.name)) : `${state.properties.name}: no race`)
      .attr("aria-describedby", state => byState.has(state.properties.name) ? tooltip.id : null)
      .on("mouseover mousemove focus click", showTooltip)
      .on("click.details", (_, state) => {
        if (!stateSelect || !byState.has(state.properties.name)) return;
        stateSelect.value = state.properties.name;
        stateSelect.dispatchEvent(new Event("change"));
      })
      .on("mouseout blur", hideTooltip)
      .on("keydown", (event, state) => {
        if ((event.key === "Enter" || event.key === " ") && byState.has(state.properties.name)) {
          event.preventDefault();
          event.currentTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      });
    artwork.selectAll("text").data(states.filter(state => byState.has(state.properties.name))).join("text")
      .attr("class", "forecast-senate-map-label")
      .attr("transform", state => {
        const [x, y] = path.centroid(state);
        const [dx, dy] = offsets[state.properties.name] || [0, 0];
        return `translate(${x + dx},${y + dy})`;
      }).text(state => abbreviations[state.properties.name]);
    const bounds = artwork.node().getBBox();
    artwork.attr("transform", `translate(${800 - bounds.x - bounds.width / 2},${450 - bounds.y - bounds.height / 2})`);
    status.textContent = "";
  }).catch(() => {
    status.textContent = "The forecast map could not load. Please refresh the page to try again.";
  });
})();
