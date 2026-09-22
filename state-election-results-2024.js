const STATE_ELECTION_COUNTY_RESULTS_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const STATE_ELECTION_COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATE_ELECTION_STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_ELECTION_FIPS_BY_NAME = {
  Alabama: "01"
};

const STATE_ELECTION_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const STATE_ELECTION_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const STATE_ELECTION_LEAD_MODE_STATES = new Set(["Alabama"]);
const STATE_ELECTION_MAJOR_CITY_LABELS = {
  Alabama: [
    { name: "Huntsville", coordinates: [-86.5861, 34.7304] },
    { name: "Birmingham", coordinates: [-86.8025, 33.5186] },
    { name: "Tuscaloosa", coordinates: [-87.5692, 33.2098] },
    { name: "Montgomery", coordinates: [-86.3000, 32.3668] },
    { name: "Mobile", coordinates: [-88.0431, 30.6954] }
  ]
};
const STATE_ELECTION_HOUSE_OVERRIDES = {
  "AL-03": { winnerParty: "R", fillKey: "Rep", marginLabel: "Uncontested", totalVotesFormatted: "Vote total unavailable" },
  "AL-04": { winnerParty: "R", fillKey: "Rep", marginLabel: "Uncontested", totalVotesFormatted: "Vote total unavailable" },
  "AL-05": { winnerParty: "R", fillKey: "Rep", marginLabel: "Uncontested", totalVotesFormatted: "Vote total unavailable" }
};

function stateElectionFormatVotes(value) {
  return Number(value || 0).toLocaleString();
}

function stateElectionNumberFromVoteString(value) {
  return Number(String(value || "").replace(/,/g, "")) || 0;
}

function stateElectionGetCountyWinner(row) {
  return Number(row.per_dem) >= Number(row.per_gop) ? "Harris" : "Trump";
}

function stateElectionCountyShade(row) {
  const demPct = Number(row.per_dem) * 100;
  const repPct = Number(row.per_gop) * 100;
  const isDem = demPct >= repPct;
  const winnerPct = isDem ? demPct : repPct;
  const shades = isDem ? STATE_ELECTION_DEM_SHADES : STATE_ELECTION_REP_SHADES;

  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

function stateElectionCountyLead(row) {
  return Math.abs(Number(row.votes_gop || 0) - Number(row.votes_dem || 0));
}

function stateElectionFormatCountyName(name) {
  const base = String(name || "")
    .trim()
    .replace(/\s+County$/i, "")
    .replace(/\s+Parish$/i, "")
    .replace(/\s+Borough$/i, "")
    .replace(/\s+Census Area$/i, "")
    .replace(/\s+Municipality$/i, "")
    .replace(/\s+city$/i, "");

  return `${base} County`;
}

function stateElectionFormatPresidentialMargin(row) {
  const winner = stateElectionGetCountyWinner(row);
  const points = Math.abs(Number(row.per_point_diff) * 100);
  return `${winner === "Harris" ? "D" : "R"}+${points < 1 ? points.toFixed(2) : points.toFixed(1)}`;
}

function stateElectionPositionTooltip(event, tooltip) {
  const node = tooltip.node();
  if (!node) return;

  const width = node.offsetWidth;
  const height = node.offsetHeight;
  let left = event.clientX - width / 2;
  let top = event.clientY + 18;

  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  top = Math.min(top, window.innerHeight - height - 12);

  tooltip.style("left", `${left}px`).style("top", `${top}px`);
}

function stateElectionCountyTooltipHTML(row, stateName) {
  const winner = stateElectionGetCountyWinner(row);
  const demPct = (Number(row.per_dem) * 100).toFixed(1);
  const repPct = (Number(row.per_gop) * 100).toFixed(1);

  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${stateElectionFormatCountyName(row.county_name)}</div>
      <div class="tooltip-ev">${stateName} presidential result</div>
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
      <tbody>
        <tr class="${winner === "Trump" ? "winner-row" : ""}">
          <td>
            <div class="tooltip-candidate">
              <span class="tooltip-candidate-bar rep"></span>
              <span>Donald J. Trump</span>
            </div>
          </td>
          <td>Rep.</td>
          <td>${stateElectionFormatVotes(row.votes_gop)}</td>
          <td>${repPct}%</td>
        </tr>
        <tr class="${winner === "Harris" ? "winner-row" : ""}">
          <td>
            <div class="tooltip-candidate">
              <span class="tooltip-candidate-bar dem"></span>
              <span>Kamala Harris</span>
            </div>
          </td>
          <td>Dem.</td>
          <td>${stateElectionFormatVotes(row.votes_dem)}</td>
          <td>${demPct}%</td>
        </tr>
      </tbody>
    </table>
  `;
}

function stateElectionCandidatePartyLabel(candidate) {
  const labels = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
    LB: "Libertarian",
    G: "Green"
  };

  return labels[candidate.party] || candidate.partyName || candidate.party || "";
}

function stateElectionCandidatePartyTone(candidate) {
  if (candidate.party === "D") return "dem";
  if (candidate.party === "R") return "rep";
  return "ind";
}

function stateElectionHouseTooltipHTML(district) {
  const rows = (district.candidates || []).map((candidate) => `
    <tr class="${candidate.winner ? "winner-row" : ""}">
      <td>
        <div class="tooltip-candidate">
          <span class="tooltip-candidate-bar ${stateElectionCandidatePartyTone(candidate)}"></span>
          <span>${candidate.name}</span>${candidate.incumbent ? `<span class="tooltip-incumbent">Inc.</span>` : ""}
        </div>
      </td>
      <td>${stateElectionCandidatePartyLabel(candidate)}</td>
      <td>${district.uncontested || Number(candidate.votes) === 0 ? "-" : candidate.votesFormatted}</td>
      <td>${district.uncontested || Number(candidate.votes) === 0 ? "-" : `${candidate.pctFormatted}%`}</td>
    </tr>
  `).join("");

  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${district.title}</div>
      <div class="tooltip-ev">100% in</div>
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

function stateElectionFormatStateMargin(result) {
  const harrisPct = Number(result.dP || 0);
  const trumpPct = Number(result.rP || 0);
  const diff = Math.abs(harrisPct - trumpPct);
  const prefix = harrisPct > trumpPct ? "D" : "R";
  return `${prefix}+${diff < 1 ? diff.toFixed(2) : diff.toFixed(1)}`;
}

function stateElectionWinnerName(result) {
  return result.winner && result.winner.startsWith("Harris") ? "Kamala Harris" : "Donald Trump";
}

function stateElectionHouseFill(fillKey) {
  if (fillKey === "Dem" || fillKey === "DemFlip") return "#2879b5";
  if (fillKey === "Rep" || fillKey === "RepFlip") return "#cf2f2f";
  return "#c8a24a";
}

function stateElectionPartyClass(party) {
  if (party === "D" || party === "Democrat") return "dem";
  if (party === "R" || party === "Republican") return "rep";
  return "ind";
}

function stateElectionDistrictLink(code) {
  return `./house-district-result.html?code=${encodeURIComponent(code)}`;
}

async function stateElectionFetchCountyResults(stateName) {
  const rows = await d3.csv(STATE_ELECTION_COUNTY_RESULTS_URL, (row) => {
    if (row.state_name !== stateName) return null;
    return {
      ...row,
      votes_gop: Number(row.votes_gop),
      votes_dem: Number(row.votes_dem),
      total_votes: Number(row.total_votes),
      per_gop: Number(row.per_gop),
      per_dem: Number(row.per_dem),
      per_point_diff: Number(row.per_point_diff)
    };
  });

  return rows.filter(Boolean);
}

function stateElectionRenderPresidentialSummary(stateName) {
  const result = window.ELECTION_DATA?.[stateName];
  if (!result) return;

  const title = document.getElementById("state-election-presidential-title");
  const ev = document.getElementById("state-election-presidential-ev");
  const margin = document.getElementById("state-election-presidential-margin");
  const total = document.getElementById("state-election-presidential-total");
  const body = document.getElementById("state-election-presidential-candidates");
  const card = document.getElementById("state-election-presidential-card");
  const detailLink = document.getElementById("state-election-presidential-detail-link");

  const winnerName = stateElectionWinnerName(result);
  const totalVotes = stateElectionNumberFromVoteString(result.dV) + stateElectionNumberFromVoteString(result.rV);
  const stateMargin = stateElectionFormatStateMargin(result);
  const winnerTone = winnerName === "Kamala Harris" ? "dem" : "rep";

  if (title) title.textContent = `${winnerName} wins ${stateName}.`;
  if (ev) ev.textContent = result.ev;
  if (margin) margin.textContent = stateMargin;
  if (total) total.textContent = stateElectionFormatVotes(totalVotes);
  if (detailLink) detailLink.href = `./state-result.html?name=${encodeURIComponent(stateName)}`;
  if (card) {
    card.classList.remove("winner-dem", "winner-rep");
    card.classList.add(`winner-${winnerTone}`);
  }
  if (!body) return;

  const rows = [
    { name: "Donald Trump", party: "Rep.", votes: result.rV, pct: `${result.rP}%`, winner: winnerName === "Donald Trump", tone: "rep" },
    { name: "Kamala Harris", party: "Dem.", votes: result.dV, pct: `${result.dP}%`, winner: winnerName === "Kamala Harris", tone: "dem" }
  ].sort((a, b) => stateElectionNumberFromVoteString(b.votes) - stateElectionNumberFromVoteString(a.votes));

  body.innerHTML = rows.map((row) => `
    <tr class="${row.winner ? "winner-row" : ""}">
      <td><span class="candidate-name-inline ${row.tone}">${row.name}</span></td>
      <td>${row.party}</td>
      <td>${row.votes}</td>
      <td>${row.pct}</td>
    </tr>
  `).join("");
}

function stateElectionRenderShareCountyMap({ svg, features, stateFeature, rowByFips, path, tooltip, stateName }) {
  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "detail-county-shape")
    .attr("d", path)
    .attr("fill", (feature) => {
      const row = rowByFips.get(String(feature.id).padStart(5, "0"));
      return row ? stateElectionCountyShade(row) : "#2d3138";
    })
    .on("mouseover", (event, feature) => {
      const row = rowByFips.get(String(feature.id).padStart(5, "0"));
      if (!row) return;
      tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(row, stateName));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  svg.append("path")
    .datum(stateFeature)
    .attr("class", "detail-state-outline")
    .attr("d", path);
}

function stateElectionRenderLeadCountyMap({ svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName }) {
  const maxLead = d3.max(features, (feature) => {
    const row = rowByFips.get(String(feature.id).padStart(5, "0"));
    return row ? stateElectionCountyLead(row) : 0;
  }) || 1;
  const radius = d3.scaleSqrt().domain([0, maxLead]).range([2.5, 40]);

  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "state-election-lead-county-shape")
    .attr("d", path);

  svg.append("path")
    .datum(stateFeature)
    .attr("class", "state-election-lead-state-outline")
    .attr("d", path);

  const bubbleData = features
    .map((feature) => {
      const row = rowByFips.get(String(feature.id).padStart(5, "0"));
      const centroid = path.centroid(feature);
      return row ? { feature, row, centroid } : null;
    })
    .filter(Boolean)
    .sort((a, b) => stateElectionCountyLead(b.row) - stateElectionCountyLead(a.row));

  svg.append("g")
    .selectAll("circle")
    .data(bubbleData)
    .enter()
    .append("circle")
    .attr("class", (item) => `state-election-lead-bubble ${stateElectionGetCountyWinner(item.row) === "Harris" ? "dem" : "rep"}`)
    .attr("cx", (item) => item.centroid[0])
    .attr("cy", (item) => item.centroid[1])
    .attr("r", (item) => radius(stateElectionCountyLead(item.row)))
    .on("mouseover", (event, item) => {
      tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(item.row, stateName));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  const cityLabels = STATE_ELECTION_MAJOR_CITY_LABELS[stateName] || [];
  const cityLayer = svg.append("g").attr("class", "state-election-city-labels");

  cityLayer.selectAll("circle")
    .data(cityLabels)
    .enter()
    .append("circle")
    .attr("cx", (city) => projection(city.coordinates)?.[0] || 0)
    .attr("cy", (city) => projection(city.coordinates)?.[1] || 0)
    .attr("r", 2.6);

  cityLayer.selectAll("text")
    .data(cityLabels)
    .enter()
    .append("text")
    .attr("x", (city) => (projection(city.coordinates)?.[0] || 0) + 5)
    .attr("y", (city) => (projection(city.coordinates)?.[1] || 0) + 5)
    .text((city) => city.name);
}

function stateElectionRenderCityLabels(svg, projection, stateName) {
  const cityLabels = STATE_ELECTION_MAJOR_CITY_LABELS[stateName] || [];
  const cityLayer = svg.append("g").attr("class", "state-election-city-labels");

  cityLayer.selectAll("circle")
    .data(cityLabels)
    .enter()
    .append("circle")
    .attr("cx", (city) => projection(city.coordinates)?.[0] || 0)
    .attr("cy", (city) => projection(city.coordinates)?.[1] || 0)
    .attr("r", 2.6);

  cityLayer.selectAll("text")
    .data(cityLabels)
    .enter()
    .append("text")
    .attr("x", (city) => (projection(city.coordinates)?.[0] || 0) + 5)
    .attr("y", (city) => (projection(city.coordinates)?.[1] || 0) + 5)
    .text((city) => city.name);
}

async function stateElectionRenderCountyMap(stateName, rows, mode = "share") {
  const svg = d3.select("#state-election-presidential-county-map");
  const empty = document.getElementById("state-election-county-empty");
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty() || !window.topojson) return;

  svg.selectAll("*").remove();

  const [countiesTopo, statesTopo] = await Promise.all([
    d3.json(STATE_ELECTION_COUNTIES_TOPOJSON_URL),
    d3.json(STATE_ELECTION_STATES_TOPOJSON_URL)
  ]);

  const rowByFips = new Map(rows.map((row) => [row.county_fips, row]));
  const features = topojson
    .feature(countiesTopo, countiesTopo.objects.counties)
    .features
    .filter((feature) => rowByFips.has(String(feature.id).padStart(5, "0")));

  const stateFips = STATE_ELECTION_FIPS_BY_NAME[stateName];
  const stateFeature = topojson
    .feature(statesTopo, statesTopo.objects.states)
    .features
    .find((feature) => String(feature.id).padStart(2, "0") === stateFips);

  if (!features.length || !stateFeature) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const projection = d3.geoMercator().fitSize([540, 520], { type: "FeatureCollection", features });
  const path = d3.geoPath(projection);

  const context = { svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName };
  if (mode === "lead" && STATE_ELECTION_LEAD_MODE_STATES.has(stateName)) {
    stateElectionRenderLeadCountyMap(context);
  } else {
    stateElectionRenderShareCountyMap(context);
  }
}

function stateElectionSetupPresidentialMapMode(stateName, rows) {
  const control = document.getElementById("state-election-presidential-map-mode");
  const legend = document.querySelector("#state-election-presidential .detail-map-legend");
  const leadLegend = document.getElementById("state-election-lead-legend");
  const copy = document.querySelector("#state-election-presidential .detail-map-head p");
  if (!control) return;

  const isEnabled = STATE_ELECTION_LEAD_MODE_STATES.has(stateName);
  control.hidden = !isEnabled;
  if (!isEnabled) return;

  control.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.addEventListener("click", async () => {
      const mode = button.dataset.mapMode || "share";
      control.querySelectorAll("[data-map-mode]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      if (legend) legend.hidden = mode === "lead";
      if (leadLegend) leadLegend.hidden = mode !== "lead";
      if (copy) {
        copy.textContent = mode === "lead"
          ? "Circles sized by each county's raw vote lead."
          : "Counties shaded by 2024 presidential margin.";
      }
      await stateElectionRenderCountyMap(stateName, rows, mode);
    });
  });
}

function stateElectionGetHouseDistricts(stateName) {
  return Object.values(window.HOUSE_2024_DATA?.districts || {})
    .filter((district) => district.stateName === stateName)
    .map((district) => ({
      ...district,
      ...(STATE_ELECTION_HOUSE_OVERRIDES[district.code] || {})
    }))
    .sort((a, b) => Number(a.district) - Number(b.district));
}

function stateElectionRenderHouseList(districts) {
  const list = document.getElementById("state-election-house-list");
  if (!list) return;

  list.innerHTML = districts.map((district) => `
    <a class="state-election-district-card state-election-district-card--${stateElectionPartyClass(district.winnerParty)}" href="${stateElectionDistrictLink(district.code)}">
      <span class="state-election-district-code">${district.code}</span>
      <strong>${district.winnerName}</strong>
      <span>${district.marginLabel} · ${district.totalVotesFormatted}${/unavailable/i.test(district.totalVotesFormatted) ? "" : " votes"}</span>
    </a>
  `).join("");
}

function stateElectionRenderHouseDistrictMap(stateName, districts) {
  const svg = d3.select("#state-election-house-district-map");
  const empty = document.getElementById("state-election-house-empty");
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty()) return;

  svg.selectAll("*").remove();

  const districtByCode = new Map(districts.map((district) => [district.code, district]));
  const features = (window.HOUSE_2024_GEOJSON?.features || [])
    .filter((feature) => feature.properties?.stateName === stateName && districtByCode.has(feature.properties.code));

  if (!features.length) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const projection = d3.geoMercator().fitSize([540, 520], { type: "FeatureCollection", features });
  const path = d3.geoPath(projection);

  svg.append("g")
    .selectAll("a")
    .data(features)
    .enter()
    .append("a")
    .attr("href", (feature) => stateElectionDistrictLink(feature.properties.code))
    .append("path")
    .attr("class", "state-election-district-shape")
    .attr("d", path)
    .attr("fill", (feature) => stateElectionHouseFill(districtByCode.get(feature.properties.code)?.fillKey))
    .attr("stroke", "rgba(255,255,255,0.9)")
    .attr("stroke-width", 1.4)
    .on("mouseover", (event, feature) => {
      const district = districtByCode.get(feature.properties.code);
      if (!district) return;
      tooltip.style("opacity", 1).html(stateElectionHouseTooltipHTML(district));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  stateElectionRenderCityLabels(svg, projection, stateName);
}

async function stateElectionInit() {
  const params = new URLSearchParams(window.location.search);
  const stateName = params.get("name") || "Alabama";

  document.title = `${stateName} Election Results | Polycivic`;
  document.getElementById("state-election-title").textContent = `${stateName} Election Results`;

  stateElectionRenderPresidentialSummary(stateName);

  try {
    const countyRows = await stateElectionFetchCountyResults(stateName);
    await stateElectionRenderCountyMap(stateName, countyRows);
    stateElectionSetupPresidentialMapMode(stateName, countyRows);
  } catch (error) {
    const empty = document.getElementById("state-election-county-empty");
    if (empty) empty.hidden = false;
    console.error(error);
  }

  const houseDistricts = stateElectionGetHouseDistricts(stateName);
  stateElectionRenderHouseList(houseDistricts);
  stateElectionRenderHouseDistrictMap(stateName, houseDistricts);
}

stateElectionInit();
