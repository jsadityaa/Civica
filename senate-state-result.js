const COUNTY_REFERENCE_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const CONNECTICUT_TOWNS_GEOJSON_URL = "./assets/maps/connecticut-towns.geojson";
const MAINE_TOWNS_GEOJSON_URL = "./assets/maps/state-local-results-2024/maine-local-results-2024.geojson";
const MASSACHUSETTS_MUNICIPALITIES_GEOJSON_URL = "./assets/maps/state-local-results-2024/massachusetts-local-results-2024.geojson";
const SENATE_COUNTY_BOARD_PREVIEW_LIMIT = 6;

const SENATE_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const SENATE_IND_SHADES = ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
const SENATE_MAJOR_CITY_LABELS = {
  Arizona: [
    { name: "Phoenix", coordinates: [-112.0740, 33.4484] },
    { name: "Tucson", coordinates: [-110.9747, 32.2226] }
  ],
  California: [
    { name: "Sacramento", coordinates: [-121.4944, 38.5816] },
    { name: "San Francisco", coordinates: [-122.4194, 37.7749] },
    { name: "San Jose", coordinates: [-121.8863, 37.3382] },
    { name: "Fresno", coordinates: [-119.7871, 36.7378] },
    { name: "Los Angeles", coordinates: [-118.2437, 34.0522] },
    { name: "San Diego", coordinates: [-117.1611, 32.7157] }
  ],
  Connecticut: [
    { name: "Hartford", coordinates: [-72.6851, 41.7658] },
    { name: "New Haven", coordinates: [-72.9279, 41.3083] },
    { name: "Bridgeport", coordinates: [-73.1952, 41.1865] }
  ],
  Delaware: [
    { name: "Wilmington", coordinates: [-75.5466, 39.7447] },
    { name: "Dover", coordinates: [-75.5244, 39.1582] }
  ],
  Florida: [
    { name: "Jacksonville", coordinates: [-81.6557, 30.3322] },
    { name: "Orlando", coordinates: [-81.3792, 28.5383] },
    { name: "Tampa", coordinates: [-82.4572, 27.9506] },
    { name: "Miami", coordinates: [-80.1918, 25.7617] }
  ],
  Hawaii: [
    { name: "Hilo", coordinates: [-155.0885, 19.7074] },
    { name: "Honolulu", coordinates: [-157.8583, 21.3069] }
  ],
  Indiana: [
    { name: "Fort Wayne", coordinates: [-85.1394, 41.0793] },
    { name: "Indianapolis", coordinates: [-86.1581, 39.7684] },
    { name: "Evansville", coordinates: [-87.5711, 37.9716] }
  ],
  Maine: [
    { name: "Portland", coordinates: [-70.2553, 43.6591] },
    { name: "Lewiston", coordinates: [-70.2148, 44.1004] },
    { name: "Bangor", coordinates: [-68.7778, 44.8016] }
  ],
  Massachusetts: [
    { name: "Boston", coordinates: [-71.0589, 42.3601] },
    { name: "Worcester", coordinates: [-71.8023, 42.2626] },
    { name: "Springfield", coordinates: [-72.5898, 42.1015] }
  ],
  Maryland: [
    { name: "Baltimore", coordinates: [-76.6122, 39.2904] },
    { name: "Annapolis", coordinates: [-76.4922, 38.9784] },
    { name: "Frederick", coordinates: [-77.4105, 39.4143] }
  ],
  Michigan: [
    { name: "Detroit", coordinates: [-83.0458, 42.3314] },
    { name: "Grand Rapids", coordinates: [-85.6681, 42.9634] },
    { name: "Lansing", coordinates: [-84.5555, 42.7325] }
  ],
  Minnesota: [
    { name: "Minneapolis", coordinates: [-93.2650, 44.9778] },
    { name: "Saint Paul", coordinates: [-93.0900, 44.9537] },
    { name: "Duluth", coordinates: [-92.1005, 46.7867] }
  ],
  Mississippi: [
    { name: "Jackson", coordinates: [-90.1848, 32.2988] },
    { name: "Gulfport", coordinates: [-89.0928, 30.3674] },
    { name: "Southaven", coordinates: [-89.9787, 34.9890] }
  ]
};
const SENATE_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const SENATE_FALLBACK_FILL = "#2d3138";
const SENATE_COUNTY_REFERENCE_OVERRIDES = {
  Connecticut: [
    { county_fips: "09001", county_name: "Fairfield County" },
    { county_fips: "09003", county_name: "Hartford County" },
    { county_fips: "09005", county_name: "Litchfield County" },
    { county_fips: "09007", county_name: "Middlesex County" },
    { county_fips: "09009", county_name: "New Haven County" },
    { county_fips: "09011", county_name: "New London County" },
    { county_fips: "09013", county_name: "Tolland County" },
    { county_fips: "09015", county_name: "Windham County" }
  ]
};

const SENATE_LOCAL_RESULT_CONFIG = {
  Connecticut: {
    geojsonUrl: CONNECTICUT_TOWNS_GEOJSON_URL,
    nameProperty: "TOWN_NAME",
    idProperty: null,
    projection: "identity",
    singular: "Municipality",
    plural: "municipalities",
    mapTitle: "Municipality Map",
    boardTitle: "Municipality Results"
  },
  Maine: {
    geojsonUrl: MAINE_TOWNS_GEOJSON_URL,
    nameProperty: "county_name",
    idProperty: "county_fips",
    projection: "mercator",
    singular: "Town",
    plural: "towns",
    mapTitle: "Town Map",
    boardTitle: "Town Results"
  },
  Massachusetts: {
    geojsonUrl: MASSACHUSETTS_MUNICIPALITIES_GEOJSON_URL,
    nameProperty: "county_name",
    idProperty: "county_fips",
    projection: "mercator",
    singular: "Municipality",
    plural: "municipalities",
    mapTitle: "Municipality Map",
    boardTitle: "Municipality Results"
  }
};

const senateCountyResults = window.SENATE_COUNTY_RESULTS || {};
const senateData = window.SENATE_2024_DATA || { races: [] };
const countyReferenceCache = new Map();
const countyBoardState = {
  rows: [],
  sort: "votes",
  limit: String(SENATE_COUNTY_BOARD_PREVIEW_LIMIT),
  activeFips: null,
  regionPlural: "counties"
};

const senateStateFipsByName = {
  Arizona: "04",
  California: "06",
  Connecticut: "09",
  Delaware: "10",
  Florida: "12",
  Hawaii: "15",
  Indiana: "18",
  Maine: "23",
  Maryland: "24",
  Massachusetts: "25",
  Michigan: "26",
  Minnesota: "27",
  Mississippi: "28",
  Missouri: "29",
  Montana: "30",
  Nebraska: "31",
  Nevada: "32",
  "New Jersey": "34",
  "New Mexico": "35",
  "New York": "36",
  "North Dakota": "38",
  Ohio: "39",
  Pennsylvania: "42",
  "Rhode Island": "44",
  Tennessee: "47",
  Texas: "48",
  Utah: "49",
  Vermont: "50",
  Virginia: "51",
  Washington: "53",
  "West Virginia": "54",
  Wisconsin: "55",
  Wyoming: "56"
};

const senateRaceGroups = senateData.races.reduce((acc, race) => {
  const existing = acc.get(race.race) || [];
  existing.push(race);
  acc.set(race.race, existing);
  return acc;
}, new Map());

function senateFormatPartyLabel(party) {
  if (party === "D" || party === "Dem.") return "Democrat";
  if (party === "R" || party === "Rep.") return "Republican";
  if (party === "I" || party === "Ind.") return "Independent";
  if (party === "L" || party === "Lib.") return "Libertarian";
  return party || "Independent";
}

function senateFormatPartyShort(party) {
  if (party === "D" || party === "Dem.") return "Dem.";
  if (party === "R" || party === "Rep.") return "Rep.";
  if (party === "I" || party === "Ind.") return "Ind.";
  return party || "Ind.";
}

function senateWinnerTone(party) {
  if (party === "D") return "dem";
  if (party === "R") return "rep";
  return "ind";
}

function senateParseResultMargin(result) {
  return Number(String(result || "0").split("+")[1] || 0);
}

function senateFormatVotes(value) {
  return Number(value || 0).toLocaleString();
}

function senateInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "S";
}

function getSenateCandidatePortrait(name) {
  const initials = senateInitials(name);
  return `https://placehold.co/120x120/2f3540/f3f4f6?text=${encodeURIComponent(initials)}`;
}

function getPrimaryRace(name, seatType = "Regular") {
  const races = senateRaceGroups.get(name) || [];
  return races.find((race) => race.seatType === seatType) || races.find((race) => race.seatType === "Regular") || races[0] || null;
}

function getSenateResultRecord(name, seatType = "Regular") {
  const races = senateRaceGroups.get(name) || [];
  const primary = getPrimaryRace(name, seatType);
  if (!primary) return null;
  return {
    name,
    displayName: name,
    primary,
    races
  };
}

function candidateNameSpan(name, party) {
  const tone = senateWinnerTone(party);
  return `<span class="candidate-name-inline ${tone}">${name}</span>`;
}

function getStatewideCandidates(record) {
  const rows = record.primary.tooltipRows;
  if (Array.isArray(rows) && rows.length) {
    return rows.map((row) => ({
      candidate: row.name,
      party: senateFormatPartyLabel(row.party),
      partyShort: senateFormatPartyShort(row.party),
      votes: row.votes,
      pct: `${row.pct}%`,
      tone: senateWinnerTone(row.party[0])
    }));
  }

  return [
    {
      candidate: record.primary.winner,
      party: senateFormatPartyLabel(record.primary.winnerParty),
      partyShort: senateFormatPartyShort(record.primary.winnerParty),
      votes: "—",
      pct: record.primary.result.replace(/^[A-Z]\+/, "") + "%",
      tone: senateWinnerTone(record.primary.winnerParty)
    },
    {
      candidate: record.primary.opponent,
      party: senateFormatPartyLabel(record.primary.opponentParty),
      partyShort: senateFormatPartyShort(record.primary.opponentParty),
      votes: "—",
      pct: "—",
      tone: senateWinnerTone(record.primary.opponentParty)
    }
  ];
}

function getCertifiedSenateTotal(record, candidates) {
  if (record.primary.reportedTotal) {
    return Number(record.primary.reportedTotal);
  }

  const countyRows = senateCountyResults[record.name]?.counties || [];
  if (countyRows.length) {
    return countyRows.reduce((sum, county) => sum + Number(county.totalVotes || 0), 0);
  }

  return candidates.reduce((sum, candidate) => sum + Number(String(candidate.votes || 0).replace(/,/g, "")), 0);
}

function buildFactItems(record, candidates) {
  const [winner, runnerUp] = candidates;
  const facts = [
    `<li><strong>${candidateNameSpan(winner.candidate, winner.partyShort[0])}</strong><span>won ${record.displayName}'s ${record.primary.seatType.toLowerCase()} Senate race with ${winner.votes} votes (${winner.pct}).</span></li>`,
    `<li><strong>${candidateNameSpan(runnerUp.candidate, runnerUp.partyShort[0])}</strong><span>finished second with ${runnerUp.votes} votes (${runnerUp.pct}).</span></li>`,
    `<li><strong>Seat</strong><span>This page is showing the ${record.primary.seatType.toLowerCase()} 2024 Senate contest in ${record.displayName}.</span></li>`,
    `<li><strong>Margin</strong><span>${candidateNameSpan(record.primary.winner, record.primary.winnerParty)} carried the race by ${record.primary.result}.</span></li>`
  ];

  if (record.races.length > 1) {
    facts.push(`<li><strong>Additional contest</strong><span>${record.displayName} also held ${record.races.length - 1} additional Senate election${record.races.length - 1 === 1 ? "" : "s"} in 2024.</span></li>`);
  }

  return facts;
}

function normalizeCountyName(name) {
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
    .replace(/\bcity and borough\b/g, "")
    .replace(/\bcity\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCountyDisplayName(name) {
  const raw = String(name || "").trim();
  if (/ward/i.test(raw) || /district of columbia/i.test(raw)) {
    return raw.replace(/\s+city$/i, "");
  }
  if (/^baltimore\s+city$/i.test(raw)) {
    return "Baltimore City";
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

async function fetchCountyReference(stateName) {
  if (countyReferenceCache.has(stateName)) return countyReferenceCache.get(stateName);

  const rows = SENATE_COUNTY_REFERENCE_OVERRIDES[stateName] || await d3.csv(COUNTY_REFERENCE_URL, (row) => {
    if (row.state_name !== stateName) return null;
    return {
      county_fips: row.county_fips,
      county_name: row.county_name
    };
  });

  const lookup = new Map();
  rows.filter(Boolean).forEach((row) => {
    lookup.set(String(row.county_name || "").trim().toLowerCase(), row);
    lookup.set(formatCountyDisplayName(row.county_name).toLowerCase(), row);
    lookup.set(normalizeCountyName(row.county_name), row);
    lookup.set(normalizeCountyName(formatCountyDisplayName(row.county_name)), row);
  });

  countyReferenceCache.set(stateName, lookup);
  return lookup;
}

function getCountyWinnerParty(row) {
  return row.candidates[0]?.party || "D";
}

function getCountyMarginValue(row) {
  const top = row.candidates[0];
  const runnerUp = row.candidates[1];
  if (!top || !runnerUp) return 0;
  return Math.max(0, Number(top.pct) - Number(runnerUp.pct));
}

function getCountyMarginLabel(row) {
  const top = row.candidates[0];
  const margin = getCountyMarginValue(row);
  const winnerLabel = top?.party || "D";
  const formatted = margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
  return `${winnerLabel}+${formatted}`;
}

function getCountyShade(row) {
  const winnerPct = Number(row.candidates[0]?.pct || 0);
  const party = getCountyWinnerParty(row);
  const shades = party === "D" ? SENATE_DEM_SHADES : party === "R" ? SENATE_REP_SHADES : SENATE_IND_SHADES;
  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

async function getStateCountyRows(stateName) {
  const bundle = senateCountyResults[stateName];
  const localConfig = SENATE_LOCAL_RESULT_CONFIG[stateName];
  const counties = bundle?.counties || [];

  if (localConfig) {
    const localRows = bundle?.municipalities || counties;
    return localRows
      .map((county) => {
        const displayName = county.town || county.county;
        if (!displayName) return null;
        return {
          county_fips: county.county_fips || `${stateName}-${normalizeCountyName(displayName)}`,
          county_name: displayName,
          displayName,
          candidates: county.candidates,
          totalVotes: county.totalVotes,
          winnerParty: getCountyWinnerParty(county),
          marginValue: getCountyMarginValue(county),
          marginLabel: getCountyMarginLabel(county)
        };
      })
      .filter(Boolean);
  }

  if (!counties.length) return [];

  const reference = await fetchCountyReference(stateName);

  return counties
    .map((county) => {
      const countyKey = String(county.county || "").trim().toLowerCase();
      const referenceRow = reference.get(countyKey) || reference.get(normalizeCountyName(county.county)) || null;
      if (!referenceRow) return null;
      return {
        county_fips: referenceRow.county_fips,
        county_name: referenceRow.county_name,
        displayName: formatCountyDisplayName(referenceRow.county_name),
        candidates: county.candidates,
        totalVotes: county.totalVotes,
        winnerParty: getCountyWinnerParty(county),
        marginValue: getCountyMarginValue(county),
        marginLabel: getCountyMarginLabel(county)
      };
    })
    .filter(Boolean);
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
    sorted.sort((a, b) => b.marginValue - a.marginValue || b.totalVotes - a.totalVotes);
  } else if (countyBoardState.sort === "alphabetical") {
    sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else {
    sorted.sort((a, b) => b.totalVotes - a.totalVotes || b.marginValue - a.marginValue);
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
  body.innerHTML = rows.map((row) => `
    <tr class="detail-county-row" data-fips="${row.county_fips}">
      <td>${row.displayName}</td>
      <td><span class="detail-county-margin ${senateWinnerTone(row.winnerParty)}">${row.marginLabel}</span></td>
      <td>${senateFormatVotes(row.totalVotes)}</td>
      <td>100%</td>
    </tr>
  `).join("");

  body.querySelectorAll(".detail-county-row").forEach((row) => {
    row.addEventListener("mouseenter", () => setActiveCounty(row.dataset.fips));
    row.addEventListener("mouseleave", () => setActiveCounty(null));
  });

  updateCountyShowAllButton();
}

function updateCountyShowAllButton() {
  const button = document.getElementById("detail-county-show-all");
  if (!button) return;

  const hasOverflow = countyBoardState.rows.length > SENATE_COUNTY_BOARD_PREVIEW_LIMIT;
  button.hidden = !hasOverflow;
  if (!hasOverflow) return;

  const showingAll = countyBoardState.limit === "all";
  button.textContent = showingAll ? "Show fewer" : `Show all ${countyBoardState.rows.length} ${countyBoardState.regionPlural}`;
  button.setAttribute("aria-expanded", String(showingAll));
}

function wireCountyBoardControls() {
  document.querySelectorAll(".detail-county-sort-button").forEach((button) => {
    button.onclick = () => {
      countyBoardState.sort = button.dataset.sort;
      document.querySelectorAll(".detail-county-sort-button").forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderCountyBoardRows();
    };
  });

  const showAllButton = document.getElementById("detail-county-show-all");
  if (showAllButton) {
    showAllButton.onclick = () => {
      countyBoardState.limit = countyBoardState.limit === "all" ? String(SENATE_COUNTY_BOARD_PREVIEW_LIMIT) : "all";
      renderCountyBoardRows();
    };
  }
}

function getSenateRegionLabels(stateName) {
  const localConfig = SENATE_LOCAL_RESULT_CONFIG[stateName];
  if (localConfig) return localConfig;
  return {
    singular: "County",
    plural: "counties",
    mapTitle: "County Map",
    boardTitle: "County Results"
  };
}

function getCountyTooltipHTML(row, stateName) {
  const rows = row.candidates.slice(0, 3).map((candidate, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td>
        <div class="tooltip-candidate">
          <span class="tooltip-candidate-bar ${senateWinnerTone(candidate.party)}"></span>
          <span>${candidate.name}</span>
        </div>
      </td>
      <td>${senateFormatPartyShort(candidate.party)}</td>
      <td>${candidate.votesFormatted || senateFormatVotes(candidate.votes)}</td>
      <td>${candidate.pct}%</td>
    </tr>
  `).join("");

  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${row.displayName}</div>
      <div class="tooltip-ev">${stateName} Senate result</div>
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

function renderSenateCityLabels(svg, projection, stateName) {
  const cityLabels = SENATE_MAJOR_CITY_LABELS[stateName] || [];
  const placedLabels = placeSenateCityLabels(cityLabels, projection);

  const cityLayer = svg.append("g").attr("class", "state-election-city-labels senate-city-labels");

  cityLayer.selectAll("circle")
    .data(placedLabels)
    .enter()
    .append("circle")
    .attr("cx", (city) => city.point[0])
    .attr("cy", (city) => city.point[1])
    .attr("r", 2.6);

  cityLayer.selectAll("text")
    .data(placedLabels)
    .enter()
    .append("text")
    .attr("x", (city) => city.labelX)
    .attr("y", (city) => city.labelY)
    .attr("text-anchor", (city) => city.anchor)
    .text((city) => city.name);
}

function placeSenateCityLabels(cityLabels, projection) {
  const svgWidth = 540;
  const svgHeight = 520;
  const edgePadding = 8;
  const labelHeight = 22;
  const placedBoxes = [];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const overlaps = (box) => placedBoxes.some((placed) => (
    box.x < placed.x + placed.width + 4 &&
    box.x + box.width + 4 > placed.x &&
    box.y < placed.y + placed.height + 4 &&
    box.y + box.height + 4 > placed.y
  ));

  return cityLabels
    .map((city) => {
      const point = projection(city.coordinates);
      return point ? { ...city, point } : null;
    })
    .filter(Boolean)
    .map((city) => {
      const [x, y] = city.point;
      const labelWidth = Math.max(36, city.name.length * 10.2);
      const candidates = [
        { x: x + 7, y: y + 6, anchor: "start" },
        { x: x - 7, y: y + 6, anchor: "end" },
        { x: x + 7, y: y - 9, anchor: "start" },
        { x: x - 7, y: y - 9, anchor: "end" },
        { x, y: y - 13, anchor: "middle" },
        { x, y: y + 18, anchor: "middle" },
        { x: x + 7, y: y + 24, anchor: "start" },
        { x: x - 7, y: y + 24, anchor: "end" }
      ];

      const prepared = candidates.map((candidate) => {
        const boxX = candidate.anchor === "end"
          ? candidate.x - labelWidth
          : candidate.anchor === "middle"
            ? candidate.x - labelWidth / 2
            : candidate.x;
        const box = {
          x: clamp(boxX, edgePadding, svgWidth - labelWidth - edgePadding),
          y: clamp(candidate.y - labelHeight + 5, edgePadding, svgHeight - labelHeight - edgePadding),
          width: labelWidth,
          height: labelHeight
        };
        return {
          ...candidate,
          labelX: candidate.anchor === "end"
            ? box.x + labelWidth
            : candidate.anchor === "middle"
              ? box.x + labelWidth / 2
              : box.x,
          labelY: box.y + labelHeight - 5,
          box
        };
      });

      const chosen = prepared.find((candidate) => !overlaps(candidate.box)) || prepared[0];
      placedBoxes.push(chosen.box);

      return {
        ...city,
        labelX: chosen.labelX,
        labelY: chosen.labelY,
        anchor: chosen.anchor
      };
    });
}

function updateSenateMapLegend(countyRows) {
  const winningParties = new Set(countyRows.map((row) => row.winnerParty));
  document.querySelectorAll(".detail-map-legend-row[data-party]").forEach((row) => {
    const party = row.dataset.party;
    row.hidden = !winningParties.has(party);
  });
}

async function renderCountyMap(record) {
  const svg = d3.select("#detail-county-map");
  const tooltip = d3.select("#detail-map-tooltip");
  const mapEmpty = document.getElementById("detail-map-empty");
  const subtitle = document.getElementById("detail-map-subtitle");
  const mapHeading = document.querySelector(".detail-map-head h3");
  const mapLegend = document.querySelector(".detail-map-legend");

  if (svg.empty() || !window.topojson) return;

  svg.selectAll("*").remove();
  const regionLabels = getSenateRegionLabels(record.name);
  if (mapHeading) mapHeading.textContent = regionLabels.mapTitle;
  if (mapLegend) mapLegend.setAttribute("aria-label", `${regionLabels.mapTitle.toLowerCase()} legend`);

  try {
    const localConfig = SENATE_LOCAL_RESULT_CONFIG[record.name];
    if (localConfig) {
      const [countyRows, localGeojson] = await Promise.all([
        getStateCountyRows(record.name),
        d3.json(localConfig.geojsonUrl)
      ]);
      const rowByName = new Map(countyRows.map((row) => [normalizeCountyName(row.displayName), row]));
      const rowById = new Map(countyRows.map((row) => [row.county_fips, row]));
      const features = (localGeojson.features || [])
        .map((feature) => ({
          ...feature,
          resultRow: rowById.get(feature.properties?.[localConfig.idProperty]) ||
            rowByName.get(normalizeCountyName(feature.properties?.[localConfig.nameProperty]))
        }))
        .filter((feature) => feature.resultRow);

      if (!countyRows.length || !features.length) {
        mapEmpty.hidden = false;
        subtitle.textContent = `${regionLabels.singular} map data is not available for this Senate page yet.`;
        return;
      }

      mapEmpty.hidden = true;
      subtitle.textContent = `${record.displayName} ${regionLabels.plural} shaded by the winning Senate margin.`;
      updateSenateMapLegend(countyRows);

      const localCollection = { type: "FeatureCollection", features };
      const projection = localConfig.projection === "identity"
        ? d3.geoIdentity().reflectY(true).fitSize([540, 620], localCollection)
        : d3.geoMercator().fitSize([540, 620], localCollection);
      const path = d3.geoPath(projection);

      svg.append("g")
        .selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("class", "detail-county-shape")
        .attr("data-fips", (feature) => feature.resultRow.county_fips)
        .attr("d", path)
        .attr("fill", (feature) => getCountyShade(feature.resultRow))
        .on("mouseover", (event, feature) => {
          const row = feature.resultRow;
          setActiveCounty(row.county_fips);
          tooltip.style("opacity", 1).html(getCountyTooltipHTML(row, record.name));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
          setActiveCounty(null);
        });

      svg.append("path")
        .datum(localCollection)
        .attr("class", "detail-state-outline")
        .attr("d", path);

      renderSenateCityLabels(svg, projection, record.name);

      return;
    }

    const [countyRows, countiesTopo, statesTopo] = await Promise.all([
      getStateCountyRows(record.name),
      d3.json(COUNTIES_TOPOJSON_URL),
      d3.json(STATES_TOPOJSON_URL)
    ]);

    const rowByFips = new Map(countyRows.map((row) => [row.county_fips, row]));
    const features = topojson.feature(countiesTopo, countiesTopo.objects.counties).features
      .filter((feature) => rowByFips.has(String(feature.id).padStart(5, "0")));
    const stateFeature = topojson.feature(statesTopo, statesTopo.objects.states).features
      .find((feature) => String(feature.id).padStart(2, "0") === senateStateFipsByName[record.name]);

    if (!countyRows.length || !features.length || !stateFeature) {
      mapEmpty.hidden = false;
      subtitle.textContent = "County map data is not available for this Senate page yet.";
      return;
    }

    mapEmpty.hidden = true;
    subtitle.textContent = `${record.displayName} counties shaded by the winning Senate margin.`;
    updateSenateMapLegend(countyRows);

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
      .attr("fill", (feature) => getCountyShade(rowByFips.get(String(feature.id).padStart(5, "0"))))
      .on("mouseover", (event, feature) => {
        const row = rowByFips.get(String(feature.id).padStart(5, "0"));
        if (!row) return;
        setActiveCounty(row.county_fips);
        tooltip.style("opacity", 1).html(getCountyTooltipHTML(row, record.name));
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

    renderSenateCityLabels(svg, projection, record.name);
  } catch (error) {
    mapEmpty.hidden = false;
    subtitle.textContent = "County map data could not be loaded.";
    console.error(error);
  }
}

async function renderCountyBoard(record) {
  const note = document.getElementById("detail-county-board-note");
  const empty = document.getElementById("detail-county-board-empty");
  const tableWrap = document.getElementById("detail-county-board-table-wrap");
  const heading = document.querySelector("#detail-county-board h2");
  const firstColumn = document.querySelector(".senate-county-board-table thead th:first-child");
  const sortGroup = document.querySelector(".detail-county-sort");
  const regionLabels = getSenateRegionLabels(record.name);

  empty.hidden = true;
  tableWrap.hidden = false;
  countyBoardState.regionPlural = regionLabels.plural;
  if (heading) heading.textContent = regionLabels.boardTitle;
  if (firstColumn) firstColumn.textContent = regionLabels.singular;
  if (sortGroup) sortGroup.setAttribute("aria-label", `Sort ${regionLabels.singular.toLowerCase()} results`);

  const rows = await getStateCountyRows(record.name);
  if (!rows.length) {
    note.textContent = `${regionLabels.singular} board unavailable.`;
    empty.hidden = false;
    empty.textContent = `${regionLabels.singular}-level Senate results are not available for this state page yet.`;
    tableWrap.hidden = true;
    return;
  }

  note.textContent = `${regionLabels.singular} margins in the 2024 Senate race.`;
  countyBoardState.rows = rows;
  countyBoardState.limit = String(SENATE_COUNTY_BOARD_PREVIEW_LIMIT);
  renderCountyBoardRows();
  wireCountyBoardControls();
}

function renderSummary(record) {
  const title = document.getElementById("detail-title");
  const subtitle = document.getElementById("detail-subtitle");
  const summaryCard = document.getElementById("detail-summary-card");
  const summaryTitle = document.getElementById("detail-summary-title");
  const summaryCallout = document.getElementById("detail-summary-callout");
  const summaryPortrait = document.getElementById("detail-summary-portrait");
  const winnerName = document.getElementById("detail-winner-name");
  const seat = document.getElementById("detail-ev");
  const margin = document.getElementById("detail-margin");
  const voteBody = document.getElementById("detail-vote-body");
  const certifiedTitle = document.getElementById("detail-certified-title");
  const certifiedDem = document.getElementById("detail-certified-dem");
  const certifiedRep = document.getElementById("detail-certified-rep");
  const certifiedInd = document.getElementById("detail-certified-ind");
  const certifiedOther = document.getElementById("detail-certified-other");
  const certifiedNote = document.getElementById("detail-certified-note");
  const candidates = getStatewideCandidates(record);

  const winnerTone = senateWinnerTone(record.primary.winnerParty);
  const totalVotes = getCertifiedSenateTotal(record, candidates);
  const demPct = candidates.filter((candidate) => candidate.party === "Democrat").reduce((sum, candidate) => sum + Number(candidate.pct.replace("%", "")), 0);
  const repPct = candidates.filter((candidate) => candidate.party === "Republican").reduce((sum, candidate) => sum + Number(candidate.pct.replace("%", "")), 0);
  const indPct = candidates.filter((candidate) => candidate.party === "Independent").reduce((sum, candidate) => sum + Number(candidate.pct.replace("%", "")), 0);

  document.title = `${record.displayName} U.S. Senate Election Results`;
  title.textContent = `${record.displayName} U.S. Senate Election Results`;
  subtitle.textContent = `${record.displayName}'s ${record.primary.seatType.toLowerCase()} U.S. Senate result in the 2024 general election.`;
  summaryCard.classList.remove("winner-dem", "winner-rep", "winner-ind");
  summaryCard.classList.add(`winner-${winnerTone}`);
  summaryTitle.textContent = `${record.primary.winner} wins ${record.displayName}.`;
  summaryCallout.textContent = record.races.length > 1
    ? `This page highlights the ${record.primary.seatType.toLowerCase()} Senate race. An additional Senate contest was also on the ballot here in 2024.`
    : "Race called with certified statewide Senate vote totals.";
  summaryPortrait.src = getSenateCandidatePortrait(record.primary.winner);
  winnerName.textContent = record.primary.winner;
  seat.textContent = record.primary.seatType;
  margin.textContent = record.primary.result;

  voteBody.innerHTML = candidates.map((candidate, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td>
        <div class="detail-candidate-cell">
          <img class="detail-candidate-photo" src="${getSenateCandidatePortrait(candidate.candidate)}" alt="${candidate.candidate}" />
          <span>${candidate.candidate}</span>
        </div>
      <td>${candidate.party}</td>
      <td>${candidate.votes}</td>
      <td>${candidate.pct}</td>
    </tr>
  `).join("");

  certifiedTitle.textContent = `The U.S. Senate vote has been certified in ${record.displayName}.`;
  certifiedDem.style.width = `${demPct}%`;
  certifiedRep.style.width = `${repPct}%`;
  certifiedInd.style.width = `${indPct}%`;
  certifiedOther.style.width = `${Math.max(0, 100 - demPct - repPct - indPct)}%`;
  certifiedNote.textContent = `${senateFormatVotes(totalVotes)} total votes reported.`;

  document.querySelector(".detail-map-head h3").textContent = "County Map";
}

async function renderSenateStatePage() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  const seatType = params.get("seat") || "Regular";
  const title = document.getElementById("detail-title");
  const subtitle = document.getElementById("detail-subtitle");

  if (!name) {
    title.textContent = "Result not found";
    subtitle.textContent = "No state was specified in the link.";
    return;
  }

  const record = getSenateResultRecord(name, seatType);
  if (!record) {
    title.textContent = "Result not found";
    subtitle.textContent = "That state does not have a 2024 Senate result in the current dataset.";
    return;
  }

  renderSummary(record);
  await Promise.all([
    renderCountyMap(record),
    renderCountyBoard(record)
  ]);
}

renderSenateStatePage();
