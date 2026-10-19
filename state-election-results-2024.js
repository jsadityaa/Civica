const STATE_ELECTION_COUNTY_RESULTS_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const STATE_ELECTION_COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATE_ELECTION_STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const STATE_ELECTION_CT_TOWN_RESULTS_URL = "./data/ct-town-results-2024.json";
const STATE_ELECTION_CT_TOWNS_GEOJSON_URL = "./assets/maps/connecticut-towns.geojson";
const stateElectionCountyResultsCache = new Map();
const stateElectionLocalResultsCache = new Map();
let stateElectionConnecticutTownRowsCache = null;
let stateElectionTopoCache = null;
let stateElectionSenateMapMode = "share";

const STATE_ELECTION_LOCAL_GEOJSON_URLS = {
  Maine: "./assets/maps/state-local-results-2024/maine-local-results-2024.geojson?v=20261006-maine-labels",
  Massachusetts: "./assets/maps/state-local-results-2024/massachusetts-local-results-2024.geojson",
  "New Hampshire": "./assets/maps/state-local-results-2024/new-hampshire-local-results-2024.geojson",
  "Rhode Island": "./assets/maps/state-local-results-2024/rhode-island-local-results-2024.geojson",
  Vermont: "./assets/maps/state-local-results-2024/vermont-local-results-2024.geojson"
};

const STATE_ELECTION_SENATE_LOCAL_MAP_AGGREGATE_ALIASES = {
  Vermont: {
    "Rutland City": "Rutland",
    "Rutland Town": "Rutland",
    "Essex Town": "Essex",
    "Essex Junction City": "Essex Junction",
    "Barre Town": "Barre",
    "Barre City": "Barre",
    "St. Albans Town": "St. Albans",
    "St. Albans City": "St. Albans",
    "Newport City": "Newport",
    "Newport Town": "Newport"
  }
};

const STATE_ELECTION_FIPS_BY_NAME = {
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

const STATE_ELECTION_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const STATE_ELECTION_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const STATE_ELECTION_IND_SHADES = ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
const STATE_ELECTION_HOUSE_PREVIEW_LIMIT = 5;
const stateElectionHouseListState = {
  districts: [],
  limit: STATE_ELECTION_HOUSE_PREVIEW_LIMIT
};
const STATE_ELECTION_CANDIDATE_PORTRAITS = {
  "Kamala Harris": "https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg",
  "Donald Trump": "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg"
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

function stateElectionNormalizeTownName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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

function stateElectionFormatCountyName(name, row = {}) {
  const base = String(name || "")
    .trim()
    .replace(/\s+County$/i, "")
    .replace(/\s+Parish$/i, "")
    .replace(/\s+Borough$/i, "")
    .replace(/\s+Census Area$/i, "")
    .replace(/\s+Municipality$/i, "")
    .replace(/\s+city$/i, "");

  if (row.region_type === "town" || row.region_type === "municipality" || row.region_type === "local" || /Ward\s+\d+/i.test(base) || /District of Columbia/i.test(base)) {
    return base;
  }

  return `${base} County`;
}

function stateElectionUsesLocalResults(stateName) {
  return Boolean(STATE_ELECTION_LOCAL_GEOJSON_URLS[stateName]);
}

function stateElectionRegionLabel(stateName) {
  if (stateName === "District of Columbia") return "Ward";
  if (stateName === "Connecticut") return "Town";
  if (stateName === "Massachusetts" || stateName === "Rhode Island") return "Municipality";
  if (stateElectionUsesLocalResults(stateName)) return "Town";
  return "County";
}

function stateElectionRegionLabelPlural(stateName) {
  if (stateName === "District of Columbia") return "Wards";
  if (stateName === "Connecticut") return "Towns";
  if (stateName === "Massachusetts" || stateName === "Rhode Island") return "Municipalities";
  if (stateElectionUsesLocalResults(stateName)) return "Towns";
  return "Counties";
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
      <div class="tooltip-title">${stateElectionFormatCountyName(row.county_name, row)}</div>
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
  if (fillKey === "Dem") return "#2879b5";
  if (fillKey === "Rep") return "#cf2f2f";
  return "#c8a24a";
}

function stateElectionHouseDistrictFill(district) {
  if (!district) return "#2d3138";
  const partyClass = stateElectionPartyClass(district.winnerParty);
  if (district.flipped && partyClass === "dem") return "url(#state-election-house-dem-flip-pattern)";
  if (district.flipped && partyClass === "rep") return "url(#state-election-house-rep-flip-pattern)";
  if (district.flipped) return "url(#state-election-house-ind-flip-pattern)";
  return stateElectionHouseFill(district.fillKey);
}

function stateElectionBuildHousePatterns(svg) {
  const defs = svg.append("defs");

  defs.append("pattern")
    .attr("id", "state-election-house-dem-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call((pattern) => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#5a96c8");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#2879b5");
    });

  defs.append("pattern")
    .attr("id", "state-election-house-rep-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call((pattern) => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#d86a6a");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#cf2f2f");
    });

  defs.append("pattern")
    .attr("id", "state-election-house-ind-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call((pattern) => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#e0c16a");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#c8a24a");
    });
}

function stateElectionHouseWinnerIsIncumbent(district) {
  return Boolean((district.candidates || []).find((candidate) => candidate.winner && candidate.incumbent));
}

function stateElectionHousePartyLabel(candidate) {
  const party = candidate?.party || candidate?.partyName || "";
  if (party === "D" || party === "Democrat") return "Dem.";
  if (party === "R" || party === "Republican") return "Rep.";
  if (party === "LB" || party === "Libertarian") return "Lib.";
  if (party === "GR" || party === "Green") return "Green";
  if (party === "I" || party === "Independent") return "Ind.";
  return candidate?.partyName || party || "Other";
}

function stateElectionHouseCandidateClass(candidate) {
  const party = candidate?.party || candidate?.partyName || "";
  if (party === "D" || party === "Democrat") return "dem";
  if (party === "R" || party === "Republican") return "rep";
  return "ind";
}

function stateElectionHouseCandidateSurname(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "Candidate";
}

function stateElectionPartyClass(party) {
  if (party === "D" || party === "Democrat") return "dem";
  if (party === "R" || party === "Republican") return "rep";
  return "ind";
}

function stateElectionDistrictLink(code) {
  return `./house-district-result.html?code=${encodeURIComponent(code)}`;
}

function stateElectionNormalizeRegionName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s*\((part|pt\.)\)\s*/gi, " ")
    .replace(/\s+(county|parish|borough|census area|municipality|city|town)$/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stateElectionSenatePartyCode(party) {
  const label = String(party || "").trim();
  if (label === "D" || label === "Dem." || label === "Democrat" || label === "Democratic") return "D";
  if (label === "R" || label === "Rep." || label === "Republican") return "R";
  if (label === "N" || label === "None") return "N";
  return "I";
}

function stateElectionSenatePartyTone(party) {
  const code = stateElectionSenatePartyCode(party);
  if (code === "D") return "dem";
  if (code === "R") return "rep";
  if (code === "N") return "none";
  return "ind";
}

function stateElectionSenatePartyLabel(party) {
  const code = stateElectionSenatePartyCode(party);
  if (party === "W") return "Write-in";
  if (code === "D") return "Democrat";
  if (code === "R") return "Republican";
  if (code === "N") return "None";
  const label = String(party || "").trim();
  if (label === "Ind." || label === "I" || label === "Independent") return "Independent";
  if (label === "Lib." || label === "L") return "Libertarian";
  if (label === "Green" || label === "G") return "Green";
  if (label === "Const." || label === "C") return "Constitution";
  return label || "Independent";
}

function stateElectionSenatePartyShort(party) {
  const code = stateElectionSenatePartyCode(party);
  if (code === "D") return "Dem.";
  if (code === "R") return "Rep.";
  if (code === "N") return "None";
  const label = String(party || "").trim();
  if (label === "Lib." || label === "L" || label === "Libertarian") return "Lib.";
  if (label === "Green" || label === "G") return "Green";
  if (label === "Const." || label === "C" || label === "Constitution") return "Const.";
  return "Ind.";
}

function stateElectionSenateCandidateRows(race) {
  const rows = Array.isArray(race?.tooltipRows) ? race.tooltipRows : [];
  return rows.map((row) => ({
    name: row.name,
    party: stateElectionSenatePartyLabel(row.party),
    partyShort: stateElectionSenatePartyShort(row.party),
    votes: row.votes,
    voteNumber: Number(String(row.votes || 0).replace(/,/g, "")),
    pct: `${row.pct}%`,
    imageUrl: row.imageUrl || "",
    tone: stateElectionSenatePartyTone(row.party)
  }));
}

function stateElectionGetSenateRaces(stateName) {
  return (window.SENATE_2024_DATA?.races || [])
    .filter((race) => race.race === stateName);
}

function stateElectionGetPrimarySenateRace(stateName) {
  const races = stateElectionGetSenateRaces(stateName);
  return races.find((race) => race.seatType === "Regular") || races[0] || null;
}

function stateElectionSenateDetailLink(stateName, race) {
  const params = new URLSearchParams({ name: stateName });
  if (race?.seatType && race.seatType !== "Regular") {
    params.set("seat", race.seatType);
  }
  return `./senate-state-result.html?${params.toString()}`;
}

function stateElectionSenateUnitLabel(stateName) {
  if (stateName === "Connecticut") return { singular: "Town", plural: "Towns" };
  if (stateName === "Maine" || stateName === "Vermont") return { singular: "Town", plural: "Towns" };
  if (stateName === "Massachusetts" || stateName === "Rhode Island") return { singular: "Municipality", plural: "Municipalities" };
  return { singular: "County", plural: "Counties" };
}

function stateElectionSenateUnitLabelForRows(stateName, rows) {
  if (rows.length && rows.every((row) => row.region_type === "county")) {
    return { singular: "County", plural: "Counties" };
  }
  return stateElectionSenateUnitLabel(stateName);
}

function stateElectionSenateWinnerParty(row) {
  const top = (row?.candidates || [])
    .slice()
    .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0))[0];
  return stateElectionSenatePartyCode(top?.party);
}

function stateElectionSenateUnitLead(row) {
  const candidates = (row?.candidates || [])
    .slice()
    .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
  if (!candidates.length) return 0;
  return Math.max(0, Number(candidates[0].votes || 0) - Number(candidates[1]?.votes || 0));
}

function stateElectionSenateUnitShade(row) {
  if (!Number(row?.totalVotes || 0)) return "#2d3138";
  const winner = stateElectionSenateWinnerParty(row);
  const shades = winner === "D"
    ? STATE_ELECTION_DEM_SHADES
    : winner === "R"
      ? STATE_ELECTION_REP_SHADES
      : STATE_ELECTION_IND_SHADES;
  const winnerPct = Math.max(...(row.candidates || []).map((candidate) => Number(candidate.pct || 0)), 0);
  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

function stateElectionNormalizeSenateUnitRow(row, referenceByName = new Map()) {
  const candidates = (row.candidates || [])
    .map((candidate) => ({
      ...candidate,
      party: candidate.party,
      partyShort: stateElectionSenatePartyShort(candidate.party),
      tone: stateElectionSenatePartyTone(candidate.party),
      votes: Number(candidate.votes || 0),
      votesFormatted: candidate.votesFormatted || stateElectionFormatVotes(candidate.votes),
      pct: Number(candidate.pct || 0)
    }))
    .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
  const top = candidates[0];
  const second = candidates[1];
  const winnerCode = stateElectionSenatePartyCode(top?.party);
  const marginPct = Math.max(0, Number(top?.pct || 0) - Number(second?.pct || 0));
  const cleanName = String(row.county || row.town || "").trim();
  const normalizedName = stateElectionNormalizeRegionName(cleanName);
  const reference = referenceByName.get(normalizedName);
  return {
    county_fips: reference?.county_fips || row.county_fips || `SENATE-${normalizedName}`,
    county_name: cleanName,
    displayName: cleanName,
    region_type: reference?.region_type || (row.town ? "local" : (/county|parish|borough|census area/i.test(cleanName) ? "county" : "town")),
    candidates,
    totalVotes: Number(row.totalVotes || candidates.reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0)),
    winnerParty: winnerCode,
    marginLabel: `${winnerCode === "D" ? "D" : winnerCode === "R" ? "R" : "I"}+${marginPct < 1 ? marginPct.toFixed(2) : marginPct.toFixed(1)}`
  };
}

function stateElectionAggregateSenateLocalMapRows(stateName, rows) {
  const aliases = STATE_ELECTION_SENATE_LOCAL_MAP_AGGREGATE_ALIASES[stateName];
  if (!aliases) return rows;

  const grouped = new Map();
  rows.forEach((row) => {
    const displayName = aliases[row.displayName] || row.displayName;
    const key = stateElectionNormalizeRegionName(displayName);
    if (!grouped.has(key)) {
      grouped.set(key, {
        county_fips: `${stateName}-${key.replace(/\s+/g, "")}`,
        county_name: displayName,
        displayName,
        region_type: row.region_type,
        totalVotes: 0,
        candidateVotes: new Map()
      });
    }

    const group = grouped.get(key);
    group.totalVotes += Number(row.totalVotes || 0);
    row.candidates.forEach((candidate) => {
      const candidateKey = `${candidate.name}|${candidate.party}`;
      const existing = group.candidateVotes.get(candidateKey) || {
        name: candidate.name,
        party: candidate.party,
        partyShort: candidate.partyShort,
        tone: candidate.tone,
        votes: 0
      };
      existing.votes += Number(candidate.votes || 0);
      group.candidateVotes.set(candidateKey, existing);
    });
  });

  return Array.from(grouped.values()).map((group) => {
    const candidates = Array.from(group.candidateVotes.values())
      .sort((a, b) => b.votes - a.votes)
      .map((candidate) => ({
        ...candidate,
        pct: group.totalVotes ? Number(((candidate.votes / group.totalVotes) * 100).toFixed(2)) : 0,
        votesFormatted: stateElectionFormatVotes(candidate.votes)
      }));
    const top = candidates[0];
    const second = candidates[1];
    const winnerCode = stateElectionSenatePartyCode(top?.party);
    const marginPct = Math.max(0, Number(top?.pct || 0) - Number(second?.pct || 0));
    return {
      ...group,
      candidates,
      winnerParty: winnerCode,
      marginLabel: `${winnerCode === "D" ? "D" : winnerCode === "R" ? "R" : "I"}+${marginPct < 1 ? marginPct.toFixed(2) : marginPct.toFixed(1)}`
    };
  });
}

function stateElectionSenateTooltipHTML(row, stateName, race) {
  const candidates = (row.candidates || []).slice(0, 3);
  const title = stateElectionFormatCountyName(row.county_name, row);
  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${title}</div>
      <div class="tooltip-ev">${race.seatType === "Special" ? "Special " : ""}${stateName} ${race.office === "governor" ? "governor" : "Senate"} result</div>
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
        ${candidates.map((candidate, index) => `
          <tr class="${index === 0 ? "winner-row" : ""}">
            <td>
              <div class="tooltip-candidate">
                <span class="tooltip-candidate-bar ${candidate.tone}"></span>
                <span>${candidate.name}</span>
              </div>
            </td>
            <td>${candidate.partyShort}</td>
            <td>${candidate.votesFormatted}</td>
            <td>${Number(candidate.pct).toFixed(2).replace(/\.00$/, ".0")}%</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function stateElectionFetchCountyResults(stateName) {
  if (stateElectionCountyResultsCache.has(stateName)) {
    return stateElectionCountyResultsCache.get(stateName);
  }

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

  const filtered = rows.filter(Boolean);
  stateElectionCountyResultsCache.set(stateName, filtered);
  return filtered;
}

async function stateElectionFetchConnecticutTownResults() {
  if (stateElectionConnecticutTownRowsCache) return stateElectionConnecticutTownRowsCache;

  const rows = await d3.json(STATE_ELECTION_CT_TOWN_RESULTS_URL);
  stateElectionConnecticutTownRowsCache = rows
    .map((row) => {
      const townName = String(row.town || "").trim();
      const votesDem = Number(row.dem ?? row.harris ?? row.biden ?? 0);
      const votesGop = Number(row.rep ?? row.trump ?? 0);
      const totalVotes = Number(row.total || votesDem + votesGop);
      const perDem = totalVotes ? votesDem / totalVotes : 0;
      const perGop = totalVotes ? votesGop / totalVotes : 0;

      return {
        county_fips: `CT-${stateElectionNormalizeTownName(townName)}`,
        county_name: townName,
        region_type: "town",
        votes_dem: votesDem,
        votes_gop: votesGop,
        total_votes: totalVotes,
        per_dem: perDem,
        per_gop: perGop,
        per_point_diff: Math.abs(perDem - perGop)
      };
    })
    .sort((a, b) => b.total_votes - a.total_votes);

  return stateElectionConnecticutTownRowsCache;
}

async function stateElectionFetchLocalResultGeojson(stateName) {
  if (stateElectionLocalResultsCache.has(stateName)) {
    return stateElectionLocalResultsCache.get(stateName);
  }

  const url = STATE_ELECTION_LOCAL_GEOJSON_URLS[stateName];
  if (!url) return null;

  const collection = await d3.json(url);
  const normalized = {
    type: "FeatureCollection",
    features: (collection.features || [])
      .map((feature) => ({
        ...feature,
        resultRow: feature.properties
      }))
      .filter((feature) => feature.resultRow)
  };

  stateElectionLocalResultsCache.set(stateName, normalized);
  return normalized;
}

async function stateElectionFetchLocalResultRows(stateName) {
  const collection = await stateElectionFetchLocalResultGeojson(stateName);
  return (collection?.features || [])
    .map((feature) => feature.resultRow)
    .sort((a, b) => Number(b.total_votes || 0) - Number(a.total_votes || 0));
}

async function stateElectionFetchPresidentialRegionRows(stateName) {
  if (stateName === "Connecticut") return stateElectionFetchConnecticutTownResults();
  if (stateElectionUsesLocalResults(stateName)) return stateElectionFetchLocalResultRows(stateName);
  return stateElectionFetchCountyResults(stateName);
}

async function stateElectionLoadTopo() {
  if (stateElectionTopoCache) return stateElectionTopoCache;

  const [countiesTopo, statesTopo] = await Promise.all([
    d3.json(STATE_ELECTION_COUNTIES_TOPOJSON_URL),
    d3.json(STATE_ELECTION_STATES_TOPOJSON_URL)
  ]);

  stateElectionTopoCache = { countiesTopo, statesTopo };
  return stateElectionTopoCache;
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
    { name: "Donald Trump", party: "Republican", votes: result.rV, pct: `${result.rP}%`, winner: winnerName === "Donald Trump", tone: "rep" },
    { name: "Kamala Harris", party: "Democrat", votes: result.dV, pct: `${result.dP}%`, winner: winnerName === "Kamala Harris", tone: "dem" }
  ].sort((a, b) => stateElectionNumberFromVoteString(b.votes) - stateElectionNumberFromVoteString(a.votes));

  body.innerHTML = rows.map((row) => `
    <tr class="${row.winner ? "winner-row" : ""}">
      <td>
        <div class="detail-candidate-cell">
          <img class="detail-candidate-photo" src="${STATE_ELECTION_CANDIDATE_PORTRAITS[row.name]}" alt="${row.name}" />
          <span class="candidate-name-inline ${row.tone}">${row.name}</span>
        </div>
      </td>
      <td>${row.party}</td>
      <td>${row.votes}</td>
      <td>${row.pct}</td>
    </tr>
  `).join("");
}

function stateElectionRenderSenateSummary(stateName, race, office = "senate") {
  const section = document.getElementById(`state-election-${office}`);
  if (!section || !race) return false;

  const title = document.getElementById(`state-election-${office}-title`);
  const seat = document.getElementById(`state-election-${office}-seat`);
  const margin = document.getElementById(`state-election-${office}-margin`);
  const total = document.getElementById(`state-election-${office}-total`);
  const body = document.getElementById(`state-election-${office}-candidates`);
  const card = document.getElementById(`state-election-${office}-card`);
  const detailLink = document.getElementById(`state-election-${office}-detail-link`);
  const candidates = stateElectionSenateCandidateRows(race);
  const totalVotes = race.reportedTotal || candidates.reduce((sum, candidate) => sum + Number(candidate.voteNumber || 0), 0);
  const winnerTone = stateElectionSenatePartyTone(race.winnerParty);

  section.hidden = false;
  if (title) {
    title.textContent = `${race.winner} wins ${stateName}'s${race.seatType === "Special" ? " special" : ""} ${office === "governor" ? "governor" : "Senate"} race.`;
  }
  if (seat) seat.textContent = office === "governor" ? "Governor" : race.seatType || "Regular";
  if (margin) margin.textContent = race.result || "-";
  if (total) total.textContent = stateElectionFormatVotes(totalVotes);
  if (detailLink) detailLink.href = office === "governor" ? `./governor-county-result.html?name=${encodeURIComponent(stateName)}` : stateElectionSenateDetailLink(stateName, race);
  if (card) {
    card.dataset.state = stateName;
    card.classList.remove("winner-dem", "winner-rep", "winner-ind", "winner-none");
    card.classList.add(`winner-${winnerTone}`);
  }
  if (body) {
    body.innerHTML = candidates.map((candidate, index) => `
      <tr class="${index === 0 ? "winner-row" : ""}">
        <td>
          <div class="detail-candidate-cell">
            <img class="detail-candidate-photo" src="${candidate.imageUrl || "https://placehold.co/120x120/2f3540/2f3540"}" alt="${candidate.name}" />
            <span class="candidate-name-inline ${candidate.tone}">${candidate.name}</span>
          </div>
        </td>
        <td>${candidate.party}</td>
        <td>${candidate.votes}</td>
        <td>${candidate.pct}</td>
      </tr>
    `).join("");
  }

  return true;
}

function stateElectionRenderShareCountyMap({ svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName }) {
  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "detail-county-shape")
    .attr("d", path)
    .attr("fill", (feature) => {
      const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
      return row ? stateElectionCountyShade(row) : "#2d3138";
    })
    .on("mouseover", (event, feature) => {
      const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
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

  stateElectionRenderCityLabels(svg, projection, stateName);
}

function stateElectionRenderLeadCountyMap({ svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName }) {
  const maxLead = d3.max(features, (feature) => {
    const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
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
      const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
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

  stateElectionRenderCityLabels(svg, projection, stateName);
}


function stateElectionWardKeyFromRow(row) {
  const nameMatch = String(row.county_name || "").match(/Ward\s+([1-8])/i);
  if (nameMatch) return nameMatch[1];

  const fipsMatch = String(row.county_fips || "").match(/([1-8])$/);
  return fipsMatch ? fipsMatch[1] : "";
}

function stateElectionWardKeyFromFeature(feature) {
  const properties = feature.properties || {};
  const ward = properties.WARD_ID || properties.WARD || properties.NAME || feature.id || "";
  const match = String(ward).match(/([1-8])$/);
  return match ? match[1] : "";
}

function stateElectionRenderWardLabels(svg, features, path) {
  svg.append("g")
    .attr("class", "state-election-ward-labels")
    .selectAll("text")
    .data(features)
    .enter()
    .append("text")
    .attr("x", (feature) => path.centroid(feature)[0])
    .attr("y", (feature) => path.centroid(feature)[1] + 4)
    .text((feature) => `Ward ${stateElectionWardKeyFromFeature(feature)}`);
}

function stateElectionRenderDcWardGrid(svg, rows, mode, tooltip, stateName, empty) {
  const wardRows = rows.slice().sort((a, b) => Number(stateElectionWardKeyFromRow(a)) - Number(stateElectionWardKeyFromRow(b)));
  if (!wardRows.length) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const tileGroup = svg.append("g").attr("transform", "translate(36, 40)");
  const columns = 2;
  const tileWidth = 208;
  const tileHeight = 92;
  const gapX = 28;
  const gapY = 18;
  const maxLead = d3.max(wardRows, stateElectionCountyLead) || 1;
  const radius = d3.scaleSqrt().domain([0, maxLead]).range([10, 34]);

  if (mode === "lead") {
    tileGroup.selectAll("rect")
      .data(wardRows)
      .enter()
      .append("rect")
      .attr("class", "state-election-lead-county-shape")
      .attr("x", (_, index) => (index % columns) * (tileWidth + gapX))
      .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY))
      .attr("rx", 18)
      .attr("ry", 18)
      .attr("width", tileWidth)
      .attr("height", tileHeight);

    tileGroup.selectAll("circle")
      .data(wardRows)
      .enter()
      .append("circle")
      .attr("class", (row) => `state-election-lead-bubble ${stateElectionGetCountyWinner(row) === "Harris" ? "dem" : "rep"}`)
      .attr("cx", (_, index) => (index % columns) * (tileWidth + gapX) + tileWidth / 2)
      .attr("cy", (_, index) => Math.floor(index / columns) * (tileHeight + gapY) + tileHeight / 2)
      .attr("r", (row) => radius(stateElectionCountyLead(row)))
      .on("mouseover", (event, row) => {
        tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(row, stateName));
        d3.select(event.currentTarget).classed("is-active", true);
        stateElectionPositionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        tooltip.style("opacity", 0);
      });
  } else {
    tileGroup.selectAll("rect")
      .data(wardRows)
      .enter()
      .append("rect")
      .attr("class", "detail-county-shape")
      .attr("x", (_, index) => (index % columns) * (tileWidth + gapX))
      .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY))
      .attr("rx", 18)
      .attr("ry", 18)
      .attr("width", tileWidth)
      .attr("height", tileHeight)
      .attr("fill", stateElectionCountyShade)
      .on("mouseover", (event, row) => {
        tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(row, stateName));
        d3.select(event.currentTarget).classed("is-active", true);
        stateElectionPositionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        tooltip.style("opacity", 0);
      });
  }

  tileGroup.selectAll("text")
    .data(wardRows)
    .enter()
    .append("text")
    .attr("class", "detail-ward-label")
    .attr("x", (_, index) => (index % columns) * (tileWidth + gapX) + 18)
    .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY) + 34)
    .text((row) => stateElectionFormatCountyName(row.county_name, row).replace(" District of Columbia", ""));
}

function stateElectionRenderDcWardMap(svg, rows, mode, tooltip, stateName, empty) {
  const wardsGeojson = window.DC_WARDS_GEOJSON;
  if (!wardsGeojson?.features?.length) {
    stateElectionRenderDcWardGrid(svg, rows, mode, tooltip, stateName, empty);
    return;
  }

  const rowByWard = new Map(rows.map((row) => [stateElectionWardKeyFromRow(row), row]));
  const features = wardsGeojson.features
    .map((feature) => ({
      ...feature,
      resultRow: rowByWard.get(stateElectionWardKeyFromFeature(feature))
    }))
    .filter((feature) => feature.resultRow);

  if (!features.length) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const collection = { type: "FeatureCollection", features };
  const projection = d3.geoIdentity().reflectY(true).fitSize([540, 520], collection);
  const path = d3.geoPath(projection);
  const context = { svg, features, stateFeature: collection, rowByFips: rowByWard, path, projection, tooltip, stateName };

  if (mode === "lead") {
    stateElectionRenderLeadCountyMap(context);
  } else {
    stateElectionRenderShareCountyMap(context);
  }

  stateElectionRenderWardLabels(svg, features, path);
}

async function stateElectionRenderCountyMap(stateName, rows, mode = "share") {
  const svg = d3.select("#state-election-presidential-county-map");
  const empty = document.getElementById("state-election-county-empty");
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty()) return;

  svg.selectAll("*").remove();

  if (stateName === "District of Columbia") {
    stateElectionRenderDcWardMap(svg, rows, mode, tooltip, stateName, empty);
    return;
  }

  let features;
  let stateFeature;
  let rowByFips = new Map(rows.map((row) => [row.county_fips, row]));

  if (stateName === "Connecticut") {
    const townRows = rows;
    const townsGeojson = await d3.json(STATE_ELECTION_CT_TOWNS_GEOJSON_URL);
    const rowByTown = new Map(townRows.map((row) => [stateElectionNormalizeTownName(row.county_name), row]));
    features = (townsGeojson.features || [])
      .map((feature) => ({
        ...feature,
        resultRow: rowByTown.get(stateElectionNormalizeTownName(feature.properties?.TOWN_NAME))
      }))
      .filter((feature) => feature.resultRow);
    stateFeature = { type: "FeatureCollection", features };
  } else if (stateElectionUsesLocalResults(stateName)) {
    const localGeojson = await stateElectionFetchLocalResultGeojson(stateName);
    features = localGeojson?.features || [];
    stateFeature = localGeojson;
  } else {
    if (!window.topojson) return;

    const { countiesTopo, statesTopo } = await stateElectionLoadTopo();
    features = topojson
      .feature(countiesTopo, countiesTopo.objects.counties)
      .features
      .map((feature) => ({
        ...feature,
        resultRow: rowByFips.get(String(feature.id).padStart(5, "0"))
      }))
      .filter((feature) => feature.resultRow);

    const stateFips = STATE_ELECTION_FIPS_BY_NAME[stateName];
    stateFeature = topojson
      .feature(statesTopo, statesTopo.objects.states)
      .features
      .find((feature) => String(feature.id).padStart(2, "0") === stateFips);
  }

  if (!features.length || !stateFeature) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const collection = { type: "FeatureCollection", features };
  const projection = stateName === "Connecticut"
    ? d3.geoIdentity().reflectY(true).fitSize([540, 520], collection)
    : d3.geoMercator().fitSize([540, 520], collection);
  const path = d3.geoPath(projection);

  const context = { svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName };
  if (mode === "lead") {
    stateElectionRenderLeadCountyMap(context);
  } else {
    stateElectionRenderShareCountyMap(context);
  }
}

function stateElectionSetupPresidentialMapMode(stateName, rows) {
  const control = document.getElementById("state-election-presidential-map-mode");
  const legend = document.querySelector("#state-election-presidential .detail-map-legend");
  const leadLegend = document.getElementById("state-election-lead-legend");
  if (!control) return;

  const isEnabled = rows.length > 0;
  control.hidden = !isEnabled;
  if (leadLegend) leadLegend.hidden = true;
  if (legend) legend.hidden = false;
  if (!isEnabled) return;

  control.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mapMode === "share");
    button.addEventListener("click", async () => {
      const mode = button.dataset.mapMode || "share";
      control.querySelectorAll("[data-map-mode]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      if (legend) legend.hidden = mode === "lead";
      if (leadLegend) leadLegend.hidden = mode !== "lead";
      await stateElectionRenderCountyMap(stateName, rows, mode);
    });
  });
}

async function stateElectionFetchSenateRegionRows(stateName, seatType = "Regular") {
  const bundle = window.SENATE_COUNTY_RESULTS?.[stateName];
  const rawRows = seatType === "Special" ? bundle?.specialCounties || [] : bundle?.municipalities || bundle?.counties || [];
  if (!rawRows.length) return [];

  let referenceByName = new Map();
  try {
    const countyRows = await stateElectionFetchCountyResults(stateName);
    referenceByName = new Map(countyRows.map((row) => [stateElectionNormalizeRegionName(row.county_name), row]));
  } catch (error) {
    referenceByName = new Map();
  }

  return rawRows
    .map((row) => stateElectionNormalizeSenateUnitRow(row, referenceByName))
    .sort((a, b) => Number(b.totalVotes || 0) - Number(a.totalVotes || 0));
}

function stateElectionSenateMapContextFromFeatures(svg, features, stateFeature, projection, tooltip, stateName, race) {
  const path = d3.geoPath(projection);
  return { svg, features, stateFeature, path, projection, tooltip, stateName, race };
}

function stateElectionRenderSenateShareMap({ svg, features, stateFeature, path, projection, tooltip, stateName, race }) {
  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "detail-county-shape")
    .attr("d", path)
    .attr("fill", (feature) => stateElectionSenateUnitShade(feature.resultRow))
    .on("mouseover", (event, feature) => {
      const row = feature.resultRow;
      if (!row) return;
      tooltip.style("opacity", 1).html(stateElectionSenateTooltipHTML(row, stateName, race));
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

  stateElectionRenderCityLabels(svg, projection, stateName);
}

function stateElectionRenderSenateLeadMap({ svg, features, stateFeature, path, projection, tooltip, stateName, race }) {
  const maxLead = d3.max(features, (feature) => stateElectionSenateUnitLead(feature.resultRow)) || 1;
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

  svg.append("g")
    .selectAll("circle")
    .data(features
      .map((feature) => ({ feature, row: feature.resultRow, centroid: path.centroid(feature) }))
      .filter((item) => item.row)
      .sort((a, b) => stateElectionSenateUnitLead(b.row) - stateElectionSenateUnitLead(a.row)))
    .enter()
    .append("circle")
    .attr("class", (item) => `state-election-lead-bubble ${stateElectionSenatePartyTone(item.row.winnerParty)}`)
    .attr("cx", (item) => item.centroid[0])
    .attr("cy", (item) => item.centroid[1])
    .attr("r", (item) => radius(stateElectionSenateUnitLead(item.row)))
    .on("mouseover", (event, item) => {
      tooltip.style("opacity", 1).html(stateElectionSenateTooltipHTML(item.row, stateName, race));
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

async function stateElectionBuildSenateMapFeatures(stateName, rows, office = "senate") {
  let mapRows = rows;

  if (stateName === "Connecticut") {
    const rowByName = new Map(mapRows.map((row) => [stateElectionNormalizeRegionName(row.county_name), row]));
    const townsGeojson = await d3.json(STATE_ELECTION_CT_TOWNS_GEOJSON_URL);
    const features = (townsGeojson.features || [])
      .map((feature) => ({
        ...feature,
        resultRow: rowByName.get(stateElectionNormalizeRegionName(feature.properties?.TOWN_NAME))
      }))
      .filter((feature) => feature.resultRow);
    if (features.length) {
      const stateFeature = { type: "FeatureCollection", features };
      const projection = d3.geoIdentity().reflectY(true).fitSize([540, 520], stateFeature);
      return { features, stateFeature, projection };
    }
  }

  if (stateElectionUsesLocalResults(stateName) && !(office === "governor" && rows.every((row) => row.region_type === "county"))) {
    mapRows = office === "governor" ? rows : stateElectionAggregateSenateLocalMapRows(stateName, rows);
    const rowByName = new Map(mapRows.map((row) => [stateElectionNormalizeRegionName(row.county_name), row]));
    const rowById = new Map(mapRows.map((row) => [row.county_fips, row]));
    const localGeojson = await d3.json(STATE_ELECTION_LOCAL_GEOJSON_URLS[stateName]);
    const features = (localGeojson?.features || [])
      .map((feature) => {
        const properties = feature.properties || {};
        return {
          ...feature,
          resultRow: rowById.get(properties.county_fips) ||
            rowByName.get(stateElectionNormalizeRegionName(properties.county_name || properties.NAME || properties.BASENAME || ""))
        };
      })
      .filter((feature) => feature.resultRow);
    if (features.length) {
      const stateFeature = { type: "FeatureCollection", features };
      const projection = d3.geoMercator().fitSize([540, 520], stateFeature);
      return { features, stateFeature, projection };
    }
  }

  if (!window.topojson) return null;

  const { countiesTopo, statesTopo } = await stateElectionLoadTopo();
  const rowByFips = new Map(mapRows.map((row) => [row.county_fips, row]));
  const features = topojson
    .feature(countiesTopo, countiesTopo.objects.counties)
    .features
    .map((feature) => ({
      ...feature,
      resultRow: rowByFips.get(String(feature.id).padStart(5, "0"))
    }))
    .filter((feature) => feature.resultRow);
  const stateFips = STATE_ELECTION_FIPS_BY_NAME[stateName];
  const stateFeature = topojson
    .feature(statesTopo, statesTopo.objects.states)
    .features
    .find((feature) => String(feature.id).padStart(2, "0") === stateFips);
  if (!features.length || !stateFeature) return null;
  const projection = d3.geoMercator().fitSize([540, 520], { type: "FeatureCollection", features });
  return { features, stateFeature, projection };
}

async function stateElectionRenderSenateMap(stateName, race, rows, mode = "share", office = "senate") {
  const svg = d3.select(`#state-election-${office}-county-map`);
  const empty = document.getElementById(`state-election-${office}-empty`);
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty()) return;

  svg.selectAll("*").remove();
  if (!rows.length) {
    if (empty) empty.hidden = false;
    return;
  }

  const built = await stateElectionBuildSenateMapFeatures(stateName, rows, office);
  if (!built) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  const context = stateElectionSenateMapContextFromFeatures(svg, built.features, built.stateFeature, built.projection, tooltip, stateName, race);
  if (mode === "lead") {
    stateElectionRenderSenateLeadMap(context);
  } else {
    stateElectionRenderSenateShareMap(context);
  }
}

function stateElectionSetupSenateMapMode(stateName, race, rows, office = "senate") {
  const control = document.getElementById(`state-election-${office}-map-mode`);
  const legend = document.getElementById(`state-election-${office}-map-legend`);
  const leadLegend = document.getElementById(`state-election-${office}-lead-legend`);
  const leadIndLegend = document.getElementById(`state-election-${office}-lead-legend-ind`);
  const mapTitle = document.getElementById(`state-election-${office}-map-title`);
  const unit = stateElectionSenateUnitLabelForRows(stateName, rows);
  const winningParties = new Set(rows.map((row) => stateElectionSenateWinnerParty(row)));
  const isEnabled = rows.length > 0;

  if (mapTitle) mapTitle.textContent = `${unit.singular} Map`;
  if (legend) {
    legend.setAttribute("aria-label", `${office === "governor" ? "Governor" : "Senate"} ${unit.singular.toLowerCase()} map legend`);
    legend.querySelectorAll("[data-party]").forEach((row) => {
      row.hidden = !winningParties.has(row.dataset.party);
    });
  }
  if (leadIndLegend) {
    leadIndLegend.hidden = !winningParties.has("I");
  }

  if (!control) return;
  if (office === "senate") stateElectionSenateMapMode = "share";
  control.hidden = !isEnabled;
  if (legend) legend.hidden = false;
  if (leadLegend) leadLegend.hidden = true;
  if (!isEnabled) return;

  control.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mapMode === "share");
    button.onclick = async () => {
      const mode = button.dataset.mapMode || "share";
      if (office === "senate") stateElectionSenateMapMode = mode;
      control.querySelectorAll("[data-map-mode]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      if (legend) legend.hidden = mode === "lead";
      if (leadLegend) leadLegend.hidden = mode !== "lead";
      if (leadIndLegend) leadIndLegend.hidden = mode !== "lead" || !winningParties.has("I");
      await stateElectionRenderSenateMap(stateName, race, rows, mode, office);
    };
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
  const showAllButton = document.getElementById("state-election-house-show-all");
  if (!list) return;

  stateElectionHouseListState.districts = districts;

  if (!districts.length) {
    list.innerHTML = `<p class="state-election-empty-note">No voting House district result is available for this jurisdiction.</p>`;
    if (showAllButton) showAllButton.hidden = true;
    return;
  }

  const visibleDistricts = stateElectionHouseListState.limit === "all"
    ? districts
    : districts.slice(0, STATE_ELECTION_HOUSE_PREVIEW_LIMIT);

  list.innerHTML = `
    <div class="state-election-house-table-wrap">
      <table class="state-election-house-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Margin</th>
            <th colspan="2">Candidates</th>
            <th>% In</th>
            <th aria-label="District details"></th>
          </tr>
        </thead>
        <tbody>
          ${visibleDistricts.map((district) => {
            const candidates = [...(district.candidates || [])]
              .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
            const winner = candidates.find((candidate) => candidate.winner) || candidates[0] || {
              name: district.winnerName,
              party: district.winnerParty
            };
            const runnerUp = candidates.find((candidate) => candidate !== winner) || null;
            const winnerClass = stateElectionPartyClass(district.winnerParty);
            const isUncontested = district.uncontested || candidates.length <= 1 || district.marginLabel === "Uncontested";
            const marginLabel = isUncontested ? "Uncont." : district.marginLabel;
            const winnerCellClass = [
              "state-election-house-candidate",
              "state-election-house-candidate--winner",
              `state-election-house-candidate--${winnerClass}`,
              district.flipped ? "state-election-house-candidate--flip" : ""
            ].filter(Boolean).join(" ");
            const percentIn = "100%";

            return `
              <tr class="state-election-house-row" data-district-link="${stateElectionDistrictLink(district.code)}" tabindex="0">
                <td class="state-election-house-district-cell">${Number(district.district)}</td>
                <td class="state-election-house-margin state-election-house-margin--${winnerClass}${isUncontested ? " state-election-house-margin--uncontested" : ""}">${marginLabel}</td>
                <td class="${winnerCellClass}">
                  <span class="state-election-house-candidate-name">
                    ${stateElectionHouseCandidateSurname(winner.name || district.winnerName)}
                    ${winner.incumbent ? `<span class="state-election-district-incumbent">Incumbent</span>` : ""}
                  </span>
                  <span class="state-election-house-party">${stateElectionHousePartyLabel(winner)}</span>
                </td>
                <td class="state-election-house-candidate state-election-house-candidate--runner state-election-house-candidate--${stateElectionHouseCandidateClass(runnerUp)}">
                  ${runnerUp ? `
                    <span class="state-election-house-candidate-name">
                      ${stateElectionHouseCandidateSurname(runnerUp.name)}
                      ${runnerUp.incumbent ? `<span class="state-election-district-incumbent">Incumbent</span>` : ""}
                    </span>
                    <span class="state-election-house-party">${stateElectionHousePartyLabel(runnerUp)}</span>
                  ` : `<span class="state-election-house-party">Unopposed</span>`}
                </td>
                <td class="state-election-house-percent">${percentIn}</td>
                <td class="state-election-house-arrow" aria-hidden="true">›</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  list.querySelectorAll(".state-election-house-row").forEach((row) => {
    row.addEventListener("click", () => {
      window.location.href = row.dataset.districtLink;
    });
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      window.location.href = row.dataset.districtLink;
    });
  });

  if (!showAllButton) return;

  const hasOverflow = districts.length > STATE_ELECTION_HOUSE_PREVIEW_LIMIT;
  showAllButton.hidden = !hasOverflow;
  if (!hasOverflow) return;

  const showingAll = stateElectionHouseListState.limit === "all";
  showAllButton.textContent = showingAll ? "Show fewer" : `Show all ${districts.length} districts`;
  showAllButton.setAttribute("aria-expanded", String(showingAll));
  showAllButton.onclick = () => {
    stateElectionHouseListState.limit = showingAll ? STATE_ELECTION_HOUSE_PREVIEW_LIMIT : "all";
    stateElectionRenderHouseList(stateElectionHouseListState.districts);
  };
}

function stateElectionRenderHouseDistrictMap(stateName, districts) {
  const svg = d3.select("#state-election-house-district-map");
  const empty = document.getElementById("state-election-house-empty");
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty()) return;

  svg.selectAll("*").remove();
  stateElectionBuildHousePatterns(svg);

  if (stateName === "Alaska") {
    if (empty) empty.hidden = true;
    return;
  }

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
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "state-election-district-shape")
    .attr("d", path)
    .attr("fill", (feature) => stateElectionHouseDistrictFill(districtByCode.get(feature.properties.code)))
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

function stateElectionGetGovernorRace(stateName) {
  const race = window.GOVERNOR_2024_DATA?.races?.find((item) => item.state === stateName);
  const bundle = window.GOVERNOR_COUNTY_RESULTS?.[stateName];
  if (!race || !bundle?.counties?.length) return null;

  // Match the detailed governor page: statewide totals include every local candidate.
  const totals = new Map();
  bundle.counties.forEach((region) => {
    (region.candidates || []).forEach((candidate) => {
      const key = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const total = totals.get(key) || {
        name: candidate.name,
        party: key === "write in" ? "W" : candidate.name === "Other" ? "Other" : candidate.party,
        votes: 0
      };
      total.votes += Number(candidate.votes || 0);
      totals.set(key, total);
    });
  });
  const candidates = Array.from(totals.values()).sort((a, b) => b.votes - a.votes);
  const reportedTotal = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  return {
    ...race,
    office: "governor",
    reportedTotal,
    tooltipRows: candidates.map((candidate) => ({
      ...candidate,
      votes: stateElectionFormatVotes(candidate.votes),
      pct: reportedTotal ? ((candidate.votes / reportedTotal) * 100).toFixed(2) : "0.00",
      imageUrl: race.candidates.find((known) => known.name === candidate.name)?.imageUrl || ""
    }))
  };
}

async function stateElectionFetchGovernorRegionRows(stateName) {
  const bundle = window.GOVERNOR_COUNTY_RESULTS[stateName];
  let referenceByName = new Map();
  if (bundle.regionType !== "town") {
    const { countiesTopo } = await stateElectionLoadTopo();
    referenceByName = new Map(topojson.feature(countiesTopo, countiesTopo.objects.counties).features
      .filter((feature) => String(feature.id).padStart(5, "0").startsWith(STATE_ELECTION_FIPS_BY_NAME[stateName]))
      .map((feature) => [stateElectionNormalizeRegionName(feature.properties.name), {
        county_fips: String(feature.id).padStart(5, "0"), region_type: "county"
      }]));
  }
  return bundle.counties.map((row) => {
    const normalized = stateElectionNormalizeSenateUnitRow(row);
    const countyKey = stateElectionNormalizeRegionName(row.county.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const reference = referenceByName.get(countyKey);
    // The atlas gives St. Louis city and county the same display name.
    const stLouisFips = stateName === "Missouri" && /^St\. Louis (City|County)$/.test(row.county)
      ? (row.county.endsWith("City") ? "29510" : "29189") : null;
    return {
      ...normalized,
      county_fips: stLouisFips || reference?.county_fips || normalized.county_fips,
      region_type: bundle.regionType === "town" ? "town" : "county"
    };
  });
}

async function stateElectionInit() {
  const params = new URLSearchParams(window.location.search);
  const stateName = params.get("name") || "Alabama";
  const regionLabel = stateElectionRegionLabel(stateName);
  const regionLabelPlural = stateElectionRegionLabelPlural(stateName);

  document.title = `${stateName} Election Results | Polycivic`;
  document.getElementById("state-election-title").textContent = `${stateName} Election Results`;
  // Set navigation before awaiting map requests, including when those requests fail.
  const availableRaces = {
    senate: Boolean(stateElectionGetPrimarySenateRace(stateName)),
    "senate-special": stateName === "Nebraska" && stateElectionGetSenateRaces(stateName).some((race) => race.seatType === "Special"),
    governor: Boolean(stateElectionGetGovernorRace(stateName)),
    house: stateName !== "District of Columbia" && stateElectionGetHouseDistricts(stateName).length > 0
  };
  Object.entries(availableRaces).forEach(([office, available]) => {
    const link = document.getElementById(`state-election-${office}-jump`);
    const section = document.getElementById(`state-election-${office}`);
    if (link) link.hidden = !available;
    if (section && !available) {
      section.hidden = true;
      section.style.display = "none";
    }
  });
  const mapTitle = document.getElementById("state-election-presidential-map-title");
  const presidentialMapCard = document.getElementById("state-election-presidential-map-card");
  const houseMapCard = document.getElementById("state-election-house-map-card");
  const hideMaps = stateName === "Alaska";
  if (mapTitle) mapTitle.textContent = `${regionLabel} Map`;
  if (presidentialMapCard) {
    presidentialMapCard.hidden = hideMaps;
    presidentialMapCard.style.display = hideMaps ? "none" : "";
  }
  if (houseMapCard) {
    houseMapCard.hidden = hideMaps;
    houseMapCard.style.display = hideMaps ? "none" : "";
  }

  stateElectionRenderPresidentialSummary(stateName);

  if (!hideMaps) {
    try {
      const regionRows = await stateElectionFetchPresidentialRegionRows(stateName);
      await stateElectionRenderCountyMap(stateName, regionRows);
      stateElectionSetupPresidentialMapMode(stateName, regionRows);
    } catch (error) {
      const empty = document.getElementById("state-election-county-empty");
      if (empty) empty.hidden = false;
      console.error(error);
    }
  }

  const senateRace = stateElectionGetPrimarySenateRace(stateName);
  const senateSection = document.getElementById("state-election-senate");
  const senateJump = document.getElementById("state-election-senate-jump");
  const senateMapCard = document.getElementById("state-election-senate-map-card");
  if (senateJump) senateJump.hidden = !senateRace;
  if (senateRace) {
    if (senateSection) senateSection.style.display = "";
    stateElectionRenderSenateSummary(stateName, senateRace);
    if (senateMapCard) {
      senateMapCard.hidden = hideMaps;
      senateMapCard.style.display = hideMaps ? "none" : "";
    }
    if (!hideMaps) {
      try {
        const senateRows = await stateElectionFetchSenateRegionRows(stateName);
        await stateElectionRenderSenateMap(stateName, senateRace, senateRows);
        stateElectionSetupSenateMapMode(stateName, senateRace, senateRows);
      } catch (error) {
        const empty = document.getElementById("state-election-senate-empty");
        if (empty) empty.hidden = false;
        console.error(error);
      }
    }
  } else if (senateSection) {
    senateSection.hidden = true;
    senateSection.style.display = "none";
  }

  const specialSenateRace = stateName === "Nebraska"
    ? stateElectionGetSenateRaces(stateName).find((race) => race.seatType === "Special") : null;
  const specialSenateSection = document.getElementById("state-election-senate-special");
  const specialSenateJump = document.getElementById("state-election-senate-special-jump");
  if (specialSenateJump) specialSenateJump.hidden = !specialSenateRace;
  if (specialSenateSection) {
    specialSenateSection.hidden = !specialSenateRace;
    specialSenateSection.style.display = specialSenateRace ? "" : "none";
  }
  if (specialSenateRace) {
    stateElectionRenderSenateSummary(stateName, specialSenateRace, "senate-special");
    try {
      const specialRows = await stateElectionFetchSenateRegionRows(stateName, "Special");
      await stateElectionRenderSenateMap(stateName, specialSenateRace, specialRows, "share", "senate-special");
      stateElectionSetupSenateMapMode(stateName, specialSenateRace, specialRows, "senate-special");
    } catch (error) {
      const empty = document.getElementById("state-election-senate-special-empty");
      if (empty) empty.hidden = false;
      console.error(error);
    }
  }

  const governorRace = stateElectionGetGovernorRace(stateName);
  const governorSection = document.getElementById("state-election-governor");
  const governorJump = document.getElementById("state-election-governor-jump");
  if (governorJump) governorJump.hidden = !governorRace;
  if (governorSection) {
    governorSection.hidden = !governorRace;
    governorSection.style.display = governorRace ? "" : "none";
  }
  if (governorRace) {
    stateElectionRenderSenateSummary(stateName, governorRace, "governor");
    try {
      const governorRows = await stateElectionFetchGovernorRegionRows(stateName);
      await stateElectionRenderSenateMap(stateName, governorRace, governorRows, "share", "governor");
      stateElectionSetupSenateMapMode(stateName, governorRace, governorRows, "governor");
    } catch (error) {
      const empty = document.getElementById("state-election-governor-empty");
      if (empty) empty.hidden = false;
      console.error(error);
    }
  }

  const houseSection = document.getElementById("state-election-house");
  const houseJump = document.getElementById("state-election-house-jump");
  const houseDistricts = stateElectionGetHouseDistricts(stateName);
  const hasHouseResults = stateName !== "District of Columbia" && houseDistricts.length > 0;
  if (houseJump) houseJump.hidden = !hasHouseResults;
  if (hasHouseResults) {
    if (houseSection) {
      houseSection.hidden = false;
      houseSection.style.display = "";
    }
    stateElectionHouseListState.limit = STATE_ELECTION_HOUSE_PREVIEW_LIMIT;
    stateElectionRenderHouseList(houseDistricts);
    stateElectionRenderHouseDistrictMap(stateName, houseDistricts);
  } else if (houseSection) {
    houseSection.hidden = true;
    houseSection.style.display = "none";
  }
}

stateElectionInit();
