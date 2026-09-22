const STATE_ELECTION_COUNTY_RESULTS_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const STATE_ELECTION_COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATE_ELECTION_STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_ELECTION_FIPS_BY_NAME = {
  Alabama: "01"
};

const STATE_ELECTION_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const STATE_ELECTION_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
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
  const summary = document.getElementById("state-election-presidential-summary");
  const ev = document.getElementById("state-election-presidential-ev");
  const margin = document.getElementById("state-election-presidential-margin");
  const total = document.getElementById("state-election-presidential-total");
  const body = document.getElementById("state-election-presidential-candidates");

  const winnerName = stateElectionWinnerName(result);
  const totalVotes = stateElectionNumberFromVoteString(result.dV) + stateElectionNumberFromVoteString(result.rV);
  const stateMargin = stateElectionFormatStateMargin(result);

  if (title) title.textContent = `${winnerName} wins ${stateName}.`;
  if (summary) summary.textContent = `${winnerName} carried ${stateName} by ${stateMargin}.`;
  if (ev) ev.textContent = result.ev;
  if (margin) margin.textContent = stateMargin;
  if (total) total.textContent = stateElectionFormatVotes(totalVotes);
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

async function stateElectionRenderCountyMap(stateName, rows) {
  const svg = d3.select("#state-election-presidential-county-map");
  const empty = document.getElementById("state-election-county-empty");
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
    });

  svg.append("path")
    .datum(stateFeature)
    .attr("class", "detail-state-outline")
    .attr("d", path);
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
    .attr("stroke-width", 1.4);

  svg.append("g")
    .selectAll("text")
    .data(features)
    .enter()
    .append("text")
    .attr("class", "state-election-district-label")
    .attr("x", (feature) => path.centroid(feature)[0])
    .attr("y", (feature) => path.centroid(feature)[1])
    .attr("dy", "0.35em")
    .text((feature) => feature.properties.district);
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
