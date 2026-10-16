const GOVERNOR_COUNTY_REFERENCE_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const GOVERNOR_COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const GOVERNOR_STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const GOVERNOR_VERMONT_TOWNS_GEOJSON_URL = "./assets/maps/state-local-results-2024/vermont-local-results-2024.geojson";

const GOVERNOR_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const GOVERNOR_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const GOVERNOR_IND_SHADES = ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
const GOVERNOR_FALLBACK_FILL = "#2d3138";
const GOVERNOR_COUNTY_BOARD_PREVIEW_LIMIT = 6;
const GOVERNOR_LOCAL_CANDIDATE_DISPLAY_LIMIT = 3;

const governorCountyResults = window.GOVERNOR_COUNTY_RESULTS || {};
const governorData = window.GOVERNOR_2024_DATA || { races: [] };
const governorCandidateImages = window.GOVERNOR_CANDIDATE_IMAGES || {};
const governorCountyReferenceCache = new Map();
const governorCountyBoardState = {
  rows: [],
  sort: "votes",
  limit: String(GOVERNOR_COUNTY_BOARD_PREVIEW_LIMIT),
  activeFips: null
};
let governorCurrentRegionLabels = getGovernorRegionLabels();

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
  const queryState = params.get("name");
  if (queryState) return queryState;

  const encodedQueryMatch = window.location.href.match(/%3Fname=([^#]+)/i);
  if (encodedQueryMatch) return decodeURIComponent(encodedQueryMatch[1]);

  return "Delaware";
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

function getGovernorRegionLabels(record) {
  const regionType = record?.countyBundle?.regionType === "town" ? "town" : "county";
  if (regionType === "town") {
    return {
      singular: "town",
      singularTitle: "Town",
      plural: "towns",
      pluralTitle: "Towns",
      boardTitle: "Town Results",
      mapTitle: "Town Map"
    };
  }
  return {
    singular: "county",
    singularTitle: "County",
    plural: "counties",
    pluralTitle: "Counties",
    boardTitle: "County Results",
    mapTitle: "County Map"
  };
}

function governorFormatRegionName(name, regionType) {
  const cleaned = String(name || "").trim();
  if (regionType === "town") return cleaned;
  return cleaned.replace(/\s+County$/i, "");
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
  if (party === "W") return "Write-in";
  return "Independent";
}

function governorPartyShortLabel(party) {
  if (party === "D") return "Dem.";
  if (party === "R") return "Rep.";
  if (party === "L") return "Lib.";
  if (party === "W") return "Write-in";
  return "Ind.";
}

function governorShortPartyCode(party) {
  if (party === "Dem." || party === "D") return "D";
  if (party === "Rep." || party === "R") return "R";
  if (party === "Lib." || party === "L") return "L";
  if (party === "Write-in" || party === "W") return "W";
  return "I";
}

function governorFormatVotes(value) {
  return Number(value || 0).toLocaleString();
}

function governorFormatPercent(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0.0";
  return numeric < 1 && numeric > 0 ? numeric.toFixed(2) : numeric.toFixed(1);
}

function governorFormatMarginValue(value) {
  const numeric = Math.abs(Number(value || 0));
  if (!Number.isFinite(numeric)) return "0.0";
  return numeric < 1 && numeric > 0 ? numeric.toFixed(2) : numeric.toFixed(1);
}

function governorNormalizeCandidateName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\bester\b/g, "esther")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function governorInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "G";
}

function governorCandidatePortrait(name, imageUrl) {
  if (imageUrl) return imageUrl;
  const mapped = governorCandidateImages[name];
  if (mapped) return mapped;
  return "https://placehold.co/120x120/2f3540/2f3540";
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
  return `${party}+${governorFormatMarginValue(margin)}`;
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
  const knownCandidates = new Map(record.statewide.candidates.map((candidate) => [
    governorNormalizeCandidateName(candidate.name),
    candidate
  ]));
  const totals = new Map();

  record.countyBundle.counties.forEach((region) => {
    (region.candidates || []).forEach((candidate) => {
      const key = governorNormalizeCandidateName(candidate.name);
      const partyCode = governorNormalizeCandidateName(candidate.name) === "write in" ? "W" : governorShortPartyCode(candidate.party);
      const existing = totals.get(key) || {
        name: candidate.name,
        partyCode,
        votes: 0
      };
      existing.votes += Number(candidate.votes || 0);
      totals.set(key, existing);
    });
  });

  const totalVotes = Array.from(totals.values()).reduce((sum, candidate) => sum + candidate.votes, 0);
  return Array.from(totals.values())
    .sort((a, b) => b.votes - a.votes)
    .map((candidate) => {
      const known = knownCandidates.get(governorNormalizeCandidateName(candidate.name)) || {};
      const partyShort = governorPartyShortLabel(candidate.partyCode);
      return {
        candidate: candidate.name,
        incumbent: Boolean(known.incumbent),
        party: governorPartyLabel(candidate.partyCode),
        partyShort,
        votes: governorFormatVotes(candidate.votes),
        pct: `${governorFormatPercent(totalVotes ? (candidate.votes / totalVotes) * 100 : 0)}%`,
        tone: candidate.partyCode === "D" ? "dem" : candidate.partyCode === "R" ? "rep" : "ind",
        imageUrl: known.imageUrl || ""
      };
    });
}

function renderGovernorSummary(record) {
  const rows = getStatewideRows(record);
  const winner = rows[0];
  governorCurrentRegionLabels = getGovernorRegionLabels(record);
  document.title = `2024 ${record.stateName} Governor ${governorCurrentRegionLabels.singularTitle} Result`;
  document.getElementById("detail-title").textContent = `${record.stateName} Gubernatorial Elections`;
  const stateResultsLink = document.getElementById("detail-state-results-link");
  stateResultsLink.textContent = `See all ${record.stateName} election results`;
  stateResultsLink.href = `./state-election-results-2024.html?name=${encodeURIComponent(record.stateName)}`;
  stateResultsLink.hidden = false;
  document.getElementById("detail-summary-card").classList.add(`winner-${winner.tone}`);
  document.getElementById("detail-summary-title").textContent = `${winner.candidate} wins ${record.stateName}.`;
  document.getElementById("detail-summary-portrait").src = governorCandidatePortrait(winner.candidate, winner.imageUrl);
  document.getElementById("detail-margin").textContent = record.statewide.result;

  document.getElementById("detail-vote-body").innerHTML = rows.map((row, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td>
        <div class="detail-candidate-cell">
          <img class="detail-candidate-photo" src="${governorCandidatePortrait(row.candidate, row.imageUrl)}" alt="${row.candidate}" />
          <span class="candidate-name-inline">${row.candidate}</span>
          ${row.incumbent ? `<span class="tooltip-incumbent">Incumbent</span>` : ""}
        </div>
      </td>
      <td>${row.party}</td>
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

  const facts = document.getElementById("detail-facts");
  if (facts) {
    facts.innerHTML = [
      `<li><strong>${winner.candidate}</strong><span>won ${record.stateName}'s 2024 governor race with ${winner.votes} votes (${winner.pct}).</span></li>`,
      `<li><strong>${governorCurrentRegionLabels.pluralTitle} reporting</strong><span>${record.countyBundle.counties.length} ${governorCurrentRegionLabels.plural} are shown in the governor ${governorCurrentRegionLabels.singular} table.</span></li>`,
      `<li><strong>Margin</strong><span>${winner.candidate} carried the race by ${record.statewide.result} statewide.</span></li>`
    ].join("");
  }

  const contextCopy = document.getElementById("detail-context-copy");
  if (contextCopy) {
    contextCopy.textContent = `This page shows ${governorCurrentRegionLabels.singular}-level governor results for ${record.stateName}, separate from the presidential ${governorCurrentRegionLabels.singular} pages.`;
  }
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
  const regionType = bundle.regionType === "town" ? "town" : "county";
  if (regionType === "town") {
    return bundle.counties.map((county) => ({
      county_fips: county.county_fips || null,
      county_name: county.county,
      displayName: governorFormatRegionName(county.county, regionType),
      candidates: county.candidates,
      totalVotes: county.totalVotes,
      winnerParty: governorWinnerParty(county),
      marginValue: governorMarginValue(county),
      marginLabel: governorMarginLabel(county)
    }));
  }
  const reference = await fetchGovernorCountyReference(stateName);
  return bundle.counties.map((county) => {
    const referenceRow = reference.get(governorNormalizeCountyName(county.county));
    return {
      county_fips: referenceRow?.county_fips || null,
      county_name: referenceRow?.county_name || county.county,
      displayName: governorFormatRegionName(county.county, regionType),
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
      <td>${governorFormatVotes(row.totalVotes)}</td>
      <td>100%</td>
    </tr>
  `).join("");

  body.querySelectorAll(".detail-county-row").forEach((row) => {
    row.addEventListener("mouseenter", () => setActiveGovernorCounty(row.dataset.fips));
    row.addEventListener("mouseleave", () => setActiveGovernorCounty(null));
  });

  updateGovernorCountyShowAllButton();
}

function updateGovernorCountyShowAllButton() {
  const button = document.getElementById("detail-county-show-all");
  if (!button) return;

  const hasOverflow = governorCountyBoardState.rows.length > GOVERNOR_COUNTY_BOARD_PREVIEW_LIMIT;
  button.hidden = !hasOverflow;
  if (!hasOverflow) return;

  const showingAll = governorCountyBoardState.limit === "all";
  button.textContent = showingAll ? "Show fewer" : `Show all ${governorCountyBoardState.rows.length} ${governorCurrentRegionLabels.plural}`;
  button.setAttribute("aria-expanded", String(showingAll));
}

function wireGovernorCountyControls() {
  document.querySelectorAll(".detail-county-sort-button").forEach((button) => {
    button.addEventListener("click", () => {
      governorCountyBoardState.sort = button.dataset.sort;
      document.querySelectorAll(".detail-county-sort-button").forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderGovernorCountyBoardRows();
    });
  });
  const showAllButton = document.getElementById("detail-county-show-all");
  if (showAllButton) {
    showAllButton.addEventListener("click", () => {
      governorCountyBoardState.limit = governorCountyBoardState.limit === "all" ? String(GOVERNOR_COUNTY_BOARD_PREVIEW_LIMIT) : "all";
      renderGovernorCountyBoardRows();
    });
  }
}

function governorCountyTooltipHTML(row, stateName) {
  const regionName = String(row.county_name || row.displayName || "").trim();
  const title = governorCurrentRegionLabels.singular === "town" || /\b(County|City)$/i.test(regionName)
    ? regionName
    : `${regionName} County`;
  const rows = row.candidates.slice(0, GOVERNOR_LOCAL_CANDIDATE_DISPLAY_LIMIT).map((candidate, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td>
        <div class="tooltip-candidate">
          <span class="tooltip-candidate-bar ${governorPartyTone(candidate.party)}"></span>
          <span>${candidate.name}</span>
        </div>
      </td>
      <td>${governorPartyShortLabel(candidate.party)}</td>
      <td>${candidate.votesFormatted}</td>
      <td>${governorFormatPercent(candidate.pct)}%</td>
    </tr>
  `).join("");
  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${title}</div>
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
  if (record.countyBundle.regionType === "town") {
    await renderGovernorTownMap(record);
    return;
  }

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
    stateElectionRenderCityLabels(svg, projection, record.stateName);
  } catch (error) {
    empty.hidden = false;
    empty.textContent = "County map data could not be loaded.";
  }
}

async function renderGovernorTownMap(record) {
  const svg = d3.select("#detail-county-map");
  const empty = document.getElementById("detail-map-empty");
  if (svg.empty()) return;

  try {
    const [townRows, geojson] = await Promise.all([
      getGovernorCountyRows(record.stateName),
      d3.json(GOVERNOR_VERMONT_TOWNS_GEOJSON_URL)
    ]);
    const rowByFips = new Map(townRows.filter((row) => row.county_fips).map((row) => [row.county_fips, row]));
    const features = geojson.features || [];
    if (!features.length) {
      empty.hidden = false;
      return;
    }

    const projection = d3.geoMercator();
    const path = d3.geoPath().projection(projection);
    projection.fitExtent([[18, 18], [522, 602]], geojson);
    svg.selectAll("*").remove();

    const tooltip = d3.select("#detail-map-tooltip");
    svg.selectAll(".detail-county-shape")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape")
      .attr("data-fips", (feature) => feature.properties.county_fips || "")
      .attr("d", path)
      .attr("fill", (feature) => {
        const row = rowByFips.get(feature.properties.county_fips);
        return row ? governorCountyShade(row) : GOVERNOR_FALLBACK_FILL;
      })
      .on("mouseover", (event, feature) => {
        const fips = feature.properties.county_fips || "";
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
    stateElectionRenderCityLabels(svg, projection, record.stateName);
  } catch (error) {
    empty.hidden = false;
    empty.textContent = "Town map data could not be loaded.";
  }
}

async function renderGovernorCountyBoard(record) {
  const rows = await getGovernorCountyRows(record.stateName);
  governorCountyBoardState.rows = rows;
  governorCurrentRegionLabels = getGovernorRegionLabels(record);
  const boardTitle = document.getElementById("detail-county-board-title");
  const nameHeading = document.getElementById("detail-county-name-heading");
  const sortGroup = document.getElementById("detail-county-sort");
  const mapTitle = document.getElementById("detail-map-title");
  const mapSubtitle = document.getElementById("detail-map-subtitle");
  const mapEmpty = document.getElementById("detail-map-empty");
  if (boardTitle) boardTitle.textContent = governorCurrentRegionLabels.boardTitle;
  if (nameHeading) nameHeading.textContent = governorCurrentRegionLabels.singularTitle;
  if (sortGroup) sortGroup.setAttribute("aria-label", `Sort ${governorCurrentRegionLabels.singular} results`);
  if (mapTitle) mapTitle.textContent = governorCurrentRegionLabels.mapTitle;
  if (mapSubtitle) mapSubtitle.textContent = `Four-step ${governorCurrentRegionLabels.singular} margin scale.`;
  if (mapEmpty) mapEmpty.textContent = `${governorCurrentRegionLabels.singularTitle} map data is not available for this governor page yet.`;
  document.getElementById("detail-county-board-note").textContent = `${rows.length} ${governorCurrentRegionLabels.plural} reporting governor results.`;
  renderGovernorCountyBoardRows();
  wireGovernorCountyControls();
}

async function initGovernorCountyPage() {
  const stateName = getGovernorStateName();
  const record = getGovernorRaceRecord(stateName);
  if (!record) {
    document.getElementById("detail-title").textContent = "Governor county result unavailable";
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
