const GOVERNOR_COUNTY_REFERENCE_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const GOVERNOR_COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const GOVERNOR_STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const GOVERNOR_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const GOVERNOR_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const GOVERNOR_IND_SHADES = ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
const GOVERNOR_FALLBACK_FILL = "#2d3138";

const governorCountyResults = window.GOVERNOR_COUNTY_RESULTS || {};
const governorData = window.GOVERNOR_2024_DATA || { races: [] };
const governorCountyReferenceCache = new Map();
const governorCountyBoardState = {
  rows: [],
  sort: "votes",
  limit: "25",
  activeFips: null
};

const governorStateFipsByName = {
  Delaware: "10",
  Indiana: "18",
  Missouri: "29",
  Montana: "30",
  "New Hampshire": "33",
  "North Carolina": "37",
  "North Dakota": "38",
  Utah: "49",
  Vermont: "50",
  Washington: "53",
  "West Virginia": "54"
};

function getGovernorStateName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "Delaware";
}

function governorNormalizeCountyName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/['’]/g, "")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bcounty\b/g, "")
    .replace(/\bparish\b/g, "")
    .replace(/\bborough\b/g, "")
    .replace(/\bcensus area\b/g, "")
    .replace(/\bmunicipality\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function governorPartyTone(party) {
  if (party === "D") return "dem";
  if (party === "R") return "rep";
  return "ind";
}

function governorPartyLabel(party) {
  if (party === "D") return "Democrat";
  if (party === "R") return "Republican";
  if (party === "L") return "Libertarian";
  return "Independent";
}

function governorPartyShortLabel(party) {
  if (party === "D") return "Dem.";
  if (party === "R") return "Rep.";
  if (party === "L") return "Lib.";
  return "Ind.";
}

function governorFormatVotes(value) {
  return Number(value || 0).toLocaleString();
}

function governorInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "G";
}

function governorCandidatePortrait(name) {
  return `https://placehold.co/120x120/2f3540/f3f4f6?text=${encodeURIComponent(governorInitials(name))}`;
}

function governorWinnerParty(row) {
  return row.candidates[0]?.party || "I";
}

function governorMarginValue(row) {
  const top = row.candidates[0];
  const runnerUp = row.candidates[1];
  if (!top || !runnerUp) return 0;
  return Math.max(0, Number(top.pct) - Number(runnerUp.pct));
}

function governorMarginLabel(row) {
  const top = row.candidates[0];
  const margin = governorMarginValue(row);
  const party = top?.party || "I";
  return `${party}+${margin.toFixed(margin < 10 ? 1 : 0).replace(".0", "")}`;
}

function governorCountyShade(row) {
  const winnerPct = Number(row.candidates[0]?.pct || 0);
  const party = governorWinnerParty(row);
  const shades = party === "D" ? GOVERNOR_DEM_SHADES : party === "R" ? GOVERNOR_REP_SHADES : GOVERNOR_IND_SHADES;
  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

function getGovernorRaceRecord(stateName) {
  const countyBundle = governorCountyResults[stateName];
  const statewide = governorData.races.find((race) => race.state === stateName);
  if (!countyBundle || !statewide) return null;
  return { stateName, countyBundle, statewide };
}

function getStatewideRows(record) {
  return record.statewide.candidates.map((candidate) => ({
    candidate: candidate.name,
    party: governorPartyLabel(candidate.party === "Dem." ? "D" : candidate.party === "Rep." ? "R" : candidate.party === "Lib." ? "L" : "I"),
    partyShort: candidate.party,
    votes: candidate.votes,
    pct: `${candidate.pct}%`,
    tone: candidate.party === "Dem." ? "dem" : candidate.party === "Rep." ? "rep" : "ind"
  }));
}

function renderGovernorSummary(record) {
  const rows = getStatewideRows(record);
  const winner = rows[0];
  document.title = `2024 ${record.stateName} Governor County Result`;
  document.getElementById("detail-title").textContent = `${record.stateName} Governor`;
  document.getElementById("detail-subtitle").textContent = `County-level results for the 2024 ${record.stateName} governor election.`;
  document.getElementById("detail-summary-card").classList.add(`winner-${winner.tone}`);
  document.getElementById("detail-summary-title").textContent = `${winner.candidate} wins ${record.stateName}.`;
  document.getElementById("detail-summary-portrait").src = governorCandidatePortrait(winner.candidate);
  document.getElementById("detail-margin").textContent = record.statewide.result;

  document.getElementById("detail-vote-body").innerHTML = rows.map((row, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td><span class="candidate-name-inline ${row.tone}">${row.candidate}</span></td>
      <td>${row.partyShort}</td>
      <td>${row.votes}</td>
      <td>${row.pct}</td>
    </tr>
  `).join("");

  const totals = rows.reduce((acc, row) => {
    const party = row.partyShort === "Dem." ? "dem" : row.partyShort === "Rep." ? "rep" : row.partyShort === "Lib." ? "ind" : "other";
    const votes = Number(String(row.votes).replace(/,/g, "")) || 0;
    acc[party] = (acc[party] || 0) + votes;
    acc.total += votes;
    return acc;
  }, { dem: 0, rep: 0, ind: 0, other: 0, total: 0 });
  ["dem", "rep", "ind", "other"].forEach((party) => {
    const el = document.getElementById(`detail-certified-${party}`);
    if (el) el.style.width = `${totals.total ? (totals[party] / totals.total) * 100 : 0}%`;
  });
  document.getElementById("detail-certified-note").textContent = `${governorFormatVotes(totals.total)} total votes reported.`;

  document.getElementById("detail-facts").innerHTML = [
    `<li><strong>${winner.candidate}</strong><span>won ${record.stateName}'s 2024 governor race with ${winner.votes} votes (${winner.pct}).</span></li>`,
    `<li><strong>Counties reporting</strong><span>${record.countyBundle.counties.length} counties are shown in the governor county table.</span></li>`,
    `<li><strong>Margin</strong><span>${winner.candidate} carried the race by ${record.statewide.result} statewide.</span></li>`
  ].join("");
  document.getElementById("detail-context-copy").textContent = `This page shows county-level governor results for ${record.stateName}, separate from the presidential county pages.`;
}

async function fetchGovernorCountyReference(stateName) {
  if (governorCountyReferenceCache.has(stateName)) return governorCountyReferenceCache.get(stateName);
  const rows = await d3.csv(GOVERNOR_COUNTY_REFERENCE_URL, (row) => {
    if (row.state_name !== stateName) return null;
    return { county_fips: row.county_fips, county_name: row.county_name };
  });
  const lookup = new Map();
  rows.filter(Boolean).forEach((row) => {
    lookup.set(governorNormalizeCountyName(row.county_name), row);
  });
  governorCountyReferenceCache.set(stateName, lookup);
  return lookup;
}

async function getGovernorCountyRows(stateName) {
  const bundle = governorCountyResults[stateName];
  if (!bundle) return [];
  const reference = await fetchGovernorCountyReference(stateName);
  return bundle.counties.map((county) => {
    const referenceRow = reference.get(governorNormalizeCountyName(county.county));
    return {
      county_fips: referenceRow?.county_fips || null,
      county_name: referenceRow?.county_name || county.county,
      displayName: county.county,
      candidates: county.candidates,
      totalVotes: county.totalVotes,
      winnerParty: governorWinnerParty(county),
      marginValue: governorMarginValue(county),
      marginLabel: governorMarginLabel(county)
    };
  });
}

function setActiveGovernorCounty(fips) {
  governorCountyBoardState.activeFips = fips || null;
  document.querySelectorAll(".detail-county-row").forEach((row) => {
    row.classList.toggle("is-active", row.dataset.fips === governorCountyBoardState.activeFips);
  });
  document.querySelectorAll(".detail-county-shape").forEach((shape) => {
    shape.classList.toggle("is-active", shape.dataset.fips === governorCountyBoardState.activeFips);
  });
}

function sortGovernorCountyRows(rows) {
  const sorted = [...rows];
  if (governorCountyBoardState.sort === "margin") {
    sorted.sort((a, b) => b.marginValue - a.marginValue || b.totalVotes - a.totalVotes);
  } else if (governorCountyBoardState.sort === "alphabetical") {
    sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else {
    sorted.sort((a, b) => b.totalVotes - a.totalVotes);
  }
  return governorCountyBoardState.limit === "all" ? sorted : sorted.slice(0, Number(governorCountyBoardState.limit));
}

function renderGovernorCountyBoardRows() {
  const body = document.getElementById("detail-county-board-body");
  if (!body) return;
  const rows = sortGovernorCountyRows(governorCountyBoardState.rows);
  body.innerHTML = rows.map((row) => `
    <tr class="detail-county-row" data-fips="${row.county_fips || ""}">
      <td>${row.displayName}</td>
      <td><span class="detail-county-margin ${governorPartyTone(row.winnerParty)}">${row.marginLabel}</span></td>
      <td><span class="detail-county-winner ${governorPartyTone(row.winnerParty)}">${row.candidates[0]?.name || "—"}</span></td>
      <td>${governorFormatVotes(row.totalVotes)}</td>
      <td>100%</td>
    </tr>
  `).join("");

  body.querySelectorAll(".detail-county-row").forEach((row) => {
    row.addEventListener("mouseenter", () => setActiveGovernorCounty(row.dataset.fips));
    row.addEventListener("mouseleave", () => setActiveGovernorCounty(null));
  });
}

function wireGovernorCountyControls() {
  document.querySelectorAll(".detail-county-sort-button").forEach((button) => {
    button.addEventListener("click", () => {
      governorCountyBoardState.sort = button.dataset.sort;
      document.querySelectorAll(".detail-county-sort-button").forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderGovernorCountyBoardRows();
    });
  });
  document.querySelectorAll(".detail-county-limit-button").forEach((button) => {
    button.addEventListener("click", () => {
      governorCountyBoardState.limit = button.dataset.limit;
      document.querySelectorAll(".detail-county-limit-button").forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderGovernorCountyBoardRows();
    });
  });
}

function governorCountyTooltipHTML(row, stateName) {
  const rows = row.candidates.map((candidate, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td>
        <div class="tooltip-candidate">
          <span class="tooltip-candidate-bar ${governorPartyTone(candidate.party)}"></span>
          <span>${candidate.name}</span>
        </div>
      </td>
      <td>${governorPartyShortLabel(candidate.party)}</td>
      <td>${candidate.votesFormatted}</td>
      <td>${candidate.pct}%</td>
    </tr>
  `).join("");
  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${row.displayName}</div>
      <div class="tooltip-ev">${stateName} governor</div>
    </div>
    <table>
      <thead>
        <tr><th style="text-align:left;">Candidate</th><th>Party</th><th>Votes</th><th>Pct.</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function positionGovernorTooltip(event) {
  const tooltip = d3.select("#detail-map-tooltip");
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

async function renderGovernorCountyMap(record) {
  const svg = d3.select("#detail-county-map");
  const empty = document.getElementById("detail-map-empty");
  const stateFips = governorStateFipsByName[record.stateName];
  if (!stateFips || !window.topojson || svg.empty()) return;

  try {
    const [countyRows, countiesTopo, statesTopo] = await Promise.all([
      getGovernorCountyRows(record.stateName),
      d3.json(GOVERNOR_COUNTIES_TOPOJSON_URL),
      d3.json(GOVERNOR_STATES_TOPOJSON_URL)
    ]);
    const rowByFips = new Map(countyRows.filter((row) => row.county_fips).map((row) => [row.county_fips, row]));
    const counties = topojson.feature(countiesTopo, countiesTopo.objects.counties).features;
    const states = topojson.feature(statesTopo, statesTopo.objects.states).features;
    const features = counties.filter((feature) => String(feature.id).padStart(5, "0").startsWith(stateFips));
    const stateFeature = states.find((feature) => String(feature.id).padStart(2, "0") === stateFips);

    if (!features.length || !stateFeature) {
      empty.hidden = false;
      return;
    }

    const projection = d3.geoMercator();
    const path = d3.geoPath().projection(projection);
    projection.fitExtent([[18, 18], [522, 602]], stateFeature);
    svg.selectAll("*").remove();

    const tooltip = d3.select("#detail-map-tooltip");
    svg.selectAll(".detail-county-shape")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape")
      .attr("data-fips", (feature) => String(feature.id).padStart(5, "0"))
      .attr("d", path)
      .attr("fill", (feature) => {
        const row = rowByFips.get(String(feature.id).padStart(5, "0"));
        return row ? governorCountyShade(row) : GOVERNOR_FALLBACK_FILL;
      })
      .on("mouseover", (event, feature) => {
        const fips = String(feature.id).padStart(5, "0");
        const row = rowByFips.get(fips);
        if (!row) return;
        setActiveGovernorCounty(fips);
        tooltip.style("opacity", 1).html(governorCountyTooltipHTML(row, record.stateName));
        positionGovernorTooltip(event);
      })
      .on("mousemove", positionGovernorTooltip)
      .on("mouseout", () => {
        setActiveGovernorCounty(null);
        tooltip.style("opacity", 0);
      });
  } catch (error) {
    empty.hidden = false;
    empty.textContent = "County map data could not be loaded.";
  }
}

async function renderGovernorCountyBoard(record) {
  const rows = await getGovernorCountyRows(record.stateName);
  governorCountyBoardState.rows = rows;
  document.getElementById("detail-county-board-note").textContent = `${rows.length} counties reporting governor results.`;
  renderGovernorCountyBoardRows();
  wireGovernorCountyControls();
}

async function initGovernorCountyPage() {
  const stateName = getGovernorStateName();
  const record = getGovernorRaceRecord(stateName);
  if (!record) {
    document.getElementById("detail-title").textContent = "Governor county result unavailable";
    document.getElementById("detail-subtitle").textContent = "Choose a 2024 governor state from the governor page.";
    document.getElementById("detail-county-board-empty").hidden = false;
    document.getElementById("detail-county-board-empty").textContent = "No governor county results are available for this state.";
    return;
  }

  renderGovernorSummary(record);
  await Promise.all([
    renderGovernorCountyBoard(record),
    renderGovernorCountyMap(record)
  ]);
}

initGovernorCountyPage();
