const senateData = window.SENATE_2024_DATA;
let senateStateResultsSortMode = "margin";

if (senateData && document.getElementById("senate-dem-count")) {
  const PARTY_CLASS = {
    D: "dem",
    R: "rep",
    I: "ind"
  };

  const senateMapSvg = d3.select("#senate-election-map");
  const senateTooltip = d3.select("#senate-map-tooltip");
  const senateStateAbbreviations = {
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

  const senateLabelAdjustments = {
    "Michigan": [20, 18],
    "Louisiana": [-10, 5],
    "Rhode Island": [10, 5],
    "Hawaii": [-8, 15],
    "Alaska": [2, 0],
    "Connecticut": [0, 4],
    "Delaware": [19, 7],
    "Florida": [14, 4],
    "Massachusetts": [40, 0],
    "Maryland": [-10, -4],
    "New Jersey": [25, 5]
  };

  const senateRaceLookup = senateData.races.reduce((acc, race) => {
    const existing = acc.get(race.race) || [];
    existing.push({
      ...race,
      coalitionParty: race.winnerParty === "R" ? "R" : "D"
    });
    acc.set(race.race, existing);
    return acc;
  }, new Map());

  function senateFillKey(race) {
    if (!race) return "#3a3d42";
    if (race.winnerParty === "I") return "#c8a44d";
    if (race.flipped) {
      return race.coalitionParty === "D" ? "url(#senate-dem-flip-pattern)" : "url(#senate-rep-flip-pattern)";
    }
    return race.coalitionParty === "D" ? "#2879b5" : "#cf2f2f";
  }

  function buildMapPatterns() {
    const defs = senateMapSvg.append("defs");

    defs.append("pattern")
      .attr("id", "senate-dem-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call(pattern => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#5a96c8");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#2879b5");
      });

    defs.append("pattern")
      .attr("id", "senate-rep-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call(pattern => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#d86a6a");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#cf2f2f");
      });
  }

  function senateTooltipHTML(stateName, seatType = null) {
    const races = senateRaceLookup.get(stateName) || [];
    if (!races.length) {
      return `
        <div class="tooltip-header">
          <div class="tooltip-title">${stateName}</div>
          <div class="tooltip-ev">No Senate race</div>
        </div>
        <table>
          <tbody>
            <tr><td>No 2024 Senate contest was on the ballot in this state.</td></tr>
          </tbody>
        </table>
      `;
    }

    const preferredRace = seatType
      ? races.find(race => race.seatType === seatType)
      : (races.find(race => race.seatType === "Regular") || races[0]);
    if (!preferredRace) {
      return `
        <div class="tooltip-header">
          <div class="tooltip-title">${stateName}</div>
          <div class="tooltip-ev">No Senate race</div>
        </div>
        <table>
          <tbody>
            <tr><td>No matching 2024 Senate contest was found for this state.</td></tr>
          </tbody>
        </table>
      `;
    }
    const rows = (preferredRace.tooltipRows || [
      {
        name: preferredRace.winner,
        party: preferredRace.winnerParty === "I" ? "Ind." : preferredRace.winnerParty === "D" ? "Dem." : "Rep.",
        votes: "—",
        pct: preferredRace.result.replace(/^[A-Z]\+/, "")
      },
      {
        name: preferredRace.opponent,
        party: preferredRace.opponentParty === "I" ? "Ind." : preferredRace.opponentParty === "D" ? "Dem." : "Rep.",
        votes: "—",
        pct: "—"
      }
    ]).map((candidate, index) => `
      <tr class="${index === 0 ? "winner-row" : ""}">
        <td>
          <div class="tooltip-candidate">
            <span class="tooltip-candidate-bar ${candidate.party === "Dem." ? "dem" : candidate.party === "Rep." ? "rep" : "ind"}"></span>
            <span>${candidate.name}</span>
          </div>
        </td>
        <td>${candidate.party}</td>
        <td>${candidate.votes}</td>
        <td>${candidate.pct}${candidate.pct === "—" ? "" : "%"}</td>
      </tr>
    `).join("");

    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${stateName}</div>
        <div class="tooltip-ev">${preferredRace.seatType === "Special" ? "Special · " : ""}100% of votes in</div>
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
    const node = senateTooltip.node();
    if (!node) return;
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    let left = event.clientX - width / 2;
    let top = event.clientY + 18;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    top = Math.min(top, window.innerHeight - height - 12);
    senateTooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  function renderSummary() {
    const summary = senateData.summary;

    document.getElementById("senate-dem-count").textContent = summary.demSeats;
    document.getElementById("senate-rep-count").textContent = summary.repSeats;
    document.getElementById("senate-bar-dem").style.flex = String(summary.demSeats);
    document.getElementById("senate-bar-rep").style.flex = String(summary.repSeats);
    document.getElementById("senate-votes-dem").textContent = summary.demFlips > summary.repFlips ? `Flipped ${summary.demFlips} seats` : "";
    document.getElementById("senate-votes-total").textContent = `${summary.indSeats} independents · ${summary.contestedSeats} contests settled in 2024`;
    document.getElementById("senate-votes-rep").textContent = summary.repFlips > summary.demFlips ? `Flipped ${summary.repFlips} seats` : "";

    document.getElementById("senate-stat-control").textContent = `${summary.repSeats}-${summary.demSeats}`;
    document.getElementById("senate-stat-control-copy").textContent = "Republicans finished the cycle with 53 seats, while the Democratic caucus held 47 including two independents.";
    document.getElementById("senate-stat-flips").textContent = `${summary.repFlips}`;
    document.getElementById("senate-stat-flips-copy").textContent = "Republicans flipped Montana, Ohio, Pennsylvania, and West Virginia.";
    document.getElementById("senate-stat-contested").textContent = `${summary.contestedSeats}`;
    document.getElementById("senate-stat-contested-copy").textContent = "That total includes the Nebraska special election held alongside the regular contest.";
  }

  function renderRaceBoard() {
    const host = document.getElementById("senate-race-board");
    const closest = [...senateData.races]
      .sort((a, b) => parseFloat(a.result.split("+")[1]) - parseFloat(b.result.split("+")[1]))
      .slice(0, 5);
    const flips = senateData.races.filter(race => race.flipped);

    host.innerHTML = senateData.races
      .map(race => {
        const winnerClass = PARTY_CLASS[race.winnerParty] || "";
        const opponentLabel = `${race.opponent} (${race.opponentParty})`;
        const statusClass = race.status.startsWith("Republican") ? "rep" : race.status.startsWith("Democratic") ? "dem" : "ind";
        const seatLabel = race.seatType === "Special" ? `${race.race} Special` : race.race;
        const caucusNote = race.caucus ? `<span>${race.caucus}</span>` : "";

        return `
          <div class="results-board-row">
            <div class="results-board-race">
              <strong>${seatLabel}</strong>
              <span>${race.seatType} election</span>
            </div>
            <div class="results-board-winner ${winnerClass}">
              ${race.winner} defeated ${opponentLabel}
              ${caucusNote}
            </div>
            <div class="results-board-party ${winnerClass}">${formatSenateResultLabel(race)}</div>
            <div class="results-board-status ${statusClass}">${race.status}</div>
          </div>
        `;
      })
      .join("");

    document.getElementById("senate-closest-list").innerHTML = closest
      .map(race => `
        <div class="house-note-item">
          <div class="house-note-title">${race.race}${race.seatType === "Special" ? " Special" : ""}</div>
          <div class="house-note-meta ${PARTY_CLASS[race.winnerParty] || "ind"}">${formatSenateResultLabel(race)}</div>
        </div>
      `)
      .join("");

    document.getElementById("senate-flips-list").innerHTML = flips
      .map(race => `
        <div class="house-note-item">
          <div class="house-note-title">${race.race}</div>
          <div class="house-note-meta rep">${race.status}</div>
        </div>
      `)
      .join("");
  }

  function parseResultMargin(resultLabel) {
    return Number(String(resultLabel || "0").split("+")[1] || 0);
  }

  function formatSenateMarginValue(value) {
    const numeric = Number(value || 0);
    const rounded = numeric < 1 ? numeric.toFixed(2) : numeric.toFixed(1);
    return rounded;
  }

  function formatSenateResultLabel(race) {
    const prefix = race.winnerParty === 'D' ? 'D' : race.winnerParty === 'R' ? 'R' : 'I';
    return `${prefix}+${formatSenateMarginValue(parseResultMargin(race.result))}`;
  }

  function senateStateResultLinkHref(name, seatType = "Regular") {
    const params = new URLSearchParams({ name });
    if (seatType && seatType !== "Regular") {
      params.set("seat", seatType);
    }
    return `./senate-state-result.html?${params.toString()}`;
  }

  function getStateResultsEntries() {
    return Array.from(senateRaceLookup.entries()).flatMap(([name, races]) => {
      const primaryRace = races.find((race) => race.seatType === "Regular") || races[0];
      const primaryEntry = {
        name,
        displayName: name,
        winnerParty: primaryRace.winnerParty,
        winner: primaryRace.winner,
        status: primaryRace.status,
        result: formatSenateResultLabel(primaryRace),
        margin: parseResultMargin(primaryRace.result),
        flipped: Boolean(primaryRace.flipped),
        seatType: primaryRace.seatType,
        extraRaceCount: Math.max(0, races.length - 1)
      };

      const specialEntries = races
        .filter((race) => race !== primaryRace)
        .map((race) => ({
          name,
          displayName: `${name} (${race.seatType})`,
          winnerParty: race.winnerParty,
          winner: race.winner,
          status: race.status,
          result: formatSenateResultLabel(race),
          margin: parseResultMargin(race.result),
          flipped: Boolean(race.flipped),
          seatType: race.seatType,
          extraRaceCount: 0
        }));

      return [primaryEntry, ...specialEntries];
    });
  }

  function senateMarginClassForResult(result) {
    if (result.winnerParty === "I") return result.flipped ? "ind-flip" : "ind-win";
    if (result.winnerParty === "D") return result.flipped ? "dem-flip" : "dem-win";
    return result.flipped ? "rep-flip" : "rep-win";
  }

  function getStateResultsGroup(result) {
    if (result.winnerParty === "I") return "ind";
    if (result.margin < 5) return "competitive";
    if (result.winnerParty === "D" && result.margin < 10) return "dem-narrow";
    if (result.winnerParty === "D") return "dem-strong";
    if (result.margin < 10) return "rep-narrow";
    return "rep-strong";
  }

  function renderStateResults() {
    const board = document.getElementById("senate-state-results-board");
    const closestList = document.getElementById("senate-closest-states-list");
    const flippedList = document.getElementById("senate-flipped-states-list");
    const demCount = document.getElementById("senate-states-won-dem");
    const repCount = document.getElementById("senate-states-won-rep");
    const indCount = document.getElementById("senate-states-won-ind");
    const sortButtons = document.querySelectorAll(".senate-state-results-sort-button");

    if (!board) return;

    sortButtons.forEach((button) => {
      const isActive = button.dataset.sort === senateStateResultsSortMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const results = getStateResultsEntries();
    const uniqueStatePrimaries = Array.from(senateRaceLookup.entries()).map(([name, races]) => {
      const primaryRace = races.find((race) => race.seatType === "Regular") || races[0];
      return { name, winnerParty: primaryRace.winnerParty, flipped: Boolean(primaryRace.flipped), result: formatSenateResultLabel(primaryRace), margin: parseResultMargin(primaryRace.result) };
    });
    const sections = [
      { id: "dem-strong", title: "Democratic wins", column: 0 },
      { id: "dem-narrow", title: "Democratic edge", column: 0 },
      { id: "ind", title: "Independent wins", column: 1 },
      { id: "competitive", title: "Most competitive races", column: 1 },
      { id: "rep-narrow", title: "Republican edge", column: 2 },
      { id: "rep-strong", title: "Republican wins", column: 2 }
    ];
    const columns = [[], [], []];

    sections.forEach((section) => {
      const list = results
        .filter((result) => getStateResultsGroup(result) === section.id)
        .sort((a, b) => {
          if (senateStateResultsSortMode === "alphabetical") {
            return a.displayName.localeCompare(b.displayName);
          }
          return b.margin - a.margin || a.displayName.localeCompare(b.displayName);
        });

      if (list.length) {
        columns[section.column].push({ ...section, list });
      }
    });

    board.innerHTML = `
      <div class="state-results-grid">
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
                    ${section.list.map((result) => `
                      <tr>
                        <td><a class="state-link" href="${senateStateResultLinkHref(result.name, result.seatType)}">${result.displayName}</a></td>
                        <td><span class="margin-box ${senateMarginClassForResult(result)}">${result.result}</span></td>
                        <td class="state-percent">100%</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </section>
            `).join("")}
          </div>
        `).join("")}
      </div>
    `;

    const closest = results
      .slice()
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 6);
    const flips = results.filter((result) => result.flipped);

    if (closestList) {
      closestList.innerHTML = closest.map((result) => `
        <li>
          <span class="state-side-name">${result.displayName}</span>
          <span class="state-side-value">${result.result}</span>
        </li>
      `).join("");
    }

    if (flippedList) {
      flippedList.innerHTML = flips.map((result) => `
        <li>
          <span class="state-side-name">${result.displayName}</span>
          <span class="state-side-value">${result.result}</span>
        </li>
      `).join("");
    }

    if (demCount) demCount.textContent = String(uniqueStatePrimaries.filter((result) => result.winnerParty === "D").length);
    if (repCount) repCount.textContent = String(uniqueStatePrimaries.filter((result) => result.winnerParty === "R").length);
    if (indCount) indCount.textContent = String(uniqueStatePrimaries.filter((result) => result.winnerParty === "I").length);
  }

  function initStateResultsControls() {
    const sortButtons = document.querySelectorAll(".senate-state-results-sort-button");
    sortButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextMode = button.dataset.sort;
        if (!nextMode || nextMode === senateStateResultsSortMode) return;
        senateStateResultsSortMode = nextMode;
        renderStateResults();
      });
    });
  }

  function renderMap() {
    if (!window.topojson || senateMapSvg.empty()) return;

    buildMapPatterns();

    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);

    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
      const states = topojson.feature(us, us.objects.states).features;
      const stateCollection = { type: "FeatureCollection", features: states };
      const mapFitArea = [[18, 8], [1368, 892]];
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

      senateMapSvg.selectAll(".senate-state")
        .data(states)
        .enter()
        .append("path")
        .attr("class", "senate-state")
        .attr("d", path)
        .attr("fill", feature => {
          const races = senateRaceLookup.get(feature.properties.name) || [];
          return senateFillKey(races[0]);
        })
        .on("mouseover", (event, feature) => {
          d3.select(event.currentTarget).classed("is-active", true);
          senateTooltip.style("opacity", 1).html(senateTooltipHTML(feature.properties.name));
          positionTooltip(event);
        })
        .on("mousemove", positionTooltip)
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).classed("is-active", false);
          senateTooltip.style("opacity", 0);
        });

      senateMapSvg.selectAll(".map-label")
        .data(states)
        .enter()
        .append("text")
        .attr("class", "map-label")
        .attr("x", feature => path.centroid(feature)[0] + (senateLabelAdjustments[feature.properties.name]?.[0] || 0))
        .attr("y", feature => path.centroid(feature)[1] + (senateLabelAdjustments[feature.properties.name]?.[1] || 0))
        .text(feature => senateRaceLookup.has(feature.properties.name) ? (senateStateAbbreviations[feature.properties.name] || "") : "");

      const nebraskaSpecial = senateData.races.find((race) => race.race === "Nebraska" && race.seatType === "Special");
      const nebraskaFeature = states.find((feature) => feature.properties.name === "Nebraska");
      if (nebraskaSpecial && nebraskaFeature) {
        const nebraskaBounds = path.bounds(nebraskaFeature);
        const [minX, minY] = nebraskaBounds[0];
        const [maxX, maxY] = nebraskaBounds[1];
        const width = maxX - minX;
        const height = maxY - minY;
        const desiredWidth = 138;
        const scale = desiredWidth / width;
        const targetX = 1274;
        const targetY = 688;
        const insetGroup = senateMapSvg.append("g")
          .attr("class", "senate-special-inset")
          .attr("transform", `translate(${targetX - minX * scale} ${targetY - minY * scale}) scale(${scale})`);

        insetGroup.append("path")
          .attr("class", "senate-special-shape")
          .attr("d", path(nebraskaFeature))
          .attr("fill", senateFillKey({ ...nebraskaSpecial, coalitionParty: nebraskaSpecial.winnerParty === "R" ? "R" : "D" }))
          .on("mouseover", (event) => {
            d3.select(event.currentTarget).classed("is-active", true);
            senateTooltip.style("opacity", 1).html(senateTooltipHTML("Nebraska", "Special"));
            positionTooltip(event);
          })
          .on("mousemove", positionTooltip)
          .on("mouseout", (event) => {
            d3.select(event.currentTarget).classed("is-active", false);
            senateTooltip.style("opacity", 0);
          });

        const labelGroup = senateMapSvg.append("g")
          .attr("class", "senate-special-label-group")
          .attr("transform", `translate(${targetX + desiredWidth + 8} ${targetY + (height * scale) / 2 - 8})`);

        labelGroup.append("text")
          .attr("class", "senate-special-label")
          .attr("x", 0)
          .attr("y", 0)
          .text("Neb.");

        labelGroup.append("text")
          .attr("class", "senate-special-label")
          .attr("x", 0)
          .attr("y", 16)
          .text("special");
      }
    });
  }

  renderSummary();
  renderRaceBoard();
  renderStateResults();
  initStateResultsControls();
  renderMap();
}
