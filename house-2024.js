const houseDataBundle = window.HOUSE_2024_DATA;
const houseGeojson = window.HOUSE_2024_GEOJSON;

if (houseDataBundle && houseGeojson && document.getElementById("house-district-map")) {
  const houseSvg = d3.select("#house-district-map");
  const houseTooltip = d3.select("#house-map-tooltip");

  const PARTY_LABELS = {
    D: "Dem.",
    R: "Rep.",
    I: "Ind.",
    IND: "Ind.",
    GR: "Green",
    LB: "Lib.",
    W: "WFP",
    CON: "Con.",
    CST: "Const.",
    PF: "P&F",
    LMN: "LMN",
    NPP: "NPP",
    O: "Other",
    NP: "Other",
    UY: "Other"
  };

  const houseResultsConfig = [
    { id: "dem-easy", title: "Democrats expected to win easily" },
    { id: "dem-narrow", title: "Democrats expected to win narrowly" },
    { id: "competitive", title: "Most competitive districts" },
    { id: "rep-narrow", title: "Republicans expected to win narrowly" },
    { id: "rep-easy", title: "Republicans expected to win easily" }
  ];

  const HOUSE_STATE_DISPLAY = {
    AK: "Alaska",
    AL: "Alabama",
    AR: "Arkansas",
    AZ: "Arizona",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    IA: "Iowa",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    MA: "Massachusetts",
    MD: "Maryland",
    ME: "Maine",
    MI: "Michigan",
    MN: "Minnesota",
    MO: "Missouri",
    MS: "Mississippi",
    MT: "Montana",
    NC: "North Carolina",
    ND: "North Dakota",
    NE: "Nebraska",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NV: "Nevada",
    NY: "New York",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VA: "Virginia",
    VT: "Vermont",
    WA: "Washington",
    WI: "Wisconsin",
    WV: "West Virginia",
    WY: "Wyoming"
  };

  const houseNytLayout = {
    "dem-easy": [
      "AL-07","AZ-03","AZ-04","AZ-07","CA-02","CA-04","CA-06","CA-07","CA-08","CA-10","CA-11","CA-12","CA-14","CA-15","CA-16","CA-17","CA-18","CA-19","CA-21","CA-24","CA-25","CA-26","CA-28","CA-29","CA-30","CA-31","CA-32","CA-33","CA-34","CA-35",
      "CA-36","CA-37","CA-38","CA-39","CA-42","CA-43","CA-44","CA-46","CA-50","CA-51","CA-52","CO-01","CO-02","CO-06","CO-07","CT-01","CT-02","CT-03","CT-04","DE-01","FL-10","FL-14","FL-20","FL-22","FL-23","FL-24","FL-25","GA-02","GA-04","GA-05","GA-06","GA-13","HI-01","HI-02",
      "IL-01","IL-02","IL-03","IL-04","IL-05","IL-06","IL-07","IL-08","IL-09","IL-10","IL-11","IL-13","IL-14","IN-07","KY-03","LA-02","LA-06","ME-01","MD-02","MD-03","MD-04","MD-05","MD-07","MD-08","MA-01","MA-02","MA-03","MA-04","MA-05","MA-06","MA-07","MA-08","MA-09",
      "MI-06","MI-11","MI-12","MI-13","MN-03","MN-04","MN-05","MS-02","MO-01","MO-05","NH-02","NJ-01","NJ-03","NJ-05","NJ-06","NJ-08","NJ-09","NJ-10","NJ-11","NJ-12","NM-01","NM-03","NY-05","NY-06","NY-07","NY-08","NY-09","NY-10","NY-12","NY-13","NY-14","NY-15","NY-16","NY-20","NY-25","NY-26",
      "NC-02","NC-04","NC-12","OH-03","OH-11","OR-01","OR-03","PA-02","PA-03","PA-04","PA-05","PA-06","PA-12","RI-01","RI-02","SC-06","TN-09","TX-07","TX-09","TX-16","TX-18","TX-20","TX-29","TX-30","TX-32","TX-33","TX-35","TX-37","VT-01","VA-03","VA-04","VA-08","VA-10","VA-11","WA-01","WA-02",
      "WA-06","WA-07","WA-09","WA-10","WI-02","WI-04"
    ],
    "dem-narrow": [
      "AL-02","CA-09","CA-47","CA-49","CT-05","FL-09","IL-17","IN-01","KS-03","MD-06","MI-03","MN-02","NE-02","NV-01","NV-03","NV-04","NH-01","NY-03","NY-04","NY-18","NY-22","OH-01","OH-09","OH-13","OR-04","OR-06","PA-17","TX-28","TX-34","WA-08"
    ],
    "competitive": [
      "AK-01","AZ-01","AZ-06","CA-13","CA-22","CA-27","CA-41","CA-45","CO-08","IA-01","IA-03","ME-02","MI-08","NM-02","NY-19","NC-01","OR-05","PA-07","PA-08","PA-10","VA-07","WA-03"
    ],
    "rep-narrow": [
      "AZ-02","CA-03","CA-40","CO-03","FL-13","FL-27","MI-07","MI-10","MT-01","NJ-07","NY-01","NY-17","PA-01","TX-15","VA-02","WI-01","WI-03"
    ],
    "rep-easy": [
      "AL-01","AL-03","AL-04","AL-05","AL-06","AZ-05","AZ-08","AZ-09","AR-01","AR-02","AR-03","AR-04","CA-01","CA-05","CA-20","CA-23","CA-48","CO-04","CO-05","FL-01","FL-02","FL-03","FL-04","FL-05","FL-06","FL-07","FL-08","FL-11","FL-12","FL-15",
      "FL-16","FL-17","FL-18","FL-19","FL-21","FL-26","FL-28","GA-01","GA-03","GA-07","GA-08","GA-09","GA-10","GA-11","GA-12","GA-14","ID-01","ID-02","IL-12","IL-15","IL-16","IN-02","IN-03","IN-04","IN-05","IN-06","IN-08","IN-09","IA-02","IA-04","KS-01","KS-02","KS-04","KY-01",
      "KY-02","KY-04","KY-05","KY-06","LA-01","LA-03","LA-04","LA-05","MD-01","MI-01","MI-02","MI-04","MI-05","MI-09","MN-01","MN-06","MN-07","MN-08","MS-01","MS-03","MS-04","MO-02","MO-03","MO-04","MO-06","MO-07","MO-08","MT-02","NE-01","NE-03","NV-02","NJ-02","NJ-04",
      "NY-02","NY-11","NY-21","NY-23","NY-24","NC-03","NC-05","NC-06","NC-07","NC-08","NC-09","NC-10","NC-11","NC-13","NC-14","ND-01","OH-02","OH-04","OH-05","OH-06","OH-07","OH-08","OH-10","OH-12","OH-14","OH-15","OK-01","OK-02","OK-03","OK-04","OK-05","OR-02","PA-09","PA-11","PA-13","PA-14",
      "PA-15","PA-16","SC-01","SC-02","SC-03","SC-04","SC-05","SC-07","SD-01","TN-01","TN-02","TN-03","TN-04","TN-05","TN-06","TN-07","TN-08","TX-01","TX-02","TX-03","TX-04","TX-05","TX-06","TX-08","TX-10","TX-11","TX-12","TX-13","TX-14","TX-17","TX-19","TX-21","TX-22","TX-23","TX-24","TX-25",
      "TX-26","TX-27","TX-31","TX-36","TX-38","UT-01","UT-02","UT-03","UT-04","VA-01","VA-05","VA-06","VA-09","WA-04","WA-05","WV-01","WV-02","WI-05","WI-06","WI-07","WI-08","WY-01"
    ]
  };

  const houseNytGroupByCode = new Map();
  const houseNytOrderByCode = new Map();

  Object.entries(houseNytLayout).forEach(([groupId, codes]) => {
    codes.forEach((code, index) => {
      houseNytGroupByCode.set(code, groupId);
      houseNytOrderByCode.set(code, index);
    });
  });

  let houseResultsSortMode = "margin";
  let houseResultsSearchQuery = "";
  let houseResultsStateFilter = "all";

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function formatCompactNumber(value) {
    const numeric = Number(value || 0);
    const rounded = numeric < 1 ? numeric.toFixed(2) : numeric.toFixed(1);
    return rounded;
  }

  function formatHouseCandidateVotes(district, candidate) {
    if (district.uncontested && Number(candidate.votes || 0) === 0) return "Uncontested";
    return candidate.votesFormatted || formatNumber(candidate.votes);
  }

  function formatHouseCandidatePct(district, candidate) {
    if (district.uncontested && Number(candidate.pct || 0) === 0) return "Uncontested";
    return `${candidate.pctFormatted || formatCompactNumber(candidate.pct)}%`;
  }

  function getPartyTone(party) {
    if (party === "D") return "dem";
    if (party === "R") return "rep";
    return "ind";
  }

  function displayDistrictLabel(code) {
    const [state, rawDistrict] = code.split("-");
    const stateLabel = HOUSE_STATE_DISPLAY[state] || state;
    const districtLabel = rawDistrict === "AL" ? "1" : String(Number(rawDistrict));
    return `${stateLabel} ${districtLabel}`;
  }

  function houseFill(fillKey) {
    if (fillKey === "Dem") return "#2879b5";
    if (fillKey === "Rep") return "#cf2f2f";
    if (fillKey === "DemFlip") return "url(#house-dem-flip-pattern)";
    if (fillKey === "RepFlip") return "url(#house-rep-flip-pattern)";
    if (fillKey === "Ind") return "#c8a24a";
    if (fillKey === "IndFlip") return "url(#house-ind-flip-pattern)";
    return "#3a3d42";
  }

  function marginClassForDistrict(district) {
    if (district.fillKey === "Dem") return "dem-win";
    if (district.fillKey === "Rep") return "rep-win";
    if (district.fillKey === "DemFlip") return "dem-flip";
    if (district.fillKey === "RepFlip") return "rep-flip";
    if (district.fillKey === "IndFlip") return "ind-flip";
    return "ind-win";
  }

  function districtResultLinkHref(code) {
    return `./house-district-result.html?code=${encodeURIComponent(code)}`;
  }

  function matchesDistrictSearch(district) {
    if (!houseResultsSearchQuery) return true;

    const query = houseResultsSearchQuery;
    const haystacks = [
      district.code,
      district.compactDisplay,
      district.title,
      district.code.replace('-', ' '),
      district.compactDisplay.replace(/\./g, ''),
      district.title.replace(/District/gi, '')
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return haystacks.some((value) => value.includes(query));
  }

  function matchesDistrictStateFilter(district) {
    if (!houseResultsStateFilter || houseResultsStateFilter === 'all') return true;
    return district.code.startsWith(`${houseResultsStateFilter}-`);
  }

  function buildHouseStateFilterOptions() {
    const filterSelect = document.getElementById('house-state-filter');
    if (!filterSelect) return;

    const seen = new Set();
    const options = Object.values(houseDataBundle.districts)
      .map((district) => district.code.split('-')[0])
      .filter((state) => {
        if (seen.has(state)) return false;
        seen.add(state);
        return true;
      })
      .sort((a, b) => (HOUSE_STATE_DISPLAY[a] || a).localeCompare(HOUSE_STATE_DISPLAY[b] || b))
      .map((state) => `<option value="${state}">${HOUSE_STATE_DISPLAY[state] || state}</option>`)
      .join('');

    filterSelect.innerHTML = `<option value="all">All states</option>${options}`;
    filterSelect.value = houseResultsStateFilter;
  }

  function classifyDistrict(district) {
    const explicitGroup = houseNytGroupByCode.get(district.code);
    if (explicitGroup) return explicitGroup;
    if (district.uncontested) {
      return district.winnerParty === "D" ? "dem-easy" : district.winnerParty === "R" ? "rep-easy" : "competitive";
    }
    if (district.margin < 5) return "competitive";
    if (district.winnerParty === "D") return district.margin < 15 ? "dem-narrow" : "dem-easy";
    if (district.winnerParty === "R") return district.margin < 15 ? "rep-narrow" : "rep-easy";
    return "competitive";
  }

  function normalizeHouseData() {
    const normalized = {};

    Object.entries(houseDataBundle.districts).forEach(([code, district]) => {
      const candidates = [...(district.candidates || [])].sort((a, b) => b.votes - a.votes);
      const winner = candidates.find((candidate) => candidate.winner) || candidates[0] || null;
      const dem = candidates.find((candidate) => candidate.party === "D") || null;
      const rep = candidates.find((candidate) => candidate.party === "R") || null;
      const ind = candidates.find((candidate) => !["D", "R"].includes(candidate.party)) || null;

      const winnerParty = winner?.party === "D" || winner?.party === "R"
        ? winner.party
        : (district.winnerParty === "D" || district.winnerParty === "R" ? district.winnerParty : "I");

      const uncontested = candidates.length < 2 || (district.marginLabel || "").toLowerCase().includes("uncontested");
      const totalVotes = Number(district.totalVotes || 0);
      const computedMargin = candidates.length > 1 && totalVotes > 0
        ? (Math.abs(Number(candidates[0].votes || 0) - Number(candidates[1].votes || 0)) / totalVotes) * 100
        : candidates.length > 1
          ? Math.abs(Number(candidates[0].pct || 0) - Number(candidates[1].pct || 0))
          : 100;
      const providedMargin = Number(district.margin);
      const margin = uncontested
        ? (Number.isFinite(providedMargin) && providedMargin > 0 ? providedMargin : 100)
        : computedMargin;
      const marginLabel = uncontested
        ? `${winnerParty === "D" ? "D" : winnerParty === "R" ? "R" : "I"} Uncontested`
        : `${winnerParty === "D" ? "D" : winnerParty === "R" ? "R" : "I"}+${formatCompactNumber(margin)}`;

      const fillKey = district.flipped
        ? winnerParty === "D"
          ? "DemFlip"
          : winnerParty === "R"
            ? "RepFlip"
            : "IndFlip"
        : winnerParty === "D"
          ? "Dem"
          : winnerParty === "R"
            ? "Rep"
            : "Ind";

      normalized[code] = {
        ...district,
        code,
        candidates,
        winnerName: winner?.name || district.winnerName || "Winner",
        winnerParty,
        dem,
        rep,
        ind,
        margin,
        uncontested,
        marginLabel,
        fillKey,
        percentIn: "100%",
        group: classifyDistrict({ code, winnerParty, margin, uncontested }),
        compactDisplay: displayDistrictLabel(code),
        linkHref: districtResultLinkHref(code)
      };
    });

    houseDataBundle.districts = normalized;

    const summary = {
      demSeats: 0,
      repSeats: 0,
      indSeats: 0,
      demFlips: 0,
      repFlips: 0,
      indFlips: 0,
      demVotes: 0,
      repVotes: 0,
      indVotes: 0,
      allVotes: 0,
      closest: [],
      flips: [],
      control: 218
    };

    Object.values(normalized).forEach((district) => {
      if (district.winnerParty === "D") summary.demSeats += 1;
      else if (district.winnerParty === "R") summary.repSeats += 1;
      else summary.indSeats += 1;

      if (district.flipped) {
        if (district.winnerParty === "D") summary.demFlips += 1;
        else if (district.winnerParty === "R") summary.repFlips += 1;
        else summary.indFlips += 1;
      }

      if (district.dem) summary.demVotes += district.dem.votes;
      if (district.rep) summary.repVotes += district.rep.votes;
      district.candidates
        .filter((candidate) => !["D", "R"].includes(candidate.party))
        .forEach((candidate) => {
          summary.indVotes += Number(candidate.votes || 0);
        });

      summary.allVotes += Number(district.totalVotes || 0);
      summary.closest.push(district);
      if (district.flipped) summary.flips.push(district);
    });

    summary.closest.sort((a, b) => a.margin - b.margin || a.title.localeCompare(b.title));
    summary.flips.sort((a, b) => a.title.localeCompare(b.title));
    summary.demVotesFormatted = formatNumber(summary.demVotes);
    summary.repVotesFormatted = formatNumber(summary.repVotes);
    summary.allVotesFormatted = formatNumber(summary.allVotes);

    houseDataBundle.summary = summary;
  }

  function tooltipHTML(code) {
    const district = houseDataBundle.districts[code];
    if (!district) return "";

    const rows = district.candidates.map((candidate) => {
      const winnerClass = candidate.winner ? "winner-row" : "";
      const tone = getPartyTone(candidate.party);
      const label = PARTY_LABELS[candidate.party] || candidate.partyName || candidate.party || "";

      return `
        <tr class="${winnerClass}">
          <td>
            <div class="tooltip-candidate">
              <span class="tooltip-candidate-bar ${tone}"></span>
              <span>${candidate.name}</span>${candidate.incumbent ? `<span class="tooltip-incumbent">Inc.</span>` : ""}
            </div>
          </td>
          <td>${label}</td>
          <td>${formatHouseCandidateVotes(district, candidate)}</td>
          <td>${formatHouseCandidatePct(district, candidate)}</td>
        </tr>
      `;
    }).join("");

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

  function positionTooltip(event) {
    const node = houseTooltip.node();
    if (!node) return;

    const width = node.offsetWidth;
    const height = node.offsetHeight;
    let left = event.clientX - width / 2;
    let top = event.clientY + 18;

    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    top = Math.min(top, window.innerHeight - height - 12);

    houseTooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  function renderSummary() {
    const summary = houseDataBundle.summary;
    document.getElementById("house-dem-count").textContent = summary.demSeats;
    document.getElementById("house-rep-count").textContent = summary.repSeats;
    document.getElementById("house-votes-dem").textContent = `${summary.demVotesFormatted} votes`;
    document.getElementById("house-votes-rep").textContent = `${summary.repVotesFormatted} votes`;
    document.getElementById("house-votes-total").textContent = `${summary.allVotesFormatted} total votes`;
    document.getElementById("house-bar-dem").style.flex = String(summary.demSeats);
    document.getElementById("house-bar-rep").style.flex = String(summary.repSeats);
  }

  function renderLists() {
    const closestHost = document.getElementById("house-closest-list");
    const flipsHost = document.getElementById("house-flips-list");

    closestHost.innerHTML = houseDataBundle.summary.closest.slice(0, 12).map((district) => `
      <a class="house-note-item" href="${district.linkHref}">
        <div class="house-note-title">${district.title}</div>
        <div class="house-note-meta ${district.winnerParty === "D" ? "dem" : district.winnerParty === "R" ? "rep" : "ind"}">${district.marginLabel}</div>
      </a>
    `).join("");

    flipsHost.innerHTML = houseDataBundle.summary.flips.slice(0, 16).map((district) => `
      <a class="house-note-item" href="${district.linkHref}">
        <div class="house-note-title">${district.title}</div>
        <div class="house-note-meta ${district.winnerParty === "D" ? "dem" : district.winnerParty === "R" ? "rep" : "ind"}">${district.marginLabel}</div>
      </a>
    `).join("");
  }

  function buildResultsSections() {
    return houseResultsConfig.map((section) => {
      const list = Object.values(houseDataBundle.districts)
        .filter((district) => district.group === section.id)
        .filter((district) => matchesDistrictStateFilter(district))
        .filter((district) => matchesDistrictSearch(district))
        .sort((a, b) => {
          if (houseResultsSortMode === "alphabetical") {
            return a.compactDisplay.localeCompare(b.compactDisplay);
          }
          return b.margin - a.margin || (houseNytOrderByCode.get(a.code) ?? 9999) - (houseNytOrderByCode.get(b.code) ?? 9999);
        });

      return { ...section, list };
    });
  }

  function renderDistrictResults() {
    const board = document.getElementById("house-results-board");
    const closestList = document.getElementById("house-district-closest-list");
    const flipsList = document.getElementById("house-district-flips-list");
    const demWins = document.getElementById("house-districts-won-dem");
    const repWins = document.getElementById("house-districts-won-rep");
    const flipped = document.getElementById("house-districts-flipped");

    if (!board) return;

    document.querySelectorAll(".state-results-sort-button").forEach((button) => {
      const isActive = button.dataset.sort === houseResultsSortMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const sections = buildResultsSections();
    const hasMatches = sections.some((section) => section.list.length > 0);

    board.innerHTML = hasMatches ? `
      <div class="state-results-grid house-results-grid">
        ${sections.map((section) => `
          <section class="state-results-group">
            <h3 class="state-results-title">${section.title}</h3>
            <table class="state-results-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Margin</th>
                  <th>% In</th>
                </tr>
              </thead>
              <tbody>
                ${section.list.length ? section.list.map((district) => `
                    <tr>
                    <td><a class="state-link" href="${district.linkHref}">${district.compactDisplay}</a></td>
                    <td>
                      <span class="margin-box ${marginClassForDistrict(district)}">${district.marginLabel}</span>
                    </td>
                    <td class="state-percent">${district.percentIn}</td>
                  </tr>
                `).join("") : `
                  <tr class="state-results-empty-row">
                    <td colspan="3">No matching districts in this category.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </section>
        `).join("")}
      </div>
    ` : `
      <div class="state-results-empty-state house-results-empty-state">
        <strong>No districts matched your filters.</strong>
        <span>${houseResultsSearchQuery ? `Search: “${houseResultsSearchQuery}”. ` : ''}${houseResultsStateFilter !== 'all' ? `State: ${HOUSE_STATE_DISPLAY[houseResultsStateFilter] || houseResultsStateFilter}. ` : ''}Try a district code like CA-27 or switch the state filter back to All states.</span>
      </div>
    `;

    const summary = houseDataBundle.summary;
    if (demWins) demWins.textContent = String(summary.demSeats);
    if (repWins) repWins.textContent = String(summary.repSeats);
    if (flipped) flipped.textContent = String(summary.demFlips + summary.repFlips + summary.indFlips);

    if (closestList) {
      closestList.innerHTML = summary.closest.slice(0, 6).map((district) => `
        <li>
          <a class="state-link" href="${district.linkHref}">${district.compactDisplay}</a>
          <span class="state-side-value">${district.marginLabel}</span>
        </li>
      `).join("");
    }

    if (flipsList) {
      flipsList.innerHTML = summary.flips.slice(0, 6).map((district) => `
        <li>
          <a class="state-link" href="${district.linkHref}">${district.compactDisplay}</a>
          <span class="state-side-value">${district.marginLabel}</span>
        </li>
      `).join("");
    }
  }

  function initResultsControls() {
    document.querySelectorAll(".state-results-sort-button").forEach((button) => {
      button.addEventListener("click", () => {
        const nextMode = button.dataset.sort;
        if (!nextMode || nextMode === houseResultsSortMode) return;
        houseResultsSortMode = nextMode;
        renderDistrictResults();
      });
    });

    const searchInput = document.getElementById("house-district-search");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        houseResultsSearchQuery = event.target.value.trim().toLowerCase();
        renderDistrictResults();
      });
    }

    const stateFilter = document.getElementById('house-state-filter');
    if (stateFilter) {
      buildHouseStateFilterOptions();
      stateFilter.addEventListener('change', (event) => {
        houseResultsStateFilter = event.target.value;
        renderDistrictResults();
      });
    }
  }

  function buildPatterns() {
    const defs = houseSvg.append("defs");

    defs.append("pattern")
      .attr("id", "house-dem-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call((pattern) => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#5a96c8");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#2879b5");
      });

    defs.append("pattern")
      .attr("id", "house-rep-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call((pattern) => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#d86a6a");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#cf2f2f");
      });

    defs.append("pattern")
      .attr("id", "house-ind-flip-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 12)
      .attr("height", 12)
      .attr("patternTransform", "rotate(45)")
      .call((pattern) => {
        pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#e0c16a");
        pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#c8a24a");
      });
  }

  function renderMap() {
    buildPatterns();

    const projection = d3.geoAlbersUsa().fitExtent([[0, 0], [1600, 900]], houseGeojson);
    const path = d3.geoPath().projection(projection);

    houseSvg.selectAll(".house-district")
      .data(houseGeojson.features)
      .enter()
      .append("path")
      .attr("class", "house-district")
      .attr("d", path)
      .attr("fill", (feature) => {
        const district = houseDataBundle.districts[feature.properties.code];
        return houseFill(district?.fillKey);
      })
      .on("mouseover", (event, feature) => {
        const district = houseDataBundle.districts[feature.properties.code];
        if (!district) return;
        houseTooltip.style("opacity", 1).html(tooltipHTML(feature.properties.code));
        d3.select(event.currentTarget).classed("is-active", true);
        positionTooltip(event);
      })
      .on("mousemove", (event) => {
        positionTooltip(event);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        houseTooltip.style("opacity", 0);
      });
  }

  normalizeHouseData();
  renderSummary();
  renderLists();
  renderDistrictResults();
  initResultsControls();
  renderMap();
}
