const houseDetailDataBundle = window.HOUSE_2024_DATA;
const houseDetailGeojson = window.HOUSE_2024_GEOJSON;

if (houseDetailDataBundle && houseDetailGeojson && document.getElementById("house-detail-title")) {
  const PARTY_LABELS = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
    IND: "Independent",
    GR: "Green",
    LB: "Libertarian",
    W: "Working Families",
    CON: "Conservative",
    CST: "Constitution",
    PF: "Peace and Freedom",
    LMN: "Legal Marijuana Now",
    NPP: "No party preference",
    O: "Other",
    NP: "Other",
    UY: "Other"
  };

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function formatCompactNumber(value) {
    const numeric = Number(value || 0);
    const rounded = numeric < 1 ? numeric.toFixed(2) : numeric.toFixed(1);
    return rounded;
  }

  function getPortrait(name) {
    const mapped = window.HOUSE_CANDIDATE_IMAGES?.[name];
    if (mapped) return mapped;

    const initials = String(name || "H")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
    return `https://placehold.co/120x120/2f3540/f3f4f6?text=${encodeURIComponent(initials || "C")}`;
  }

  function formatHouseCandidateVotes(district, candidate) {
    if (district.uncontested && Number(candidate.votes || 0) === 0) return "Uncontested";
    return candidate.votesFormatted || formatNumber(candidate.votes);
  }

  function formatHouseCandidatePct(district, candidate) {
    if (district.uncontested && Number(candidate.pct || 0) === 0) return "Uncontested";
    return candidate.pctFormatted || `${formatCompactNumber(candidate.pct)}%`;
  }

  function normalizeDistricts() {
    return Object.fromEntries(
      Object.entries(houseDetailDataBundle.districts).map(([code, district]) => {
        const candidates = [...(district.candidates || [])].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
        const winner = candidates.find((candidate) => candidate.winner) || candidates[0] || null;
        const winnerParty = winner?.party === "D" || winner?.party === "R"
          ? winner.party
          : (district.winnerParty === "D" || district.winnerParty === "R" ? district.winnerParty : "I");
        const uncontested = candidates.length < 2 || String(district.marginLabel || "").toLowerCase().includes("uncontested");
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

        return [code, {
          ...district,
          code,
          candidates,
          winnerName: winner?.name || district.winnerName || "Winner",
          winnerParty,
          margin,
          marginLabel,
          uncontested,
          fillKey
        }];
      })
    );
  }

  function districtFill(fillKey) {
    if (fillKey === "Dem") return "#2879b5";
    if (fillKey === "Rep") return "#cf2f2f";
    if (fillKey === "DemFlip") return "#2879b5";
    if (fillKey === "RepFlip") return "#cf2f2f";
    return "#c8a24a";
  }

  const COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
  const CALIFORNIA_COUNTY_FIPS = {
    "Alameda County": "06001",
    "Alpine County": "06003",
    "Amador County": "06005",
    "Butte County": "06007",
    "Calaveras County": "06009",
    "Colusa County": "06011",
    "Contra Costa County": "06013",
    "Del Norte County": "06015",
    "El Dorado County": "06017",
    "Fresno County": "06019",
    "Glenn County": "06021",
    "Humboldt County": "06023",
    "Imperial County": "06025",
    "Inyo County": "06027",
    "Kern County": "06029",
    "Kings County": "06031",
    "Lake County": "06033",
    "Lassen County": "06035",
    "Los Angeles County": "06037",
    "Madera County": "06039",
    "Marin County": "06041",
    "Mariposa County": "06043",
    "Mendocino County": "06045",
    "Merced County": "06047",
    "Modoc County": "06049",
    "Mono County": "06051",
    "Monterey County": "06053",
    "Napa County": "06055",
    "Nevada County": "06057",
    "Orange County": "06059",
    "Placer County": "06061",
    "Plumas County": "06063",
    "Riverside County": "06065",
    "Sacramento County": "06067",
    "San Benito County": "06069",
    "San Bernardino County": "06071",
    "San Diego County": "06073",
    "San Francisco County": "06075",
    "San Joaquin County": "06077",
    "San Luis Obispo County": "06079",
    "San Mateo County": "06081",
    "Santa Barbara County": "06083",
    "Santa Clara County": "06085",
    "Santa Cruz County": "06087",
    "Shasta County": "06089",
    "Sierra County": "06091",
    "Siskiyou County": "06093",
    "Solano County": "06095",
    "Sonoma County": "06097",
    "Stanislaus County": "06099",
    "Sutter County": "06101",
    "Tehama County": "06103",
    "Trinity County": "06105",
    "Tulare County": "06107",
    "Tuolumne County": "06109",
    "Ventura County": "06111",
    "Yolo County": "06113",
    "Yuba County": "06115"
  };

  const HOUSE_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
  const HOUSE_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];

  function normalizeCaliforniaCountyName(name) {
    return String(name || "")
      .replace(/\s*\(part\)$/i, "")
      .trim();
  }

  function formatCaliforniaCountyTableName(name) {
    return normalizeCaliforniaCountyName(name).replace(/ County$/i, "");
  }

  function getCaliforniaCountyFill(row) {
    const shades = row.winnerParty === "D"
      ? HOUSE_DEM_SHADES
      : row.winnerParty === "R"
        ? HOUSE_REP_SHADES
        : ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
    const winnerPct = Math.max(...(row.candidates || []).map((candidate) => Number(candidate.pct || 0)), 0);

    if (winnerPct >= 80) return shades[3];
    if (winnerPct >= 70) return shades[2];
    if (winnerPct >= 60) return shades[1];
    return shades[0];
  }

  function positionTooltip(event, tooltip) {
    const node = tooltip.node();
    if (!node) return;

    const rect = node.getBoundingClientRect();
    let left = event.clientX - rect.width / 2;
    let top = event.clientY + 16;

    left = Math.max(12, Math.min(left, window.innerWidth - rect.width - 12));
    top = Math.min(top, window.innerHeight - rect.height - 12);

    tooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  function californiaCountyTooltipHTML(row, district) {
    const candidates = (row.candidates || []).slice().sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const first = candidates[0];
    const second = candidates[1];
    const districtNumber = String(district.code || "").split("-")[1]?.replace(/^0/, "") || "";
    const title = districtNumber ? `${row.county} / District ${districtNumber}` : row.county;

    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${title}</div>
        <div class="tooltip-ev">${row.marginLabel}</div>
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
          ${first ? `
            <tr class="winner-row">
              <td>
                <div class="tooltip-candidate">
                  <span class="tooltip-candidate-bar ${first.party === "D" ? "dem" : first.party === "R" ? "rep" : "ind"}"></span>
                  <span>${first.name}</span>
                </div>
              </td>
              <td>${first.partyName === "Democratic" ? "Dem." : first.partyName === "Republican" ? "Rep." : first.partyName || first.party}</td>
              <td>${formatNumber(first.votes)}</td>
              <td>${Number(first.pct).toFixed(2).replace(/\.00$/, ".0")}%</td>
            </tr>
          ` : ""}
          ${second ? `
            <tr>
              <td>
                <div class="tooltip-candidate">
                  <span class="tooltip-candidate-bar ${second.party === "D" ? "dem" : second.party === "R" ? "rep" : "ind"}"></span>
                  <span>${second.name}</span>
                </div>
              </td>
              <td>${second.partyName === "Democratic" ? "Dem." : second.partyName === "Republican" ? "Rep." : second.partyName || second.party}</td>
              <td>${formatNumber(second.votes)}</td>
              <td>${Number(second.pct).toFixed(2).replace(/\.00$/, ".0")}%</td>
            </tr>
          ` : ""}
        </tbody>
      </table>
    `;
  }

  async function renderCaliforniaCountyMap(district, feature) {
    const countyData = window.HOUSE_CA_COUNTY_RESULTS?.[district.code];
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const legend = document.getElementById("house-detail-map-legend");
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");
    if (!countyData?.counties?.length || svg.empty() || !window.topojson) {
      if (legend) legend.hidden = true;
      return false;
    }

    const rows = countyData.counties
      .map((row) => {
        const normalizedCounty = normalizeCaliforniaCountyName(row.county);
        return {
          ...row,
          county: normalizedCounty,
          countyFips: CALIFORNIA_COUNTY_FIPS[normalizedCounty]
        };
      })
      .filter((row) => row.countyFips);

    if (!rows.length) {
      if (legend) legend.hidden = true;
      return false;
    }

    const rowByFips = new Map(rows.map((row) => [row.countyFips, row]));
    const countiesTopo = await d3.json(COUNTIES_TOPOJSON_URL);
    const countyFeatures = topojson.feature(countiesTopo, countiesTopo.objects.counties).features
      .filter((countyFeature) => rowByFips.has(String(countyFeature.id).padStart(5, "0")));

    if (!countyFeatures.length) {
      if (legend) legend.hidden = true;
      return false;
    }

    svg.selectAll("*").remove();

    const projection = d3.geoMercator().fitSize([540, 420], feature);
    const path = d3.geoPath().projection(projection);
    const districtPath = path(feature);

    const defs = svg.append("defs");
    defs.append("clipPath")
      .attr("id", "house-detail-district-clip")
      .append("path")
      .attr("d", districtPath);

    const countyLayer = svg.append("g").attr("clip-path", "url(#house-detail-district-clip)");

    countyLayer.selectAll("path")
      .data(countyFeatures)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape house-detail-county")
      .attr("data-fips", (countyFeature) => String(countyFeature.id).padStart(5, "0"))
      .attr("d", path)
      .attr("fill", (countyFeature) => {
        const row = rowByFips.get(String(countyFeature.id).padStart(5, "0"));
        return row ? getCaliforniaCountyFill(row) : "#2d3138";
      })
      .on("mouseover", (event, countyFeature) => {
        const row = rowByFips.get(String(countyFeature.id).padStart(5, "0"));
        if (!row) return;
        tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(row, district));
        positionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    svg.append("path")
      .datum(feature)
      .attr("class", "house-detail-shape")
      .attr("d", districtPath)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.95)")
      .attr("stroke-width", 2.1);

    if (subtitle) {
      subtitle.textContent = `${district.title} counties shaded by the winning county vote share.`;
    }
    if (legend) {
      legend.hidden = false;
    }

    return true;
  }

  function renderCaliforniaCountyBoard(district) {
    const board = document.getElementById("house-detail-county-board");
    const body = document.getElementById("house-detail-county-board-body");
    if (!board || !body) return;

    const countyData = window.HOUSE_CA_COUNTY_RESULTS?.[district.code];
    if (!countyData?.counties?.length) {
      board.hidden = true;
      return;
    }

    board.hidden = false;
    body.innerHTML = countyData.counties
      .slice()
      .sort((a, b) => b.totalVotes - a.totalVotes || a.county.localeCompare(b.county))
      .map((row) => `
        <tr class="detail-county-row">
          <td>${formatCaliforniaCountyTableName(row.county)}</td>
          <td><span class="detail-county-margin ${row.winnerParty === "D" ? "dem" : row.winnerParty === "R" ? "rep" : "ind"}">${row.marginLabel}</span></td>
          <td>${formatNumber(row.totalVotes)}</td>
          <td>${row.percentIn}</td>
        </tr>
      `)
      .join("");
  }

  function getWinnerTone(party) {
    if (party === "D") return "dem";
    if (party === "R") return "rep";
    return "ind";
  }

  function formatColoredMarginLabel(label, party) {
    const tone = party === "D" ? "dem" : party === "R" ? "rep" : "ind";
    return `<span class="detail-stat-margin ${tone}">${label}</span>`;
  }

  async function renderDistrictOutline(district, feature) {
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const svg = d3.select("#house-detail-map");
    if (!feature || svg.empty()) return;

    const renderedCountyMap = district.code.startsWith("CA-")
      ? await renderCaliforniaCountyMap(district, feature)
      : false;

    if (renderedCountyMap) return;

    const legend = document.getElementById("house-detail-map-legend");
    if (legend) {
      legend.hidden = true;
    }

    const projection = d3.geoMercator().fitSize([540, 420], feature);
    const path = d3.geoPath().projection(projection);
    svg.selectAll("*").remove();

    svg.append("path")
      .datum(feature)
      .attr("class", "house-detail-shape")
      .attr("d", path)
      .attr("fill", districtFill(district.fillKey))
      .attr("stroke", "rgba(255,255,255,0.92)")
      .attr("stroke-width", 2.1);

    if (subtitle) {
      subtitle.textContent = district.flipped
        ? "District outline shown with flip-aware winner coloring."
        : "District outline shown with certified winner coloring.";
    }
  }

  const districts = normalizeDistricts();
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const district = code ? districts[code] : null;

  if (!district) {
    document.getElementById("house-detail-title").textContent = "District not found";
    document.getElementById("house-detail-subtitle").textContent = "This House district result could not be loaded.";
  } else {
    const tone = getWinnerTone(district.winnerParty);
    const summaryCard = document.getElementById("house-detail-summary-card");
    summaryCard.classList.add(`winner-${tone}`);

    document.title = `${district.title} House Result`;
    document.getElementById("house-detail-title").textContent = district.title;
    document.getElementById("house-detail-subtitle").textContent = `Certified congressional district result in ${district.stateName} for the 2024 House election.`;
    document.getElementById("house-detail-summary-title").textContent = `${district.winnerName} wins ${district.title}.`;
    document.getElementById("house-detail-summary-callout").textContent = district.flipped
      ? "This district flipped parties in the 2024 general election."
      : "Race called with certified district totals.";
    document.getElementById("house-detail-summary-portrait").src = getPortrait(district.winnerName);
    document.getElementById("house-detail-summary-portrait").alt = district.winnerName;

    document.getElementById("house-detail-winner").textContent = district.winnerName;
    document.getElementById("house-detail-district").textContent = district.code;
    document.getElementById("house-detail-margin").innerHTML = formatColoredMarginLabel(district.marginLabel, district.winnerParty);

    const voteBody = document.getElementById("house-detail-vote-body");
    voteBody.innerHTML = district.candidates.map((candidate) => `
      <tr class="${candidate.winner ? "winner-row" : ""}">
        <td>
          <div class="detail-candidate-cell">
            <img class="detail-candidate-photo" src="${getPortrait(candidate.name)}" alt="${candidate.name}">
            <span>${candidate.name}</span>
          </div>
        </td>
        <td>${PARTY_LABELS[candidate.party] || candidate.partyName || candidate.party}</td>
        <td>${formatHouseCandidateVotes(district, candidate)}</td>
        <td>${formatHouseCandidatePct(district, candidate)}</td>
      </tr>
    `).join("");

    const totals = {
      dem: district.candidates.filter((candidate) => candidate.party === "D").reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0),
      rep: district.candidates.filter((candidate) => candidate.party === "R").reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0),
      ind: district.candidates.filter((candidate) => !["D", "R"].includes(candidate.party)).reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0)
    };
    const totalVotes = Number(district.totalVotes || 0) || (totals.dem + totals.rep + totals.ind);
    const otherVotes = Math.max(0, totalVotes - totals.dem - totals.rep - totals.ind);

    document.getElementById("house-detail-certified-title").textContent = `The House vote has been certified in ${district.title}.`;
    document.getElementById("house-detail-certified-note").textContent = district.uncontested
      ? "Uncontested race."
      : `${formatNumber(totalVotes)} total votes reported.`;
    document.getElementById("house-detail-certified-dem").style.flex = district.uncontested && district.winnerParty === "D" ? "1" : String(totals.dem);
    document.getElementById("house-detail-certified-rep").style.flex = district.uncontested && district.winnerParty === "R" ? "1" : String(totals.rep);
    document.getElementById("house-detail-certified-ind").style.flex = district.uncontested && !["D", "R"].includes(district.winnerParty) ? "1" : String(totals.ind);
    document.getElementById("house-detail-certified-other").style.flex = district.uncontested ? "0" : String(otherVotes);

    const runnerUp = district.candidates[1] || null;
    const districtNumber = district.code.split("-")[1];
    const facts = [
      `<li><strong>Winner</strong><span>${district.winnerName} carried ${district.title} by ${district.marginLabel}.</span></li>`,
      `<li><strong>District</strong><span>${district.stateName} Congressional District ${districtNumber.replace(/^0/, "")} was contested in 2024.</span></li>`,
      `<li><strong>Total votes</strong><span>${district.uncontested ? "This race was uncontested, so comparable two-candidate vote totals are not shown here." : `${formatNumber(totalVotes)} votes were reported in the district.`}</span></li>`,
      `<li><strong>Runner-up</strong><span>${runnerUp ? `${runnerUp.name} finished second with ${runnerUp.pctFormatted || `${formatCompactNumber(runnerUp.pct)}%`}.` : "No runner-up was recorded because the race was uncontested."}</span></li>`,
      `<li><strong>Flip status</strong><span>${district.flipped ? "This district flipped parties in 2024." : "This district stayed with the same party in 2024."}</span></li>`
    ];
    document.getElementById("house-detail-facts").innerHTML = facts.join("");

    document.getElementById("house-detail-context").textContent =
      `${district.title} was decided by ${district.marginLabel}. ${district.winnerName} won the seat for the ${PARTY_LABELS[district.winnerParty] || district.winnerParty}, and ${district.flipped ? "the result changed party control compared with the previous cycle." : "the seat remained with the same party after the election."}`;

    const feature = houseDetailGeojson.features.find((item) => item.properties.code === district.code);
    if (feature) {
      renderDistrictOutline(district, feature).then(() => {
        renderCaliforniaCountyBoard(district);
      });
    } else {
      renderCaliforniaCountyBoard(district);
    }
  }
}
