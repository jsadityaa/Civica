const STATE_RESULTS_HUB_ORDER = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"]
];

const STATE_RESULTS_HUB_HOUSE_COUNTS = {
  Alabama: 7,
  Alaska: 1,
  Arizona: 9,
  Arkansas: 4,
  California: 52,
  Colorado: 8,
  Connecticut: 5,
  Delaware: 1,
  "District of Columbia": 0,
  Florida: 28,
  Georgia: 14,
  Hawaii: 2,
  Idaho: 2,
  Illinois: 17,
  Indiana: 9,
  Iowa: 4,
  Kansas: 4,
  Kentucky: 6,
  Louisiana: 6,
  Maine: 2,
  Maryland: 8,
  Massachusetts: 9,
  Michigan: 13,
  Minnesota: 8,
  Mississippi: 4,
  Missouri: 8,
  Montana: 2,
  Nebraska: 3,
  Nevada: 4,
  "New Hampshire": 2,
  "New Jersey": 12,
  "New Mexico": 3,
  "New York": 26,
  "North Carolina": 14,
  "North Dakota": 1,
  Ohio: 15,
  Oklahoma: 5,
  Oregon: 6,
  Pennsylvania: 17,
  "Rhode Island": 2,
  "South Carolina": 7,
  "South Dakota": 1,
  Tennessee: 9,
  Texas: 38,
  Utah: 4,
  Vermont: 1,
  Virginia: 11,
  Washington: 10,
  "West Virginia": 2,
  Wisconsin: 8,
  Wyoming: 1
};

const STATE_RESULTS_HUB_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_RESULTS_HUB_LABEL_ADJUSTMENTS = {
  Louisiana: [-10, 5],
  "Rhode Island": [10, 5],
  Hawaii: [-8, 15],
  Alaska: [2, 0],
  Arkansas: [0, 2],
  California: [-2, 2],
  Connecticut: [0, 4],
  Delaware: [19, 7],
  Florida: [14, 4],
  Idaho: [0, 11],
  Iowa: [0, 7],
  Kansas: [0, 5],
  Kentucky: [2, 5],
  Maryland: [-10, -4],
  Massachusetts: [40, 0],
  Michigan: [12, 12],
  Minnesota: [-3, 12],
  Missouri: [0, 2],
  Montana: [0, 4],
  Nebraska: [0, 3],
  "New Jersey": [25, 5],
  "New York": [2, 5],
  "North Carolina": [0, 2],
  "North Dakota": [0, 2],
  Ohio: [0, 3],
  Oklahoma: [0, 4],
  Oregon: [0, 2],
  Pennsylvania: [0, 3],
  Tennessee: [0, 3],
  Vermont: [-1, 2],
  Virginia: [6, 2]
};

const STATE_RESULTS_HUB_CODE_BY_NAME = STATE_RESULTS_HUB_ORDER.reduce((codes, [code, name]) => {
  codes[name] = code;
  return codes;
}, {});

function stateResultsHubLink(name) {
  if (name === "Alabama") {
    return "./state-election-results-2024.html?name=Alabama";
  }
  return `./state-result.html?name=${encodeURIComponent(name)}`;
}

function parsePercent(value) {
  return Number(String(value || "").replace("%", "")) || 0;
}

function winnerToneForParty(party) {
  if (/dem/i.test(party || "")) return "dem";
  if (/rep/i.test(party || "")) return "rep";
  return "other";
}

function partyPrefixForParty(party) {
  const tone = winnerToneForParty(party);
  if (tone === "dem") return "D";
  if (tone === "rep") return "R";
  return "O";
}

function formatStateHubCandidateName(name) {
  const nameMap = {
    "Donald John Trump": "Donald Trump",
    "Kamala Devi Harris": "Kamala Harris",
    "Robert Francis Kennedy, Jr.": "Robert F. Kennedy Jr.",
    "Jill Ellen Stein": "Jill Stein",
    "Chase Russell Oliver": "Chase Oliver",
    "Cornel Ronald West": "Cornel West"
  };

  return nameMap[name] || name;
}

function buildStateHubCardData() {
  const presidentialResults = window.STATE_CANDIDATE_RESULTS || {};

  return STATE_RESULTS_HUB_ORDER.map(([code, name]) => {
    const candidates = presidentialResults[name] || [];
    const winner = candidates.find((candidate) => candidate.status === "Elected") || candidates[0];
    const runnerUp = candidates.find((candidate) => candidate !== winner);
    const margin = winner && runnerUp
      ? Math.abs(parsePercent(winner.pct) - parsePercent(runnerUp.pct))
      : null;
    const tone = winnerToneForParty(winner?.party);
    const marginLabel = margin === null
      ? "No result"
      : `${partyPrefixForParty(winner?.party)}+${margin < 1 ? margin.toFixed(2) : margin.toFixed(1)}`;

    return {
      code,
      name,
      winnerName: formatStateHubCandidateName(winner?.candidate) || "Result unavailable",
      tone,
      marginLabel,
      houseCount: STATE_RESULTS_HUB_HOUSE_COUNTS[name] || 0
    };
  });
}

function fillForStateHubTone(tone) {
  if (tone === "dem") return "#2879b5";
  if (tone === "rep") return "#cf2f2f";
  return "#c8a24a";
}

function openStateResultsHubState(name) {
  window.location.href = stateResultsHubLink(name);
}

function renderStateResultsHubFallbackGrid() {
  const grid = document.getElementById("state-results-hub-grid");
  if (!grid) return;
  const cards = buildStateHubCardData();
  grid.innerHTML = cards.map((state) => `
    <a class="state-results-shape-card state-results-shape-card--${state.tone}" href="${stateResultsHubLink(state.name)}">
      <span class="state-results-shape-card__shape-fallback"></span>
      <span class="state-results-shape-card__name">${state.name}</span>
      <span class="state-results-shape-card__meta">${state.winnerName} - ${state.marginLabel}</span>
    </a>
  `).join("");
}

function renderStateResultsHubGrid() {
  const grid = document.getElementById("state-results-hub-grid");
  if (!grid) return;

  if (!window.d3 || !window.topojson) {
    renderStateResultsHubFallbackGrid();
    return;
  }

  const cards = buildStateHubCardData();
  const stateByName = new Map(cards.map((state) => [state.name, state]));
  grid.innerHTML = cards.map((state) => `
    <a class="state-results-shape-card state-results-shape-card--${state.tone}" href="${stateResultsHubLink(state.name)}" data-state-name="${state.name}">
      <span class="state-results-shape-card__shape">
        <svg class="state-results-shape-card__svg" viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>
      </span>
      <span class="state-results-shape-card__name">${state.name}</span>
      <span class="state-results-shape-card__meta">${state.winnerName} - ${state.marginLabel}</span>
      <span class="state-results-shape-card__links">
        <span>County results</span>
        <span>${state.houseCount ? `${state.houseCount} House ${state.houseCount === 1 ? "district" : "districts"}` : "House detail pending"}</span>
      </span>
    </a>
  `).join("");

  d3.json(STATE_RESULTS_HUB_TOPOJSON_URL)
    .then((us) => {
      const states = topojson.feature(us, us.objects.states).features;
      states.forEach((feature) => {
        const stateName = feature.properties.name;
        const state = stateByName.get(stateName);
        if (!state) return;

        const card = document.querySelector(`[data-state-name="${CSS.escape(stateName)}"]`);
        const svgNode = card?.querySelector(".state-results-shape-card__svg");
        if (!svgNode) return;

        const miniSvg = d3.select(svgNode);
        const miniProjection = d3.geoAlbersUsa();
        const miniPath = d3.geoPath().projection(miniProjection);
        miniProjection.fitExtent([[12, 10], [148, 92]], feature);

        miniSvg.append("path")
          .attr("class", "state-results-shape-card__path")
          .attr("d", miniPath(feature))
          .attr("fill", fillForStateHubTone(state.tone));

      });
    })
    .catch(() => {
      renderStateResultsHubFallbackGrid();
    });
}

document.addEventListener("DOMContentLoaded", renderStateResultsHubGrid);
