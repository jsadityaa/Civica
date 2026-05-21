const COUNTY_RESULTS_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const COUNTY_RESULTS_2020_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2020_US_County_Level_Presidential_Results.csv";
const COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const FALLBACK_FILL = "#2d3138";
const STATEWIDE_CANDIDATE_RESULTS = window.STATE_CANDIDATE_RESULTS || {};
const countyResultsCache = new Map();
const countyBoardState = {
  rows: [],
  sort: "votes",
  limit: "25",
  activeFips: null
};

const CANDIDATE_PORTRAITS = {
  "Kamala Harris": "https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg",
  "Donald Trump": "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
  "Robert F. Kennedy Jr.": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Portrait_of_Secretary_Robert_F._Kennedy_Jr.%2C_2025_%28cropped%29.jpg/470px-Portrait_of_Secretary_Robert_F._Kennedy_Jr.%2C_2025_%28cropped%29.jpg",
  "Jill Stein": "https://upload.wikimedia.org/wikipedia/commons/9/91/Jill_Stein_by_Gage_Skidmore.jpg",
  "Chase Oliver": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Chase_Oliver_by_Gage_Skidmore.jpg",
  "Claudia De la Cruz": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Claudia_De_la_Cruz_%28cropped%29.png/512px-Claudia_De_la_Cruz_%28cropped%29.png",
  "Cornel West": "https://placehold.co/120x120/6d5a47/f8f2ec?text=CW",
  "Peter A. Sonski": "https://placehold.co/120x120/5d718a/f4f7fb?text=PS",
  "Shiva Ayyadurai": "https://placehold.co/120x120/7d4d4d/faf1f1?text=SA",
  "Write-in": "https://placehold.co/120x120/4b5563/f3f4f6?text=WI"
};

const districtNameMap = {
  "Maine 1": "Maine 1",
  "Maine 2": "Maine 2",
  "Neb. 1": "Nebraska 1",
  "Neb. 2": "Nebraska 2",
  "Neb. 3": "Nebraska 3"
};

const districtParentState = {
  "Maine 1": "Maine",
  "Maine 2": "Maine",
  "Neb. 1": "Nebraska",
  "Neb. 2": "Nebraska",
  "Neb. 3": "Nebraska"
};

const stateFipsByName = {
  Alabama: "01", Alaska: "02", Arizona: "04", Arkansas: "05", California: "06",
  Colorado: "08", Connecticut: "09", Delaware: "10", "District of Columbia": "11", Florida: "12",
  Georgia: "13", Hawaii: "15", Idaho: "16", Illinois: "17", Indiana: "18",
  Iowa: "19", Kansas: "20", Kentucky: "21", Louisiana: "22", Maine: "23",
  Maryland: "24", Massachusetts: "25", Michigan: "26", Minnesota: "27", Mississippi: "28",
  Missouri: "29", Montana: "30", Nebraska: "31", Nevada: "32", "New Hampshire": "33",
  "New Jersey": "34", "New Mexico": "35", "New York": "36", "North Carolina": "37", "North Dakota": "38",
  Ohio: "39", Oklahoma: "40", Oregon: "41", Pennsylvania: "42", "Rhode Island": "44",
  "South Carolina": "45", "South Dakota": "46", Tennessee: "47", Texas: "48", Utah: "49",
  Vermont: "50", Virginia: "51", Washington: "53", "West Virginia": "54", Wisconsin: "55",
  Wyoming: "56"
};

function formatWinnerLabel(winner) {
  if (winner.startsWith("Harris")) return "Harris";
  if (winner.startsWith("Trump")) return "Trump";
  return "No result";
}

function getWinnerTone(winner) {
  return winner.startsWith("Harris") ? "dem" : "rep";
}

function formatMargin(result) {
  const harrisPct = Number(result.dP || 0);
  const trumpPct = Number(result.rP || 0);
  const diff = Math.abs(harrisPct - trumpPct);
  const rounded = diff < 1 ? diff.toFixed(2) : diff.toFixed(1);
  const clean = rounded;
  const prefix = harrisPct > trumpPct ? "D" : "R";
  return `${prefix}+${clean}`;
}

function formatVotes(value) {
  return Number(value || 0).toLocaleString();
}

function normalizeCandidateName(name) {
  const map = {
    "Kamala Devi Harris": "Kamala Harris",
    "Donald John Trump": "Donald Trump",
    "Robert Francis Kennedy, Jr.": "Robert F. Kennedy Jr.",
    "Jill Ellen Stein": "Jill Stein",
    "Chase Russell Oliver": "Chase Oliver",
    "Cornel Ronald West": "Cornel West",
    "Write-In": "Write-in",
    "WRITE-IN": "Write-in"
  };

  return map[name] || name;
}

function normalizePartyName(party) {
  const cleaned = (party || "").replace(/\s+/g, " ").trim();
  const partyMap = {
    Democratic: "Democrat",
    Republican: "Republican",
    Independent: "Independent",
    Libertarian: "Libertarian",
    Green: "Green",
    "American Independent": "American Independent",
    "Peace And Freedom": "Peace and Freedom",
    "Scattering": "Write-in"
  };

  if (partyMap[cleaned]) return partyMap[cleaned];

  const writeInMatch = cleaned.match(/Write-?in; \((.*?)\)/i);
  if (writeInMatch) return writeInMatch[1];

  const ballotAccessMatch = cleaned.match(/(?:Independent|Petition); \((.*?)\)/i);
  if (ballotAccessMatch) return ballotAccessMatch[1];

  return cleaned || "Independent";
}

function getCandidatePortrait(name) {
  const normalized = normalizeCandidateName(name);
  if (CANDIDATE_PORTRAITS[normalized]) return CANDIDATE_PORTRAITS[normalized];

  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return `https://placehold.co/120x120/4b5563/f3f4f6?text=${encodeURIComponent(initials || "C")}`;
}

function candidateNameSpan(name) {
  const normalized = normalizeCandidateName(name);
  if (normalized === "Donald Trump") return `<span class="candidate-name-inline rep">${normalized}</span>`;
  if (normalized === "Kamala Harris") return `<span class="candidate-name-inline dem">${normalized}</span>`;
  return normalized;
}

function getStatewideCandidates(result) {
  return [
    {
      candidate: "Kamala Harris",
      party: "Democrat",
      votes: result.dV,
      pct: `${result.dP}%`
    },
    {
      candidate: "Donald Trump",
      party: "Republican",
      votes: result.rV,
      pct: `${result.rP}%`
    }
  ];
}

function getResultRecord(name) {
  if (window.ELECTION_DATA?.[name]) {
    return {
      name,
      displayName: name,
      stateName: name,
      type: "state",
      ...window.ELECTION_DATA[name]
    };
  }

  const district = (window.DISTRICT_DATA || []).find((item) => item.name === name);
  if (district) {
    return {
      name,
      displayName: districtNameMap[name] || name,
      stateName: districtParentState[name] || "Maine",
      type: "district",
      ...district
    };
  }

  return null;
}

function buildFactItems(result) {
  const winner = formatWinnerLabel(result.winner);
  const winnerName = winner === "Harris" ? "Kamala Harris" : "Donald Trump";
  const runnerUp = winner === "Harris" ? "Donald Trump" : "Kamala Harris";
  const winnerVotes = winner === "Harris" ? result.dV : result.rV;
  const winnerPct = winner === "Harris" ? result.dP : result.rP;
  const runnerVotes = winner === "Harris" ? result.rV : result.dV;
  const runnerPct = winner === "Harris" ? result.rP : result.dP;

  return [
    `<li><strong>${candidateNameSpan(winnerName)}</strong><span>won this ${result.type} with ${winnerVotes} votes (${winnerPct}%).</span></li>`,
    `<li><strong>${candidateNameSpan(runnerUp)}</strong><span>finished second with ${runnerVotes} votes (${runnerPct}%).</span></li>`,
    `<li><strong>Electoral count</strong><span>${result.ev} electoral vote${result.ev === 1 ? "" : "s"} were assigned here.</span></li>`,
    `<li><strong>Margin</strong><span>${candidateNameSpan(winnerName)} carried this ${result.type} by ${formatMargin(result)}.</span></li>`
  ];
}

function getCountyShade(row) {
  const demPct = Number(row.per_dem) * 100;
  const repPct = Number(row.per_gop) * 100;
  const isDem = demPct >= repPct;
  const winnerPct = isDem ? demPct : repPct;
  const shades = isDem ? DEM_SHADES : REP_SHADES;

  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

function getCountyWinner(row) {
  return Number(row.per_dem) >= Number(row.per_gop) ? "Harris" : "Trump";
}

function formatCountyDisplayName(name) {
  const raw = String(name || "").trim();
  if (/ward/i.test(raw) || /district of columbia/i.test(raw)) {
    return raw.replace(/\s+city$/i, "");
  }

  const base = raw
    .replace(/\s+County$/i, "")
    .replace(/\s+Parish$/i, "")
    .replace(/\s+Borough$/i, "")
    .replace(/\s+Census Area$/i, "")
    .replace(/\s+Municipality$/i, "")
    .replace(/\s+city$/i, "");

  return `${base} County`;
}

function formatCountyMarginLabel(row) {
  const winner = getCountyWinner(row) === "Harris" ? "Harris" : "Trump";
  const points = Math.abs(Number(row.per_point_diff) * 100).toFixed(1);
  return `${winner} +${points}`;
}

function formatCountyShift(shiftPoints) {
  if (!Number.isFinite(shiftPoints) || shiftPoints === 0) {
    return { direction: "even", label: "Even" };
  }

  const movedLeft = shiftPoints > 0;
  const points = Math.abs(shiftPoints).toFixed(1).replace(/^-/, "");
  return {
    direction: movedLeft ? "left" : "right",
    label: `${movedLeft ? "Harris" : "Trump"} +${points}`
  };
}

function setActiveCounty(fips) {
  countyBoardState.activeFips = fips || null;
  document.querySelectorAll(".detail-county-row").forEach((row) => {
    row.classList.toggle("is-active", row.dataset.fips === countyBoardState.activeFips);
  });
  document.querySelectorAll(".detail-county-shape").forEach((shape) => {
    shape.classList.toggle("is-active", shape.dataset.fips === countyBoardState.activeFips);
  });
}

function sortCountyRows(rows) {
  const sorted = rows.slice();
  if (countyBoardState.sort === "margin") {
    sorted.sort((a, b) => Number(b.per_point_diff) - Number(a.per_point_diff));
  } else if (countyBoardState.sort === "shift") {
    sorted.sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));
  } else {
    sorted.sort((a, b) => b.total_votes - a.total_votes);
  }

  if (countyBoardState.limit !== "all") {
    return sorted.slice(0, Number(countyBoardState.limit));
  }

  return sorted;
}

function renderCountyBoardRows() {
  const body = document.getElementById("detail-county-board-body");
  if (!body) return;

  const rows = sortCountyRows(countyBoardState.rows);
  body.innerHTML = rows
    .map((row) => {
      const shift = formatCountyShift(row.shift);
      return `
        <tr class="detail-county-row" data-fips="${row.county_fips}">
          <td>${formatCountyDisplayName(row.county_name)}</td>
          <td><span class="detail-county-margin ${getCountyWinner(row) === "Harris" ? "dem" : "rep"}">${formatCountyMarginLabel(row)}</span></td>
          <td>
            <span class="detail-county-shift ${shift.direction}">
              <span class="detail-county-shift-arrow" aria-hidden="true"></span>
              <span class="detail-county-shift-badge">${shift.label}</span>
            </span>
          </td>
          <td>${formatVotes(row.total_votes)}</td>
          <td>100%</td>
        </tr>
      `;
    })
    .join("");

  body.querySelectorAll(".detail-county-row").forEach((row) => {
    row.addEventListener("mouseenter", () => setActiveCounty(row.dataset.fips));
    row.addEventListener("mouseleave", () => setActiveCounty(null));
  });
}

function wireCountyBoardControls() {
  document.querySelectorAll(".detail-county-sort-button").forEach((button) => {
    button.onclick = () => {
      countyBoardState.sort = button.dataset.sort;
      document.querySelectorAll(".detail-county-sort-button").forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderCountyBoardRows();
    };
  });

  document.querySelectorAll(".detail-county-limit-button").forEach((button) => {
    button.onclick = () => {
      countyBoardState.limit = button.dataset.limit;
      document.querySelectorAll(".detail-county-limit-button").forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderCountyBoardRows();
    };
  });
}

function getCountyTooltipHTML(row, stateName) {
  const winner = getCountyWinner(row);
  const demPct = (Number(row.per_dem) * 100).toFixed(1);
  const repPct = (Number(row.per_gop) * 100).toFixed(1);

  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${formatCountyDisplayName(row.county_name)}</div>
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
          <td>${formatVotes(row.votes_gop)}</td>
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
          <td>${formatVotes(row.votes_dem)}</td>
          <td>${demPct}%</td>
        </tr>
      </tbody>
    </table>
  `;
}

function getMapRegionLabel(result) {
  if (result.stateName === "District of Columbia") return "Wards";
  if (result.type === "district") return "Counties in the parent state";
  return "Counties";
}

function setMapMode(mode) {
  const canvas = document.getElementById("detail-map-canvas");
  const svg = document.getElementById("detail-county-map");
  if (!canvas || !svg) return;

  canvas.classList.toggle("is-dc", mode === "dc");
  canvas.classList.toggle("is-alaska", mode === "alaska");
  svg.setAttribute("viewBox", mode === "dc" ? "0 0 540 540" : "0 0 540 620");
}

function positionTooltip(event, tooltip) {
  const node = tooltip.node();
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  let left = event.clientX - width / 2;
  let top = event.clientY + 18;
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  top = Math.min(top, window.innerHeight - height - 12);
  tooltip.style("left", `${left}px`).style("top", `${top}px`);
}

async function fetchCountyResults(stateName, year = 2024) {
  const cacheKey = `${year}:${stateName}`;
  if (countyResultsCache.has(cacheKey)) return countyResultsCache.get(cacheKey);

  const sourceUrl = year === 2020 ? COUNTY_RESULTS_2020_URL : COUNTY_RESULTS_URL;
  const rows = await d3.csv(sourceUrl, (row) => {
    if (row.state_name !== stateName) return null;
    return {
      ...row,
      votes_gop: Number(row.votes_gop),
      votes_dem: Number(row.votes_dem),
      total_votes: Number(row.total_votes),
      diff: Number(row.diff),
      per_gop: Number(row.per_gop),
      per_dem: Number(row.per_dem),
      per_point_diff: Number(row.per_point_diff)
    };
  });

  const filtered = rows.filter(Boolean);
  countyResultsCache.set(cacheKey, filtered);
  return filtered;
}

async function renderCountyMap(result) {
  const svg = d3.select("#detail-county-map");
  const tooltip = d3.select("#detail-map-tooltip");
  const mapEmpty = document.getElementById("detail-map-empty");
  const subtitle = document.getElementById("detail-map-subtitle");
  const stateName = result.stateName;

  if (svg.empty() || !window.d3 || !window.topojson) return;

  svg.selectAll("*").remove();
  setMapMode(
    stateName === "District of Columbia"
      ? "dc"
      : "default"
  );

  try {
    if (stateName === "District of Columbia") {
      const countyRows = await fetchCountyResults(stateName, 2024);
      const wardRows = countyRows
        .slice()
        .sort((a, b) => Number(a.county_fips) - Number(b.county_fips));

      if (!wardRows.length) {
        mapEmpty.hidden = false;
        subtitle.textContent = "Ward-level map data is not available for this page yet.";
        return;
      }

      mapEmpty.hidden = true;
      subtitle.textContent = "District of Columbia wards shaded by winning margin.";

      const tileGroup = svg.append("g").attr("transform", "translate(40, 42)");
      const columns = 2;
      const tileWidth = 204;
      const tileHeight = 96;
      const gapX = 26;
      const gapY = 18;

      tileGroup.selectAll("rect")
        .data(wardRows)
        .enter()
        .append("rect")
        .attr("class", "detail-county-shape")
        .attr("data-fips", (row) => row.county_fips)
        .attr("x", (_, index) => (index % columns) * (tileWidth + gapX))
        .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY))
        .attr("rx", 18)
        .attr("ry", 18)
        .attr("width", tileWidth)
        .attr("height", tileHeight)
        .attr("fill", (row) => getCountyShade(row))
        .on("mouseover", (event, row) => {
          setActiveCounty(row.county_fips);
          tooltip.style("opacity", 1).html(getCountyTooltipHTML(row, stateName));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
          setActiveCounty(null);
        });

      tileGroup.selectAll(".detail-ward-label")
        .data(wardRows)
        .enter()
        .append("text")
        .attr("class", "detail-ward-label")
        .attr("x", (_, index) => (index % columns) * (tileWidth + gapX) + 22)
        .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY) + 38)
        .attr("text-anchor", "start")
        .text((row) => row.county_name.replace(" District of Columbia", ""));

      tileGroup.selectAll(".detail-ward-subvalue")
        .data(wardRows)
        .enter()
        .append("text")
        .attr("class", "detail-ward-subvalue")
        .attr("x", (_, index) => (index % columns) * (tileWidth + gapX) + 22)
        .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY) + 68)
        .text((row) => `${getCountyWinner(row) === "Harris" ? "D" : "R"}+${Math.abs(Number(row.per_point_diff) * 100).toFixed(1).replace(/\\.0$/, "")}`);

      return;
    }

    if (stateName === "Alaska") {
      mapEmpty.hidden = false;
      subtitle.textContent = "County map unavailable.";
      mapEmpty.textContent = "Alaska does not use the same county reporting system here, so a comparable county map is not available on this page.";
      return;
    }

    const [countyRows, countiesTopo, statesTopo] = await Promise.all([
      fetchCountyResults(stateName, 2024),
      d3.json(COUNTIES_TOPOJSON_URL),
      d3.json(STATES_TOPOJSON_URL)
    ]);

    const rowByFips = new Map(countyRows.map((row) => [row.county_fips, row]));
    const features = topojson
      .feature(countiesTopo, countiesTopo.objects.counties)
      .features
      .filter((feature) => rowByFips.has(String(feature.id).padStart(5, "0")));

    const stateFips = stateFipsByName[stateName];
    const stateFeature = topojson
      .feature(statesTopo, statesTopo.objects.states)
      .features
      .find((feature) => String(feature.id).padStart(2, "0") === stateFips);

    if (!features.length || !stateFeature) {
      mapEmpty.hidden = false;
      subtitle.textContent = result.type === "district"
        ? `${result.displayName} uses district-level reporting.`
        : result.stateName === "District of Columbia"
          ? "Ward-level map data is not available for this page yet."
          : "County map data is not available for this page yet.";
      return;
    }

    mapEmpty.hidden = true;
    subtitle.textContent = `${stateName} ${result.stateName === "District of Columbia" ? "wards" : "counties"} shaded by winning margin.`;

    const projection = d3.geoMercator().fitSize([540, 620], { type: "FeatureCollection", features });
    const path = d3.geoPath(projection);

    svg.append("g")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape")
      .attr("data-fips", (feature) => String(feature.id).padStart(5, "0"))
      .attr("d", path)
      .attr("fill", (feature) => {
        const row = rowByFips.get(String(feature.id).padStart(5, "0"));
        return row ? getCountyShade(row) : FALLBACK_FILL;
      })
      .on("mouseover", (event, feature) => {
        const row = rowByFips.get(String(feature.id).padStart(5, "0"));
        if (!row) return;
        setActiveCounty(row.county_fips);
        tooltip.style("opacity", 1).html(getCountyTooltipHTML(row, stateName));
        positionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
        setActiveCounty(null);
      });

    svg.append("path")
      .datum(stateFeature)
      .attr("class", "detail-state-outline")
      .attr("d", path);
  } catch (error) {
    mapEmpty.hidden = false;
    subtitle.textContent = "County map data could not be loaded.";
    console.error(error);
  }
}

async function renderCountyBoard(result) {
  const note = document.getElementById("detail-county-board-note");
  const empty = document.getElementById("detail-county-board-empty");
  const tableWrap = document.getElementById("detail-county-board-table-wrap");
  const body = document.getElementById("detail-county-board-body");

  if (!note || !empty || !tableWrap || !body) return;

  empty.hidden = true;
  tableWrap.hidden = false;
  body.innerHTML = "";

  if (result.type === "district") {
    note.textContent = "County shift board unavailable.";
    empty.hidden = false;
    empty.textContent = "This page reports a congressional district result, so a statewide county comparison table is not shown here.";
    tableWrap.hidden = true;
    return;
  }

  if (result.stateName === "Alaska") {
    note.textContent = "County shift board unavailable.";
    empty.hidden = false;
    empty.textContent = "Alaska does not use the same county reporting system here, so a comparable county shift table is not available on this page.";
    tableWrap.hidden = true;
    return;
  }

  if (result.stateName === "District of Columbia") {
    note.textContent = "Ward shift board unavailable.";
    empty.hidden = false;
    empty.textContent = "District of Columbia uses ward-level reporting in 2024, but the 2020 source is not broken out that way, so a comparable shift table is not available.";
    tableWrap.hidden = true;
    return;
  }

  const [rows2024, rows2020] = await Promise.all([
    fetchCountyResults(result.stateName, 2024),
    fetchCountyResults(result.stateName, 2020)
  ]);

  const prevByFips = new Map(rows2020.map((row) => [row.county_fips, row]));
  const comparableRows = rows2024
    .filter((row) => prevByFips.has(row.county_fips))
    .map((row) => {
      const previous = prevByFips.get(row.county_fips);
      const margin2024 = (Number(row.per_dem) - Number(row.per_gop)) * 100;
      const margin2020 = (Number(previous.per_dem) - Number(previous.per_gop)) * 100;
      return {
        ...row,
        shift: margin2024 - margin2020
      };
    })
    .sort((a, b) => b.total_votes - a.total_votes);

  note.textContent = "County margins and movement since 2020.";
  countyBoardState.rows = comparableRows;
  renderCountyBoardRows();
  wireCountyBoardControls();
}

function renderSummary(result) {
  const title = document.getElementById("detail-title");
  const subtitle = document.getElementById("detail-subtitle");
  const summaryCard = document.getElementById("detail-summary-card");
  const summaryTitle = document.getElementById("detail-summary-title");
  const summaryCallout = document.getElementById("detail-summary-callout");
  const summaryPortrait = document.getElementById("detail-summary-portrait");
  const winnerName = document.getElementById("detail-winner-name");
  const ev = document.getElementById("detail-ev");
  const margin = document.getElementById("detail-margin");
  const voteBody = document.getElementById("detail-vote-body");
  const facts = document.getElementById("detail-facts");
  const contextCopy = document.getElementById("detail-context-copy");
  const certifiedTitle = document.getElementById("detail-certified-title");
  const certifiedDem = document.getElementById("detail-certified-dem");
  const certifiedRep = document.getElementById("detail-certified-rep");
  const certifiedOther = document.getElementById("detail-certified-other");
  const certifiedNote = document.getElementById("detail-certified-note");

  const displayName = result.displayName;
  const winner = formatWinnerLabel(result.winner);
  const winnerFullName = winner === "Harris" ? "Kamala Harris" : "Donald Trump";
  const winnerTone = getWinnerTone(result.winner);
  const candidates = getStatewideCandidates(result);
  const totalVotes = formatVotes(candidates.reduce((sum, candidate) => (
    sum + Number(String(candidate.votes || 0).replace(/,/g, ""))
  ), 0));
  const demPct = Number(result.dP);
  const repPct = Number(result.rP);

  document.title = `${displayName} 2024 Presidential Result`;
  title.textContent = `${displayName} Presidential Election Results`;
  subtitle.textContent = `${result.type === "district" ? "Congressional district" : "State"} presidential result in the 2024 general election.`;
  summaryCard.classList.remove("winner-dem", "winner-rep");
  summaryCard.classList.add(winnerTone === "dem" ? "winner-dem" : "winner-rep");
  summaryTitle.textContent = `${winnerFullName} wins ${displayName}.`;
  summaryCallout.textContent = result.stateName === "District of Columbia"
    ? "Race called with certified ward-level reporting."
    : "Race called with certified presidential vote totals.";
  summaryPortrait.src = getCandidatePortrait(winnerFullName);
  winnerName.textContent = winnerFullName;
  ev.textContent = `${result.ev}`;
  margin.textContent = formatMargin(result);

  voteBody.innerHTML = candidates
    .map((candidate) => {
      const isWinner = candidate.candidate === winnerFullName;
      return `
        <tr class="${isWinner ? "winner-row" : ""}">
          <td>
            <div class="detail-candidate-cell">
              <img class="detail-candidate-photo" src="${getCandidatePortrait(candidate.candidate)}" alt="${candidate.candidate}" />
              <span>${candidate.candidate}</span>
            </div>
          </td>
          <td>${candidate.party}</td>
          <td>${candidate.votes}</td>
          <td>${candidate.pct}</td>
        </tr>
      `;
    })
    .join("");

  facts.innerHTML = buildFactItems(result).join("");
  contextCopy.innerHTML = `${displayName} awarded ${result.ev} electoral vote${result.ev === 1 ? "" : "s"} in the 2024 presidential election. ${candidateNameSpan(winnerFullName)} carried this ${result.type} by ${formatMargin(result)}, based on the vote totals shown here.`;

  certifiedTitle.textContent = `The vote count has been certified in ${displayName}.`;
  certifiedDem.style.width = `${demPct}%`;
  certifiedRep.style.width = `${repPct}%`;
  certifiedOther.style.width = `${Math.max(0, 100 - demPct - repPct)}%`;
  certifiedNote.textContent = `${totalVotes} total votes reported.`;

  document.querySelector(".detail-map-head h3").textContent = `${getMapRegionLabel(result)} Map`;
}

async function renderStateResultPage() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  const title = document.getElementById("detail-title");
  const subtitle = document.getElementById("detail-subtitle");

  if (!name) {
    title.textContent = "Result not found";
    subtitle.textContent = "No state or district was specified in the link.";
    return;
  }

  const result = getResultRecord(name);
  if (!result) {
    title.textContent = "Result not found";
    subtitle.textContent = "That state or district is not available in the current 2024 dataset.";
    return;
  }

  renderSummary(result);
  await Promise.all([
    renderCountyMap(result),
    renderCountyBoard(result)
  ]);
}

renderStateResultPage();
