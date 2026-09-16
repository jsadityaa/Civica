const governorData = window.GOVERNOR_2024_DATA;

if (governorData && document.getElementById("governor-dem-count")) {
  const governorMapSvg = d3.select("#governor-election-map");
  const governorTooltip = d3.select("#governor-map-tooltip");
  const stateAbbreviations = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
  };

  const labelAdjustments = {
    "Delaware": [16, 6],
    "New Hampshire": [28, -3],
    "North Carolina": [10, 6],
    "West Virginia": [-8, 8],
    "Vermont": [22, -6],
    "Washington": [-10, 2]
  };

  const raceLookup = new Map(governorData.races.map((race) => [race.state, race]));

  function fillForRace(race) {
    if (!race) return "#3a3d42";
    if (race.flipped) return "url(#governor-rep-flip-pattern)";
    return race.winnerParty === "D" ? "#2879b5" : "#cf2f2f";
  }

  function partyClass(party) {
    if (party === "Dem.") return "dem";
    if (party === "Rep.") return "rep";
    return "ind";
  }

  function tooltipHTML(stateName) {
    const race = raceLookup.get(stateName);
    if (!race) {
      return `
        <div class="tooltip-header">
          <div class="tooltip-title">${stateName}</div>
          <div class="tooltip-ev">No governor race</div>
        </div>
        <table>
          <tbody>
            <tr><td>No 2024 governor contest was on the ballot in this state.</td></tr>
          </tbody>
        </table>
      `;
    }

    const rows = race.candidates.map((candidate, index) => `
      <tr class="${index === 0 ? "winner-row" : ""}">
        <td>
          <div class="tooltip-candidate">
            <span class="tooltip-candidate-bar ${partyClass(candidate.party)}"></span>
            <span>${candidate.name}</span>
          </div>
        </td>
        <td>${candidate.party}</td>
        <td>${candidate.votes}</td>
        <td>${candidate.pct}%</td>
      </tr>
    `).join("");

    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${stateName}</div>
        <div class="tooltip-ev">100% of votes in</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Candidate</th>
            <th>Party</th>
            <th>Votes</th>
            <th>Pct.</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function positionTooltip(event) {
    const node = governorTooltip.node();
    if (!node) return;
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    let left = event.clientX - width / 2;
    let top = event.clientY + 18;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    top = Math.min(top, window.innerHeight - height - 12);
    governorTooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  function buildMapPatterns() {
    const defs = governorMapSvg.append("defs");
    defs.append("pattern")
      .attr("id", "governor-rep-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call((pattern) => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#d86a6a");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#cf2f2f");
      });
  }

  function renderSummary() {
    const summary = governorData.summary;
    document.getElementById("governor-dem-count").textContent = summary.demWins;
    document.getElementById("governor-rep-count").textContent = summary.repWins;
    document.getElementById("governor-bar-dem").style.flex = String(summary.demWins);
    document.getElementById("governor-bar-rep").style.flex = String(summary.repWins);
    document.getElementById("governor-votes-dem").textContent = `${summary.demWins} Democratic wins`;
    document.getElementById("governor-votes-total").textContent = `${summary.totalRaces} governor races settled in 2024`;
    document.getElementById("governor-votes-rep").textContent = `${summary.repWins} Republican wins`;
  }

  function renderRaceBoard() {
    const board = document.getElementById("governor-race-board");
    if (!board) return;

    board.innerHTML = governorData.races
      .map((race) => {
        const winnerClass = race.winnerParty === "D" ? "dem" : "rep";
        const winnerPartyLabel = race.winnerParty === "D" ? "Dem." : "Rep.";
        const winnerCandidate = race.candidates.find((candidate) => candidate.party === winnerPartyLabel);
        const opponent = race.candidates.find((candidate) => candidate.party !== winnerPartyLabel);
        const status = race.flipped
          ? "Republican flip"
          : race.winnerParty === "D" ? "Democratic hold" : "Republican hold";
        const statusClass = race.winnerParty === "D" ? "dem" : "rep";
        return `
          <div class="results-board-row">
            <div class="results-board-race">
              <strong>${race.state}</strong>
              <span>Governor election</span>
            </div>
            <div class="results-board-winner ${winnerClass}">
              ${(winnerCandidate && winnerCandidate.name) || race.winner} defeated ${opponent ? `${opponent.name} (${opponent.party.replace(".", "")})` : "the field"}
            </div>
            <div class="results-board-party ${winnerClass}">${race.result}</div>
            <div class="results-board-status ${statusClass}">${status}</div>
          </div>
        `;
      })
      .join("");
  }

  function renderGovernorForecastBoard() {
    const board = document.getElementById("governor-forecast-board");
    if (!board) return;

    const sections = [
      { id: "dem-easy", title: "Democrats expected to win easily", column: 0 },
      { id: "dem-narrow", title: "Democrats expected to win narrowly", column: 1 },
      { id: "competitive", title: "Most competitive states", column: 2 },
      { id: "rep-narrow", title: "Republicans expected to win narrowly", column: 3 },
      { id: "rep-easy", title: "Republicans expected to win easily", column: 4 }
    ];
    const columns = [[], [], [], [], []];
    const nytGovernorGroups = [
      { state: "Delaware", group: "dem-easy", margin: "D+12", party: "D" },
      { state: "North Carolina", group: "dem-narrow", margin: "D+15", party: "D" },
      { state: "Washington", group: "dem-narrow", margin: "D+11", party: "D" },
      { state: "New Hampshire", group: "competitive", margin: "R+9", party: "R" },
      { state: "Indiana", group: "rep-narrow", margin: "R+13", party: "R" },
      { state: "Missouri", group: "rep-easy", margin: "R+20", party: "R" },
      { state: "Montana", group: "rep-easy", margin: "R+20", party: "R" },
      { state: "North Dakota", group: "rep-easy", margin: "R+42", party: "R" },
      { state: "Utah", group: "rep-easy", margin: "R+24", party: "R" },
      { state: "Vermont", group: "rep-easy", margin: "R+52", party: "R" },
      { state: "West Virginia", group: "rep-easy", margin: "R+30", party: "R" }
    ];

    sections.forEach((section) => {
      const list = nytGovernorGroups
        .filter((race) => race.group === section.id)
        .sort((a, b) => nytGovernorGroups.indexOf(a) - nytGovernorGroups.indexOf(b));
      columns[section.column].push({ ...section, list });
    });

    board.innerHTML = `
      <div class="state-results-grid governor-results-grid">
        ${columns.map((column) => `
          <div class="state-results-column">
            ${column.map((section) => `
              <section class="state-results-group">
                <h3 class="state-results-title">${section.title}</h3>
                <table class="state-results-table">
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>Margin</th>
                      <th>% In</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${section.list.length ? section.list.map((race) => `
                      <tr>
                        <td><span class="state-link">${race.state}</span></td>
                        <td>
                          <span class="margin-box ${race.party === "D" ? "dem-win" : "rep-win"}">
                            ${race.margin}
                          </span>
                        </td>
                        <td class="state-percent">100%</td>
                      </tr>
                    `).join("") : `
                      <tr class="state-results-empty-row">
                        <td colspan="3">No races</td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </section>
            `).join("")}
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderMap() {
    if (!window.topojson || governorMapSvg.empty()) return;

    buildMapPatterns();
    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);

    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then((us) => {
      const states = topojson.feature(us, us.objects.states).features;
      const stateCollection = { type: "FeatureCollection", features: states };
      const mapFitArea = [[42, 8], [1392, 892]];
      projection.fitExtent(mapFitArea, stateCollection);

      const initialBounds = path.bounds(stateCollection);
      const currentCenterX = (initialBounds[0][0] + initialBounds[1][0]) / 2;
      const currentCenterY = (initialBounds[0][1] + initialBounds[1][1]) / 2;
      const targetCenterX = (mapFitArea[0][0] + mapFitArea[1][0]) / 2;
      const targetCenterY = (mapFitArea[0][1] + mapFitArea[1][1]) / 2;
      const currentTranslate = projection.translate();
      projection.translate([
        currentTranslate[0] + (targetCenterX - currentCenterX),
        currentTranslate[1] + (targetCenterY - currentCenterY)
      ]);

      governorMapSvg.selectAll(".governor-state-2024")
        .data(states)
        .enter()
        .append("path")
        .attr("class", "governor-state-2024")
        .attr("d", path)
        .attr("fill", (feature) => fillForRace(raceLookup.get(feature.properties.name)))
        .on("mouseover", (event, feature) => {
          d3.select(event.currentTarget).classed("is-active", true);
          governorTooltip.style("opacity", 1).html(tooltipHTML(feature.properties.name));
          positionTooltip(event);
        })
        .on("mousemove", positionTooltip)
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).classed("is-active", false);
          governorTooltip.style("opacity", 0);
        });

      governorMapSvg.selectAll(".map-label")
        .data(states)
        .enter()
        .append("text")
        .attr("class", "map-label")
        .attr("x", (feature) => path.centroid(feature)[0] + (labelAdjustments[feature.properties.name]?.[0] || 0))
        .attr("y", (feature) => path.centroid(feature)[1] + (labelAdjustments[feature.properties.name]?.[1] || 0))
        .text((feature) => raceLookup.has(feature.properties.name) ? (stateAbbreviations[feature.properties.name] || "") : "");
    });
  }

  renderSummary();
  renderRaceBoard();
  renderGovernorForecastBoard();
  renderMap();
}
